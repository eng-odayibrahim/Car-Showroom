'use client';

/**
 * TikTokGallery
 * ─────────────
 * Displays the 10 most recent TikTok marketing videos for Hussein Ghulam Motors.
 *
 * Behaviour
 * ─────────
 *  • On mount: calls /api/tiktok/status to check if a token is stored.
 *  • If connected: fetches /api/tiktok/videos and renders a responsive grid.
 *  • Clicking a card thumbnail swaps it with an inline TikTok embed iframe —
 *    no modal, no redirect, no new tab.
 *  • The "Authorize TikTok" button is only shown to admin users.
 *
 * Styling: Tailwind CSS — dark luxury aesthetic matching the site's
 *          #050505 background and #C8A24A gold accent palette.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, Heart, Share2, X, Lock } from 'lucide-react';
import { tiktokApi, type TikTokVideo } from '../../lib/api/tiktok.api';
import { getStoredAuth, isAdmin as checkIsAdmin } from '../../lib/auth/auth';

// ── Backend origin ────────────────────────────────────────────────────────────
const BACKEND_ORIGIN =
  process.env['NEXT_PUBLIC_API_URL']?.replace(/\/api$/, '') ?? 'http://localhost:4000';
const TIKTOK_LOGIN_URL = `${BACKEND_ORIGIN}/api/tiktok/login`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// TikTok icon path — reused across the file
const TIKTOK_PATH =
  'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={TIKTOK_PATH} />
    </svg>
  );
}

// ── VideoCard — self-contained inline play ────────────────────────────────────

interface VideoCardProps {
  video: TikTokVideo;
  index: number;
}

function VideoCard({ video, index }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  // video.id is normalised by the backend (id || item_id).
  // Guard against missing/literal-"undefined" ids so the embed URL is always valid.
  const videoId = (video.id && video.id !== 'undefined') ? video.id : (video.item_id ?? '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      className="group relative flex flex-col bg-[#0d0d0d] border border-neutral-800 overflow-hidden"
    >
      {/* ── Top gold accent bar (always visible once hovered or playing) ── */}
      <div
        className={`h-[2px] w-full bg-[#C8A24A] transition-transform duration-300 origin-left ${
          hovered || playing ? 'scale-x-100' : 'scale-x-0'
        }`}
      />

      {/* ── Media area — fixed 9:16 aspect ratio ── */}
      <div
        className="relative w-full overflow-hidden bg-neutral-900"
        style={{ aspectRatio: '9 / 16' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatePresence mode="wait">
          {playing ? (
            /* ── Inline iframe ── */
            <motion.div
              key="iframe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {/* Close button — top-right corner of the card */}
              <button
                onClick={() => setPlaying(false)}
                aria-label="Close video"
                className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center bg-[#050505]/80 border border-neutral-700 text-neutral-400 hover:text-white hover:border-[#C8A24A] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {videoId ? (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  width="100%"
                  height="100%"
                  frameBorder={0}
                  allow="fullscreen; autoplay"
                  allowFullScreen
                  title={video.title || 'TikTok video'}
                  style={{ display: 'block', border: 'none' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs px-4 text-center">
                  Video ID unavailable — please try re-authorizing TikTok.
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Thumbnail ── */
            <motion.div
              key="thumbnail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setPlaying(true)}
              role="button"
              tabIndex={0}
              aria-label={`Play: ${video.title || 'TikTok video'}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPlaying(true); }}
            >
              {/* Cover image */}
              {video.cover_image_url ? (
                <img
                  src={video.cover_image_url}
                  alt={video.title || 'TikTok video'}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                  <Play className="w-10 h-10 text-neutral-700" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 pointer-events-none" />

              {/* Animated play button */}
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    key="play-btn"
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#C8A24A]/90 flex items-center justify-center shadow-xl shadow-black/40">
                      <Play className="w-6 h-6 text-[#050505] translate-x-0.5" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats — bottom of thumbnail */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 pointer-events-none">
                <span className="flex items-center gap-1 text-[11px] text-neutral-300 font-medium">
                  <Eye className="w-3 h-3 text-[#C8A24A]" />
                  {formatCount(video.view_count ?? 0)}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-neutral-300 font-medium">
                  <Heart className="w-3 h-3 text-[#C8A24A]" />
                  {formatCount(video.like_count ?? 0)}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-neutral-300 font-medium">
                  <Share2 className="w-3 h-3 text-[#C8A24A]" />
                  {formatCount(video.share_count ?? 0)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Caption (hidden while playing to keep the card compact) ── */}
      {!playing && (
        <div className="px-3 py-3 flex items-center justify-between border-t border-neutral-800/60">
          <p className="text-[12px] text-neutral-400 font-medium leading-snug line-clamp-1 group-hover:text-neutral-200 transition-colors">
            {video.title || 'Hussein Ghulam Motors'}
          </p>
          <Play className="w-3 h-3 text-neutral-700 group-hover:text-[#C8A24A] transition-colors flex-shrink-0 ml-2" />
        </div>
      )}
    </motion.div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function VideoSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      className="bg-[#0d0d0d] border border-neutral-800 overflow-hidden"
    >
      <div className="w-full bg-neutral-900 animate-pulse" style={{ aspectRatio: '9 / 16' }} />
      <div className="px-3 py-3 space-y-2">
        <div className="h-2.5 bg-neutral-800 animate-pulse w-4/5" />
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TikTokGallery() {
  const [status, setStatus]   = useState<'idle' | 'loading' | 'connected' | 'disconnected' | 'error'>('idle');
  const [videos, setVideos]   = useState<TikTokVideo[]>([]);
  const [error, setError]     = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin check — client-only
  useEffect(() => {
    const auth = getStoredAuth();
    setIsAdmin(checkIsAdmin(auth.user));
  }, []);

  // Initialize: check status then optionally load videos
  const initialize = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const statusRes = await tiktokApi.status();
      if (!statusRes.connected) {
        setStatus('disconnected');
        return;
      }
      const videosRes = await tiktokApi.videos();
      setVideos(videosRes.data ?? []);
      setStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load TikTok videos.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { void initialize(); }, [initialize]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="bg-[#050505] py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-900 border border-neutral-800 mb-6">
            <TikTokIcon className="w-4 h-4 text-[#C8A24A]" />
            <span className="text-[11px] tracking-[0.25em] uppercase text-neutral-400 font-medium">
              TikTok
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Our Latest <span className="text-[#C8A24A]">Showcase</span>
          </h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
            Browse our most recent luxury car videos — straight from our official TikTok channel.
          </p>
        </motion.div>

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <VideoSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {/* ── Disconnected ── */}
        {status === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <TikTokIcon className="w-7 h-7 text-neutral-600" />
            </div>

            <div>
              <p className="text-neutral-300 text-sm font-medium mb-1">TikTok not connected</p>
              <p className="text-neutral-600 text-xs max-w-xs">
                {isAdmin
                  ? 'Authorize your TikTok account to display marketing videos on the site.'
                  : 'Videos will appear here once the administrator connects the TikTok account.'}
              </p>
            </div>

            {isAdmin ? (
              <a
                id="tiktok-authorize-btn"
                href={TIKTOK_LOGIN_URL}
                className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#C8A24A] text-[#050505] text-sm font-semibold tracking-wide uppercase hover:bg-[#d4af61] transition-colors duration-300 shadow-lg shadow-[#C8A24A]/20"
              >
                <TikTokIcon className="w-4 h-4" />
                Authorize TikTok
              </a>
            ) : (
              <div className="flex items-center gap-2 text-neutral-700 text-xs">
                <Lock className="w-3.5 h-3.5" />
                Admin access required
              </div>
            )}
          </motion.div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => void initialize()}
              className="mt-4 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300 transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* ── Connected — inline video grid ── */}
        {status === 'connected' && (
          <>
            {videos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-neutral-600 text-sm"
              >
                No videos found.{' '}
                {isAdmin && <span>Make sure your TikTok account has videos posted.</span>}
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {videos
                  // Second line of defence: drop any video that still has no
                  // usable ID even after the backend normalisation step.
                  .filter(v => v.id && v.id !== 'undefined')
                  .map((video, i) => (
                    <VideoCard key={video.id} video={video} index={i} />
                  ))}
              </div>
            )}

            {/* Admin: re-authorize link */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex justify-center"
              >
                <a
                  id="tiktok-reauthorize-btn"
                  href={TIKTOK_LOGIN_URL}
                  className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-neutral-700 hover:text-[#C8A24A] transition-colors"
                >
                  <TikTokIcon className="w-3.5 h-3.5" />
                  Re-authorize TikTok
                </a>
              </motion.div>
            )}
          </>
        )}

      </div>
    </section>
  );
}

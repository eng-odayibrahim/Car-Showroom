'use client';

/**
 * TikTokGallery
 * ─────────────
 * Displays the 10 most recent TikTok marketing videos for Hussein Ghulam Motors.
 *
 * Behaviour
 * ─────────
 *  • On mount: calls /api/tiktok/status to check if a token is stored.
 *  • If connected: fetches /api/tiktok/videos and renders a luxury grid.
 *  • If not connected: shows the "Authorize TikTok" button (admin-only).
 *  • Auth-gate: the button is hidden for non-admin users (checked via
 *    getStoredAuth() — the same helper used by the navbar).
 *
 * Styling: Tailwind CSS — dark luxury aesthetic matching the site's
 *          #050505 background and #C8A24A gold accent palette.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, Heart, Share2, X, Lock } from 'lucide-react';
import { tiktokApi, type TikTokVideo } from '../../lib/api/tiktok.api';
import { getStoredAuth, isAdmin as checkIsAdmin } from '../../lib/auth/auth';

// ── Backend origin — always talk to the Express server directly for OAuth ─────
const BACKEND_ORIGIN =
  process.env['NEXT_PUBLIC_API_URL']?.replace(/\/api$/, '') ?? 'http://localhost:4000';
const TIKTOK_LOGIN_URL = `${BACKEND_ORIGIN}/api/tiktok/login`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Video Modal ───────────────────────────────────────────────────────────────

interface VideoModalProps {
  video: TikTokVideo;
  onClose: () => void;
}

function VideoModal({ video, onClose }: VideoModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Escape key closes modal; restore scroll on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        aria-label="Close video"
      >
        {/* Panel — stops click propagation so clicking the iframe doesn't close */}
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full flex flex-col items-center"
          style={{ maxWidth: 400 }}
        >
          {/* Gold top accent bar */}
          <div className="w-full h-[2px] bg-[#C8A24A]" />

          {/* Header */}
          <div className="w-full flex items-center justify-between bg-[#0d0d0d] border-x border-neutral-800 px-4 py-3">
            <p className="text-[12px] tracking-[0.18em] uppercase text-neutral-400 font-medium truncate pr-4">
              {video.title || 'Hussein Ghulam Motors'}
            </p>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close video"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TikTok embed iframe — 9:16 phone ratio */}
          <div className="w-full border-x border-b border-neutral-800 bg-[#050505]" style={{ aspectRatio: '9/16' }}>
            <iframe
              src={`https://www.tiktok.com/embed/v2/${video.id}`}
              width="100%"
              height="100%"
              frameBorder={0}
              allow="fullscreen"
              allowFullScreen
              title={video.title || 'TikTok video'}
              style={{ display: 'block' }}
            />
          </div>

          {/* Footer — stats strip */}
          <div className="w-full flex items-center gap-5 bg-[#0d0d0d] border-x border-b border-neutral-800 px-4 py-3">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Eye className="w-3 h-3 text-[#C8A24A]" /> {formatCount(video.view_count ?? 0)}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Heart className="w-3 h-3 text-[#C8A24A]" /> {formatCount(video.like_count ?? 0)}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Share2 className="w-3 h-3 text-[#C8A24A]" /> {formatCount(video.share_count ?? 0)}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface VideoCardProps {
  video: TikTokVideo;
  index: number;
  onOpen: (video: TikTokVideo) => void;
}

function VideoCard({ video, index, onOpen }: VideoCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Watch: ${video.title || 'TikTok video'}`}
      onClick={() => onOpen(video)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(video); }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col bg-[#0d0d0d] border border-neutral-800 overflow-hidden cursor-pointer"
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-900">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />

        {/* Gold accent bar — slides in on hover */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute top-0 left-0 right-0 h-[2px] bg-[#C8A24A] origin-left"
        />

        {/* Play button overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="play-overlay"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#C8A24A]/90 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-[#050505] translate-x-0.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row — bottom of thumbnail */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
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
      </div>

      {/* ── Caption ── */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <p className="text-[13px] text-neutral-200 font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {video.title || 'Hussein Ghulam Motors'}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 font-medium">
            Watch Video
          </span>
          <Play className="w-3 h-3 text-neutral-700 group-hover:text-[#C8A24A] transition-colors" />
        </div>
      </div>
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
      <div className="aspect-[9/16] w-full bg-neutral-900 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-neutral-800 animate-pulse w-4/5" />
        <div className="h-3 bg-neutral-800 animate-pulse w-3/5" />
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TikTokGallery() {
  const [status, setStatus]     = useState<'idle' | 'loading' | 'connected' | 'disconnected' | 'error'>('idle');
  const [videos, setVideos]     = useState<TikTokVideo[]>([]);
  const [error, setError]       = useState('');
  const [isAdmin, setIsAdmin]   = useState(false);
  const [activeVideo, setActiveVideo] = useState<TikTokVideo | null>(null);

  // ── Check admin role on mount (client-only) ──────────────────────────────
  useEffect(() => {
    const auth = getStoredAuth();
    setIsAdmin(checkIsAdmin(auth.user));
  }, []);

  // ── Handle ?tiktok=authorized redirect from the callback ─────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('tiktok') === 'authorized') {
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Check connection status, then load videos if connected ───────────────
  const initialize = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const statusRes = await tiktokApi.status();

      if (!statusRes.connected) {
        setStatus('disconnected');
        return;
      }

      // Token is valid — fetch videos
      const videosRes = await tiktokApi.videos();
      setVideos(videosRes.data ?? []);
      setStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load TikTok videos.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Video modal — rendered outside the section so it overlays everything */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

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
          {/* TikTok wordmark pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-900 border border-neutral-800 mb-6">
            {/* TikTok icon SVG */}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-[#C8A24A]"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z"/>
            </svg>
            <span className="text-[11px] tracking-[0.25em] uppercase text-neutral-400 font-medium">
              TikTok
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Our Latest{' '}
            <span className="text-[#C8A24A]">Showcase</span>
          </h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
            Browse our most recent luxury car videos — straight from our official TikTok channel.
          </p>
        </motion.div>

        {/* ── Loading state ── */}
        {status === 'loading' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <VideoSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {/* ── Disconnected — show authorize button (admin only) ── */}
        {status === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-neutral-600"
                aria-hidden="true"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z"/>
              </svg>
            </div>

            <div>
              <p className="text-neutral-300 text-sm font-medium mb-1">TikTok not connected</p>
              <p className="text-neutral-600 text-xs max-w-xs">
                {isAdmin
                  ? 'Authorize your TikTok account to display marketing videos on the site.'
                  : 'Videos will appear here once the administrator connects the TikTok account.'}
              </p>
            </div>

            {/* Admin-only authorize button */}
            {isAdmin ? (
              <a
                id="tiktok-authorize-btn"
                href={TIKTOK_LOGIN_URL}
                className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#C8A24A] text-[#050505] text-sm font-semibold tracking-wide uppercase hover:bg-[#d4af61] transition-colors duration-300 shadow-lg shadow-[#C8A24A]/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z"/>
                </svg>
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

        {/* ── Error state ── */}
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

        {/* ── Connected — video grid ── */}
        {status === 'connected' && (
          <>
            {videos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-neutral-600 text-sm"
              >
                No videos found.{' '}
                {isAdmin && (
                  <span>
                    Make sure your TikTok sandbox account has videos posted.
                  </span>
                )}
              </motion.div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {videos.map((video, i) => (
                  <VideoCard key={video.id} video={video} index={i} onOpen={setActiveVideo} />
                ))}
              </div>
            )}

            {/* Admin: re-authorize option */}
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z"/>
                  </svg>
                  Re-authorize TikTok
                </a>
              </motion.div>
            )}
          </>
        )}
      </div>
      </section>
    </>
  );
}

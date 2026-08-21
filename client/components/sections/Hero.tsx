'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

const VIDEOS = [
  '/Videos/1.mp4',
  '/Videos/2.mp4',
  '/Videos/3.mp4',
];

export default function Hero() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When video ends, crossfade to the next one
  const handleVideoEnd = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % VIDEOS.length);
      setTransitioning(false);
    }, 600); // matches exit transition duration
  };

  // Play video from the start when the index changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play().catch(() => {});
  }, [index]);

  return (
    <section className="relative bg-black h-screen overflow-hidden w-full" style={{ height: '100dvh' }}>

      {/* ── Video layer ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <video
            ref={videoRef}
            src={VIDEOS[index]}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Cinematic overlay stack ──────────────────────────────── */}

      {/* 1. Primary dark vignette — deep edges, clear center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 50% 50%,
              transparent 30%,
              rgba(0,0,0,0.55) 80%,
              rgba(0,0,0,0.85) 100%
            )
          `,
        }}
      />

      {/* 2. Bottom-to-top gradient — keeps text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 35%, transparent 65%)',
        }}
      />

      {/* 3. Top fade — protects navbar area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%)',
        }}
      />

      {/* 4. Cinematic color grade — warm gold tint + slight cool shadows */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          background: 'linear-gradient(135deg, rgba(10,8,4,0.35) 0%, rgba(30,20,5,0.2) 50%, rgba(5,5,15,0.3) 100%)',
        }}
      />

      {/* 5. Subtle film grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* ── Video progress indicator ─────────────────────────────── */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex gap-2 justify-center pointer-events-none">
        {VIDEOS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === index ? 36 : 18,
              background: i === index ? '#C8A24A' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* ── Hero text content ─────────────────────────────────────── */}
      <div className="relative h-full max-w-6xl mx-auto px-6 flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <p className="text-xs tracking-[0.35em] text-white/70 uppercase">{t('hero.tagline')}</p>
          <h2 className="text-5xl md:text-6xl font-light text-white mt-6 leading-tight">
            {t('hero.title')}
          </h2>
          <p className="text-white/70 mt-6">{t('hero.description')}</p>

          <div className="flex gap-4 mt-10">
            <button className="relative px-6 py-3 bg-[#C8A24A] text-white overflow-hidden group transition duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.97]">
              <Link href="/cars">
                <span className="relative z-10">{t('hero.carsButton')}</span>
              </Link>
              <span className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-200" />
            </button>

            <button className="relative px-6 py-3 border border-white/40 text-white overflow-hidden group transition duration-200 ease-out hover:-translate-y-[1px] active:scale-[0.97]">
              <Link href="/about">
                <span className="relative z-10">{t('hero.aboutButton')}</span>
              </Link>
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-200" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


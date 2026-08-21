'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export default function IntroScreen() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Clear old stale keys
    sessionStorage.removeItem('hgm-intro-seen');
    localStorage.removeItem('hgm-intro-v2');

    const STORAGE_KEY = 'hgm-intro-last-shown';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    // Show intro if never shown OR more than 24 hours have passed
    const shouldShow = !lastShown || now - Number(lastShown) >= ONE_DAY_MS;

    if (shouldShow) {
      setVisible(true);
      const exitTimer = setTimeout(() => {
        setLeaving(true);
        setTimeout(() => {
          setVisible(false);
          localStorage.setItem(STORAGE_KEY, String(now));
        }, 800);
      }, 3500);
      return () => clearTimeout(exitTimer);
    }
  }, []);

  const handleSkip = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem('hgm-intro-last-shown', String(Date.now()));
    }, 800);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505]"
        initial={{ opacity: 1 }}
        animate={leaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex flex-col items-center gap-8 px-6 text-center select-none max-w-lg w-full">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/images/logo.jpg"
              alt="Hussein Ghulam Motors"
              className="h-16 w-16 md:h-20 md:w-20 rounded-full object-contain"
            />
          </motion.div>

          {/* Brand Name */}
          <div className="flex flex-col items-center gap-3">
            <div className="overflow-hidden">
              <motion.h1
                className="text-2xl md:text-3xl font-light tracking-[0.35em] uppercase text-white/90"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                Hussein Ghulam
              </motion.h1>
            </div>

            <div className="overflow-hidden">
              <motion.p
                className="text-sm md:text-base tracking-[0.6em] uppercase text-white/50"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                Motors
              </motion.p>
            </div>

            <motion.p
              className="text-[10px] tracking-[0.3em] uppercase mt-2 text-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {t('intro.tagline')}
            </motion.p>
          </div>

          {/* Progress Line */}
          <motion.div
            className="w-32 h-[1px] bg-white/10 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-white/70"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, delay: 0.8, ease: 'linear' }}
            />
          </motion.div>
        </div>

        {/* Skip button */}
        <motion.button
          onClick={handleSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 text-[10px] tracking-[0.25em] uppercase text-white/30 hover:text-white/70 transition-colors duration-300"
          aria-label="Skip intro"
        >
          {t('intro.skip')}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

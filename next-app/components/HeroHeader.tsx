'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SUBTITLES = [
  'Play against a personality, not a bot.',
  'Five chess minds. One engine. Different futures.',
  'Choose the mind your opponent plays with.',
];

const STATUS_PILLS = [
  { label: 'UCI Ready', color: '#22c55e' },
  { label: 'Transposition Table', color: '#6366f1' },
  { label: 'Quiescence Search', color: '#6366f1' },
  { label: 'MVV/LVA Ordering', color: '#6366f1' },
];

const STEPS = [
  { n: '1', label: 'Choose Engine Mind' },
  { n: '2', label: 'Make Your Move' },
  { n: '3', label: 'Watch the Reply' },
];

export default function HeroHeader() {
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    // Stagger the title reveal
    const t = setTimeout(() => setTitleVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIdx((i) => (i + 1) % SUBTITLES.length);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden px-8 pb-8 pt-10 text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8" aria-hidden>
        <div
          className="h-72 w-[700px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #6366f1 0%, #8b5cf6 40%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10">
        {/* Gradient title — letter-by-letter reveal */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: titleVisible ? 1 : 0, y: titleVisible ? 0 : -20 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 45%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Grandmaster Council
        </motion.h1>

        {/* Rotating subtitle */}
        <div className="mt-4 h-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={subtitleIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="text-lg font-light tracking-wide text-slate-300"
            >
              <span style={{ color: '#f0a500' }} className="font-semibold">
                {SUBTITLES[subtitleIdx].split(' ').slice(0, 1).join(' ')}{' '}
              </span>
              {SUBTITLES[subtitleIdx].split(' ').slice(1).join(' ')}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Hero copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mx-auto mt-3 max-w-lg text-sm text-slate-500"
        >
          Select a strategic personality, make your move, and watch the engine answer through that
          style of thinking.
        </motion.p>

        {/* 3-step flow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mx-auto mt-6 flex w-fit items-center gap-0 overflow-hidden rounded-xl border border-white/8 bg-white/3"
        >
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center">
              <div className="flex items-center gap-2 px-4 py-2.5">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black"
                  style={{
                    backgroundColor: 'rgba(99,102,241,0.3)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.4)',
                  }}
                >
                  {step.n}
                </span>
                <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="text-slate-700 text-xs px-1">→</span>
              )}
            </div>
          ))}
        </motion.div>

        {/* Status pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          {STATUS_PILLS.map((pill) => (
            <span
              key={pill.label}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-medium"
              style={{
                borderColor: `${pill.color}35`,
                backgroundColor: `${pill.color}0a`,
                color: pill.color,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: pill.color }}
              />
              {pill.label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

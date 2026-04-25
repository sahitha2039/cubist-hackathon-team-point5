'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getPersona } from '@/lib/personas';
import type { GamePhase, PersonaMode } from '@/lib/types';

const SUBTITLES = [
  'Play against a personality, not a bot.',
  'Five chess minds. One engine. Different futures.',
  'Choose the mind your opponent plays with.',
];

const STATUS_PILLS = [
  { label: 'UCI Ready', color: '#22c55e' },
  { label: 'Transposition Table', color: '#38bdf8' },
  { label: 'Quiescence Search', color: '#a78bfa' },
  { label: 'MVV/LVA Ordering', color: '#f59e0b' },
];

const STEPS = [
  { n: '1', label: 'Choose Engine Mind' },
  { n: '2', label: 'Make Your Move' },
  { n: '3', label: 'Watch the Reply' },
];

interface HeroHeaderProps {
  activeMode: PersonaMode;
  responseMode: PersonaMode;
  gamePhase: GamePhase;
  userMoveSan: string | null;
  engineMoveSan: string | null;
}

function formatEngineMove(move: string | null): string {
  if (!move) return 'the reply';
  return move.startsWith('...') ? move : `...${move}`;
}

function getStatusCopy(
  activeMode: PersonaMode,
  responseMode: PersonaMode,
  gamePhase: GamePhase,
  userMoveSan: string | null,
  engineMoveSan: string | null,
) {
  const selectedPersona = getPersona(activeMode);
  const replyPersona = getPersona(responseMode);

  if (gamePhase === 'engine_thinking') {
    return {
      eyebrow: 'Engine Thinking',
      title: `${replyPersona.nickname} is preparing the current reply.`,
      body:
        userMoveSan !== null
          ? `You played ${userMoveSan}. ${replyPersona.thinkingText}`
          : `${replyPersona.thinkingText} The selected mind only replies after your move.`,
    };
  }

  if (gamePhase === 'engine_replied') {
    const sameMind = activeMode === responseMode;
    return {
      eyebrow: 'Engine Replied',
      title: `${replyPersona.nickname} answered with ${formatEngineMove(engineMoveSan)}.`,
      body: sameMind
        ? `The same opponent brain is still selected for the next reply. Make your move when ready.`
        : `Next reply is currently set to ${selectedPersona.nickname}. Switch again now if you want a different opponent brain.`,
    };
  }

  return {
    eyebrow: 'Ready To Play',
    title: `You are playing against: ${selectedPersona.nickname}. Make your move.`,
    body: 'Choosing a personality sets the opponent brain for the next engine reply. It does not make a move on its own.',
  };
}

export default function HeroHeader({
  activeMode,
  responseMode,
  gamePhase,
  userMoveSan,
  engineMoveSan,
}: HeroHeaderProps) {
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const persona = getPersona(activeMode);
  const statusCopy = getStatusCopy(activeMode, responseMode, gamePhase, userMoveSan, engineMoveSan);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIdx((current) => (current + 1) % SUBTITLES.length);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative overflow-hidden px-6 pb-10 pt-10 md:px-8">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          animate={{ x: [0, 60, -20, 0], y: [0, 30, -25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-8rem] top-[-3rem] h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(56,189,248,0) 72%)' }}
        />
        <motion.div
          animate={{ x: [0, -70, 30, 0], y: [0, -20, 35, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-8rem] top-[-2rem] h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0) 72%)' }}
        />
        <motion.div
          animate={{ opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px]">
        <div className="hero-shell relative overflow-hidden rounded-[32px] border border-white/10 px-6 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:px-8 md:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                'radial-gradient(circle at top center, rgba(59,130,246,0.12), transparent 34%), radial-gradient(circle at 80% 18%, rgba(167,139,250,0.12), transparent 30%)',
            }}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-[0.3em] text-slate-400"
              >
                Personality Chess Engine
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="max-w-4xl text-5xl font-black tracking-[-0.05em] text-transparent md:text-6xl lg:text-7xl"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #ffffff 0%, #c7d2fe 32%, #7dd3fc 58%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  textShadow: '0 0 40px rgba(125,211,252,0.15)',
                }}
              >
                Grandmaster Council
              </motion.h1>

              <div className="mt-4 min-h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={subtitleIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className="text-lg tracking-wide text-slate-300"
                  >
                    {SUBTITLES[subtitleIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.55 }}
                className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base"
              >
                Select a strategic personality, make your move, and watch the engine answer through
                that style of thinking.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.55 }}
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                {STATUS_PILLS.map((pill) => (
                  <span
                    key={pill.label}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-medium"
                    style={{
                      borderColor: `${pill.color}35`,
                      backgroundColor: `${pill.color}10`,
                      color: pill.color,
                      boxShadow: `0 0 12px ${pill.color}18`,
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: pill.color, boxShadow: `0 0 8px ${pill.color}` }}
                    />
                    {pill.label}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="rounded-[28px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur-xl"
              style={{
                boxShadow: `0 0 0 1px ${persona.accentColor}20, 0 22px 48px rgba(0,0,0,0.28)`,
              }}
            >
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
                {statusCopy.eyebrow}
              </p>
              <p className="mt-3 text-xl font-bold text-white">{statusCopy.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{statusCopy.body}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: `${persona.accentColor}18`,
                    color: persona.accentColor,
                    border: `1px solid ${persona.accentColor}35`,
                  }}
                >
                  Opponent Brain: {persona.nickname}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400">
                  Next reply uses this mind
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="relative z-10 mt-8 flex flex-wrap items-center gap-2 rounded-[22px] border border-white/8 bg-slate-950/40 p-2"
          >
            {STEPS.map((step, index) => (
              <div key={step.n} className="flex items-center">
                <div className="flex items-center gap-3 rounded-[16px] px-3 py-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black"
                    style={{
                      backgroundColor: 'rgba(99,102,241,0.18)',
                      border: '1px solid rgba(99,102,241,0.28)',
                      color: '#c7d2fe',
                    }}
                  >
                    {step.n}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && <span className="px-1 text-slate-600">→</span>}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </header>
  );
}

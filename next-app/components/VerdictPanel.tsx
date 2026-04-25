'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Gavel } from 'lucide-react';
import { getPersona } from '@/lib/personas';
import type { CouncilVerdict, MoveGrade, PersonaMode } from '@/lib/types';

const GRADE_COLORS: Record<string, string> = {
  Brilliant: '#a855f7',
  Best: '#22c55e',
  Excellent: '#3b82f6',
  Good: '#6366f1',
  Inaccuracy: '#f59e0b',
  Mistake: '#f97316',
  Blunder: '#ef4444',
};

interface VerdictPanelProps {
  verdict: CouncilVerdict | null;
  moveGrade: MoveGrade | null;
  isLoading: boolean;
  activeMode: PersonaMode;
}

export default function VerdictPanel({ verdict, moveGrade, isLoading, activeMode }: VerdictPanelProps) {
  const persona = getPersona(activeMode);
  const gradeColor = moveGrade ? GRADE_COLORS[moveGrade.grade] ?? '#94a3b8' : '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="glass-panel flex flex-col rounded-xl p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <Gavel size={14} className="text-amber-400" />
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
          Council Verdict
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 py-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
              className="h-10 w-10 rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${persona.accentColor}30`, borderTopColor: persona.accentColor }}
            />
            <p className="font-mono text-sm" style={{ color: `${persona.accentColor}99` }}>
              {persona.thinkingText}
            </p>
          </motion.div>
        ) : !verdict ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center py-8 text-center"
          >
            <p className="text-3xl mb-3 opacity-20">⚖️</p>
            <p className="text-sm text-slate-600">Make a move to see the council verdict.</p>
          </motion.div>
        ) : (
          <motion.div
            key={verdict.move}
            initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="flex flex-1 flex-col gap-4"
          >
            {/* Big move */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex h-20 w-20 items-center justify-center rounded-xl font-mono text-3xl font-black text-white"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(99,102,241,0.4)',
                  boxShadow: '0 0 30px rgba(99,102,241,0.25)',
                }}
              >
                {verdict.move}
              </motion.div>

              <div className="flex-1 space-y-2">
                {/* Votes */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: verdict.totalVotes }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.08, type: 'spring' }}
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: i < verdict.votes ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                        boxShadow: i < verdict.votes ? '0 0 6px rgba(139,92,246,0.6)' : undefined,
                      }}
                    />
                  ))}
                  <span className="text-xs text-slate-500 font-mono">
                    {verdict.votes}/{verdict.totalVotes} votes
                  </span>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="mb-1 flex justify-between text-[10px]">
                    <span className="text-slate-500">Confidence</span>
                    <span className="font-mono font-bold text-violet-400">{verdict.confidence}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${verdict.confidence}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-violet-500"
                    />
                  </div>
                </div>

                {/* Grade badge */}
                {moveGrade && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="inline-block rounded px-2 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}
                  >
                    {moveGrade.grade}
                  </motion.span>
                )}
              </div>
            </div>

            {/* Dissent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500/70 mb-0.5">
                Dissent
              </p>
              <p className="text-xs text-slate-400">{verdict.dissent}</p>
            </motion.div>

            {/* Reasoning */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Why this move won
              </p>
              <p className="text-xs leading-relaxed text-slate-400">{verdict.reasoning}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

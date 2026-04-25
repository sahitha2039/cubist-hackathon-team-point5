'use client';

import { motion } from 'motion/react';
import { getPersona } from '@/lib/personas';
import type { PersonaMode } from '@/lib/types';

interface EngineReplyPanelProps {
  activeMode: PersonaMode;
  userMoveSan: string | null;
  engineMoveSan: string | null;
  engineReasoning: string | null;
  enginePlan: string | null;
  isLoading: boolean;
}

export default function EngineReplyPanel({
  activeMode,
  userMoveSan,
  engineMoveSan,
  engineReasoning,
  enginePlan,
  isLoading,
}: EngineReplyPanelProps) {
  const persona = getPersona(activeMode);

  if (!isLoading && !engineMoveSan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-panel rounded-xl p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
          Engine Reply
        </p>
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${persona.accentColor}20`, color: persona.accentColor }}
        >
          {persona.nickname}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="animate-pulse h-8 rounded-lg bg-white/5" />
          <div className="animate-pulse h-4 w-3/4 rounded bg-white/5" />
          <div className="animate-pulse h-4 w-1/2 rounded bg-white/5" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          {/* Move exchange */}
          <div className="flex items-center gap-3">
            {/* User move */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                You played
              </span>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-mono text-base font-bold text-blue-300">
                {userMoveSan ?? '—'}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-0.5 pt-4">
              <div className="text-slate-600">→</div>
            </div>

            {/* Engine move */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                {persona.nickname} replied
              </span>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 250 }}
                className="rounded-lg px-3 py-1.5 font-mono text-base font-bold"
                style={{
                  backgroundColor: `${persona.accentColor}18`,
                  border: `1px solid ${persona.accentColor}35`,
                  color: persona.accentColor,
                  boxShadow: `0 0 12px ${persona.glowColor}`,
                }}
              >
                …{engineMoveSan}
              </motion.div>
            </div>
          </div>

          {/* Reasoning */}
          {engineReasoning && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="border-l-2 pl-3 text-xs italic leading-relaxed text-slate-400"
              style={{ borderColor: `${persona.accentColor}40` }}
            >
              &quot;{engineReasoning}&quot;
            </motion.p>
          )}

          {/* Plan */}
          {enginePlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex items-start gap-2"
            >
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Plan
              </span>
              <p className="text-xs text-slate-500">{enginePlan}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { getPersona } from '@/lib/personas';
import type { PersonaOpinion, PersonaMode } from '@/lib/types';

interface OpinionCardProps {
  opinion: PersonaOpinion;
  index: number;
}

function OpinionCard({ opinion, index }: OpinionCardProps) {
  const persona = getPersona(opinion.persona);

  return (
    <motion.div
      key={opinion.persona}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
      className="relative overflow-hidden rounded-xl p-4"
      style={{
        backgroundColor: `${persona.accentColor}08`,
        border: `1px solid ${persona.accentColor}25`,
      }}
    >
      {/* Persona header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: persona.accentColor, boxShadow: `0 0 6px ${persona.glowColor}` }}
          />
          <span className="text-sm font-bold" style={{ color: persona.accentColor }}>
            {persona.nickname}
          </span>
          <span className="text-xs text-slate-600">{persona.inspiration}</span>
        </div>
        {opinion.agrees ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle size={10} /> Agrees
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
            <XCircle size={10} /> Dissents
          </span>
        )}
      </div>

      {/* Move recommendation */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className="rounded-lg px-3 py-1.5 font-mono text-lg font-bold"
          style={{
            backgroundColor: `${persona.accentColor}18`,
            color: persona.accentColor,
            border: `1px solid ${persona.accentColor}35`,
          }}
        >
          {opinion.recommendedMove}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Confidence</span>
            <span className="font-mono text-xs font-bold text-slate-300">{opinion.confidence}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${opinion.confidence}%` }}
              transition={{ delay: index * 0.12 + 0.5, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: persona.accentColor }}
            />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-xs leading-relaxed text-slate-400">{opinion.reasoning}</p>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/5 bg-white/2 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
      <div className="mb-3 flex gap-3">
        <div className="h-9 w-16 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-1.5 w-full rounded-full bg-white/5">
            <div className="h-1.5 w-2/3 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded bg-white/8" />
        <div className="h-2 w-3/4 rounded bg-white/8" />
      </div>
    </div>
  );
}

interface CouncilDebateTimelineProps {
  opinions: PersonaOpinion[];
  isLoading: boolean;
  activeMode: PersonaMode;
}

export default function CouncilDebateTimeline({ opinions, isLoading, activeMode }: CouncilDebateTimelineProps) {
  const activePersona = getPersona(activeMode);
  if (!isLoading && opinions.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
          Council Debate
        </p>
        {isLoading && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs font-mono"
            style={{ color: activePersona.accentColor }}
          >
            {activePersona.thinkingText}
          </motion.span>
        )}
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="opinions"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {opinions.map((op, i) => (
              <OpinionCard key={op.persona} opinion={op} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

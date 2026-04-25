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

function formatEngineMove(move: string | null): string {
  if (!move) return 'Calculating...';
  return move.startsWith('...') ? move : `...${move}`;
}

function ValueShell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/3 px-4 py-3">
      <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-base font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
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

  if (!isLoading && !userMoveSan && !engineMoveSan) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-panel rounded-[28px] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
            Engine Reply
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">See the exchange as a clear sequence.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Your move triggers a reply from the selected opponent brain. This panel makes that handoff explicit.
          </p>
        </div>

        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: `${persona.accentColor}18`,
            color: persona.accentColor,
            border: `1px solid ${persona.accentColor}35`,
          }}
        >
          Engine personality: {persona.nickname}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ValueShell label="User Played" value={userMoveSan ?? '--'} accent="#60a5fa" />
        <ValueShell label="Engine Personality" value={persona.nickname} accent={persona.accentColor} />
        <ValueShell label="Engine Replied" value={formatEngineMove(engineMoveSan)} accent="#f59e0b" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] border border-white/8 bg-slate-950/45 px-4 py-4">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-500">
            Why This Personality Chose It
          </p>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-4 animate-pulse rounded bg-white/8" />
              <div className="h-4 animate-pulse rounded bg-white/6" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/6" />
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {engineReasoning ?? persona.copy}
            </p>
          )}
        </div>

        <div className="rounded-[22px] border border-white/8 bg-slate-950/45 px-4 py-4">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-500">
            Immediate Threat Or Plan
          </p>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-4 animate-pulse rounded bg-white/8" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/6" />
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {enginePlan ?? `${persona.nickname} is trying to steer the game toward its preferred kind of position.`}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

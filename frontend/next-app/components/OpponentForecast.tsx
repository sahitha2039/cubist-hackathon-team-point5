'use client';

import { motion } from 'motion/react';
import { getPersona } from '@/lib/personas';
import type { PersonaMode, TopMove, PersonaOpinion } from '@/lib/types';

interface OpponentForecastProps {
  activeMode: PersonaMode;
  topMoves: TopMove[];
  opinions: PersonaOpinion[];
  isLoading: boolean;
}

function fmtEval(e: number | undefined): string {
  if (e === undefined) return '';
  const sign = e >= 0 ? '+' : '';
  return ` (${sign}${(e / 100).toFixed(2)})`;
}

export default function OpponentForecast({
  activeMode,
  topMoves,
  opinions,
  isLoading,
}: OpponentForecastProps) {
  const persona = getPersona(activeMode);

  // Derive forecasts: prefer topMoves, fall back to opinions
  const forecasts: TopMove[] =
    topMoves.length > 0
      ? topMoves.slice(0, 3)
      : opinions.slice(0, 3).map((op) => ({
          move: op.recommendedMove,
          description: op.reasoning.split('.')[0],
        }));

  if (!isLoading && forecasts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="glass-panel rounded-xl p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
          Opponent Forecast
        </p>
        <span
          className="text-[10px] font-semibold text-slate-600"
          style={{ color: `${persona.accentColor}80` }}
        >
          {persona.nickname}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-white/8" />
              <div className="h-7 w-12 rounded-lg bg-white/8" />
              <div className="h-3 flex-1 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {forecasts.map((fm, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, x: -8 },
                show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
              }}
              className="flex items-start gap-3"
            >
              {/* Rank */}
              <span className="mt-0.5 w-4 shrink-0 text-center font-mono text-xs font-bold text-slate-600">
                {i + 1}.
              </span>

              {/* Move badge */}
              <span
                className="shrink-0 rounded-md px-2 py-0.5 font-mono text-sm font-bold"
                style={{
                  backgroundColor: i === 0 ? `${persona.accentColor}20` : 'rgba(255,255,255,0.05)',
                  color: i === 0 ? persona.accentColor : '#94a3b8',
                  border: `1px solid ${i === 0 ? `${persona.accentColor}35` : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                {fm.san ?? fm.move}
              </span>

              {/* Description + eval */}
              <div className="flex-1">
                <p className="text-xs leading-snug text-slate-400">
                  {fm.description}
                  {fm.eval !== undefined && (
                    <span className="font-mono text-slate-600">{fmtEval(fm.eval)}</span>
                  )}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

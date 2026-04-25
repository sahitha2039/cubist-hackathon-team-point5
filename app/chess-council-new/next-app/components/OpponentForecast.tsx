'use client';

import { motion } from 'motion/react';
import { getPersona } from '@/lib/personas';
import type { PersonaMode, TopMove, PersonaOpinion } from '@/lib/types';

interface OpponentForecastProps {
  activeMode: PersonaMode;
  topMoves: TopMove[];
  opinions: PersonaOpinion[];
  actualReply: string | null;
  enginePlan: string | null;
  isLoading: boolean;
}

const FALLBACK_FORECASTS: Record<PersonaMode, TopMove[]> = {
  firefighter: [
    { move: 'e5', san: 'e5', description: 'Challenges the center with immediate force.' },
    { move: 'c5', san: 'c5', description: 'Creates asymmetry and invites tactical play.' },
    { move: 'Nf6', san: 'Nf6', description: 'Develops quickly while attacking the center.' },
  ],
  optimizer: [
    { move: 'e5', san: 'e5', description: 'Builds a stable center and prepares long-term pressure.' },
    { move: 'Nf6', san: 'Nf6', description: 'Develops with restraint and keeps the structure flexible.' },
    { move: 'c6', san: 'c6', description: 'Supports a durable center before committing further.' },
  ],
  wall: [
    { move: 'Nf6', san: 'Nf6', description: 'Finishes development while covering key squares.' },
    { move: 'c6', san: 'c6', description: 'Neutralizes central ideas before counterattacking.' },
    { move: 'e6', san: 'e6', description: 'Keeps the position solid and denies quick tactics.' },
  ],
  grinder: [
    { move: 'Nf6', san: 'Nf6', description: 'Develops naturally and keeps multiple plans available.' },
    { move: 'e5', san: 'e5', description: 'Claims space and simplifies the decision tree.' },
    { move: 'O-O', san: 'O-O', description: 'Improves king safety before choosing the next imbalance.' },
  ],
  council: [
    { move: 'O-O', san: 'O-O', description: 'Improves king safety before choosing a shared plan.' },
    { move: 'e5', san: 'e5', description: 'Contests the center and opens a sharper debate.' },
    { move: 'c5', san: 'c5', description: 'Creates asymmetry and invites competing plans.' },
  ],
};

function formatMoveLabel(move: string | undefined, san?: string): string {
  const value = san ?? move ?? '--';
  if (value.startsWith('...')) return value;
  if (value.length >= 4 && /^[a-h][1-8][a-h][1-8]/.test(value)) {
    return `...${value.slice(0, 2)}-${value.slice(2, 4)}`;
  }
  return `...${value}`;
}

function fmtEval(evalCp: number | undefined): string | null {
  if (evalCp === undefined) return null;
  const sign = evalCp >= 0 ? '+' : '';
  return `${sign}${(evalCp / 100).toFixed(2)}`;
}

export default function OpponentForecast({
  activeMode,
  topMoves,
  opinions,
  actualReply,
  enginePlan,
  isLoading,
}: OpponentForecastProps) {
  const persona = getPersona(activeMode);

  const forecasts =
    topMoves.length > 0
      ? topMoves.slice(0, 3)
      : opinions.length > 0
        ? opinions.slice(0, 3).map((opinion) => ({
            move: opinion.recommendedMove.replace(/^\.\.\./, ''),
            san: opinion.recommendedMove.replace(/^\.\.\./, ''),
            eval: undefined,
            description: opinion.reasoning.split('. ')[0] ?? opinion.reasoning,
          }))
        : FALLBACK_FORECASTS[activeMode];

  const predictedReply = forecasts[0];

  if (!isLoading && forecasts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="glass-panel rounded-[28px] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
            Opponent Forecast
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">Projected replies from the selected mind.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Use this as the opponent preview: what the engine is most likely to do, and what each move is trying to achieve.
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
          Forecasting {persona.nickname}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-[20px] border border-white/8 bg-white/3 px-4 py-3">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-500">
            Predicted Reply
          </p>
          {isLoading ? (
            <div className="mt-3 h-7 w-24 animate-pulse rounded-xl bg-white/8" />
          ) : (
            <p className="mt-3 font-mono text-xl font-bold" style={{ color: persona.accentColor }}>
              {formatMoveLabel(predictedReply?.move, predictedReply?.san)}
            </p>
          )}
        </div>

        <div className="rounded-[20px] border border-white/8 bg-white/3 px-4 py-3">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-500">
            Actual Reply
          </p>
          {isLoading ? (
            <div className="mt-3 h-7 w-24 animate-pulse rounded-xl bg-white/8" />
          ) : (
            <p className="mt-3 font-mono text-xl font-bold text-amber-300">
              {actualReply ? formatMoveLabel(actualReply) : 'Waiting for reply'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-slate-950/45 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-slate-500">
            Top Candidate Replies
          </p>
          {enginePlan && !isLoading && <span className="text-xs text-slate-500">{enginePlan}</span>}
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <div className="h-5 w-5 animate-pulse rounded-full bg-white/8" />
                <div className="h-8 w-20 animate-pulse rounded-xl bg-white/8" />
                <div className="h-4 flex-1 animate-pulse rounded bg-white/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {forecasts.map((forecast, index) => {
              const display = formatMoveLabel(forecast.move, forecast.san);
              const matchesActual = actualReply !== null && formatMoveLabel(actualReply) === display;

              return (
                <div
                  key={`${forecast.move}-${index}`}
                  className="rounded-[18px] border border-white/8 bg-white/3 px-3 py-3"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/6 font-mono text-xs font-bold text-slate-300">
                      {index + 1}
                    </span>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 font-mono text-sm font-bold"
                          style={{
                            backgroundColor:
                              index === 0 ? `${persona.accentColor}18` : 'rgba(255,255,255,0.05)',
                            color: index === 0 ? persona.accentColor : '#e2e8f0',
                            border: `1px solid ${index === 0 ? `${persona.accentColor}30` : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {display}
                        </span>
                        {matchesActual && (
                          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                            Played
                          </span>
                        )}
                        {fmtEval(forecast.eval) && (
                          <span className="font-mono text-xs text-slate-500">{fmtEval(forecast.eval)}</span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-300">{forecast.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

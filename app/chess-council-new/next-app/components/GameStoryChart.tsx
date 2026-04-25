'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { getPersona } from '@/lib/personas';
import type { HingeMove, PersonalitySwitch, RootCauseMarker } from '@/lib/types';

interface GameStoryChartProps {
  history: number[];
  hingeMoves?: HingeMove[];
  personalitySwitches?: PersonalitySwitch[];
  rootCauseMarker?: RootCauseMarker | null;
}

const W = 960;
const H = 320;
const PAD = { left: 60, right: 26, top: 26, bottom: 58 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function xOf(index: number, length: number) {
  return PAD.left + (length <= 1 ? CHART_W / 2 : (index / (length - 1)) * CHART_W);
}

function yOf(value: number) {
  return PAD.top + (1 - value / 100) * CHART_H;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function GameStoryChart({
  history,
  hingeMoves = [],
  personalitySwitches = [],
  rootCauseMarker = null,
}: GameStoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (history.length < 2) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="glass-panel rounded-[32px] p-6 md:p-7"
      >
        <div className="rounded-[26px] border border-white/8 bg-slate-950/45 px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-slate-400">
            +
          </div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
            Game Story
          </p>
          <h3 className="mt-3 text-2xl font-bold text-white">Win probability across the game</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Game Story unlocks after two moves. Make your first move to start the win probability timeline.
          </p>
          <div className="mx-auto mt-5 max-w-sm rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-400">
            Timeline progress: {history.length}/2 data points
          </div>
        </div>
      </motion.section>
    );
  }

  const points = history.map((value, index) => ({ index, value, x: xOf(index, history.length), y: yOf(value) }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = [
    `${points[0]?.x ?? PAD.left},${PAD.top + CHART_H}`,
    polyline,
    `${points[points.length - 1]?.x ?? PAD.left},${PAD.top + CHART_H}`,
  ].join(' ');
  const activeIndex = hoveredIndex ?? history.length - 1;
  const activePoint = points[activeIndex];
  const currentValue = history[history.length - 1];
  const lastSwing = history[history.length - 1] - history[history.length - 2];
  const advantageLabel = currentValue > 55 ? 'White edge' : currentValue < 45 ? 'Black edge' : 'Near equal';
  const advantageColor = currentValue > 55 ? '#38bdf8' : currentValue < 45 ? '#f97316' : '#cbd5e1';
  const hingeMap = new Map(hingeMoves.map((hinge) => [hinge.moveIndex, hinge]));
  const switchMap = new Map(personalitySwitches.map((item) => [item.moveIndex, item]));
  const activeHinge = hingeMap.get(activeIndex);
  const activeSwitch = switchMap.get(activeIndex);
  const isRootCausePoint = rootCauseMarker?.moveIndex === activeIndex;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="glass-panel rounded-[32px] p-6 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
            Game Story
          </p>
          <h3 className="mt-2 text-3xl font-bold text-white">Win probability across the game</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            The returned timeline becomes the game narrative. Hover the chart to inspect swings, hinge moments, and any optional markers the backend provides.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[20px] border border-white/8 bg-white/3 px-4 py-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500">Current</p>
            <p className="mt-2 font-mono text-2xl font-black" style={{ color: advantageColor }}>
              {currentValue}%
            </p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/3 px-4 py-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500">Last Swing</p>
            <p className="mt-2 font-mono text-2xl font-black text-white">
              {lastSwing >= 0 ? '+' : ''}
              {lastSwing}
            </p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/3 px-4 py-3">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-500">State</p>
            <p className="mt-2 text-sm font-bold" style={{ color: advantageColor }}>
              {advantageLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-5 rounded-full bg-sky-400/80" />
          Win probability
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-5 border-t border-dashed border-white/25" />
          50% equilibrium
        </span>
        {hingeMoves.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Hinge move
          </span>
        )}
        {personalitySwitches.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Personality switch
          </span>
        )}
        {rootCauseMarker && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rotate-45 bg-red-400" />
            Root cause
          </span>
        )}
      </div>

      <div className="relative mt-5 rounded-[26px] border border-white/8 bg-slate-950/45 p-4">
        <div
          className="pointer-events-none absolute rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 shadow-[0_18px_36px_rgba(0,0,0,0.35)]"
          style={{
            left: `${clamp((activePoint.x / W) * 100, 14, 86)}%`,
            top: `${clamp((activePoint.y / H) * 100 - 8, 6, 78)}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-slate-500">
            Ply {activeIndex + 1}
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-white">{history[activeIndex]}%</p>
          {activeHinge && <p className="mt-1 max-w-xs text-xs leading-5 text-amber-200">{activeHinge.description}</p>}
          {activeSwitch && (
            <p className="mt-1 text-xs leading-5 text-violet-200">
              Switch: {activeSwitch.label ?? getPersona(activeSwitch.mode).nickname}
            </p>
          )}
          {isRootCausePoint && rootCauseMarker?.description && (
            <p className="mt-1 text-xs leading-5 text-red-200">{rootCauseMarker.description}</p>
          )}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: 290 }}
        >
          <defs>
            <linearGradient id="game-story-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
            <filter id="game-story-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <text
                x={PAD.left - 10}
                y={yOf(tick) + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize={10}
                fontFamily="monospace"
              >
                {tick}%
              </text>
              <line
                x1={PAD.left}
                x2={PAD.left + CHART_W}
                y1={yOf(tick)}
                y2={yOf(tick)}
                stroke={tick === 50 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)'}
                strokeDasharray={tick === 50 ? '5 5' : undefined}
              />
            </g>
          ))}

          {personalitySwitches.map((marker) => {
            const persona = getPersona(marker.mode);
            const x = xOf(marker.moveIndex, history.length);
            return (
              <g key={`${marker.mode}-${marker.moveIndex}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD.top}
                  y2={PAD.top + CHART_H}
                  stroke={`${persona.accentColor}88`}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <rect
                  x={x - 28}
                  y={PAD.top - 4}
                  width={56}
                  height={18}
                  rx={9}
                  fill="rgba(15,23,42,0.92)"
                  stroke={`${persona.accentColor}88`}
                />
                <text
                  x={x}
                  y={PAD.top + 8}
                  textAnchor="middle"
                  fill={persona.accentColor}
                  fontSize={9}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {marker.label ?? persona.nickname.replace(/^The /, '')}
                </text>
              </g>
            );
          })}

          {rootCauseMarker && (
            <g>
              <line
                x1={xOf(rootCauseMarker.moveIndex, history.length)}
                x2={xOf(rootCauseMarker.moveIndex, history.length)}
                y1={PAD.top}
                y2={PAD.top + CHART_H}
                stroke="rgba(248,113,113,0.55)"
                strokeWidth={1}
                strokeDasharray="6 4"
              />
              <rect
                x={xOf(rootCauseMarker.moveIndex, history.length) - 5}
                y={yOf(history[rootCauseMarker.moveIndex] ?? 50) - 5}
                width={10}
                height={10}
                transform={`rotate(45 ${xOf(rootCauseMarker.moveIndex, history.length)} ${yOf(history[rootCauseMarker.moveIndex] ?? 50)})`}
                fill="#f87171"
                filter="url(#game-story-glow)"
              />
            </g>
          )}

          <polygon points={area} fill="url(#game-story-fill)" />

          {hingeMoves.map((hinge) => {
            if (hinge.moveIndex >= history.length) return null;
            const x = xOf(hinge.moveIndex, history.length);
            const y = yOf(history[hinge.moveIndex]);
            return (
              <g key={hinge.moveIndex}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD.top}
                  y2={PAD.top + CHART_H}
                  stroke="rgba(245,158,11,0.34)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle cx={x} cy={y} r={6} fill="#f59e0b" filter="url(#game-story-glow)" />
                <circle cx={x} cy={y} r={3} fill="#fff7ed" />
              </g>
            );
          })}

          <polyline
            points={polyline}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#game-story-glow)"
          />

          {points.map((point) => (
            <g key={point.index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.index === activeIndex ? 6 : 4}
                fill={point.index === activeIndex ? '#ffffff' : '#bae6fd'}
                stroke="#38bdf8"
                strokeWidth={2}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={12}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(point.index)}
                onFocus={() => setHoveredIndex(point.index)}
              />
            </g>
          ))}

          {points.map((point) => {
            if (history.length > 20 && point.index % 4 !== 0 && point.index !== history.length - 1) return null;
            if (history.length > 10 && history.length <= 20 && point.index % 2 !== 0 && point.index !== history.length - 1) return null;

            return (
              <text
                key={`x-${point.index}`}
                x={point.x}
                y={H - 18}
                textAnchor="middle"
                fill="#64748b"
                fontSize={10}
                fontFamily="monospace"
              >
                {point.index + 1}
              </text>
            );
          })}

          <text
            x={PAD.left + CHART_W / 2}
            y={H - 2}
            textAnchor="middle"
            fill="#475569"
            fontSize={10}
            fontFamily="monospace"
            fontWeight="700"
          >
            PLY
          </text>
        </svg>
      </div>
    </motion.section>
  );
}

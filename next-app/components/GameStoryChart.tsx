'use client';

import { motion } from 'motion/react';
import type { HingeMove } from '@/lib/types';

interface GameStoryChartProps {
  history: number[];
  hingeMoves?: HingeMove[];
}

const W = 800;
const H = 200;
const PAD = { left: 40, right: 20, top: 16, bottom: 36 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

function xOf(i: number, len: number) {
  return PAD.left + (len <= 1 ? CW / 2 : (i / (len - 1)) * CW);
}
function yOf(v: number) {
  return PAD.top + (1 - v / 100) * CH;
}

export default function GameStoryChart({ history, hingeMoves = [] }: GameStoryChartProps) {
  // Placeholder when not enough data
  if (history.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel flex flex-col items-center justify-center rounded-xl px-8 py-12 text-center"
      >
        <div className="mb-3 text-3xl opacity-20">📈</div>
        <p className="text-sm font-semibold text-slate-400">Game Story</p>
        <p className="mt-1 max-w-xs text-xs text-slate-600">
          Win probability timeline unlocks after two moves. Make your first move to start the game
          story.
        </p>
      </motion.div>
    );
  }

  const pts = history.map((v, i) => `${xOf(i, history.length)},${yOf(v)}`).join(' ');
  const lastX = xOf(history.length - 1, history.length);
  const lastY = yOf(history[history.length - 1]);
  const fillPts = [
    `${PAD.left},${yOf(history[0])}`,
    pts,
    `${lastX},${PAD.top + CH}`,
    `${PAD.left},${PAD.top + CH}`,
  ].join(' ');

  const current = history[history.length - 1];
  const advantage = current > 55 ? 'White' : current < 45 ? 'Black' : 'Equal';
  const advantageColor = current > 55 ? '#6366f1' : current < 45 ? '#ef4444' : '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-xl p-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-white">Game Story</p>
          <p className="text-xs text-slate-500">Win probability across the game</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-600">
              Current
            </p>
            <p className="font-mono text-lg font-black" style={{ color: advantageColor }}>
              {current}%
            </p>
          </div>
          <div
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
            style={{ backgroundColor: `${advantageColor}18`, color: advantageColor }}
          >
            {advantage}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-5 text-[10px] text-slate-600 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm bg-indigo-500/70" />
          White advantage
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[1px] w-4 border-t border-dashed border-white/25" />
          50% equilibrium
        </span>
        {hingeMoves.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Hinge move
          </span>
        )}
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: 200 }}
      >
        <defs>
          <linearGradient id="gs-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <clipPath id="gs-clip">
            <rect x={PAD.left} y={PAD.top} width={CW} height={CH} />
          </clipPath>
          <filter id="gs-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-axis gridlines & labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <text
              x={PAD.left - 7}
              y={yOf(v) + 4}
              textAnchor="end"
              fill="#475569"
              fontSize={9}
              fontFamily="monospace"
            >
              {v}
            </text>
            <line
              x1={PAD.left}
              x2={PAD.left + CW}
              y1={yOf(v)}
              y2={yOf(v)}
              stroke={v === 50 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)'}
              strokeDasharray={v === 50 ? '5 5' : undefined}
            />
          </g>
        ))}

        {/* Fill */}
        <polygon points={fillPts} fill="url(#gs-fill)" clipPath="url(#gs-clip)" />

        {/* Hinge markers */}
        {hingeMoves.map((h) => {
          if (h.moveIndex >= history.length) return null;
          const hx = xOf(h.moveIndex, history.length);
          const hy = yOf(history[h.moveIndex]);
          return (
            <g key={h.moveIndex}>
              <line
                x1={hx}
                x2={hx}
                y1={PAD.top}
                y2={PAD.top + CH}
                stroke="rgba(245,158,11,0.35)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={hx} cy={hy} r={5} fill="#f59e0b" filter="url(#gs-glow)" />
              <circle cx={hx} cy={hy} r={3} fill="#f59e0b" />
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={pts}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath="url(#gs-clip)"
          filter="url(#gs-glow)"
        />

        {/* End dot */}
        <circle cx={lastX} cy={lastY} r={5} fill="#6366f1" filter="url(#gs-glow)" />
        <circle cx={lastX} cy={lastY} r={3} fill="white" />

        {/* X-axis move numbers */}
        {history.map((_, i) => {
          if (history.length > 16 && i % 4 !== 0) return null;
          if (history.length > 8 && history.length <= 16 && i % 2 !== 0) return null;
          return (
            <text
              key={i}
              x={xOf(i, history.length)}
              y={H - 10}
              textAnchor="middle"
              fill="#475569"
              fontSize={9}
              fontFamily="monospace"
            >
              {i + 1}
            </text>
          );
        })}

        {/* X-axis label */}
        <text
          x={PAD.left + CW / 2}
          y={H - 2}
          textAnchor="middle"
          fill="#334155"
          fontSize={8}
          fontFamily="monospace"
        >
          MOVE
        </text>
      </svg>

      {/* Hinge annotations */}
      {hingeMoves.map((h) => (
        <p key={h.moveIndex} className="mt-2 text-[10px] text-slate-500 font-mono">
          <span className="mr-1 text-amber-400">★</span>
          Move {h.moveIndex + 1}: {h.description}
        </p>
      ))}
    </motion.div>
  );
}

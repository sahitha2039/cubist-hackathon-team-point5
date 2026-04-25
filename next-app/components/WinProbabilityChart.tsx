'use client';

import { motion } from 'motion/react';
import type { HingeMove } from '@/lib/types';

interface WinProbabilityChartProps {
  history: number[];
  hingeMoves?: HingeMove[];
}

const W = 600;
const H = 130;
const PAD = { left: 36, right: 16, top: 10, bottom: 28 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function xOf(i: number, len: number) {
  return PAD.left + (len <= 1 ? CHART_W / 2 : (i / (len - 1)) * CHART_W);
}
function yOf(v: number) {
  return PAD.top + (1 - v / 100) * CHART_H;
}

export default function WinProbabilityChart({ history, hingeMoves = [] }: WinProbabilityChartProps) {
  if (!history.length) return null;

  const pts = history.map((v, i) => `${xOf(i, history.length)},${yOf(v)}`).join(' ');
  const lastX = xOf(history.length - 1, history.length);
  const lastY = yOf(history[history.length - 1]);
  const bottomLeft = `${PAD.left},${PAD.top + CHART_H}`;
  const bottomRight = `${lastX},${PAD.top + CHART_H}`;
  const fillPts = `${PAD.left},${yOf(history[0])} ${pts} ${bottomRight} ${bottomLeft}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="glass-panel rounded-xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
          Win Probability Curve
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
            White advantage
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1 w-4 border-t border-dashed border-white/20" />
            Equilibrium
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: 130 }}
      >
        <defs>
          <linearGradient id="wpc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="wpc-clip">
            <rect x={PAD.left} y={PAD.top} width={CHART_W} height={CHART_H} />
          </clipPath>
        </defs>

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <text
              x={PAD.left - 6}
              y={yOf(v) + 4}
              textAnchor="end"
              className="fill-slate-600 font-mono"
              fontSize={9}
            >
              {v}
            </text>
            <line
              x1={PAD.left}
              x2={PAD.left + CHART_W}
              y1={yOf(v)}
              y2={yOf(v)}
              stroke={v === 50 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
              strokeDasharray={v === 50 ? '4 4' : undefined}
            />
          </g>
        ))}

        {/* Fill area */}
        <polygon points={fillPts} fill="url(#wpc-fill)" clipPath="url(#wpc-clip)" />

        {/* Hinge move markers */}
        {hingeMoves.map((h) => {
          const hx = xOf(h.moveIndex, history.length);
          return (
            <g key={h.moveIndex}>
              <line
                x1={hx}
                x2={hx}
                y1={PAD.top}
                y2={PAD.top + CHART_H}
                stroke="#f0a500"
                strokeOpacity={0.5}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={hx} cy={yOf(history[h.moveIndex] ?? 50)} r={3} fill="#f0a500" />
            </g>
          );
        })}

        {/* Line */}
        <polyline
          points={pts}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
          clipPath="url(#wpc-clip)"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Last point dot */}
        <circle cx={lastX} cy={lastY} r={3.5} fill="#6366f1" />

        {/* X-axis move numbers */}
        {history.map((_, i) => {
          if (history.length > 12 && i % 3 !== 0) return null;
          return (
            <text
              key={i}
              x={xOf(i, history.length)}
              y={H - 8}
              textAnchor="middle"
              className="fill-slate-600 font-mono"
              fontSize={8}
            >
              {i + 1}
            </text>
          );
        })}
      </svg>

      {/* Hinge move annotations */}
      {hingeMoves.map((h) => (
        <p key={h.moveIndex} className="mt-2 text-[10px] text-slate-500 font-mono">
          <span className="mr-1 text-amber-400">★</span>
          Move {h.moveIndex + 1}: {h.description}
        </p>
      ))}
    </motion.div>
  );
}

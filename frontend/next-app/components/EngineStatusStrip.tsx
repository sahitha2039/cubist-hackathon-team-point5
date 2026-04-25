'use client';

import { motion } from 'motion/react';
import type { EngineMetrics } from '@/lib/types';

interface EngineStatusStripProps {
  metrics: Partial<EngineMetrics> | null;
}

function fmt(n: number | undefined, suffix = ''): string {
  if (n === undefined) return '—';
  return `${n}${suffix}`;
}

function fmtNodes(n: number | undefined): string {
  if (n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtEval(e: number | undefined): string {
  if (e === undefined) return '—';
  const sign = e >= 0 ? '+' : '';
  return `${sign}${(e / 100).toFixed(2)}`;
}

export default function EngineStatusStrip({ metrics }: EngineStatusStripProps) {
  const items = [
    { label: 'DEPTH', value: fmt(metrics?.depth) },
    { label: 'EVAL', value: fmtEval(metrics?.eval) },
    { label: 'NODES', value: fmtNodes(metrics?.nodes) },
    { label: 'WIN %', value: fmt(metrics?.winProbability, '%') },
    { label: 'NPS', value: fmtNodes(metrics?.nps) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center gap-0 overflow-hidden rounded-lg border border-white/7 bg-white/2 font-mono"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex flex-1 flex-col items-center px-3 py-2 ${i < items.length - 1 ? 'border-r border-white/7' : ''}`}
        >
          <span className="text-[9px] font-bold tracking-widest text-slate-600">{item.label}</span>
          <span className="mt-0.5 text-sm font-semibold text-slate-200">{item.value}</span>
        </div>
      ))}
    </motion.div>
  );
}

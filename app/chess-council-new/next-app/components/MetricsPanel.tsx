'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { EngineMetrics } from '@/lib/types';

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

interface CircleMetricProps {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

function CircleMetric({ label, value, color, suffix = '%' }: CircleMetricProps) {
  const count = useCountUp(value);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <motion.circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold font-mono text-white">
            {count}{suffix}
          </span>
        </div>
      </div>
      <span className="text-center text-[11px] font-medium text-slate-400 leading-tight">{label}</span>
    </div>
  );
}

interface BarMetricProps {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

function BarMetric({ label, value, color, suffix = '%' }: BarMetricProps) {
  const count = useCountUp(value);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="font-mono text-sm font-bold" style={{ color }}>
          {count}{suffix}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function riskLabel(v: number): { text: string; color: string } {
  if (v < 30) return { text: 'Low', color: '#10b981' };
  if (v < 55) return { text: 'Medium', color: '#f59e0b' };
  if (v < 75) return { text: 'High', color: '#ef4444' };
  return { text: 'Very High', color: '#dc2626' };
}

interface MetricsPanelProps {
  metrics: Partial<EngineMetrics> | null;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const win = metrics?.winProbability ?? 0;
  const quality = metrics?.moveOptimality ?? 0;
  const confidence = metrics?.councilConfidence ?? 0;
  const risk = metrics?.riskLevel ?? 0;
  const rl = riskLabel(risk);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-panel rounded-xl p-5"
    >
      <p className="mb-4 text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
        Engine Metrics
      </p>

      {/* Circle meters row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <CircleMetric label="Win Probability" value={win} color="#6366f1" />
        <CircleMetric label="Move Optimality" value={quality} color="#f0a500" />
        <CircleMetric label="Council Confidence" value={confidence} color="#8b5cf6" />
      </div>

      {/* Bar meters */}
      <div className="space-y-3">
        <BarMetric label="Move Optimality" value={quality} color="#f0a500" />
        <BarMetric label="Council Confidence" value={confidence} color="#8b5cf6" />

        {/* Risk level */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-slate-400">Risk Level</span>
            <span
              className="rounded px-2 py-0.5 text-xs font-bold"
              style={{ backgroundColor: `${rl.color}20`, color: rl.color }}
            >
              {rl.text}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${risk}%` }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.6 }}
              className="h-full rounded-full"
              style={{ backgroundColor: rl.color }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

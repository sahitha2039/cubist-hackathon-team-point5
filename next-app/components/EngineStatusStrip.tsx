"use client"

import { motion } from "motion/react"
import type { EngineMetrics } from "@/lib/types"

interface EngineStatusStripProps {
  metrics: Partial<EngineMetrics> | null
}

function fmt(n: number | undefined, suffix = ""): string {
  if (n === undefined) return "—"
  return `${n}${suffix}`
}

function fmtNodes(n: number | undefined): string {
  if (n === undefined) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function fmtEval(e: number | undefined): string {
  if (e === undefined) return "—"
  const sign = e >= 0 ? "+" : ""
  return `${sign}${(e / 100).toFixed(2)}`
}

export default function EngineStatusStrip({ metrics }: EngineStatusStripProps) {
  const items = [
    { label: "Depth", value: fmt(metrics?.depth) },
    { label: "Eval", value: fmtEval(metrics?.eval) },
    { label: "Nodes", value: fmtNodes(metrics?.nodes) },
    { label: "Win", value: fmt(metrics?.winProbability, "%") },
    { label: "NPS", value: fmtNodes(metrics?.nps) },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.16em] text-[rgba(32,24,20,0.5)] uppercase"
    >
      {items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2">
          <span>{item.label}</span>
          <span className="text-sm font-semibold tracking-normal text-[var(--brand-ink)]">
            {item.value}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

"use client"

import { motion } from "motion/react"

interface WinProbabilityBarProps {
  user: number
  engine: number
  opponentLabel: string
  opponentAccent: string
  isLoading?: boolean
}

export default function WinProbabilityBar({
  user,
  engine,
  opponentLabel,
  opponentAccent,
  isLoading = false,
}: WinProbabilityBarProps) {
  return (
    <section className="rounded-[1.7rem] border border-[rgba(255,247,234,0.12)] bg-[linear-gradient(180deg,rgba(43,32,27,0.97),rgba(32,24,20,0.94))] px-4 py-3 shadow-[0_20px_48px_rgba(32,24,20,0.14)] md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[rgba(255,247,234,0.52)] uppercase">
            Win Probability
          </p>
          <p className="mt-1 text-xs text-[rgba(255,247,234,0.54)]">
            {isLoading ? "Rebalancing after the latest move" : "Live position split"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
          <span className="rounded-full border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.08)] px-3 py-1 text-[var(--brand-cream-strong)]">
            You {user}%
          </span>
          <span
            className="rounded-full px-3 py-1"
            style={{
              backgroundColor: `${opponentAccent}16`,
              border: `1px solid ${opponentAccent}28`,
              color: opponentAccent,
            }}
          >
            {opponentLabel} {engine}%
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-[1.15rem] border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.08)] px-3 py-3">
        <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.18em] text-[rgba(255,247,234,0.48)] uppercase">
          <span>You</span>
          <span>Equal</span>
          <span>{opponentLabel}</span>
        </div>

        <div className="mt-2 overflow-hidden rounded-full border border-[rgba(255,247,234,0.12)] bg-[rgba(22,16,13,0.88)] p-1">
          <div className="relative flex h-4 w-full overflow-hidden rounded-full bg-[linear-gradient(90deg,rgba(255,247,234,0.1),rgba(255,247,234,0.05))]">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#fff7ea,#efd6ae)]"
              initial={{ width: `${user}%` }}
              animate={{ width: `${user}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
            <motion.div
              className="h-full"
              style={{
                background: `linear-gradient(90deg, ${opponentAccent}d0, ${opponentAccent})`,
              }}
              initial={{ width: `${engine}%` }}
              animate={{ width: `${engine}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[rgba(255,247,234,0.45)]" />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between font-mono text-xs font-semibold">
          <span className="text-[var(--brand-cream-strong)]">{user}%</span>
          <span className="text-[rgba(255,247,234,0.42)]">50 / 50</span>
          <span style={{ color: opponentAccent }}>{engine}%</span>
        </div>
      </div>
    </section>
  )
}

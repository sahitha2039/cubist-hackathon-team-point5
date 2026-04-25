"use client"

import { motion } from "motion/react"

import { getPersona } from "@/lib/personas"
import type { MoveHistoryTurn, PersonaMode } from "@/lib/types"

interface MoveHistorySidebarProps {
  turns: MoveHistoryTurn[]
  activeReplyMode: PersonaMode
  isLoading?: boolean
}

function formatSplit(user: number, engine: number): string {
  return `${user}/${engine}`
}

function qualityTone(label: string): {
  background: string
  border: string
  color: string
} {
  switch (label) {
    case "Brilliant":
    case "Best":
    case "Excellent":
    case "Strong":
      return {
        background: "rgba(83,126,168,0.14)",
        border: "rgba(83,126,168,0.22)",
        color: "#537ea8",
      }
    case "Good":
    case "Adventurous":
      return {
        background: "rgba(190,139,61,0.14)",
        border: "rgba(190,139,61,0.22)",
        color: "#9a6f28",
      }
    case "Mistake":
    case "Blunder":
    case "Risky":
    case "Inaccurate":
    default:
      return {
        background: "rgba(199,84,68,0.12)",
        border: "rgba(199,84,68,0.2)",
        color: "#b14b3f",
      }
  }
}

export default function MoveHistorySidebar({
  turns,
  activeReplyMode,
  isLoading = false,
}: MoveHistorySidebarProps) {
  const activeReplyPersona = getPersona(activeReplyMode)
  const activeAccent =
    activeReplyPersona.id === "council"
      ? "#201814"
      : activeReplyPersona.accentColor

  return (
    <section className="mt-5 flex min-h-[20rem] flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.42)] p-4 shadow-[0_12px_28px_rgba(32,24,20,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="council-kicker">Match log</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--brand-ink)]">
            Every move, one clear note.
          </h2>
        </div>

        <span className="rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.5)] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[rgba(32,24,20,0.58)] uppercase">
          {turns.length} {turns.length === 1 ? "turn" : "turns"}
        </span>
      </div>

      {turns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10 text-center">
          <div>
            <p className="text-sm font-semibold text-[var(--brand-ink)]">
              First move opens the log.
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgba(32,24,20,0.58)]">
              Notes appear after your move.
            </p>
          </div>
        </div>
      ) : (
        <div className="council-scroll mt-4 flex-1 overflow-y-auto pr-2">
          <div className="space-y-5 pb-1">
            {turns.map((turn, index) => {
              const pending = turn.status === "pending"
              const opponent = getPersona(turn.engineMode)
              const opponentAccent =
                opponent.id === "council" ? "#201814" : opponent.accentColor
              const tone = qualityTone(turn.userMoveQuality)
              const turnKey =
                turn.id ??
                `${turn.moveNumber}-${turn.userMove ?? "no-user"}-${turn.engineMove ?? "no-engine"}-${index}`

              return (
                <motion.article
                  key={turnKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative border-l border-[rgba(32,24,20,0.12)] pl-6"
                >
                  <span
                    className="absolute top-1 -left-[7px] h-3.5 w-3.5 rounded-full border-2 border-[rgba(255,248,237,0.92)]"
                    style={{
                      backgroundColor: pending ? activeAccent : opponentAccent,
                    }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[rgba(32,24,20,0.46)]">
                        {turn.moveNumber}.
                      </span>
                      <span className="rounded-full border border-[rgba(83,126,168,0.16)] bg-[rgba(83,126,168,0.1)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] text-[var(--brand-blue)] uppercase">
                        You
                      </span>
                      <span className="font-mono text-base font-semibold text-[var(--brand-ink)]">
                        {turn.userMove}
                      </span>
                    </div>

                    <span className="rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,248,237,0.72)] px-2.5 py-1 font-mono text-[11px] text-[rgba(32,24,20,0.56)]">
                      {formatSplit(
                        turn.userWinProbability.user,
                        turn.userWinProbability.engine
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
                        style={{
                          backgroundColor: tone.background,
                          border: `1px solid ${tone.border}`,
                          color: tone.color,
                        }}
                      >
                        {turn.userMoveQuality}
                      </span>
                    </div>
                    <p className="text-[15px] leading-7 text-[rgba(32,24,20,0.72)]">
                      {turn.userFeedback}
                    </p>
                  </div>

                  <div className="mt-3 border-t border-[rgba(32,24,20,0.08)] pt-3 pb-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
                            style={{
                              backgroundColor: `${opponentAccent}12`,
                              border: `1px solid ${opponentAccent}24`,
                              color: opponentAccent,
                            }}
                          >
                            {opponent.nickname}
                          </span>
                          <span className="font-mono text-sm font-semibold text-[var(--brand-ink)]">
                            {turn.engineMove
                              ? `${turn.moveNumber}... ${turn.engineMove}`
                              : `${turn.moveNumber}...`}
                          </span>
                        </div>

                        <p className="mt-2 text-[15px] leading-7 text-[rgba(32,24,20,0.68)]">
                          {turn.engineComment ??
                            (pending && isLoading
                              ? getPersona(turn.engineMode).thinkingText
                              : "Waiting on the reply.")}
                        </p>
                      </div>

                      {turn.engineWinProbability ? (
                        <span className="rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,248,237,0.72)] px-2.5 py-1 font-mono text-[11px] text-[rgba(32,24,20,0.56)]">
                          {formatSplit(
                            turn.engineWinProbability.user,
                            turn.engineWinProbability.engine
                          )}
                        </span>
                      ) : (
                        <span
                          className="rounded-full border px-2.5 py-1 font-mono text-[11px]"
                          style={{
                            borderColor: `${activeAccent}18`,
                            color: `${activeAccent}a6`,
                            backgroundColor: `${activeAccent}08`,
                          }}
                        >
                          {pending && isLoading ? "thinking" : "--"}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

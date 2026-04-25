"use client"

import { type CSSProperties } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Chessboard } from "react-chessboard"

import { getPersona } from "@/lib/personas"
import type { GamePhase, MoveGrade, PersonaMode } from "@/lib/types"

const GRADE_COLORS: Record<string, string> = {
  Brilliant: "#c97f8b",
  Best: "#537ea8",
  Excellent: "#537ea8",
  Good: "#be8b3d",
  Inaccuracy: "#c46a55",
  Mistake: "#c75444",
  Blunder: "#a13e31",
}

const GRADE_SYMBOLS: Record<string, string> = {
  Brilliant: "!!",
  Best: "!",
  Excellent: "+",
  Good: "=",
  Inaccuracy: "?!",
  Mistake: "?",
  Blunder: "??",
}

interface ChessBoardPanelProps {
  fen: string
  activeMode: PersonaMode
  responseMode: PersonaMode
  userLastMove: { from: string; to: string } | null
  engineLastMove: { from: string; to: string } | null
  moveGrade: MoveGrade | null
  onMove: (from: string, to: string) => boolean
  gamePhase: GamePhase
}

export default function ChessBoardPanel({
  fen,
  activeMode,
  responseMode,
  userLastMove,
  engineLastMove,
  moveGrade,
  onMove,
  gamePhase,
}: ChessBoardPanelProps) {
  const persona = getPersona(activeMode)
  const replyPersona = getPersona(responseMode)
  const accent = persona.id === "council" ? "#201814" : persona.accentColor
  const replyAccent =
    replyPersona.id === "council" ? "#201814" : replyPersona.accentColor
  const isLoading = gamePhase === "engine_thinking"
  const gradeColor = moveGrade
    ? (GRADE_COLORS[moveGrade.grade] ?? "#8f7d65")
    : null
  const gradeSymbol = moveGrade ? (GRADE_SYMBOLS[moveGrade.grade] ?? "") : null

  const squareStyles: Record<string, CSSProperties> = {}
  if (userLastMove) {
    squareStyles[userLastMove.from] = {
      background:
        "radial-gradient(circle, rgba(83,126,168,0.18) 0%, rgba(83,126,168,0.1) 58%, rgba(255,243,223,0.12) 100%)",
      boxShadow:
        "inset 0 0 0 2px rgba(83,126,168,0.55), 0 0 18px rgba(83,126,168,0.18)",
    }
    squareStyles[userLastMove.to] = {
      background:
        "radial-gradient(circle, rgba(83,126,168,0.3) 0%, rgba(83,126,168,0.12) 60%, rgba(255,243,223,0.12) 100%)",
      boxShadow:
        "inset 0 0 0 2px rgba(83,126,168,0.66), 0 0 24px rgba(83,126,168,0.24)",
    }
  }

  if (engineLastMove) {
    squareStyles[engineLastMove.from] = {
      background: `linear-gradient(135deg, ${replyAccent}18, rgba(255,243,223,0.16))`,
      boxShadow: `inset 0 0 0 2px ${replyAccent}55, 0 0 18px ${replyAccent}26`,
    }
    squareStyles[engineLastMove.to] = {
      background: `linear-gradient(135deg, ${replyAccent}28, rgba(255,243,223,0.2))`,
      boxShadow: `inset 0 0 0 2px ${replyAccent}70, 0 0 24px ${replyAccent}2a`,
    }
  }

  function onDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string
    targetSquare: string | null
  }): boolean {
    if (isLoading || !targetSquare) return false
    return onMove(sourceSquare, targetSquare)
  }

  return (
    <section className="council-panel relative flex min-h-0 flex-1 items-center justify-center p-3 md:p-4">
      {gradeColor && moveGrade ? (
        <div className="pointer-events-none absolute top-3 right-3 z-20 md:top-4 md:right-4">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${moveGrade.move}-${moveGrade.grade}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase shadow-[0_10px_24px_rgba(32,24,20,0.08)]"
              style={{
                backgroundColor: "rgba(255,248,237,0.9)",
                color: gradeColor,
                border: `1px solid ${gradeColor}28`,
              }}
            >
              {gradeSymbol} {moveGrade.grade}
            </motion.span>
          </AnimatePresence>
        </div>
      ) : null}

      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="relative w-full max-w-[42rem]"
          style={{
            maxWidth: "min(42rem, max(18rem, calc(100dvh - 19rem)))",
          }}
        >
          <div
            className="overflow-hidden rounded-[1.9rem] border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.72)] p-2 md:p-2.5"
            style={{
              boxShadow: `0 0 0 1px ${accent}14, 0 24px 54px rgba(32,24,20,0.12)`,
            }}
          >
            <Chessboard
              options={{
                position: fen,
                onPieceDrop: onDrop,
                darkSquareStyle: { backgroundColor: "#8fa1b2" },
                lightSquareStyle: { backgroundColor: "#f2e4cb" },
                boardStyle: { borderRadius: "24px", width: "100%" },
                squareStyles,
                allowDrawingArrows: true,
                dropSquareStyle: { backgroundColor: "rgba(199,84,68,0.28)" },
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.8rem]"
            style={{
              backgroundColor: "rgba(255,248,237,0.72)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="h-12 w-12 rounded-full border-2 border-t-transparent"
              style={{
                borderColor: `${replyAccent}3a`,
                borderTopColor: replyAccent,
              }}
            />
            <p
              className="max-w-sm text-center font-mono text-sm leading-7"
              style={{ color: replyAccent }}
            >
              {replyPersona.thinkingText}
            </p>
            <div className="flex gap-2">
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.1,
                    delay: dot * 0.12,
                  }}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: replyAccent }}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}

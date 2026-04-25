"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type FocusEvent } from "react"

import { getPersona } from "@/lib/personas"
import type { GamePhase, PersonaMode } from "@/lib/types"

const WEIGHT_ROWS = [
  { key: "material", label: "Material balance" },
  { key: "kingSafety", label: "King safety" },
  { key: "kingAttack", label: "King attack" },
  { key: "mobility", label: "Piece mobility" },
  { key: "pawnStructure", label: "Pawn structure" },
  { key: "pieceActivity", label: "Piece activity" },
  { key: "kingActivity", label: "King activity" },
] as const

interface EnginePersonalityProfileProps {
  selectedMode: PersonaMode
  responseMode: PersonaMode
  gamePhase: GamePhase
}

export default function EnginePersonalityProfile({
  selectedMode,
  responseMode,
  gamePhase,
}: EnginePersonalityProfileProps) {
  const persona = getPersona(selectedMode)
  const responsePersona = getPersona(responseMode)
  const accent = persona.id === "council" ? "#201814" : persona.accentColor
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const replyLabel =
    gamePhase === "engine_thinking"
      ? `Current reply locked to ${responsePersona.profileName}`
      : gamePhase === "engine_replied" && responseMode !== selectedMode
        ? `Last reply used ${responsePersona.profileName}`
        : `Next reply uses ${persona.profileName}`

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget

    if (
      nextTarget instanceof Node &&
      containerRef.current?.contains(nextTarget)
    ) {
      return
    }

    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative z-20 w-full pb-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={handleBlur}
    >
      <div className="rounded-[1.45rem] border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.42)] px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Show ${persona.profileName} personality weights`}
            className="relative flex h-[4.55rem] w-[4.55rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.58)] p-1 transition-transform duration-200 hover:scale-[1.02]"
            style={{
              boxShadow: `0 0 0 1px ${accent}2f, 0 18px 32px rgba(32,24,20,0.1)`,
            }}
          >
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at top, ${accent}26, transparent 72%)`,
              }}
            />
            <Image
              src={persona.avatar}
              alt={`${persona.profileName} avatar`}
              width={64}
              height={64}
              className="relative z-10 rounded-full"
            />
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[rgba(32,24,20,0.48)] uppercase">
              Selected Engine
            </p>
            <h2 className="mt-2 text-[1.55rem] font-black tracking-[-0.04em] text-[var(--brand-ink)]">
              {persona.profileName}
            </h2>
            <p className="mt-1 text-sm text-[rgba(32,24,20,0.68)]">
              {persona.subtitle}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{
              backgroundColor: `${accent}14`,
              color: accent,
              border: `1px solid ${accent}28`,
            }}
          >
            {replyLabel}
          </span>
          <span className="rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,248,237,0.72)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[rgba(32,24,20,0.54)] uppercase">
            {persona.riskProfile}
          </span>
        </div>

        <p className="mt-3 max-w-[38ch] text-sm leading-6 text-[rgba(32,24,20,0.68)]">
          {persona.copy}
        </p>
      </div>

      {open ? (
        <div className="absolute top-[calc(100%+12px)] left-0 z-30 w-full max-w-[26rem] rounded-[1.7rem] border border-[rgba(255,247,234,0.12)] bg-[rgba(43,32,27,0.97)] p-4 shadow-[0_24px_60px_rgba(32,24,20,0.28)] backdrop-blur-xl sm:w-[26rem] md:right-0 md:left-auto">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-[rgba(255,247,234,0.46)] uppercase">
            Personality Weights
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--brand-cream-strong)]">
            {persona.profileName}
          </h3>
          <p className="mt-1 text-sm text-[rgba(255,247,234,0.72)]">
            {persona.subtitle}
          </p>
          <p className="mt-3 text-sm leading-7 text-[rgba(255,247,234,0.72)]">
            {persona.description}
          </p>

          <div className="mt-4 space-y-3">
            {WEIGHT_ROWS.map((row) => {
              const value = persona.weights[row.key]
              const width = `${Math.min(100, (value / 30) * 100)}%`

              return (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs text-[rgba(255,247,234,0.58)]">
                      {row.label}
                    </span>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: accent }}
                    >
                      {value}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,247,234,0.08)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width, backgroundColor: accent }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-[1.2rem] border border-[rgba(255,247,234,0.1)] bg-[rgba(255,247,234,0.06)] px-3 py-3 text-sm leading-7 text-[rgba(255,247,234,0.78)]">
            {persona.engineBehavior}
          </div>
        </div>
      ) : null}
    </div>
  )
}

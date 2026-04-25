"use client"

import { ALL_PERSONAS } from "@/lib/personas"
import type { PersonaMode } from "@/lib/types"

interface CompactPersonalitySelectorProps {
  activeMode: PersonaMode
  onSelect: (mode: PersonaMode) => void
  disabled?: boolean
}

export default function CompactPersonalitySelector({
  activeMode,
  onSelect,
  disabled = false,
}: CompactPersonalitySelectorProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="council-kicker">Choose a voice</p>
          <p className="mt-1 text-sm font-semibold text-[var(--brand-ink)]">
            Next reply only.
          </p>
        </div>

        <span className="rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.58)] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-[rgba(32,24,20,0.58)] uppercase">
          {disabled ? "Locked" : "Ready"}
        </span>
      </div>

      <div className="council-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
        {ALL_PERSONAS.map((persona) => {
          const isActive = activeMode === persona.id
          const accent =
            persona.id === "council" ? "#201814" : persona.accentColor

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onSelect(persona.id)}
              disabled={disabled}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: isActive
                  ? `${accent}10`
                  : "rgba(255,255,255,0.34)",
                borderColor: isActive ? `${accent}30` : "rgba(32,24,20,0.1)",
                boxShadow: isActive ? `0 0 0 1px ${accent}22` : undefined,
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 0 4px ${accent}14`,
                }}
              />

              <span className="leading-none">
                <span
                  className="block text-[11px] font-semibold tracking-[0.16em] uppercase"
                  style={{ color: isActive ? accent : "rgba(32,24,20,0.72)" }}
                >
                  {persona.nickname}
                </span>
                <span className="mt-1 block text-[10px] text-[rgba(32,24,20,0.46)]">
                  {persona.subtitle}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

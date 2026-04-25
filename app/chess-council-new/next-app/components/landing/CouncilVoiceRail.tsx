"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ALL_PERSONAS, getPersona } from "@/lib/personas"
import type { PersonaMode } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CouncilVoiceRailProps {
  selectedMode: PersonaMode
  onSelect: (mode: PersonaMode) => void
  onConfirm: () => void
  confirmLabel?: string
  buttonClassName?: string
}

export default function CouncilVoiceRail({
  selectedMode,
  onSelect,
  onConfirm,
  confirmLabel = "Enter The Board Room",
  buttonClassName,
}: CouncilVoiceRailProps) {
  const reduceMotion = useReducedMotion()
  const selectedPersona = getPersona(selectedMode)
  const selectedAccent =
    selectedPersona.id === "council" ? "#201814" : selectedPersona.accentColor

  return (
    <div className="mt-5">
      <div className="council-scroll -mx-1 overflow-x-auto px-1 pb-2 lg:overflow-visible">
        <div className="flex min-w-max gap-3 lg:grid lg:min-w-0 lg:grid-cols-5">
          {ALL_PERSONAS.map((persona, index) => {
            const accent =
              persona.id === "council" ? "#201814" : persona.accentColor
            const active = persona.id === selectedMode

            return (
              <motion.button
                key={persona.id}
                type="button"
                aria-pressed={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.03 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                onClick={() => onSelect(persona.id)}
                className={cn(
                  "group relative flex w-[14rem] flex-none flex-col justify-between gap-4 overflow-hidden rounded-[1.6rem] border p-4 text-left transition-colors duration-200 lg:w-auto lg:min-w-0",
                  active
                    ? "border-[rgba(32,24,20,0.16)] bg-[rgba(255,255,255,0.9)] shadow-[0_18px_38px_rgba(32,24,20,0.12)]"
                    : "border-[rgba(32,24,20,0.08)] bg-[rgba(255,248,237,0.72)] shadow-[0_12px_28px_rgba(32,24,20,0.06)]"
                )}
                style={{
                  boxShadow: active
                    ? `0 0 0 1px ${accent}28, 0 18px 38px rgba(32,24,20,0.12)`
                    : undefined,
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-90"
                  style={{
                    background: `radial-gradient(circle at top right, ${persona.bgColor}, transparent 46%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent 44%)`,
                  }}
                  aria-hidden
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.7)]"
                      style={{
                        boxShadow: active ? `0 0 0 1px ${accent}24` : undefined,
                      }}
                    >
                      <Image
                        src={persona.avatar}
                        alt={`${persona.profileName} avatar`}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="council-kicker truncate"
                        style={{ color: `${accent}c8` }}
                      >
                        {persona.profileName}
                      </p>
                      <h3 className="mt-1 truncate text-[1.15rem] font-black tracking-[-0.04em] text-[var(--brand-ink)]">
                        {persona.nickname}
                      </h3>
                      <p className="mt-1 truncate text-xs text-[rgba(32,24,20,0.52)]">
                        {persona.subtitle}
                      </p>
                    </div>
                  </div>

                  {active ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase"
                      style={{
                        backgroundColor: `${accent}14`,
                        color: accent,
                        border: `1px solid ${accent}24`,
                      }}
                    >
                      <Check size={12} />
                      Selected
                    </span>
                  ) : (
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: accent,
                        boxShadow: `0 0 0 4px ${accent}12`,
                      }}
                    />
                  )}
                </div>

                <div className="relative">
                  <p className="text-sm leading-6 text-[rgba(32,24,20,0.72)]">
                    {persona.copy}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase"
                      style={{
                        backgroundColor: `${accent}10`,
                        borderColor: `${accent}20`,
                        color: `${accent}d8`,
                      }}
                    >
                      {persona.riskProfile}
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <motion.div
        layout
        className="mt-4 rounded-[1.6rem] border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.56)] p-4 shadow-[0_12px_28px_rgba(32,24,20,0.05)] md:p-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.72)]"
              style={{ boxShadow: `0 0 0 1px ${selectedAccent}24` }}
            >
              <Image
                src={selectedPersona.avatar}
                alt={`${selectedPersona.profileName} avatar`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0">
              <p
                className="council-kicker"
                style={{ color: `${selectedAccent}b8` }}
              >
                Selected Voice
              </p>
              <h3 className="mt-1 truncate text-2xl font-black tracking-[-0.05em] text-[var(--brand-ink)]">
                {selectedPersona.nickname}
              </h3>
              <p className="mt-1 text-sm text-[rgba(32,24,20,0.6)]">
                {selectedPersona.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase"
              style={{
                color: selectedAccent,
                border: `1px solid ${selectedAccent}26`,
                backgroundColor: `${selectedAccent}10`,
              }}
            >
              {selectedPersona.riskProfile}
            </span>
            <span className="rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,248,237,0.72)] px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[rgba(32,24,20,0.6)] uppercase">
              {selectedPersona.inspiration}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[rgba(32,24,20,0.72)]">
          {selectedPersona.engineBehavior}
        </p>
      </motion.div>

      <div className="mt-5 flex justify-center">
        <Button
          type="button"
          size="lg"
          className={cn(
            "h-16 w-full max-w-[26rem] justify-between px-8 text-[12px] tracking-[0.28em] shadow-[0_18px_40px_rgba(32,24,20,0.14)]",
            buttonClassName
          )}
          onClick={onConfirm}
        >
          {confirmLabel}
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

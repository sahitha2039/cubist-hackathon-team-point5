"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react"

import BrandMark from "@/components/BrandMark"
import CouncilSelectionModal from "@/components/landing/CouncilSelectionModal"
import CouncilVoiceRail from "@/components/landing/CouncilVoiceRail"
import HeroVisual from "@/components/landing/HeroVisual"
import { Button } from "@/components/ui/button"
import type { PersonaMode } from "@/lib/types"

const FLOW_LINES = [
  { number: "01", title: "Pick a voice.", body: "One choice. One board." },
  {
    number: "02",
    title: "Make a move.",
    body: "The engine answers in character.",
  },
  {
    number: "03",
    title: "Switch the reply.",
    body: "Keep the board. Change the voice.",
  },
]

function EditorialButton({
  label,
  onClick,
  secondary = false,
  className,
}: {
  label: string
  onClick: () => void
  secondary?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      <Button
        type="button"
        size="lg"
        variant={secondary ? "secondary" : "default"}
        className={className}
        onClick={onClick}
      >
        {label}
        {secondary ? <ArrowUpRight /> : <ArrowRight />}
      </Button>
    </motion.div>
  )
}

export default function GrandmasterLanding() {
  const router = useRouter()
  const [selectionOpen, setSelectionOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<PersonaMode>("optimizer")

  function openSelector(mode: PersonaMode = selectedMode) {
    setSelectedMode(mode)
    setSelectionOpen(true)
  }

  function startMatch() {
    router.push(`/play?mode=${selectedMode}`)
  }

  return (
    <div
      className="council-page landing-surface relative min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(199,84,68,0.14), transparent 26%), radial-gradient(circle at 82% 10%, rgba(83,126,168,0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(190,139,61,0.14), transparent 24%), linear-gradient(180deg, rgba(255,247,234,0.92) 0%, rgba(244,230,209,0.96) 48%, rgba(249,242,230,0.98) 100%)",
      }}
    >
      <header className="relative z-10 mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 pt-5 md:px-8 lg:px-10 lg:pt-6">
        <BrandMark />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="hidden sm:inline-flex"
            onClick={() => openSelector("council")}
          >
            Summon The Council
            <ArrowUpRight />
          </Button>
          <EditorialButton
            label="Enter The Board Room"
            onClick={() => openSelector(selectedMode)}
            className="h-16 px-8 text-[12px] tracking-[0.28em] shadow-[0_18px_36px_rgba(32,24,20,0.14)]"
          />
        </div>
      </header>

      <main className="relative z-10 pb-24">
        <section className="mx-auto grid max-w-[1480px] gap-10 px-5 pt-10 pb-18 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.88fr)] lg:items-center lg:px-10 lg:pt-12 lg:pb-24">
          <div className="max-w-[760px]">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="council-chip"
            >
              <Sparkles size={14} />
              Editorial personality chess
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-7 font-heading text-[clamp(4rem,14vw,8.8rem)] leading-[0.86] font-black tracking-[-0.09em] text-[var(--brand-ink)] uppercase"
            >
              <span className="block">Grandmaster</span>
              <span className="council-outline block text-transparent">
                Council
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.14 }}
              className="mt-6 max-w-[18ch] text-3xl leading-[1.02] font-black tracking-[-0.05em] text-[var(--brand-ink)] md:text-4xl"
            >
              Five voices. One move.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 max-w-xl text-lg leading-8 text-[rgba(32,24,20,0.74)]"
            >
              Pick a voice. Keep the board. Change the reply.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
              className="mt-9 flex flex-wrap gap-4"
            >
              <EditorialButton
                label="Enter The Board Room"
                onClick={() => openSelector(selectedMode)}
                className="h-16 px-8 text-[12px] tracking-[0.28em] shadow-[0_18px_36px_rgba(32,24,20,0.14)]"
              />
              <Button asChild size="lg" variant="secondary">
                <Link href="#council">
                  Explore The Voices
                  <ArrowUpRight />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34 }}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold tracking-[0.24em] text-[rgba(32,24,20,0.56)] uppercase"
            >
              <span>Five minds</span>
              <span>One board</span>
              <span>Live reply</span>
            </motion.div>
          </div>

          <HeroVisual />
        </section>

        <section
          id="council"
          className="mx-auto max-w-[1480px] px-5 pb-20 md:px-8 lg:px-10 lg:pb-24"
        >
          <div className="council-panel overflow-visible px-5 py-6 md:px-6 lg:px-7">
            <div className="flex flex-col gap-4 border-b border-[rgba(32,24,20,0.08)] pb-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="council-kicker">Choose a voice</p>
                <h2 className="mt-3 text-4xl leading-[0.92] font-black tracking-[-0.06em] text-[var(--brand-ink)] md:text-5xl">
                  Five minds. One move.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(32,24,20,0.66)] md:text-[15px]">
                  Pick the reply.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold tracking-[0.18em] text-[rgba(32,24,20,0.56)] uppercase">
                <span className="rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.46)] px-3 py-1.5">
                  One row
                </span>
                <span className="rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.46)] px-3 py-1.5">
                  One board
                </span>
                <span className="rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.46)] px-3 py-1.5">
                  Live switch
                </span>
              </div>
            </div>

            <CouncilVoiceRail
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
              onConfirm={startMatch}
            />
          </div>
        </section>

        <section className="mx-auto max-w-[1480px] px-5 md:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="council-panel-dark overflow-hidden px-6 py-8 md:px-8 md:py-10"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="council-kicker text-[rgba(255,247,234,0.5)]">
                  Flow
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[var(--brand-cream-strong)] md:text-5xl">
                  Make a move. Switch the reply.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-[rgba(255,247,234,0.68)]">
                  One board. One shell. The voice changes. The game does not.
                </p>
              </div>

              <EditorialButton
                label="Enter The Board Room"
                onClick={() => openSelector(selectedMode)}
                className="h-16 px-8 text-[12px] tracking-[0.28em] shadow-[0_20px_44px_rgba(0,0,0,0.2)]"
              />
            </div>

            <div className="mt-8 grid gap-6 border-t border-[rgba(255,247,234,0.12)] pt-6 md:grid-cols-3">
              {FLOW_LINES.map((line, index) => (
                <motion.div
                  key={line.number}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.42, delay: index * 0.08 }}
                >
                  <p className="font-heading text-6xl font-black tracking-[-0.08em] text-[rgba(255,247,234,0.16)]">
                    {line.number}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--brand-cream-strong)]">
                    {line.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[rgba(255,247,234,0.66)]">
                    {line.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <CouncilSelectionModal
        open={selectionOpen}
        selectedMode={selectedMode}
        onClose={() => setSelectionOpen(false)}
        onConfirm={startMatch}
        onSelect={setSelectedMode}
      />
    </div>
  )
}

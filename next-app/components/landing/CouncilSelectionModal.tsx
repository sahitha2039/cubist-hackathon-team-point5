"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"

import CouncilVoiceRail from "@/components/landing/CouncilVoiceRail"
import { Button } from "@/components/ui/button"
import type { PersonaMode } from "@/lib/types"

interface CouncilSelectionModalProps {
  open: boolean
  selectedMode: PersonaMode
  onClose: () => void
  onConfirm: () => void
  onSelect: (mode: PersonaMode) => void
}

export default function CouncilSelectionModal({
  open,
  selectedMode,
  onClose,
  onConfirm,
  onSelect,
}: CouncilSelectionModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6 md:items-center md:px-6"
        >
          <button
            type="button"
            aria-label="Close council selection"
            className="absolute inset-0 bg-[rgba(32,24,20,0.48)] backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="council-panel relative z-10 w-full max-w-[1240px] overflow-visible p-4 md:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(32,24,20,0.08)] pb-4 md:pb-5">
              <div className="max-w-xl">
                <p className="council-kicker">Choose a voice</p>
                <h2 className="mt-3 font-heading text-4xl leading-[0.9] font-black tracking-[-0.08em] text-[var(--brand-ink)] uppercase md:text-5xl">
                  Five minds. One move.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(32,24,20,0.68)] md:text-[15px]">
                  Pick the reply. Enter the board room.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full border border-[rgba(32,24,20,0.1)] bg-[rgba(255,255,255,0.52)] text-[var(--brand-ink)]"
                onClick={onClose}
              >
                <X />
              </Button>
            </div>

            <CouncilVoiceRail
              selectedMode={selectedMode}
              onSelect={onSelect}
              onConfirm={onConfirm}
              buttonClassName="shadow-[0_20px_44px_rgba(32,24,20,0.18)]"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

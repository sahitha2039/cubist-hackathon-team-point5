"use client"

import { motion } from "motion/react"
import { RotateCcw, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

interface DemoControlsProps {
  onDemo: () => void
  onReset: () => void
}

export default function DemoControls({ onDemo, onReset }: DemoControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="flex flex-wrap gap-2"
    >
      <Button type="button" size="sm" variant="secondary" onClick={onDemo}>
        <Play size={14} />
        Demo
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onReset}>
        <RotateCcw size={14} />
        Reset
      </Button>
    </motion.div>
  )
}

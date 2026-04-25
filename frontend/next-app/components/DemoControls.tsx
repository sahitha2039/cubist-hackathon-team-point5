'use client';

import { motion } from 'motion/react';
import { Play } from 'lucide-react';

interface DemoControlsProps {
  onDemo: () => void;
  onReset: () => void;
}

export default function DemoControls({ onDemo, onReset }: DemoControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex gap-2"
    >
      <button
        onClick={onDemo}
        className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 transition-all duration-200 hover:border-amber-500/60 hover:bg-amber-500/20 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]"
      >
        <Play size={12} />
        Demo Position
      </button>
      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition-all duration-200 hover:border-white/20 hover:text-slate-300"
      >
        Reset Board
      </button>
    </motion.div>
  );
}

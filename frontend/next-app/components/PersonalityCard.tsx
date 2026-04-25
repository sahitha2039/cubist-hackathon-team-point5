'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Target, Shield, Infinity, Crown, ChevronRight } from 'lucide-react';
import type { PersonaStyle } from '@/lib/types';

const ICONS: Record<string, React.ReactNode> = {
  firefighter: <Flame size={20} />,
  optimizer: <Target size={20} />,
  wall: <Shield size={20} />,
  grinder: <Infinity size={20} />,
  council: <Crown size={20} />,
};

const BIAS_LABELS: Array<{ key: keyof PersonaStyle['biases']; label: string }> = [
  { key: 'attack', label: 'Attack' },
  { key: 'riskControl', label: 'Risk Control' },
  { key: 'positionalDepth', label: 'Positional' },
  { key: 'endgame', label: 'Endgame' },
  { key: 'adaptability', label: 'Adaptability' },
];

interface PersonalityCardProps {
  persona: PersonaStyle;
  isActive: boolean;
  index: number;
  onClick: () => void;
  fullWidth?: boolean;
}

export default function PersonalityCard({
  persona,
  isActive,
  index,
  onClick,
  fullWidth = false,
}: PersonalityCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0, show: false });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotate({
      x: ((y - rect.height / 2) / rect.height) * -7,
      y: ((x - rect.width / 2) / rect.width) * 7,
    });
    setSpotlightPos({ x, y, show: true });
  }

  function handleMouseLeave() {
    setRotate({ x: 0, y: 0 });
    setSpotlightPos((s) => ({ ...s, show: false }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08 + 0.15, duration: 0.4, ease: 'easeOut' }}
      style={{ perspective: 900 }}
      className={fullWidth ? 'col-span-full' : ''}
    >
      <motion.div
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          scale: isActive ? 1.025 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative cursor-pointer overflow-hidden rounded-xl p-4"
        style={{
          backgroundColor: isActive ? persona.bgColor : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isActive ? `${persona.accentColor}50` : 'rgba(255,255,255,0.07)'}`,
          boxShadow: isActive
            ? `0 0 28px ${persona.glowColor}, 0 0 60px ${persona.glowColor.replace('0.35', '0.1')}`
            : 'none',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Mouse spotlight */}
        {spotlightPos.show && (
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(180px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${persona.accentColor}15, transparent 65%)`,
            }}
          />
        )}

        {/* Active left border */}
        {isActive && (
          <motion.div
            layoutId="active-bar"
            className="absolute left-0 top-0 h-full w-0.5 rounded-r-full"
            style={{ backgroundColor: persona.accentColor }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        {/* Header row */}
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${persona.accentColor}20`, color: persona.accentColor }}
            >
              {ICONS[persona.id]}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-white">{persona.nickname}</p>
              <p className="text-[10px] text-slate-500">{persona.name}</p>
            </div>
          </div>

          {isActive ? (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
              style={{
                backgroundColor: `${persona.accentColor}25`,
                color: persona.accentColor,
                border: `1px solid ${persona.accentColor}40`,
                boxShadow: `0 0 8px ${persona.glowColor}`,
              }}
            >
              Opponent
            </motion.span>
          ) : (
            <span className="shrink-0 text-[10px] text-slate-600 font-mono">{persona.inspiration}</span>
          )}
        </div>

        {/* Copy line */}
        <p className="mb-2.5 text-xs text-slate-400 leading-snug">{persona.copy}</p>

        {/* Engine behavior */}
        <div
          className="mb-3 rounded-md px-2.5 py-1.5 text-[10px] text-slate-500 leading-snug"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="font-semibold text-slate-600">Engine: </span>{persona.engineBehavior}
        </div>

        {/* Bias bars */}
        <div className={`grid gap-1.5 ${fullWidth ? 'grid-cols-5' : 'grid-cols-1'}`}>
          {BIAS_LABELS.map(({ key, label }, i) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-wider text-slate-600">{label}</span>
                <span className="font-mono text-[10px] font-bold" style={{ color: persona.accentColor }}>
                  {persona.biases[key]}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${persona.biases[key]}%` }}
                  transition={{ delay: index * 0.08 + i * 0.05 + 0.35, duration: 0.65, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: persona.accentColor }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Set as Opponent button — only shown when not active */}
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center justify-end"
          >
            <span
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
              style={{ color: `${persona.accentColor}80` }}
            >
              Set as Opponent <ChevronRight size={10} />
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

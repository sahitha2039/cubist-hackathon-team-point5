'use client';

import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Flame, Target, Shield, Infinity, Crown, Check, ChevronRight } from 'lucide-react';
import type { PersonaStyle } from '@/lib/types';

const ICONS: Record<string, ReactNode> = {
  firefighter: <Flame size={18} />,
  optimizer: <Target size={18} />,
  wall: <Shield size={18} />,
  grinder: <Infinity size={18} />,
  council: <Crown size={18} />,
};

interface PersonalityCardProps {
  persona: PersonaStyle;
  isActive: boolean;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

function getProfileRows(persona: PersonaStyle) {
  return [
    { label: 'Attack', value: persona.biases.attack },
    { label: 'Risk', value: Math.max(0, 100 - persona.biases.riskControl) },
    { label: 'Position', value: persona.biases.positionalDepth },
    { label: 'Endgame', value: persona.biases.endgame },
  ];
}

export default function PersonalityCard({
  persona,
  isActive,
  index,
  onClick,
  disabled = false,
  fullWidth = false,
}: PersonalityCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, visible: false });
  const profileRows = getProfileRows(persona);

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setRotate({
      x: ((y - rect.height / 2) / rect.height) * -7,
      y: ((x - rect.width / 2) / rect.width) * 7,
    });
    setSpotlight({ x, y, visible: true });
  }

  function handleMouseLeave() {
    setRotate({ x: 0, y: 0 });
    setSpotlight((current) => ({ ...current, visible: false }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08 + 0.1, duration: 0.42, ease: 'easeOut' }}
      style={{ perspective: 1000 }}
      className={fullWidth ? 'col-span-full' : ''}
    >
      <motion.button
        type="button"
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
          scale: isActive ? 1.022 : 1,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="relative w-full overflow-hidden rounded-[24px] p-5 text-left disabled:cursor-not-allowed disabled:opacity-75"
        style={{
          backgroundColor: isActive ? persona.bgColor : 'rgba(255,255,255,0.025)',
          border: `1px solid ${isActive ? `${persona.accentColor}50` : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isActive
            ? `0 0 0 1px ${persona.accentColor}35, 0 0 34px ${persona.glowColor}`
            : '0 14px 32px rgba(0,0,0,0.18)',
          transformStyle: 'preserve-3d',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {spotlight.visible && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(220px circle at ${spotlight.x}px ${spotlight.y}px, ${persona.accentColor}16, transparent 70%)`,
            }}
          />
        )}

        {isActive && (
          <motion.div
            layoutId="selected-opponent-ring"
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{ boxShadow: `inset 0 0 0 1px ${persona.accentColor}45` }}
          />
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${persona.accentColor}18`,
                  color: persona.accentColor,
                  border: `1px solid ${persona.accentColor}2f`,
                }}
              >
                {ICONS[persona.id]}
              </div>

              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Opponent Brain
                </p>
                <p className="mt-1 text-lg font-bold text-white">{persona.nickname}</p>
                <p className="text-sm text-slate-400">{persona.name}</p>
              </div>
            </div>

            {isActive ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{
                  backgroundColor: `${persona.accentColor}1f`,
                  color: persona.accentColor,
                  border: `1px solid ${persona.accentColor}35`,
                }}
              >
                <Check size={13} />
                Selected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500">{persona.inspiration}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">{persona.copy}</p>

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Engine Behavior
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{persona.engineBehavior}</p>
          </div>

          <div className={`mt-4 grid gap-3 ${fullWidth ? 'sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-2'}`}>
            {profileRows.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    {row.label}
                  </span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: persona.accentColor }}>
                    {row.value}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.value}%` }}
                    transition={{ delay: index * 0.08 + 0.25, duration: 0.65, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: persona.accentColor }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Next Reply
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {isActive
                  ? `Currently playing against: ${persona.nickname}`
                  : disabled
                    ? 'Locked until the current reply completes'
                    : `Set ${persona.nickname} as the opponent brain`}
              </p>
            </div>

            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
              style={{
                backgroundColor: isActive ? `${persona.accentColor}22` : 'rgba(255,255,255,0.06)',
                color: isActive ? persona.accentColor : '#e2e8f0',
                border: `1px solid ${isActive ? `${persona.accentColor}38` : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {isActive ? 'Opponent Selected' : disabled ? 'Locked' : 'Set as Opponent'}
              {!isActive && !disabled && <ChevronRight size={13} />}
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

'use client';

import { motion } from 'motion/react';
import PersonalityCard from './PersonalityCard';
import { PERSONAS, COUNCIL_PERSONA, getPersona } from '@/lib/personas';
import type { PersonaMode } from '@/lib/types';

interface PersonalitySelectorProps {
  activeMode: PersonaMode;
  onSelect: (mode: PersonaMode) => void;
}

export default function PersonalitySelector({ activeMode, onSelect }: PersonalitySelectorProps) {
  const active = getPersona(activeMode);

  return (
    <div className="flex flex-col gap-3">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2"
      >
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
          Choose Your Opponent
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </motion.div>

      {/* "Currently playing against" banner */}
      <motion.div
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{
          backgroundColor: `${active.accentColor}0c`,
          border: `1px solid ${active.accentColor}30`,
        }}
      >
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500">
            Currently playing against
          </p>
          <p className="mt-0.5 text-sm font-bold" style={{ color: active.accentColor }}>
            {active.nickname}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{active.copy}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${active.accentColor}18`,
            border: `1px solid ${active.accentColor}30`,
            color: active.accentColor,
            boxShadow: `0 0 12px ${active.glowColor}`,
          }}
        >
          <span className="text-lg">
            {{
              firefighter: '🔥',
              optimizer: '🎯',
              wall: '🛡',
              grinder: '⚙️',
              council: '👑',
            }[activeMode]}
          </span>
        </div>
      </motion.div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map((persona, i) => (
          <PersonalityCard
            key={persona.id}
            persona={persona}
            isActive={activeMode === persona.id}
            index={i}
            onClick={() => onSelect(persona.id)}
          />
        ))}
      </div>

      {/* Council — full width */}
      <PersonalityCard
        persona={COUNCIL_PERSONA}
        isActive={activeMode === 'council'}
        index={PERSONAS.length}
        onClick={() => onSelect('council')}
        fullWidth
      />
    </div>
  );
}

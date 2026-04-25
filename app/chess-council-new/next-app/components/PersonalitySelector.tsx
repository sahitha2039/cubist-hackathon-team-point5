'use client';

import { motion } from 'motion/react';
import PersonalityCard from './PersonalityCard';
import { PERSONAS, COUNCIL_PERSONA, getPersona } from '@/lib/personas';
import type { PersonaMode } from '@/lib/types';

interface PersonalitySelectorProps {
  activeMode: PersonaMode;
  onSelect: (mode: PersonaMode) => void;
  disabled?: boolean;
}

export default function PersonalitySelector({
  activeMode,
  onSelect,
  disabled = false,
}: PersonalitySelectorProps) {
  const activePersona = getPersona(activeMode);

  return (
    <section className="glass-panel rounded-[28px] p-5 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-[24px] border border-white/8 bg-slate-950/45 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.28em] text-slate-500">
              Choose Engine Mind
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Pick the opponent brain behind the next reply.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Selecting a personality does not make a move. It tells the engine which mind should
              answer after your next move on the board.
            </p>
          </div>

          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{
              backgroundColor: `${activePersona.accentColor}18`,
              color: activePersona.accentColor,
              border: `1px solid ${activePersona.accentColor}35`,
            }}
          >
            {disabled ? 'Reply locked in progress' : `Active Opponent: ${activePersona.nickname}`}
          </span>
        </div>

        <div
          className="mt-5 rounded-[22px] px-4 py-4"
          style={{
            backgroundColor: `${activePersona.accentColor}0f`,
            border: `1px solid ${activePersona.accentColor}2d`,
            boxShadow: `0 0 28px ${activePersona.glowColor}`,
          }}
        >
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.24em] text-slate-500">
            Current Matchup
          </p>
          <p className="mt-2 text-lg font-bold text-white">
            Currently playing against: <span style={{ color: activePersona.accentColor }}>{activePersona.nickname}</span>
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Make your move to trigger a reply from {activePersona.nickname}. If you switch minds now,
            the next engine response will use the newly selected personality.
          </p>
          {disabled && (
            <p className="mt-2 text-sm text-slate-400">
              Opponent switching is temporarily locked while the current reply is being calculated.
            </p>
          )}
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {PERSONAS.map((persona, index) => (
          <PersonalityCard
            key={persona.id}
            persona={persona}
            isActive={activeMode === persona.id}
            index={index}
            onClick={() => onSelect(persona.id)}
            disabled={disabled}
          />
        ))}

        <PersonalityCard
          persona={COUNCIL_PERSONA}
          isActive={activeMode === 'council'}
          index={PERSONAS.length}
          onClick={() => onSelect('council')}
          disabled={disabled}
          fullWidth
        />
      </div>
    </section>
  );
}

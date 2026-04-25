'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Chessboard } from 'react-chessboard';
import { getPersona } from '@/lib/personas';
import type { PersonaMode, MoveGrade, GamePhase } from '@/lib/types';

const GRADE_COLORS: Record<string, string> = {
  Brilliant: '#a855f7',
  Best: '#22c55e',
  Excellent: '#3b82f6',
  Good: '#6366f1',
  Inaccuracy: '#f59e0b',
  Mistake: '#f97316',
  Blunder: '#ef4444',
};

const GRADE_SYMBOLS: Record<string, string> = {
  Brilliant: '!!',
  Best: '★',
  Excellent: '!',
  Good: '⊕',
  Inaccuracy: '?!',
  Mistake: '?',
  Blunder: '??',
};

interface ChessBoardPanelProps {
  fen: string;
  activeMode: PersonaMode;
  userLastMove: { from: string; to: string } | null;
  engineLastMove: { from: string; to: string } | null;
  moveGrade: MoveGrade | null;
  onMove: (from: string, to: string) => boolean;
  gamePhase: GamePhase;
  engineMoveSan?: string | null;
}

export default function ChessBoardPanel({
  fen,
  activeMode,
  userLastMove,
  engineLastMove,
  moveGrade,
  onMove,
  gamePhase,
  engineMoveSan,
}: ChessBoardPanelProps) {
  const persona = getPersona(activeMode);
  const isLoading = gamePhase === 'engine_thinking';

  // Blue for user moves, gold for engine moves
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (userLastMove) {
    squareStyles[userLastMove.from] = { backgroundColor: 'rgba(59,130,246,0.22)' };
    squareStyles[userLastMove.to] = { backgroundColor: 'rgba(59,130,246,0.4)' };
  }
  if (engineLastMove) {
    squareStyles[engineLastMove.from] = { backgroundColor: 'rgba(245,158,11,0.22)' };
    squareStyles[engineLastMove.to] = { backgroundColor: 'rgba(245,158,11,0.42)' };
  }

  function onDrop({ sourceSquare, targetSquare }: { piece: unknown; sourceSquare: string; targetSquare: string | null }): boolean {
    if (isLoading || !targetSquare) return false;
    return onMove(sourceSquare, targetSquare);
  }

  const gradeColor = moveGrade ? GRADE_COLORS[moveGrade.grade] ?? '#94a3b8' : null;
  const gradeSymbol = moveGrade ? GRADE_SYMBOLS[moveGrade.grade] ?? '' : null;
  const isBadMove = moveGrade?.grade === 'Mistake' || moveGrade?.grade === 'Blunder';

  return (
    <div className="flex flex-col gap-3">
      {/* Turn indicator strip */}
      <AnimatePresence mode="wait">
        {gamePhase === 'selecting' && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg border border-white/7 bg-white/3 px-3 py-2"
          >
            <span className="text-slate-500 text-sm">←</span>
            <p className="text-sm text-slate-400">
              Select an opponent on the right, then make your move.
            </p>
          </motion.div>
        )}

        {gamePhase === 'your_turn' && (
          <motion.div
            key="your_turn"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2"
            style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="h-2 w-2 rounded-full bg-blue-400"
            />
            <p className="text-sm font-medium text-blue-300">
              Your turn — drag a piece to challenge{' '}
              <span style={{ color: persona.accentColor }}>{persona.nickname}</span>
            </p>
          </motion.div>
        )}

        {gamePhase === 'engine_thinking' && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2"
            style={{
              backgroundColor: `${persona.accentColor}10`,
              border: `1px solid ${persona.accentColor}25`,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="h-4 w-4 rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${persona.accentColor}40`, borderTopColor: persona.accentColor }}
            />
            <p className="text-sm font-medium" style={{ color: `${persona.accentColor}cc` }}>
              {persona.thinkingText}
            </p>
          </motion.div>
        )}

        {gamePhase === 'engine_replied' && (
          <motion.div
            key="replied"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-amber-400">✓</span>
              <p className="text-sm font-medium text-amber-300">
                {persona.nickname} replied
                {engineMoveSan ? (
                  <>
                    :{' '}
                    <span className="font-mono font-bold text-white">…{engineMoveSan}</span>
                  </>
                ) : ''}
              </p>
            </div>

            {/* User move grade */}
            {gradeColor && (
              <span
                className="rounded px-2 py-0.5 font-mono text-xs font-bold"
                style={{
                  backgroundColor: `${gradeColor}20`,
                  color: isBadMove ? gradeColor : gradeColor,
                  border: `1px solid ${gradeColor}30`,
                  boxShadow: isBadMove ? `0 0 8px ${gradeColor}40` : undefined,
                }}
              >
                Your move: {gradeSymbol} {moveGrade?.grade}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board border matches active persona */}
      <div className="relative">
        <div
          className="overflow-hidden rounded-xl"
          style={{
            boxShadow: `0 0 0 1px ${persona.accentColor}28, 0 0 32px rgba(0,0,0,0.5)`,
          }}
        >
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              darkSquareStyle: { backgroundColor: '#1a2840' },
              lightSquareStyle: { backgroundColor: '#283d55' },
              boardStyle: { borderRadius: '12px', width: '100%' },
              squareStyles: squareStyles,
              allowDrawingArrows: true,
              dropSquareStyle: { backgroundColor: 'rgba(99,102,241,0.4)' },
            }}
          />
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl"
            style={{ backgroundColor: 'rgba(7,7,15,0.8)', backdropFilter: 'blur(3px)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="h-9 w-9 rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${persona.accentColor}30`, borderTopColor: persona.accentColor }}
            />
            <p className="font-mono text-sm" style={{ color: `${persona.accentColor}bb` }}>
              {persona.thinkingText}
            </p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.22 }}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: persona.accentColor }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Move legend */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <div className="h-2 w-3 rounded-sm bg-blue-500/60" />
          Your move
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <div className="h-2 w-3 rounded-sm bg-amber-500/60" />
          Engine reply
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

import HeroHeader from '@/components/HeroHeader';
import ChessBoardPanel from '@/components/ChessBoardPanel';
import PersonalitySelector from '@/components/PersonalitySelector';
import EngineStatusStrip from '@/components/EngineStatusStrip';
import EngineReplyPanel from '@/components/EngineReplyPanel';
import OpponentForecast from '@/components/OpponentForecast';
import CouncilDebateTimeline from '@/components/CouncilDebateTimeline';
import VerdictPanel from '@/components/VerdictPanel';
import MetricsPanel from '@/components/MetricsPanel';
import GameStoryChart from '@/components/GameStoryChart';
import DemoControls from '@/components/DemoControls';

import { postMove } from '@/lib/api';
import { DEMO_FEN, DEMO_RESPONSE, DEMO_USER_MOVE, DEMO_ENGINE_MOVE } from '@/lib/mockData';
import type {
  PersonaMode,
  CouncilResponse,
  PersonaOpinion,
  EngineMetrics,
  GamePhase,
} from '@/lib/types';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function mergeMetrics(raw: Partial<EngineMetrics> | undefined): Partial<EngineMetrics> | null {
  if (!raw) return null;
  return {
    depth: raw.depth ?? 0,
    eval: raw.eval ?? 0,
    nodes: raw.nodes,
    winProbability: raw.winProbability ?? 50,
    moveOptimality: raw.moveOptimality ?? 0,
    councilConfidence: raw.councilConfidence ?? 0,
    riskLevel: raw.riskLevel ?? 50,
    nps: raw.nps,
  };
}

export default function Page() {
  const [game, setGame] = useState(() => new Chess());
  const [activeMode, setActiveMode] = useState<PersonaMode>('council');
  const [gamePhase, setGamePhase] = useState<GamePhase>('your_turn');

  const [userLastMove, setUserLastMove] = useState<{ from: string; to: string } | null>(null);
  const [engineLastMove, setEngineLastMove] = useState<{ from: string; to: string } | null>(null);

  const [councilResponse, setCouncilResponse] = useState<CouncilResponse | null>(null);
  const [winHistory, setWinHistory] = useState<number[]>([]);

  // When personality changes, update the "playing against" state but don't change phase
  function handleSelectMode(mode: PersonaMode) {
    setActiveMode(mode);
  }

  const handleMove = useCallback(
    (from: string, to: string): boolean => {
      // Validate move locally first
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({ from, to, promotion: 'q' });
      if (!move) return false;

      // Update board immediately with user's move
      setGame(gameCopy);
      setUserLastMove({ from, to });
      setEngineLastMove(null);
      setGamePhase('engine_thinking');
      setCouncilResponse(null);

      postMove(from, to, activeMode)
        .then((res) => {
          // Board source of truth: prefer response.fen, then apply bestMove manually
          let finalGame = gameCopy;

          const engineMoveUci = res.engineMove ?? res.bestMove;

          if (res.fen) {
            finalGame = new Chess(res.fen);
          } else if (engineMoveUci && engineMoveUci.length >= 4) {
            const eFrom = engineMoveUci.slice(0, 2);
            const eTo = engineMoveUci.slice(2, 4);
            const eProm = engineMoveUci.length > 4 ? engineMoveUci[4] : undefined;
            const afterEngine = new Chess(gameCopy.fen());
            const applied = afterEngine.move({ from: eFrom, to: eTo, promotion: eProm ?? 'q' });
            if (applied) {
              finalGame = afterEngine;
              setEngineLastMove({ from: eFrom, to: eTo });
            }
          }

          setGame(finalGame);
          setCouncilResponse(res);
          setGamePhase('engine_replied');
          setWinHistory((prev) => [...prev, res.metrics?.winProbability ?? 50]);
        })
        .catch(() => {
          // Backend down — show mock response so demo always works
          const mock = { ...DEMO_RESPONSE, mode: activeMode };
          setCouncilResponse(mock);
          setGamePhase('engine_replied');

          // Apply mock engine move to board
          const eFrom = DEMO_ENGINE_MOVE.from;
          const eTo = DEMO_ENGINE_MOVE.to;
          const afterMock = new Chess(gameCopy.fen());
          const applied = afterMock.move({ from: eFrom, to: eTo, promotion: 'q' });
          if (applied) {
            setGame(afterMock);
            setEngineLastMove({ from: eFrom, to: eTo });
          }

          setWinHistory((prev) => [...prev, 50]);
        });

      return true;
    },
    [game, activeMode],
  );

  function loadDemo() {
    setGame(new Chess(DEMO_FEN));
    setUserLastMove(DEMO_USER_MOVE);
    setEngineLastMove(DEMO_ENGINE_MOVE);
    setCouncilResponse(DEMO_RESPONSE);
    setGamePhase('engine_replied');
    setWinHistory(DEMO_RESPONSE.winProbabilityHistory ?? [50]);
  }

  function resetBoard() {
    setGame(new Chess(STARTING_FEN));
    setUserLastMove(null);
    setEngineLastMove(null);
    setCouncilResponse(null);
    setGamePhase('your_turn');
    setWinHistory([]);
  }

  const opinions: PersonaOpinion[] = councilResponse?.opinions ?? [];
  const metrics = mergeMetrics(councilResponse?.metrics);
  const isLoading = gamePhase === 'engine_thinking';
  const hasReply = gamePhase === 'engine_replied' && councilResponse !== null;

  // Derive engine move SAN: prefer explicit field, fall back to verdict move
  const engineMoveSan =
    councilResponse?.engineMoveSan ??
    councilResponse?.verdict?.move ??
    null;

  const userMoveSan = councilResponse?.userMoveSan ?? null;
  const topMoves = councilResponse?.topMoves ?? [];

  return (
    <div className="chess-bg min-h-screen">
      <HeroHeader />

      <main className="mx-auto max-w-[1400px] px-6 pb-16">
        {/* ── Main dashboard: board left, selector right ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[500px_1fr]">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <ChessBoardPanel
              fen={game.fen()}
              activeMode={activeMode}
              userLastMove={userLastMove}
              engineLastMove={engineLastMove}
              moveGrade={councilResponse?.moveGrade ?? null}
              onMove={handleMove}
              gamePhase={gamePhase}
              engineMoveSan={engineMoveSan}
            />
            <EngineStatusStrip metrics={metrics} />
            <DemoControls onDemo={loadDemo} onReset={resetBoard} />
          </div>

          {/* Right column */}
          <PersonalitySelector activeMode={activeMode} onSelect={handleSelectMode} />
        </div>

        {/* ── Post-move panels (appear after engine replies) ── */}
        {(isLoading || hasReply) && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EngineReplyPanel
              activeMode={activeMode}
              userMoveSan={userMoveSan}
              engineMoveSan={engineMoveSan}
              engineReasoning={councilResponse?.engineReasoning ?? null}
              enginePlan={councilResponse?.enginePlan ?? null}
              isLoading={isLoading}
            />
            <OpponentForecast
              activeMode={activeMode}
              topMoves={topMoves}
              opinions={opinions}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* ── Council debate (council mode only, or always show if opinions exist) ── */}
        {(isLoading || opinions.length > 0) && (
          <div className="mt-6">
            <CouncilDebateTimeline
              opinions={opinions}
              isLoading={isLoading}
              activeMode={activeMode}
            />
          </div>
        )}

        {/* ── Verdict + Metrics ── */}
        {(isLoading || hasReply) && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VerdictPanel
              verdict={councilResponse?.verdict ?? null}
              moveGrade={councilResponse?.moveGrade ?? null}
              isLoading={isLoading}
              activeMode={activeMode}
            />
            <MetricsPanel metrics={metrics} />
          </div>
        )}

        {/* ── Game Story chart (always shown, placeholder before 2 points) ── */}
        {(winHistory.length >= 1 || hasReply) && (
          <div className="mt-6">
            <GameStoryChart
              history={winHistory}
              hingeMoves={councilResponse?.hingeMoves ?? []}
            />
          </div>
        )}
      </main>
    </div>
  );
}

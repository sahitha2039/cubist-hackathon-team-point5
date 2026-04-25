"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"
import { Chess } from "chess.js"
import { ArrowLeft } from "lucide-react"

import ChessBoardPanel from "@/components/ChessBoardPanel"
import DemoControls from "@/components/DemoControls"
import EngineStatusStrip from "@/components/EngineStatusStrip"
import CompactPersonalitySelector from "@/components/play/CompactPersonalitySelector"
import EnginePersonalityProfile from "@/components/play/EnginePersonalityProfile"
import MoveHistorySidebar from "@/components/play/MoveHistorySidebar"
import WinProbabilityBar from "@/components/play/WinProbabilityBar"

import { postMove } from "@/lib/api"
import {
  clampProbability,
  generateEngineComment,
  generateUserMoveFeedback,
  getResponseWinHistory,
  resolveLatestUserWinProbability,
  resolveUserMoveQualityLabel,
  resolveUserMoveWinProbability,
  toWinProbabilitySplit,
} from "@/lib/playAnalysis"
import {
  DEMO_ENGINE_MOVE,
  DEMO_FEN,
  DEMO_RESPONSE,
  DEMO_USER_MOVE,
} from "@/lib/mockData"
import { getPersona } from "@/lib/personas"
import type {
  CouncilResponse,
  EngineMetrics,
  GamePhase,
  MoveHistoryTurn,
  PersonaMode,
  TopMove,
} from "@/lib/types"

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

type MoveCoords = { from: string; to: string }
type ResolvedMove = MoveCoords & {
  promotion?: string
  san: string | null
  uci: string
}

type PendingTurnContext = {
  turnId: string
  fallbackUserSan: string
  moveNumber: number
  previousUserProbability: number
  replyMode: PersonaMode
}

interface PlayExperienceProps {
  initialMode?: PersonaMode
}

function mergeMetrics(
  raw: Partial<EngineMetrics> | undefined
): Partial<EngineMetrics> | null {
  if (!raw) return null
  return {
    depth: raw.depth ?? 0,
    eval: raw.eval ?? 0,
    nodes: raw.nodes,
    winProbability: raw.winProbability ?? 50,
    moveOptimality: raw.moveOptimality ?? 0,
    councilConfidence: raw.councilConfidence ?? 0,
    riskLevel: raw.riskLevel ?? 50,
    nps: raw.nps,
  }
}

function parseUci(uci: string | null | undefined): ResolvedMove | null {
  const value = uci?.trim()
  if (!value || value.length < 4) return null

  return {
    from: value.slice(0, 2),
    to: value.slice(2, 4),
    promotion: value.length > 4 ? value.slice(4, 5) : undefined,
    san: null,
    uci: value,
  }
}

function deriveSanFromMove(
  beforeFen: string,
  move: ResolvedMove
): string | null {
  try {
    const game = new Chess(beforeFen)
    const applied = game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion ?? "q",
    })

    return applied?.san ?? null
  } catch {
    return null
  }
}

function inferMoveFromFen(
  beforeFen: string,
  afterFen: string
): ResolvedMove | null {
  try {
    const game = new Chess(beforeFen)
    const candidates = game.moves({ verbose: true })

    for (const candidate of candidates) {
      const probe = new Chess(beforeFen)
      const applied = probe.move({
        from: candidate.from,
        to: candidate.to,
        promotion: candidate.promotion ?? "q",
      })

      if (applied && probe.fen() === afterFen) {
        return {
          from: candidate.from,
          to: candidate.to,
          promotion: candidate.promotion,
          san: candidate.san,
          uci: `${candidate.from}${candidate.to}${candidate.promotion ?? ""}`,
        }
      }
    }
  } catch {
    return null
  }

  return null
}

function getMoveNumberFromFen(fen: string): number {
  const fields = fen.split(" ")
  const parsed = Number.parseInt(fields[5] ?? "1", 10)
  return Number.isFinite(parsed) ? parsed : 1
}

function createMoveHistoryTurnId(moveNumber: number): string {
  const uuid = globalThis.crypto?.randomUUID?.()

  if (uuid) {
    return `move-${moveNumber}-${uuid}`
  }

  return `move-${moveNumber}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getEngineMoveUci(response: CouncilResponse): string | null {
  return (
    response.engineMove ??
    response.engine_move ??
    response.finalMove ??
    response.final_move ??
    response.council?.finalMove ??
    response.council?.final_move ??
    response.bestMove ??
    response.best_move ??
    null
  )
}

function getEngineMoveSan(response: CouncilResponse): string | null {
  return (
    response.engineMoveSan ??
    response.engine_move_san ??
    response.council?.finalMoveSan ??
    response.council?.final_move_san ??
    response.verdict?.move ??
    null
  )
}

function getEngineReasoning(response: CouncilResponse): string | null {
  return (
    response.engineReasoning ??
    response.engine_reasoning ??
    response.council?.reasoning ??
    response.verdict?.reasoning ??
    null
  )
}

function getEnginePlan(response: CouncilResponse): string | null {
  return response.enginePlan ?? response.engine_plan ?? null
}

function getUserMoveSan(
  response: CouncilResponse,
  fallbackUserSan: string | null
): string | null {
  return response.userMoveSan ?? response.user_move_san ?? fallbackUserSan
}

function getUserFeedback(response: CouncilResponse): string | null {
  return response.userFeedback ?? response.user_feedback ?? null
}

function getEngineComment(response: CouncilResponse): string | null {
  return response.engineComment ?? response.engine_comment ?? null
}

function getUserWinProbability(response: CouncilResponse): number | null {
  return response.userWinProbability ?? response.user_win_probability ?? null
}

function getWinProbabilityAfterUserMove(
  response: CouncilResponse
): number | null {
  return (
    response.winProbabilityAfterUserMove ??
    response.win_probability_after_user_move ??
    null
  )
}

function getTopMoves(response: CouncilResponse): TopMove[] {
  return (
    response.topMoves ??
    response.top_moves ??
    response.council?.topMoves ??
    response.council?.top_moves ??
    []
  )
}

function normalizeResponse(
  rawResponse: CouncilResponse,
  fallbackUserSan: string | null,
  afterUserFen: string
): { response: CouncilResponse; resolvedEngineMove: ResolvedMove | null } {
  const explicitEngineMove = parseUci(getEngineMoveUci(rawResponse))
  let resolvedEngineMove: ResolvedMove | null =
    explicitEngineMove === null
      ? null
      : {
          ...explicitEngineMove,
          san:
            getEngineMoveSan(rawResponse) ??
            deriveSanFromMove(afterUserFen, explicitEngineMove),
        }

  if (!resolvedEngineMove && rawResponse.fen) {
    resolvedEngineMove = inferMoveFromFen(afterUserFen, rawResponse.fen)
  }

  return {
    response: {
      ...rawResponse,
      topMoves: getTopMoves(rawResponse),
      winProbabilityHistory: getResponseWinHistory(rawResponse),
      userMoveSan: getUserMoveSan(rawResponse, fallbackUserSan) ?? undefined,
      userFeedback: getUserFeedback(rawResponse) ?? undefined,
      userWinProbability: getUserWinProbability(rawResponse) ?? undefined,
      winProbabilityAfterUserMove:
        getWinProbabilityAfterUserMove(rawResponse) ?? undefined,
      engineMove:
        rawResponse.engineMove ??
        rawResponse.engine_move ??
        resolvedEngineMove?.uci ??
        undefined,
      engineMoveSan:
        getEngineMoveSan(rawResponse) ?? resolvedEngineMove?.san ?? undefined,
      engineReasoning: getEngineReasoning(rawResponse) ?? undefined,
      enginePlan: getEnginePlan(rawResponse) ?? undefined,
      engineComment: getEngineComment(rawResponse) ?? undefined,
    },
    resolvedEngineMove,
  }
}

function replacePendingTurn(
  turns: MoveHistoryTurn[],
  turnId: string,
  updatedTurn: MoveHistoryTurn
): MoveHistoryTurn[] {
  let targetIndex = -1

  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (turns[index]?.id === turnId && turns[index]?.status === "pending") {
      targetIndex = index
      break
    }
  }

  if (targetIndex === -1) {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (
        turns[index]?.moveNumber === updatedTurn.moveNumber &&
        turns[index]?.status === "pending"
      ) {
        targetIndex = index
        break
      }
    }
  }

  if (targetIndex === -1) return turns

  return turns.map((turn, index) =>
    index === targetIndex ? updatedTurn : turn
  )
}

function getStatusCopy(
  gamePhase: GamePhase,
  selectedMode: PersonaMode,
  responseMode: PersonaMode,
  userMoveSan: string | null,
  engineMoveSan: string | null
): { eyebrow: string; title: string; body: string } {
  const selectedPersona = getPersona(selectedMode)
  const responsePersona = getPersona(responseMode)

  if (gamePhase === "engine_thinking") {
    return {
      eyebrow: "Reply Locked",
      title: `${responsePersona.profileName} is thinking.`,
      body:
        userMoveSan !== null
          ? `${userMoveSan} played. ${responsePersona.thinkingText}`
          : responsePersona.thinkingText,
    }
  }

  if (gamePhase === "engine_replied") {
    return {
      eyebrow: "Reply In",
      title: `${responsePersona.profileName} answered${engineMoveSan ? ` ...${engineMoveSan}` : "."}`,
      body:
        selectedMode === responseMode
          ? "Your move. Switch the voice before the next reply."
          : `Last reply: ${responsePersona.profileName}. Next reply: ${selectedPersona.profileName}.`,
    }
  }

  return {
    eyebrow: "Your Move",
    title: `${selectedPersona.profileName} on deck.`,
    body: "Make a move. Switch the reply any time before the engine answers.",
  }
}

function formatReplyMove(move: string | null): string {
  if (!move) return "--"
  return move.startsWith("...") ? move : `...${move}`
}

export default function PlayExperience({
  initialMode = "optimizer",
}: PlayExperienceProps) {
  const [game, setGame] = useState(() => new Chess())
  const [selectedMode, setSelectedMode] = useState<PersonaMode>(initialMode)
  const [responseMode, setResponseMode] = useState<PersonaMode>(initialMode)
  const [gamePhase, setGamePhase] = useState<GamePhase>("your_turn")

  const [userLastMove, setUserLastMove] = useState<MoveCoords | null>(null)
  const [engineLastMove, setEngineLastMove] = useState<MoveCoords | null>(null)
  const [userLastMoveSan, setUserLastMoveSan] = useState<string | null>(null)
  const [engineLastMoveSan, setEngineLastMoveSan] = useState<string | null>(
    null
  )

  const [councilResponse, setCouncilResponse] =
    useState<CouncilResponse | null>(null)
  const [currentWinProbability, setCurrentWinProbability] = useState(50)
  const [moveHistory, setMoveHistory] = useState<MoveHistoryTurn[]>([])

  const applyEngineResponse = useCallback(
    (
      rawResponse: CouncilResponse,
      afterUserGame: Chess,
      turnContext: PendingTurnContext
    ) => {
      const { response, resolvedEngineMove } = normalizeResponse(
        rawResponse,
        turnContext.fallbackUserSan,
        afterUserGame.fen()
      )
      const resolvedReplyMode = response.mode ?? turnContext.replyMode

      let finalGame = afterUserGame

      if (response.fen) {
        finalGame = new Chess(response.fen)
      } else if (resolvedEngineMove) {
        const afterEngine = new Chess(afterUserGame.fen())
        const applied = afterEngine.move({
          from: resolvedEngineMove.from,
          to: resolvedEngineMove.to,
          promotion: resolvedEngineMove.promotion ?? "q",
        })

        if (applied) {
          finalGame = afterEngine
        }
      }

      const resolvedUserMoveSan =
        response.userMoveSan ?? turnContext.fallbackUserSan
      const resolvedEngineMoveSan =
        response.engineMoveSan ?? resolvedEngineMove?.san ?? null
      const userMoveProbability = resolveUserMoveWinProbability({
        response,
        previousUserProbability: turnContext.previousUserProbability,
        moveSan: resolvedUserMoveSan,
        moveNumber: turnContext.moveNumber,
      })
      const userMoveQuality = resolveUserMoveQualityLabel({
        response,
        previousUserProbability: turnContext.previousUserProbability,
        moveSan: resolvedUserMoveSan,
        moveNumber: turnContext.moveNumber,
      })
      const finalUserProbability = resolveLatestUserWinProbability(
        response,
        userMoveProbability
      )
      const userFeedback = generateUserMoveFeedback({
        response,
        moveSan: resolvedUserMoveSan,
        moveNumber: turnContext.moveNumber,
        previousUserProbability: turnContext.previousUserProbability,
      })
      const engineComment = generateEngineComment({
        response,
        engineMoveSan: resolvedEngineMoveSan,
        topMoves: response.topMoves ?? [],
      })

      setGame(finalGame)
      setEngineLastMove(
        resolvedEngineMove
          ? {
              from: resolvedEngineMove.from,
              to: resolvedEngineMove.to,
            }
          : null
      )
      setEngineLastMoveSan(resolvedEngineMoveSan)
      setResponseMode(resolvedReplyMode)
      setCouncilResponse({
        ...response,
        fen: response.fen ?? finalGame.fen(),
      })
      setCurrentWinProbability(finalUserProbability)
      setMoveHistory((previousTurns) =>
        replacePendingTurn(previousTurns, turnContext.turnId, {
          id: turnContext.turnId,
          moveNumber: turnContext.moveNumber,
          userMove: resolvedUserMoveSan,
          userMoveQuality,
          userFeedback,
          userWinProbability: toWinProbabilitySplit(userMoveProbability),
          engineMode: resolvedReplyMode,
          engineMove: resolvedEngineMoveSan,
          engineComment,
          engineWinProbability: toWinProbabilitySplit(finalUserProbability),
          status: "complete",
        })
      )
      setGamePhase("engine_replied")
    },
    []
  )

  function handleSelectMode(mode: PersonaMode) {
    if (gamePhase === "engine_thinking") return
    setSelectedMode(mode)
  }

  const handleMove = useCallback(
    (from: string, to: string): boolean => {
      const modeForReply = selectedMode
      const workingGame = new Chess(game.fen())
      const moveNumber = getMoveNumberFromFen(game.fen())
      const turnId = createMoveHistoryTurnId(moveNumber)
      const userMove = workingGame.move({ from, to, promotion: "q" })
      if (!userMove) return false

      const fallbackUserSan = userMove.san
      const previousUserProbability = currentWinProbability
      const provisionalUserProbability = clampProbability(
        resolveUserMoveWinProbability({
          previousUserProbability,
          moveSan: fallbackUserSan,
          moveNumber,
        })
      )
      const provisionalFeedback = generateUserMoveFeedback({
        moveSan: fallbackUserSan,
        moveNumber,
        previousUserProbability,
      })
      const provisionalQuality = resolveUserMoveQualityLabel({
        previousUserProbability,
        moveSan: fallbackUserSan,
        moveNumber,
      })

      setGame(workingGame)
      setUserLastMove({ from, to })
      setEngineLastMove(null)
      setUserLastMoveSan(fallbackUserSan)
      setEngineLastMoveSan(null)
      setResponseMode(modeForReply)
      setGamePhase("engine_thinking")
      setCouncilResponse(null)
      setCurrentWinProbability(provisionalUserProbability)
      setMoveHistory((previousTurns) => [
        ...previousTurns,
        {
          id: turnId,
          moveNumber,
          userMove: fallbackUserSan,
          userMoveQuality: provisionalQuality,
          userFeedback: provisionalFeedback,
          userWinProbability: toWinProbabilitySplit(provisionalUserProbability),
          engineMode: modeForReply,
          engineMove: null,
          engineComment: null,
          engineWinProbability: null,
          status: "pending",
        },
      ])

      postMove(from, to, modeForReply)
        .then((response) => {
          applyEngineResponse(response, workingGame, {
            turnId,
            fallbackUserSan,
            moveNumber,
            previousUserProbability,
            replyMode: modeForReply,
          })
        })
        .catch(() => {
          applyEngineResponse(
            { ...DEMO_RESPONSE, mode: modeForReply },
            workingGame,
            {
              turnId,
              fallbackUserSan,
              moveNumber,
              previousUserProbability,
              replyMode: modeForReply,
            }
          )
        })

      return true
    },
    [applyEngineResponse, currentWinProbability, game, selectedMode]
  )

  function loadDemo() {
    const normalized = normalizeResponse(
      DEMO_RESPONSE,
      DEMO_RESPONSE.userMoveSan ?? null,
      DEMO_FEN
    ).response
    const demoMode = normalized.mode ?? "council"
    const demoMoveNumber = Math.max(1, getMoveNumberFromFen(DEMO_FEN) - 1)
    const demoTurnId = createMoveHistoryTurnId(demoMoveNumber)
    const userMoveSan = normalized.userMoveSan ?? "Nf3"
    const engineMoveSan = normalized.engineMoveSan ?? "O-O"
    const userMoveProbability = resolveUserMoveWinProbability({
      response: normalized,
      previousUserProbability: 50,
      moveSan: userMoveSan,
      moveNumber: demoMoveNumber,
    })
    const finalUserProbability = resolveLatestUserWinProbability(
      normalized,
      userMoveProbability
    )

    setSelectedMode(demoMode)
    setResponseMode(demoMode)
    setGame(new Chess(DEMO_FEN))
    setUserLastMove(DEMO_USER_MOVE)
    setEngineLastMove(DEMO_ENGINE_MOVE)
    setUserLastMoveSan(userMoveSan)
    setEngineLastMoveSan(engineMoveSan)
    setCouncilResponse({ ...normalized, fen: DEMO_FEN })
    setGamePhase("engine_replied")
    setCurrentWinProbability(finalUserProbability)
    setMoveHistory([
      {
        id: demoTurnId,
        moveNumber: demoMoveNumber,
        userMove: userMoveSan,
        userMoveQuality: resolveUserMoveQualityLabel({
          response: normalized,
          moveSan: userMoveSan,
          moveNumber: demoMoveNumber,
          previousUserProbability: 50,
        }),
        userFeedback: generateUserMoveFeedback({
          response: normalized,
          moveSan: userMoveSan,
          moveNumber: demoMoveNumber,
          previousUserProbability: 50,
        }),
        userWinProbability: toWinProbabilitySplit(userMoveProbability),
        engineMode: demoMode,
        engineMove: engineMoveSan,
        engineComment: generateEngineComment({
          response: normalized,
          engineMoveSan,
          topMoves: normalized.topMoves ?? [],
        }),
        engineWinProbability: toWinProbabilitySplit(finalUserProbability),
        status: "complete",
      },
    ])
  }

  function resetBoard() {
    setGame(new Chess(STARTING_FEN))
    setResponseMode(selectedMode)
    setUserLastMove(null)
    setEngineLastMove(null)
    setUserLastMoveSan(null)
    setEngineLastMoveSan(null)
    setCouncilResponse(null)
    setGamePhase("your_turn")
    setCurrentWinProbability(50)
    setMoveHistory([])
  }

  const metrics = mergeMetrics(councilResponse?.metrics)
  const isLoading = gamePhase === "engine_thinking"
  const userMoveDisplay =
    userLastMoveSan ?? councilResponse?.userMoveSan ?? null
  const engineMoveDisplay =
    engineLastMoveSan ?? councilResponse?.engineMoveSan ?? null
  const currentSideToMove = game.turn() === "w" ? "White" : "Black"
  const selectedPersona = getPersona(selectedMode)
  const replyPersona = getPersona(responseMode)
  const displayPersona = getPersona(
    gamePhase === "engine_thinking" ? responseMode : selectedMode
  )
  const displayAccent =
    displayPersona.id === "council" ? "#efd6ae" : displayPersona.accentColor
  const railAccent =
    displayPersona.id === "council" ? "#201814" : displayPersona.accentColor
  const winSplit = toWinProbabilitySplit(currentWinProbability)
  const moveGrade =
    councilResponse?.moveGrade ?? councilResponse?.move_grade ?? null
  const statusCopy = getStatusCopy(
    gamePhase,
    selectedMode,
    responseMode,
    userMoveDisplay,
    engineMoveDisplay
  )
  const boardMetaItems = [
    { label: "Turn", value: currentSideToMove, accent: "#7b6758" },
    { label: "Last", value: userMoveDisplay ?? "--", accent: "#537ea8" },
    {
      label: "Reply",
      value: formatReplyMove(engineMoveDisplay),
      accent: railAccent,
    },
    {
      label: "Grade",
      value: moveGrade?.grade ?? "Live",
      accent: moveGrade ? railAccent : "#7b6758",
    },
  ]

  return (
    <div className="council-page chess-bg min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 pt-4 pb-8 sm:px-6 md:px-8 lg:px-10 lg:pt-6 lg:pb-10">
        <header className="flex-none rounded-[1.9rem] border border-[rgba(255,247,234,0.12)] bg-[linear-gradient(180deg,rgba(43,32,27,0.97),rgba(32,24,20,0.94))] px-4 py-4 shadow-[0_24px_60px_rgba(32,24,20,0.18)] md:px-6 md:py-5">
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.06)] px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-[rgba(255,247,234,0.76)] uppercase transition-colors hover:bg-[rgba(255,247,234,0.12)]"
              >
                <ArrowLeft size={14} />
                Back to Council
              </Link>

              <span className="rounded-full border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.06)] px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-[rgba(255,247,234,0.72)] uppercase">
                {statusCopy.eyebrow}
              </span>
            </div>

            <div className="min-w-0 lg:px-2">
              <p className="council-kicker text-[rgba(255,247,234,0.5)]">
                Board Room
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--brand-cream-strong)] md:text-[2rem]">
                {statusCopy.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[rgba(255,247,234,0.68)]">
                {statusCopy.body}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-self-end">
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.06)] px-3 py-2.5">
                <div
                  className="relative h-11 w-11 overflow-hidden rounded-full border border-[rgba(255,247,234,0.14)]"
                  style={{
                    boxShadow: `0 0 0 1px ${displayAccent}22`,
                  }}
                >
                  <Image
                    src={selectedPersona.avatar}
                    alt={`${selectedPersona.profileName} avatar`}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-[rgba(255,247,234,0.46)] uppercase">
                    Selected Voice
                  </p>
                  <p className="truncate text-sm font-semibold text-[var(--brand-cream-strong)]">
                    {selectedPersona.profileName}
                  </p>
                  <p className="truncate text-xs text-[rgba(255,247,234,0.56)]">
                    {selectedPersona.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
                <span
                  className="rounded-full px-3 py-2"
                  style={{
                    backgroundColor: `${displayAccent}20`,
                    color: displayAccent,
                    border: `1px solid ${displayAccent}38`,
                  }}
                >
                  {currentSideToMove} to move
                </span>
                <span className="rounded-full border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.06)] px-3 py-2 text-[rgba(255,247,234,0.66)]">
                  Last reply: {replyPersona.nickname}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:min-h-[calc(100dvh-12.5rem)] lg:grid-cols-[minmax(0,1.16fr)_minmax(380px,460px)] lg:[grid-template-rows:minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,500px)]">
          <div className="flex min-h-0 flex-col gap-4">
            <WinProbabilityBar
              user={winSplit.user}
              engine={winSplit.engine}
              isLoading={isLoading}
              opponentLabel={displayPersona.nickname}
              opponentAccent={displayAccent}
            />

            <div className="min-h-0 flex-1">
              <ChessBoardPanel
                fen={game.fen()}
                activeMode={selectedMode}
                responseMode={responseMode}
                userLastMove={userLastMove}
                engineLastMove={engineLastMove}
                moveGrade={moveGrade}
                onMove={handleMove}
                gamePhase={gamePhase}
              />
            </div>

            <div className="rounded-[1.5rem] border border-[rgba(32,24,20,0.08)] bg-[rgba(255,248,237,0.68)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {boardMetaItems.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.48)] px-3 py-1.5"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-[rgba(32,24,20,0.46)] uppercase">
                      {item.label}
                    </span>
                    <span
                      className="font-mono text-[12px] font-semibold"
                      style={{ color: item.accent }}
                    >
                      {item.value}
                    </span>
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <EngineStatusStrip metrics={metrics} />
                <DemoControls onDemo={loadDemo} onReset={resetBoard} />
                <details className="text-[11px] font-semibold tracking-[0.18em] text-[rgba(32,24,20,0.52)] uppercase">
                  <summary className="cursor-pointer rounded-full border border-[rgba(32,24,20,0.08)] bg-[rgba(255,255,255,0.46)] px-3 py-1.5">
                    FEN stays live
                  </summary>
                  <p className="mt-2 max-w-2xl rounded-xl bg-[rgba(32,24,20,0.06)] px-3 py-2 font-mono text-[11px] tracking-normal break-all text-[rgba(32,24,20,0.68)] normal-case">
                    {game.fen()}
                  </p>
                </details>
              </div>
            </div>
          </div>

          <aside className="council-panel relative flex min-h-0 flex-col overflow-visible px-4 py-4 md:px-5 lg:px-6">
            <EnginePersonalityProfile
              selectedMode={selectedMode}
              responseMode={responseMode}
              gamePhase={gamePhase}
            />

            <div className="mt-5 border-t border-[rgba(32,24,20,0.1)] pt-4">
              <CompactPersonalitySelector
                activeMode={selectedMode}
                onSelect={handleSelectMode}
                disabled={isLoading}
              />
            </div>

            <MoveHistorySidebar
              turns={moveHistory}
              isLoading={isLoading}
              activeReplyMode={replyPersona.id}
            />
          </aside>
        </section>
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, AlertTriangle } from "lucide-react"
import { fetchSummary } from "@/lib/api"

interface DagNode {
  id: number
  move: string
  ply: number
  eval: number
  delta: number
  type: "loss" | "gain" | "neutral"
}

interface DagEdge {
  from: number
  to: number
  causal_effect: number
  type: string
}

interface BackdoorPath {
  cause_ply: number
  cause_move: string
  effect_ply: number
  effect_move: string
  hidden_damage: number
  description: string
}

interface SummaryData {
  summary: string
  dag: {
    nodes: DagNode[]
    edges: DagEdge[]
    backdoor_paths: BackdoorPath[]
    root_cause: DagNode | null
  }
  backdoor_paths: BackdoorPath[]
  hinge_move: string
  hinge_idx: number
}

interface GameReportModalProps {
  open: boolean
  onClose: () => void
}

function CausalDag({
  nodes,
  edges,
  backdoorPaths,
}: {
  nodes: DagNode[]
  edges: DagEdge[]
  backdoorPaths: BackdoorPath[]
}) {
  if (!nodes.length) return (
    <p className="text-sm text-[rgba(255,247,234,0.46)] text-center py-4">
      Play more moves to generate the causal graph.
    </p>
  )

  const W = 640
  const H = 180
  const nodeR = 28
  const gap = W / (nodes.length + 1)

  const positions: Record<number, { x: number; y: number }> = {}
  nodes.forEach((node, i) => {
    positions[node.id] = { x: gap * (i + 1), y: H / 2 }
  })

  const backdoorPairs = new Set(
    backdoorPaths.map((p) => `${p.cause_ply}-${p.effect_ply}`)
  )

  function ArrowLine({
    x1, y1, x2, y2, color, dashed
  }: {
    x1: number; y1: number; x2: number; y2: number
    color: string; dashed?: boolean
  }) {
    // shorten line to not overlap nodes
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return null
    const ux = dx / len
    const uy = dy / len

    const sx = x1 + ux * nodeR
    const sy = y1 + uy * nodeR
    const ex = x2 - ux * (nodeR + 10)
    const ey = y2 - uy * (nodeR + 10)

    // arrowhead
    const angle = Math.atan2(ey - sy, ex - sx)
    const arrowSize = 8
    const ax1 = ex - arrowSize * Math.cos(angle - 0.4)
    const ay1 = ey - arrowSize * Math.sin(angle - 0.4)
    const ax2 = ex - arrowSize * Math.cos(angle + 0.4)
    const ay2 = ey - arrowSize * Math.sin(angle + 0.4)

    return (
      <g>
        <line
          x1={sx} y1={sy} x2={ex} y2={ey}
          stroke={color}
          strokeWidth={dashed ? 2 : 1.5}
          strokeDasharray={dashed ? "5 3" : undefined}
          opacity={0.8}
        />
        <polygon
          points={`${ex},${ey} ${ax1},${ay1} ${ax2},${ay2}`}
          fill={color}
          opacity={0.8}
        />
      </g>
    )
  }

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {edges.map((edge, i) => {
          const from = positions[edge.from]
          const to = positions[edge.to]
          if (!from || !to) return null

          const fromNode = nodes.find((n) => n.id === edge.from)
          const toNode = nodes.find((n) => n.id === edge.to)
          const isBackdoor = backdoorPairs.has(`${fromNode?.ply}-${toNode?.ply}`)
          const color = isBackdoor ? "#ef4444" : "rgba(255,247,234,0.35)"

          return (
            <ArrowLine
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              color={color}
              dashed={isBackdoor}
            />
          )
        })}

        {nodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null
          const color =
            node.type === "loss" ? "#ef4444"
            : node.type === "gain" ? "#22c55e"
            : "rgba(255,247,234,0.4)"

          return (
            <g key={node.id}>
              <circle cx={pos.x} cy={pos.y} r={nodeR} fill={color} opacity={0.12} />
              <circle cx={pos.x} cy={pos.y} r={nodeR} fill="none" stroke={color} strokeWidth={1.5} />
              <text x={pos.x} y={pos.y - 6} textAnchor="middle" fontSize={9}
                fill={color} fontWeight={600} fontFamily="monospace">
                {node.move === "start" ? "START" : node.move}
              </text>
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize={8}
                fill={color} opacity={0.7} fontFamily="monospace">
                {node.delta > 0 ? "+" : ""}{node.delta}
              </text>
              <text x={pos.x} y={pos.y + 20} textAnchor="middle" fontSize={7}
                fill="rgba(255,247,234,0.3)" fontFamily="monospace">
                ply {node.ply}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] font-mono text-[rgba(255,247,234,0.46)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
          Eval gain
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
          Eval loss
        </span>
        {backdoorPaths.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 border-t-2 border-dashed border-[#ef4444]" />
            Backdoor path
          </span>
        )}
      </div>
    </div>
  )
}

export default function GameReportModal({
  open,
  onClose,
}: GameReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setData(null)

    fetchSummary()
      .then((res) => {
        setData(res as SummaryData)
      })
      .catch(() => {
        setError("Could not load game report. Make sure the backend is running.")
      })
      .finally(() => setLoading(false))
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(32,24,20,0.72)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[rgba(255,247,234,0.12)] bg-[rgba(43,32,27,0.98)] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.4)] md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.28em] text-[rgba(255,247,234,0.46)] uppercase">
                  Post-Game Analysis
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[var(--brand-cream-strong)]">
                  Game Report
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,247,234,0.12)] bg-[rgba(255,247,234,0.06)] text-[rgba(255,247,234,0.6)] transition-colors hover:bg-[rgba(255,247,234,0.12)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* content */}
            <div className="mt-6">
              {loading && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                    className="h-10 w-10 rounded-full border-2 border-t-transparent border-[rgba(255,247,234,0.3)]"
                    style={{ borderTopColor: "#efd6ae" }}
                  />
                  <p className="text-sm text-[rgba(255,247,234,0.5)]">
                    Running causal analysis...
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {data && (
                <div className="space-y-6">
                  {/* coach summary */}
                  <div className="rounded-[1.5rem] border border-[rgba(255,247,234,0.1)] bg-[rgba(255,247,234,0.06)] px-5 py-5">
                    <p className="text-[10px] font-semibold tracking-[0.24em] text-[rgba(255,247,234,0.44)] uppercase mb-3">
                      Coach Summary
                    </p>
                    <p className="text-base leading-8 text-[rgba(255,247,234,0.88)]">
                      {data.summary}
                    </p>
                  </div>

                  {/* hinge move */}
                  {data.hinge_move && (
                    <div className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] px-4 py-3">
                      <span className="text-amber-400 text-lg">★</span>
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-400/70 uppercase">
                          Turning Point
                        </p>
                        <p className="text-sm font-mono font-semibold text-amber-200 mt-0.5">
                          Move {data.hinge_idx + 1}: {data.hinge_move}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* causal DAG */}
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.24em] text-[rgba(255,247,234,0.44)] uppercase mb-4">
                      Causal Chain
                    </p>
                    <CausalDag
                      nodes={data.dag?.nodes ?? []}
                      edges={data.dag?.edges ?? []}
                      backdoorPaths={data.backdoor_paths ?? []}
                    />
                  </div>

                  {/* backdoor paths */}
                  {data.backdoor_paths?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.24em] text-[rgba(255,247,234,0.44)] uppercase mb-3">
                        Hidden Causal Paths
                      </p>
                      <div className="space-y-2">
                        {data.backdoor_paths.map((path, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3"
                          >
                            <p className="text-xs leading-6 text-red-300">
                              {path.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
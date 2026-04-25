import type { CouncilResponse, PersonaMode } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const MODE_MAP: Record<PersonaMode, string> = {
  firefighter: 'kasparov',
  optimizer:   'petrosian',
  wall:        'karpov',
  grinder:     'carlsen',
  council:     'balanced',
};

function mapGrade(grade: string): 'Brilliant' | 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' {
  const map: Record<string, 'Brilliant' | 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder'> = {
    brilliant:  'Brilliant',
    good:       'Best',
    inaccuracy: 'Inaccuracy',
    mistake:    'Mistake',
    blunder:    'Blunder',
  };
  return map[grade] ?? 'Good';
}

export async function postMove(
  from: string,
  to: string,
  mode: PersonaMode,
): Promise<CouncilResponse> {
  const res = await fetch(`${API_BASE}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from_sq: from,
      to_sq:   to,
      mode:    MODE_MAP[mode] ?? 'balanced',
    }),
  });
  if (!res.ok) throw new Error(`Engine responded with ${res.status}`);

  const raw = await res.json();

  const causalExplanation =
    (raw.causal_analysis as Record<string, unknown>)?.explanation as string ?? null;
  const engineMoveUci = (raw.engine_move as string) ?? '';
  const pv            = (raw.pv as string[]) ?? [];
  const winPct        = (raw.win_pct as number) ?? 50;
  const sfScore       = (raw.stockfish_score as number) ?? 0;
  const cpLoss        = (raw.cp_loss as number) ?? 0;
  const grade         = (raw.grade as string) ?? 'good';

  return {
    ...raw,

    // board state
    fen:           raw.fen,
    engineMove:    engineMoveUci,
    engineMoveSan: engineMoveUci,
    bestMove:      engineMoveUci,

    // user move context
    userMoveSan: `${from}-${to}`,

    // user feedback = causal coaching text from Claude
    userFeedback: causalExplanation,

    // engine reasoning = PV plan, NOT the causal text
    engineReasoning: pv.length > 1
      ? `Engine plans: ${pv.slice(1, 4).join(' → ')}`
      : `Engine replied ${engineMoveUci}.`,

    // engine comment = also PV based
    engineComment: pv.length > 1
      ? `Planned continuation: ${pv.slice(1, 4).join(' → ')}`
      : null,

    enginePlan: pv.length > 1
      ? `Planned: ${pv.slice(1, 4).join(' → ')}`
      : null,

    // win probability
    winProbabilityHistory:       (raw.winpct_history as number[]) ?? [winPct],
    userWinProbability:          winPct,
    winProbabilityAfterUserMove: winPct,

    // hinge moves for chart
    hingeMoves: (raw.hinge_moves as CouncilResponse['hingeMoves']) ?? [],

    // move grade
    moveGrade: {
      move:  from + to,
      grade: mapGrade(grade),
      delta: -cpLoss,
    },

    // engine metrics
    metrics: {
      depth:             (raw.depth as number) ?? 4,
      eval:              sfScore,
      winProbability:    winPct,
      moveOptimality:    Math.max(0, 100 - cpLoss / 2),
      councilConfidence: 75,
      riskLevel:         Math.round(100 - winPct),
    },

    // top moves from PV
    topMoves: pv.slice(0, 3).map((m: string, i: number) => ({
      move:        m,
      san:         m,
      eval:        sfScore - i * 10,
      description: i === 0 ? 'Engine principal variation' : `Candidate ${i + 1}`,
    })),
  };
}

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`, { method: 'POST' });
  if (!res.ok) throw new Error('Summary failed');
  return res.json();
}
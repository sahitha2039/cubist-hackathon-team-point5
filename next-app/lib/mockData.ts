import type { CouncilResponse } from './types';

// King's Indian Defense — position after 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O
// In the demo: user played Nf3 (g1→f3), engine (as Black) replied O-O (e8→g8)
export const DEMO_FEN = 'rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP3PPP/R1BQKB1R w KQ - 0 6';
export const DEMO_USER_MOVE = { from: 'g1', to: 'f3' };   // Nf3
export const DEMO_ENGINE_MOVE = { from: 'e8', to: 'g8' }; // O-O

export const DEMO_RESPONSE: CouncilResponse = {
  bestMove: 'f1e2',
  mode: 'council',
  fen: DEMO_FEN,
  engineMove: 'e8g8',
  engineMoveSan: 'O-O',
  engineReasoning:
    'Black castles to secure king safety while keeping all future plans open — a principled response to White\'s setup.',
  enginePlan: 'Prepare ...e5 or ...c5 break depending on White\'s response',
  userMoveSan: 'Nf3',
  topMoves: [
    { move: 'f1e2', san: 'Be2', eval: 28, description: 'Completes development and prepares kingside castling' },
    { move: 'f2f4', san: 'f4', eval: 22, description: 'Seizes kingside space and threatens f5 expansion' },
    { move: 'c1e3', san: 'Be3', eval: 20, description: 'Controls e3, restrains the ...e5 counterplay' },
  ],
  opinions: [
    {
      persona: 'firefighter',
      recommendedMove: 'f4',
      confidence: 72,
      reasoning:
        'Launch the kingside pawn storm immediately! f4 seizes space and threatens f5, forcing Black to react defensively.',
      agrees: false,
    },
    {
      persona: 'optimizer',
      recommendedMove: 'Be2',
      confidence: 88,
      reasoning:
        'Be2 completes development with precision. Castle next turn, then steadily improve every piece before committing.',
      agrees: true,
    },
    {
      persona: 'wall',
      recommendedMove: 'Be3',
      confidence: 79,
      reasoning:
        "Be3 secures the key diagonal and prevents Black's ...e5 break. Restricts opponent options before any action.",
      agrees: false,
    },
    {
      persona: 'grinder',
      recommendedMove: 'Be2',
      confidence: 91,
      reasoning:
        'Be2 is objectively the most accurate move. Prepares O-O, keeps maximum flexibility, and avoids any concessions.',
      agrees: true,
    },
  ],
  verdict: {
    move: 'Be2',
    votes: 2,
    totalVotes: 4,
    confidence: 84,
    dissent:
      'The Firefighter advocates f4; The Wall prefers Be3. Both dissent from the committee decision.',
    reasoning:
      'Be2 carries the vote. It completes development, enables immediate castling, and maintains all strategic options — avoiding the premature commitments of f4 and Be3.',
  },
  metrics: {
    depth: 18,
    eval: 28,
    nodes: 2847391,
    winProbability: 56,
    moveOptimality: 87,
    councilConfidence: 84,
    riskLevel: 35,
    nps: 1240000,
  },
  moveGrade: {
    move: 'Nf3',
    grade: 'Best',
    delta: 0,
  },
  winProbabilityHistory: [50, 51, 50, 52, 51, 50, 53, 52, 54, 53, 55, 54, 56],
  hingeMoves: [
    {
      moveIndex: 9,
      evalBefore: 12,
      evalAfter: 28,
      description: "Castling improved king safety — eval jumped +16 centipawns",
    },
  ],
};

export const DEFAULT_METRICS = {
  depth: 0,
  eval: 0,
  nodes: 0,
  winProbability: 50,
  moveOptimality: 0,
  councilConfidence: 0,
  riskLevel: 50,
};

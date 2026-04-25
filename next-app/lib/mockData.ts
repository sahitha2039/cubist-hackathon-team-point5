import type { CouncilResponse } from './types';

// King's Indian Defense — position after 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O
// In the demo: user played Nf3 (g1→f3), engine (as Black) replied O-O (e8→g8)
export const DEMO_FEN = 'rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP3PPP/R1BQKB1R w KQ - 0 6';
export const DEMO_USER_MOVE = { from: 'g1', to: 'f3' };   // Nf3
export const DEMO_ENGINE_MOVE = { from: 'e8', to: 'g8' }; // O-O

export const DEMO_RESPONSE: CouncilResponse = {
  bestMove: 'e8g8',
  mode: 'council',
  fen: DEMO_FEN,
  engineMove: 'e8g8',
  engineMoveSan: 'O-O',
  engineReasoning:
    'Black castles to secure king safety while keeping the central breaks ...e5 and ...c5 available on the next turn.',
  enginePlan: 'Castle first, then challenge the center with ...e5 or create queenside imbalance with ...c5.',
  userMoveSan: 'Nf3',
  userFeedback: 'Good move: it develops a piece, supports the center, and prepares castling.',
  engineComment: 'The engine castles to secure the king and keep both ...e5 and ...c5 available.',
  userWinProbability: 56,
  winProbabilityAfterUserMove: 54,
  topMoves: [
    {
      move: 'e8g8',
      san: 'O-O',
      eval: 28,
      description: 'Secures the king and keeps both ...e5 and ...c5 available.',
    },
    {
      move: 'e7e5',
      san: 'e5',
      eval: 22,
      description: 'Challenges the center immediately and opens tactical lines.',
    },
    {
      move: 'c7c5',
      san: 'c5',
      eval: 20,
      description: 'Creates asymmetry and prepares queenside counterplay.',
    },
  ],
  opinions: [
    {
      persona: 'firefighter',
      recommendedMove: '...e5',
      confidence: 72,
      reasoning:
        'Strike the center now with ...e5 and force White to solve problems before the position settles.',
      agrees: false,
    },
    {
      persona: 'optimizer',
      recommendedMove: '...O-O',
      confidence: 88,
      reasoning:
        'Castle first. It improves king safety, preserves flexibility, and keeps every strategic plan available.',
      agrees: true,
    },
    {
      persona: 'wall',
      recommendedMove: '...c6',
      confidence: 79,
      reasoning:
        'Stabilize the center with ...c6, keep White contained, and counter only after the threats are neutralized.',
      agrees: false,
    },
    {
      persona: 'grinder',
      recommendedMove: '...O-O',
      confidence: 91,
      reasoning:
        '...O-O is the cleanest technical move. It improves the king, changes nothing for the worse, and keeps the position easy to handle.',
      agrees: true,
    },
  ],
  verdict: {
    move: 'O-O',
    votes: 2,
    totalVotes: 4,
    confidence: 84,
    dissent:
      'The Firefighter wanted ...e5 immediately, while The Wall preferred ...c6 first.',
    reasoning:
      'Castling carried the vote because it improves king safety without declaring the central structure too early. The engine keeps maximum flexibility for the next decision.',
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

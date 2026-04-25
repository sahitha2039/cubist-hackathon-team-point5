export type PersonaMode = 'firefighter' | 'optimizer' | 'wall' | 'grinder' | 'council';

export type GamePhase = 'selecting' | 'your_turn' | 'engine_thinking' | 'engine_replied';

export interface BiasProfile {
  attack: number;
  riskControl: number;
  positionalDepth: number;
  endgame: number;
  adaptability: number;
}

export interface PersonaStyle {
  id: PersonaMode;
  name: string;
  nickname: string;
  inspiration: string;
  riskProfile: string;
  preferredPosition: string;
  quote: string;
  copy: string;
  engineBehavior: string;
  thinkingText: string;
  accentColor: string;
  glowColor: string;
  bgColor: string;
  biases: BiasProfile;
}

export interface TopMove {
  move: string;
  san?: string;
  eval?: number;
  description: string;
}

export interface PersonaOpinion {
  persona: PersonaMode;
  recommendedMove: string;
  confidence: number;
  reasoning: string;
  agrees: boolean;
}

export interface CouncilVerdict {
  move: string;
  votes: number;
  totalVotes: number;
  confidence: number;
  dissent: string;
  reasoning: string;
}

export interface EngineMetrics {
  depth: number;
  eval: number;
  nodes?: number;
  winProbability: number;
  moveOptimality: number;
  councilConfidence: number;
  riskLevel: number;
  nps?: number;
}

export interface MoveGrade {
  move: string;
  grade: 'Brilliant' | 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';
  delta?: number;
}

export interface HingeMove {
  moveIndex: number;
  evalBefore: number;
  evalAfter: number;
  description: string;
}

export interface CouncilResponse {
  bestMove?: string;
  mode?: PersonaMode;
  opinions?: PersonaOpinion[];
  verdict?: CouncilVerdict;
  metrics?: Partial<EngineMetrics>;
  moveGrade?: MoveGrade;
  winProbabilityHistory?: number[];
  hingeMoves?: HingeMove[];
  error?: string;
  // board state
  fen?: string;
  // engine reply
  engineMove?: string;
  engineMoveSan?: string;
  engineReasoning?: string;
  enginePlan?: string;
  // user move context
  userMoveSan?: string;
  // forecast
  topMoves?: TopMove[];
}

export type PersonaMode = 'firefighter' | 'optimizer' | 'wall' | 'grinder' | 'council';

export type GamePhase = 'selecting' | 'your_turn' | 'engine_thinking' | 'engine_replied';

export interface BiasProfile {
  attack: number;
  riskControl: number;
  positionalDepth: number;
  endgame: number;
  adaptability: number;
}

export interface PersonaWeightProfile {
  material: number;
  kingSafety: number;
  kingAttack: number;
  mobility: number;
  pawnStructure: number;
  pieceActivity: number;
  kingActivity: number;
}

export interface PersonaStyle {
  id: PersonaMode;
  name: string;
  nickname: string;
  profileName: string;
  subtitle: string;
  inspiration: string;
  riskProfile: string;
  preferredPosition: string;
  quote: string;
  copy: string;
  description: string;
  engineBehavior: string;
  thinkingText: string;
  accentColor: string;
  glowColor: string;
  bgColor: string;
  avatar: string;
  biases: BiasProfile;
  weights: PersonaWeightProfile;
}

export interface WinProbabilitySplit {
  user: number;
  engine: number;
}

export interface MoveHistoryTurn {
  id?: string;
  moveNumber: number;
  userMove: string;
  userMoveQuality: string;
  userFeedback: string;
  userWinProbability: WinProbabilitySplit;
  engineMode: PersonaMode;
  engineMove: string | null;
  engineComment: string | null;
  engineWinProbability: WinProbabilitySplit | null;
  status: 'pending' | 'complete';
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

export interface PersonalitySwitch {
  moveIndex: number;
  mode: PersonaMode;
  label?: string;
}

export interface RootCauseMarker {
  moveIndex: number;
  label: string;
  description?: string;
}

export interface CouncilEnvelope {
  finalMove?: string;
  final_move?: string;
  finalMoveSan?: string;
  final_move_san?: string;
  reasoning?: string;
  topMoves?: TopMove[];
  top_moves?: TopMove[];
}

export interface CouncilResponse {
  bestMove?: string;
  best_move?: string;
  finalMove?: string;
  final_move?: string;
  mode?: PersonaMode;
  opinions?: PersonaOpinion[];
  verdict?: CouncilVerdict;
  metrics?: Partial<EngineMetrics>;
  moveGrade?: MoveGrade;
  move_grade?: MoveGrade;
  winProbabilityHistory?: number[];
  win_probability_history?: number[];
  hingeMoves?: HingeMove[];
  hinge_moves?: HingeMove[];
  personalitySwitches?: PersonalitySwitch[];
  personality_switches?: PersonalitySwitch[];
  rootCauseMarker?: RootCauseMarker;
  root_cause_marker?: RootCauseMarker;
  error?: string;
  // board state
  fen?: string;
  // engine reply
  engineMove?: string;
  engine_move?: string;
  engineMoveSan?: string;
  engine_move_san?: string;
  engineReasoning?: string;
  engine_reasoning?: string;
  enginePlan?: string;
  engine_plan?: string;
  // user move context
  userMoveSan?: string;
  user_move_san?: string;
  userFeedback?: string;
  user_feedback?: string;
  engineComment?: string;
  engine_comment?: string;
  userWinProbability?: number;
  user_win_probability?: number;
  winProbabilityAfterUserMove?: number;
  win_probability_after_user_move?: number;
  // forecast
  topMoves?: TopMove[];
  top_moves?: TopMove[];
  council?: CouncilEnvelope;
}

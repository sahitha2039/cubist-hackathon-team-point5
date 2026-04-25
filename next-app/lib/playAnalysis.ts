import type { CouncilResponse, MoveGrade, TopMove, WinProbabilitySplit } from './types';

const CENTRAL_PAWN_MOVES = new Set(['c4', 'c5', 'd4', 'd5', 'e4', 'e5']);

const GRADE_SWINGS: Record<MoveGrade['grade'], number> = {
  Brilliant: 8,
  Best: 6,
  Excellent: 4,
  Good: 2,
  Inaccuracy: -4,
  Mistake: -8,
  Blunder: -12,
};

function firstSentence(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;

  const match = normalized.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? normalized).trim();
}

function cleanSan(moveSan: string): string {
  return moveSan.replace(/[+#?!]/g, '');
}

function lowerFirst(value: string): string {
  return value.length > 0 ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function upperFirst(value: string): string {
  return value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function parseFeedbackSentence(value: string | null | undefined): { label: string | null; body: string | null } {
  const sentence = firstSentence(value);
  if (!sentence) {
    return { label: null, body: null };
  }

  const match = sentence.match(/^([^:.-]+?)(?:\s+move)?\s*[:\-]\s*(.+)$/i);
  if (!match) {
    return { label: null, body: sentence };
  }

  return {
    label: match[1]?.trim() ?? null,
    body: match[2]?.trim() ?? null,
  };
}

function getMoveTheme(moveSan: string, moveNumber: number) {
  const cleaned = cleanSan(moveSan);

  if (cleaned === 'O-O' || cleaned === 'O-O-O') {
    return {
      positive: 'it improves king safety and brings the rooks into play.',
      caution: 'it helps safety, but you still need active follow-up in the center.',
      risky: false,
    };
  }

  if (/^Q/.test(cleaned) && moveNumber <= 10) {
    return {
      positive: 'it creates immediate pressure and asks the engine concrete questions.',
      caution: 'it brings the queen out early and can lose time to chasing moves.',
      risky: true,
    };
  }

  if (/^K/.test(cleaned)) {
    return {
      positive: 'it adjusts king placement and can sidestep tactical ideas.',
      caution: 'it moves the king without castling and can leave the position loose.',
      risky: true,
    };
  }

  if (cleaned.includes('+')) {
    return {
      positive: 'it creates direct pressure against the king and narrows the reply set.',
      caution: 'it gives check, but the initiative can disappear quickly if the follow-up is thin.',
      risky: false,
    };
  }

  if (cleaned.includes('x')) {
    return {
      positive: 'it changes the structure and forces the engine to respond to a concrete threat.',
      caution: 'it changes the structure and can leave your pieces exposed if the capture is not supported.',
      risky: false,
    };
  }

  if (/^[NBR]/.test(cleaned)) {
    return {
      positive: 'it improves piece activity and tightens your coordination.',
      caution: 'it develops a piece, but it may not address the most urgent squares.',
      risky: false,
    };
  }

  if (/^[ah]/.test(cleaned) && moveNumber <= 10) {
    return {
      positive: 'it gains space on the flank and can support a later attack.',
      caution: 'it spends time on the flank before central development is complete.',
      risky: true,
    };
  }

  if (CENTRAL_PAWN_MOVES.has(cleaned)) {
    return {
      positive: 'it claims central space and opens lines for development.',
      caution: 'it changes the center and can loosen key squares if you do not follow accurately.',
      risky: false,
    };
  }

  return {
    positive: 'it improves your structure and keeps your pieces flexible.',
    caution: 'it spends time without clearly improving coordination or central control.',
    risky: false,
  };
}

function gradeTone(moveGrade: MoveGrade | null | undefined): string | null {
  if (!moveGrade) return null;

  switch (moveGrade.grade) {
    case 'Brilliant':
    case 'Best':
    case 'Excellent':
      return 'Strong move';
    case 'Good':
      return 'Good move';
    case 'Inaccuracy':
      return 'Inaccurate move';
    case 'Mistake':
      return 'Risky move';
    case 'Blunder':
      return 'Inaccurate move';
    default:
      return null;
  }
}

export function resolveUserMoveQualityLabel({
  response,
  moveSan,
  moveNumber,
  previousUserProbability,
}: {
  response?: CouncilResponse | null;
  moveSan: string;
  moveNumber: number;
  previousUserProbability: number;
}): string {
  const moveGrade = response?.moveGrade ?? response?.move_grade ?? null;
  if (moveGrade) {
    return moveGrade.grade;
  }

  const explicit = parseFeedbackSentence(response?.userFeedback ?? response?.user_feedback).label;
  if (explicit) {
    return explicit;
  }

  const afterMoveProbability = resolveUserMoveWinProbability({
    response,
    previousUserProbability,
    moveSan,
    moveNumber,
  });
  const swing = afterMoveProbability - previousUserProbability;
  const theme = getMoveTheme(moveSan, moveNumber);

  if (theme.risky) {
    return swing >= 0 ? 'Adventurous' : 'Risky';
  }

  if (swing >= 5) {
    return 'Strong';
  }

  if (swing >= 1) {
    return 'Good';
  }

  return 'Inaccurate';
}

export function clampProbability(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function toWinProbabilitySplit(user: number): WinProbabilitySplit {
  const clamped = clampProbability(user);

  return {
    user: clamped,
    engine: 100 - clamped,
  };
}

export function getResponseWinHistory(response: CouncilResponse | null | undefined): number[] {
  if (!response) return [];
  return response.winProbabilityHistory ?? response.win_probability_history ?? [];
}

export function resolveLatestUserWinProbability(
  response: CouncilResponse | null | undefined,
  fallback = 50,
): number {
  const history = getResponseWinHistory(response);
  const latestHistory = history.length > 0 ? history[history.length - 1] : undefined;
  const explicit =
    latestHistory ??
    response?.metrics?.winProbability ??
    response?.userWinProbability ??
    response?.user_win_probability;

  return clampProbability(explicit ?? fallback);
}

export function resolveUserMoveWinProbability({
  response,
  previousUserProbability,
  moveSan,
  moveNumber,
}: {
  response?: CouncilResponse | null;
  previousUserProbability: number;
  moveSan: string;
  moveNumber: number;
}): number {
  const explicit =
    response?.winProbabilityAfterUserMove ??
    response?.win_probability_after_user_move;

  if (typeof explicit === 'number') {
    return clampProbability(explicit);
  }

  const history = getResponseWinHistory(response);
  if (history.length >= 2) {
    return clampProbability(history[history.length - 2]);
  }

  const cleaned = cleanSan(moveSan);
  const moveGrade = response?.moveGrade ?? response?.move_grade ?? null;
  const gradeSwing = moveGrade ? GRADE_SWINGS[moveGrade.grade] : 0;
  const themeSwing =
    cleaned === 'O-O' || cleaned === 'O-O-O'
      ? 4
      : CENTRAL_PAWN_MOVES.has(cleaned)
        ? 3
        : /^[NBR]/.test(cleaned)
          ? 2
          : /^Q/.test(cleaned) && moveNumber <= 10
            ? -4
            : /^[ah]/.test(cleaned) && moveNumber <= 10
              ? -3
              : cleaned.includes('x')
                ? 1
                : 0;

  return clampProbability(previousUserProbability + gradeSwing + themeSwing);
}

export function generateUserMoveFeedback({
  response,
  moveSan,
  moveNumber,
  previousUserProbability,
}: {
  response?: CouncilResponse | null;
  moveSan: string;
  moveNumber: number;
  previousUserProbability: number;
}): string {
  const explicit = parseFeedbackSentence(response?.userFeedback ?? response?.user_feedback).body;
  if (explicit) return upperFirst(explicit);

  const moveGrade = response?.moveGrade ?? response?.move_grade ?? null;
  const afterMoveProbability = resolveUserMoveWinProbability({
    response,
    previousUserProbability,
    moveSan,
    moveNumber,
  });
  const swing = afterMoveProbability - previousUserProbability;
  const theme = getMoveTheme(moveSan, moveNumber);
  const tone =
    gradeTone(moveGrade) ??
    (theme.risky ? 'Risky move' : swing >= 3 ? 'Strong move' : swing >= 0 ? 'Good move' : 'Inaccurate move');
  const reason = tone === 'Strong move' || tone === 'Good move' ? theme.positive : theme.caution;

  return upperFirst(reason);
}

function moveMatches(engineMoveSan: string | null, candidate: TopMove): boolean {
  if (!engineMoveSan) return false;

  const cleanedEngine = cleanSan(engineMoveSan);
  const cleanedSan = candidate.san ? cleanSan(candidate.san) : null;
  const cleanedMove = cleanSan(candidate.move);

  return cleanedEngine === cleanedSan || cleanedEngine === cleanedMove;
}

export function generateEngineComment({
  response,
  engineMoveSan,
  topMoves = [],
}: {
  response?: CouncilResponse | null;
  engineMoveSan: string | null;
  topMoves?: TopMove[];
}): string | null {
  const explicit = firstSentence(response?.engineComment ?? response?.engine_comment);
  if (explicit) return explicit;

  const reasoning = firstSentence(
    response?.engineReasoning ??
      response?.engine_reasoning ??
      response?.council?.reasoning ??
      response?.verdict?.reasoning,
  );
  if (reasoning) return reasoning;

  const matchingTopMove = topMoves.find((candidate) => moveMatches(engineMoveSan, candidate)) ?? topMoves[0];
  if (matchingTopMove?.description) {
    const label = matchingTopMove.san ?? engineMoveSan ?? matchingTopMove.move;
    return `The engine chooses ${label} because ${lowerFirst(matchingTopMove.description.replace(/\.$/, ''))}.`;
  }

  const plan = firstSentence(response?.enginePlan ?? response?.engine_plan);
  if (plan) return plan;

  if (!engineMoveSan) return null;
  return `The engine replies with ${engineMoveSan} to keep the position balanced and flexible.`;
}

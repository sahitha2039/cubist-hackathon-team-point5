import chess
from engine.eval import evaluate

_current_mode = "balanced"

def _minimax(board, depth, alpha, beta, maximizing):
    if board.is_checkmate():
        return -100000 if maximizing else 100000
    if board.is_stalemate() or board.is_insufficient_material():
        return 0
    if depth == 0:
        return evaluate(board, _current_mode)

    if maximizing:
        max_score = -float("inf")
        for move in _order_moves(board):
            board.push(move)
            score = _minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_score = max(max_score, score)
            alpha = max(alpha, score)
            if beta <= alpha:
                break
        return max_score
    else:
        min_score = float("inf")
        for move in _order_moves(board):
            board.push(move)
            score = _minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_score = min(min_score, score)
            beta = min(beta, score)
            if beta <= alpha:
                break
        return min_score

def _order_moves(board):
    def move_priority(move):
        if board.is_capture(move):
            return 0
        if board.gives_check(move):
            return 1
        return 2
    return sorted(board.legal_moves, key=move_priority)

def find_best_move(board, depth=4, mode="balanced", return_candidates=False):
    global _current_mode
    _current_mode = mode

    is_white = board.turn == chess.WHITE
    best_move = None
    best_score = -float("inf") if is_white else float("inf")
    alpha = -float("inf")
    beta  = float("inf")

    candidates = []

    for move in _order_moves(board):
        board.push(move)
        score = _minimax(board, depth - 1, alpha, beta, not is_white)
        board.pop()

        candidates.append({
            "move":  move.uci(),
            "score": round(score, 2),
        })

        if is_white:
            if score > best_score:
                best_score = score
                best_move  = move
            alpha = max(alpha, score)
        else:
            if score < best_score or best_move is None:
                best_score = score
                best_move  = move
            beta = min(beta, score)

    # sort candidates best first
    candidates.sort(key=lambda x: x["score"], reverse=is_white)
    top3 = candidates[:3]

    if return_candidates:
        return best_move.uci() if best_move else None, top3

    return best_move.uci() if best_move else None
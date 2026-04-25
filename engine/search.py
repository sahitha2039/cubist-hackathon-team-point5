import chess
from engine.eval import evaluate

def _minimax(board, depth, alpha, beta, maximizing):
    global _node_count
    _node_count += 1
    if board.is_checkmate():
        return -100000 if maximizing else 100000
    if board.is_stalemate() or board.is_insufficient_material():
        return 0
    if depth == 0:
        return evaluate(board, _current_mode)

    if maximizing:
        max_score = -float("inf")
        for move in board.legal_moves:
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
        for move in board.legal_moves:
            board.push(move)
            score = _minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_score = min(min_score, score)
            beta = min(beta, score)
            if beta <= alpha:
                break
        return min_score

_current_mode = "balanced"
_node_count = 0

def find_best_move(board, depth=4, mode="balanced"):
    global _current_mode, _node_count
    _current_mode = mode
    _node_count = 0

    best_move = None
    best_score = -float("inf")
    alpha = -float("inf")
    beta = float("inf")

    is_white = board.turn == chess.WHITE

    for move in board.legal_moves:
        board.push(move)
        score = _minimax(board, depth - 1, alpha, beta, not is_white)
        board.pop()

        if is_white:
            if score > best_score:
                best_score = score
                best_move = move
            alpha = max(alpha, score)
        else:
            if score < best_score or best_move is None:
                best_score = score
                best_move = move
            beta = min(beta, score)

    print(f"[search] mode={mode} depth={depth} nodes={_node_count}")
    return best_move.uci() if best_move else None
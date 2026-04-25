import chess
from engine.modes import MODES

def _material(board):
    values = {
        chess.PAWN:   100,
        chess.KNIGHT: 320,
        chess.BISHOP: 330,
        chess.ROOK:   500,
        chess.QUEEN:  900,
    }
    score = 0
    for piece_type, value in values.items():
        score += len(board.pieces(piece_type, chess.WHITE)) * value
        score -= len(board.pieces(piece_type, chess.BLACK)) * value
    return score

def _king_safety(board):
    castled = {chess.WHITE: {chess.G1, chess.C1}, chess.BLACK: {chess.G8, chess.C8}}
    score = 0
    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        king_sq = board.king(color)
        if king_sq is None:
            continue
        shield = chess.SquareSet(chess.BB_KING_ATTACKS[king_sq])
        pawns = board.pieces(chess.PAWN, color)
        shielding = len(shield & pawns)
        score += sign * shielding * 40
        if king_sq in castled[color]:
            score += sign * 60
    return score

def _mobility(board):
    white_moves = len(list(board.legal_moves)) if board.turn == chess.WHITE else 0
    board.turn = not board.turn
    black_moves = len(list(board.legal_moves))
    board.turn = not board.turn
    return (white_moves - black_moves) * 8

def _pawn_structure(board):
    score = 0
    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        pawns = board.pieces(chess.PAWN, color)
        files = [chess.square_file(sq) for sq in pawns]

        for f in range(8):
            count = files.count(f)
            if count > 1:
                score -= sign * (count - 1) * 60

        for f in files:
            if not any(n in files for n in [f-1, f+1]):
                score -= sign * 50

        opp_pawns = board.pieces(chess.PAWN, not color)
        opp_files = [chess.square_file(sq) for sq in opp_pawns]
        for sq in pawns:
            if chess.square_file(sq) not in opp_files:
                score += sign * 100

    return score

def _king_attack(board):
    score = 0
    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        opp_king_sq = board.king(not color)
        if opp_king_sq is None:
            continue
        attack_zone = chess.SquareSet(chess.BB_KING_ATTACKS[opp_king_sq])
        for sq in attack_zone:
            attackers = board.attackers(color, sq)
            score += sign * len(attackers) * 25
    if board.is_check():
        # current side to move is in check; reward the side that delivered it
        deliverer_sign = -1 if board.turn == chess.WHITE else 1
        score += deliverer_sign * 75
    return score

def _king_activity(board):
    score = 0
    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        king_sq = board.king(color)
        if king_sq is None:
            continue
        dist = chess.square_distance(king_sq, chess.E4)
        if dist < 3:
            score += sign * 30
        elif dist > 4:
            score += sign * (-15)
    return score

def _piece_activity(board):
    active_types = [chess.KNIGHT, chess.BISHOP, chess.ROOK, chess.QUEEN]
    white_total = 0
    black_total = 0
    for piece_type in active_types:
        for sq in board.pieces(piece_type, chess.WHITE):
            white_total += len(board.attacks(sq))
        for sq in board.pieces(piece_type, chess.BLACK):
            black_total += len(board.attacks(sq))
    return (white_total - black_total) * 3

def evaluate(board, mode="balanced"):
    weights = MODES.get(mode, MODES["balanced"])

    score = 0
    score += weights["material"]        * _material(board)
    score += weights["king_safety"]     * _king_safety(board)
    score += weights["mobility"]        * _mobility(board)
    score += weights["pawn_structure"]  * _pawn_structure(board)
    score += weights["king_attack"]     * _king_attack(board)
    score += weights["king_activity"]   * _king_activity(board)
    score += weights["piece_activity"]  * _piece_activity(board)

    return score
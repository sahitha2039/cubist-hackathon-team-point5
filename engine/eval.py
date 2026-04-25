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
    score = 0
    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        king_sq = board.king(color)
        if king_sq is None:
            continue
        shield = chess.SquareSet(chess.BB_KING_ATTACKS[king_sq])
        pawns = board.pieces(chess.PAWN, color)
        shielding = len(shield & pawns)
        score += sign * shielding * 10
    return score

def _mobility(board):
    white_moves = len(list(board.legal_moves)) if board.turn == chess.WHITE else 0
    board.turn = not board.turn
    black_moves = len(list(board.legal_moves))
    board.turn = not board.turn
    return white_moves - black_moves

def _pawn_structure(board):
    score = 0
    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        pawns = board.pieces(chess.PAWN, color)
        files = [chess.square_file(sq) for sq in pawns]

        for f in range(8):
            count = files.count(f)
            if count > 1:
                score -= sign * (count - 1) * 30

        for f in files:
            if not any(n in files for n in [f-1, f+1]):
                score -= sign * 20

        opp_pawns = board.pieces(chess.PAWN, not color)
        opp_files = [chess.square_file(sq) for sq in opp_pawns]
        for sq in pawns:
            if chess.square_file(sq) not in opp_files:
                score += sign * 40

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
            score += sign * len(attackers) * 5
    return score

def evaluate(board, mode="balanced"):
    weights = MODES.get(mode, MODES["balanced"])

    score = 0
    score += weights["material"]       * _material(board)
    score += weights["king_safety"]    * _king_safety(board)
    score += weights["mobility"]       * _mobility(board)
    score += weights["pawn_structure"] * _pawn_structure(board)
    score += weights["king_attack"]    * _king_attack(board)

    return score
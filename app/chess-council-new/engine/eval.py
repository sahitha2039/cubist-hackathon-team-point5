# import chess
# from engine.modes import MODES
#
# def _material(board):
#     values = {
#         chess.PAWN:   100,
#         chess.KNIGHT: 320,
#         chess.BISHOP: 330,
#         chess.ROOK:   500,
#         chess.QUEEN:  900,
#     }
#     score = 0
#     for piece_type, value in values.items():
#         score += len(board.pieces(piece_type, chess.WHITE)) * value
#         score -= len(board.pieces(piece_type, chess.BLACK)) * value
#     return score
#
# def _king_safety(board):
#     score = 0
#     for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
#         king_sq = board.king(color)
#         if king_sq is None:
#             continue
#         shield = chess.SquareSet(chess.BB_KING_ATTACKS[king_sq])
#         pawns = board.pieces(chess.PAWN, color)
#         shielding = len(shield & pawns)
#         score += sign * shielding * 10
#     return score
#
# def _mobility(board):
#     white_moves = len(list(board.legal_moves)) if board.turn == chess.WHITE else 0
#     board.turn = not board.turn
#     black_moves = len(list(board.legal_moves))
#     board.turn = not board.turn
#     return white_moves - black_moves
#
# def _pawn_structure(board):
#     score = 0
#     for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
#         pawns = board.pieces(chess.PAWN, color)
#         files = [chess.square_file(sq) for sq in pawns]
#
#         for f in range(8):
#             count = files.count(f)
#             if count > 1:
#                 score -= sign * (count - 1) * 30
#
#         for f in files:
#             if not any(n in files for n in [f-1, f+1]):
#                 score -= sign * 20
#
#         opp_pawns = board.pieces(chess.PAWN, not color)
#         opp_files = [chess.square_file(sq) for sq in opp_pawns]
#         for sq in pawns:
#             if chess.square_file(sq) not in opp_files:
#                 score += sign * 40
#
#     return score
#
# def _king_attack(board):
#     score = 0
#     for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
#         opp_king_sq = board.king(not color)
#         if opp_king_sq is None:
#             continue
#         attack_zone = chess.SquareSet(chess.BB_KING_ATTACKS[opp_king_sq])
#         for sq in attack_zone:
#             attackers = board.attackers(color, sq)
#             score += sign * len(attackers) * 5
#     return score
#
# def evaluate(board, mode="balanced"):
#     weights = MODES.get(mode, MODES["balanced"])
#
#     score = 0
#     score += weights["material"]       * _material(board)
#     score += weights["king_safety"]    * _king_safety(board)
#     score += weights["mobility"]       * _mobility(board)
#     score += weights["pawn_structure"] * _pawn_structure(board)
#     score += weights["king_attack"]    * _king_attack(board)
#     score += weights["piece_activity"] * _piece_activity(board)
#     score += weights["king_activity"]  * _king_activity(board)
#
#     return score
#
# def _piece_activity(board):
#     score = 0
#     center_squares = [
#         chess.D4, chess.D5, chess.E4, chess.E5,
#         chess.C3, chess.C4, chess.C5, chess.C6,
#         chess.D3, chess.D6, chess.E3, chess.E6,
#         chess.F3, chess.F4, chess.F5, chess.F6,
#     ]
#     for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
#         for sq in center_squares:
#             attackers = board.attackers(color, sq)
#             score += sign * len(attackers) * 3
#         # bonus for rooks on open files
#         for sq in board.pieces(chess.ROOK, color):
#             file = chess.square_file(sq)
#             file_mask = chess.BB_FILES[file]
#             white_pawns = board.pieces(chess.PAWN, chess.WHITE)
#             black_pawns = board.pieces(chess.PAWN, chess.BLACK)
#             if not (file_mask & white_pawns) and not (file_mask & black_pawns):
#                 score += sign * 20
#     return score
#
# def _king_activity(board):
#     score = 0
#     # only matters in endgame — when queens are off the board
#     if board.pieces(chess.QUEEN, chess.WHITE) or board.pieces(chess.QUEEN, chess.BLACK):
#         return 0
#     for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
#         king_sq = board.king(color)
#         if king_sq is None:
#             continue
#         # bonus for king being central
#         file = chess.square_file(king_sq)
#         rank = chess.square_rank(king_sq)
#         centrality = (3.5 - abs(file - 3.5)) + (3.5 - abs(rank - 3.5))
#         score += sign * centrality * 5
#     return score


import chess
from engine.modes import MODES


# -------------------------
# MATERIAL
# -------------------------
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


# -------------------------
# KING SAFETY
# -------------------------
def _king_safety(board):
    score = 0

    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        king_sq = board.king(color)
        if king_sq is None:
            continue

        shield = chess.SquareSet(chess.BB_KING_ATTACKS[king_sq])

        pawns = board.pieces(chess.PAWN, color)
        pawns = chess.SquareSet(pawns)

        shielding = len(shield & pawns)
        score += sign * shielding * 10

    return score


# -------------------------
# MOBILITY (FIXED - no mutation)
# -------------------------
def _mobility(board):
    original_turn = board.turn

    board.turn = chess.WHITE
    white_moves = len(list(board.legal_moves))

    board.turn = chess.BLACK
    black_moves = len(list(board.legal_moves))

    board.turn = original_turn

    return white_moves - black_moves


# -------------------------
# PAWN STRUCTURE
# -------------------------
def _pawn_structure(board):
    score = 0

    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        pawns = board.pieces(chess.PAWN, color)
        files = [chess.square_file(sq) for sq in pawns]

        # doubled pawns
        for f in range(8):
            count = files.count(f)
            if count > 1:
                score -= sign * (count - 1) * 30

        # isolated pawns
        for f in files:
            if not any(n in files for n in [f - 1, f + 1]):
                score -= sign * 20

        # passed pawn bonus (simple version)
        opp_pawns = board.pieces(chess.PAWN, not color)
        opp_files = [chess.square_file(sq) for sq in opp_pawns]

        for sq in pawns:
            if chess.square_file(sq) not in opp_files:
                score += sign * 40

    return score


# -------------------------
# KING ATTACK
# -------------------------
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


# -------------------------
# PIECE ACTIVITY (FIXED TYPES)
# -------------------------
def _piece_activity(board):
    score = 0

    center_squares = [
        chess.D4, chess.D5, chess.E4, chess.E5,
        chess.C3, chess.C4, chess.C5, chess.C6,
        chess.D3, chess.D6, chess.E3, chess.E6,
        chess.F3, chess.F4, chess.F5, chess.F6,
    ]

    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:

        for sq in center_squares:
            attackers = board.attackers(color, sq)
            score += sign * len(attackers) * 3

        # rook file activity (FIXED BITBOARD TYPES)
        for sq in board.pieces(chess.ROOK, color):
            file = chess.square_file(sq)
            file_mask = chess.BB_FILES[file]

            white_pawns = int(board.pieces(chess.PAWN, chess.WHITE))
            black_pawns = int(board.pieces(chess.PAWN, chess.BLACK))

            if not (file_mask & white_pawns) and not (file_mask & black_pawns):
                score += sign * 20

    return score


# -------------------------
# KING ACTIVITY (ENDGAME ONLY)
# -------------------------
def _king_activity(board):
    score = 0

    if board.pieces(chess.QUEEN, chess.WHITE) or board.pieces(chess.QUEEN, chess.BLACK):
        return 0

    for color, sign in [(chess.WHITE, 1), (chess.BLACK, -1)]:
        king_sq = board.king(color)
        if king_sq is None:
            continue

        file = chess.square_file(king_sq)
        rank = chess.square_rank(king_sq)

        centrality = (3.5 - abs(file - 3.5)) + (3.5 - abs(rank - 3.5))
        score += sign * centrality * 5

    return score


# -------------------------
# MAIN EVALUATION
# -------------------------
def evaluate(board, mode="balanced"):
    weights = MODES.get(mode, MODES["balanced"])

    score = 0
    score += weights["material"]       * _material(board)
    score += weights["king_safety"]    * _king_safety(board)
    score += weights["mobility"]       * _mobility(board)
    score += weights["pawn_structure"] * _pawn_structure(board)
    score += weights["king_attack"]    * _king_attack(board)
    score += weights["piece_activity"] * _piece_activity(board)
    score += weights["king_activity"]  * _king_activity(board)

    return score

def evaluate_breakdown(board, mode="balanced"):
    weights = MODES.get(mode, MODES["balanced"])

    breakdown = {
        "material":       round(weights["material"]       * _material(board),       2),
        "king_safety":    round(weights["king_safety"]    * _king_safety(board),    2),
        "mobility":       round(weights["mobility"]       * _mobility(board),       2),
        "pawn_structure": round(weights["pawn_structure"] * _pawn_structure(board), 2),
        "king_attack":    round(weights["king_attack"]    * _king_attack(board),    2),
        "piece_activity": round(weights["piece_activity"] * _piece_activity(board), 2),
        "king_activity":  round(weights["king_activity"]  * _king_activity(board),  2),
    }
    breakdown["total"] = round(sum(breakdown.values()), 2)
    return breakdown
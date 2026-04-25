"""
extract_features.py

Extract per-game stylistic features from a PGN file for one player.

Usage:
    python extract_features.py <input.pgn> <name_substring> <color> \
        [--year-min YYYY] [--year-max YYYY] > output.csv

Color is 'white' or 'black' (separate runs by design).
Outputs CSV with one row per processed game to stdout.
Logs processed/skipped counts and reasons to stderr.

ASSUMPTIONS (referenceable as "assumption #N"):
1. Pawn island = a maximal run of consecutive files (a..h) that contain at least
   one of the subject's pawns. Computed per file occupancy bitmap.
2. Pawn shield = subject pawns on files {king_file-1, king_file, king_file+1}
   that are within 2 ranks "in front of" the king. "In front of" means toward
   the opponent's back rank: ranks > king_rank for White, ranks < king_rank
   for Black. We clamp file range to [0,7] (so a king on a-file uses files a,b).
3. Endgame phase = total non-pawn material on the board (both sides) drops
   below 13 in {P=1, N=3, B=3, R=5, Q=9} units. P doesn't actually count but
   we include it in the docstring per the spec; only N+B+R+Q sum to 13.
4. Castling detection: we detect king moves of distance 2 on the back rank
   (the standard castle move) rather than rely on board.has_castled flags.
   castle_side is 'k' if king lands on g-file, 'q' if c-file.
5. king_in_center: king is on file d or e (files 3 or 4) AND on rank 1 (white)
   or rank 8 (black). Counted across plies > 30 just after subject's moves.
6. Pawn-structure features at "move 20": measured at ply 39 (white subject)
   or ply 40 (black subject) — the position right after the subject's 20th
   move. -1 for all four if the game ended before that ply.
7. Mobility = legal-move count for the side-to-move on the position. Subject
   mobility is sampled on positions where it just became opponent's turn
   (i.e., subject just moved). Range: plies 20-60 inclusive.
8. material_max_deficit / surplus: scanned after every ply (both sides). The
   "balance" at a position is (subject_material - opponent_material) in pawn
   units using {P=1,N=3,B=3,R=5,Q=9}. max_deficit is reported as a positive
   number (e.g. 3.0 means "down a minor at worst").
9. accepted_material_deficit_for_10_plies_and_didnt_lose: True iff there
   exists a window of 10 consecutive plies where subject's material balance
   was <= -1 throughout, AND the game's final result is not a loss for
   subject.
10. Mobility/shield averaging skips plies where the position is terminal.

NOISE WARNINGS (features I expect to be noisy as style signatures):
- subject_checks_total: confounded with opening/tactical context.
- subject_captures_total: confounded with opponent style and game length.
- material_max_surplus: dominated by games against weak opponents in the
  player's youth — Karpov's 1961-1970 games will skew this.
- ply_first_capture: dominated by opening choice, not stylistic preference.

MISSING FEATURES (would improve diagnosis vs an aggressive baseline):
- Time to first sacrifice (sac = capture giving up >=1 pawn of material).
- Number of "quiet" moves (non-capture, non-check, non-pawn-advance).
- Average minor-piece centralization (knights/bishops on central squares).
- Bishop pair retention (long bishop pair = positional preference).
- Late-game piece activity asymmetry (subject_minors_active vs opp).
"""
from __future__ import annotations
import argparse
import sys
import csv
from collections import defaultdict
from typing import Optional

import chess
import chess.pgn


PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 0,
}
NONPAWN_TYPES = (chess.KNIGHT, chess.BISHOP, chess.ROOK, chess.QUEEN)


def material_balance(board: chess.Board, subject_color: chess.Color) -> float:
    """Subject material minus opponent material in pawn units."""
    s = 0
    o = 0
    for piece_type, val in PIECE_VALUES.items():
        s += len(board.pieces(piece_type, subject_color)) * val
        o += len(board.pieces(piece_type, not subject_color)) * val
    return s - o


def total_nonpawn_material(board: chess.Board) -> int:
    """Sum of N+B+R+Q for both sides in pawn units. See assumption #3."""
    total = 0
    for color in (chess.WHITE, chess.BLACK):
        for pt in NONPAWN_TYPES:
            total += len(board.pieces(pt, color)) * PIECE_VALUES[pt]
    return total


def count_pawn_islands(board: chess.Board, color: chess.Color) -> int:
    """Number of maximal runs of consecutive files containing color's pawns."""
    files_with_pawn = [False] * 8
    for sq in board.pieces(chess.PAWN, color):
        files_with_pawn[chess.square_file(sq)] = True
    islands = 0
    in_island = False
    for f in files_with_pawn:
        if f and not in_island:
            islands += 1
            in_island = True
        elif not f:
            in_island = False
    return islands


def count_doubled_pawns(board: chess.Board, color: chess.Color) -> int:
    """Number of pawns that share a file with another friendly pawn."""
    file_counts = [0] * 8
    for sq in board.pieces(chess.PAWN, color):
        file_counts[chess.square_file(sq)] += 1
    return sum(c for c in file_counts if c >= 2)


def count_isolated_pawns(board: chess.Board, color: chess.Color) -> int:
    """Pawns with no friendly pawns on adjacent files."""
    files_with_pawn = [False] * 8
    for sq in board.pieces(chess.PAWN, color):
        files_with_pawn[chess.square_file(sq)] = True
    iso = 0
    for sq in board.pieces(chess.PAWN, color):
        f = chess.square_file(sq)
        left = files_with_pawn[f - 1] if f > 0 else False
        right = files_with_pawn[f + 1] if f < 7 else False
        if not left and not right:
            iso += 1
    return iso


def count_passed_pawns(board: chess.Board, color: chess.Color) -> int:
    """Pawns with no enemy pawn on same/adjacent file ahead of them."""
    enemy_pawns_by_file = defaultdict(list)
    for sq in board.pieces(chess.PAWN, not color):
        enemy_pawns_by_file[chess.square_file(sq)].append(chess.square_rank(sq))
    passed = 0
    for sq in board.pieces(chess.PAWN, color):
        f = chess.square_file(sq)
        r = chess.square_rank(sq)
        blocked = False
        for adj_f in (f - 1, f, f + 1):
            if not 0 <= adj_f <= 7:
                continue
            for er in enemy_pawns_by_file[adj_f]:
                if color == chess.WHITE and er > r:
                    blocked = True; break
                if color == chess.BLACK and er < r:
                    blocked = True; break
            if blocked:
                break
        if not blocked:
            passed += 1
    return passed


def pawn_shield_count(board: chess.Board, color: chess.Color) -> int:
    """See assumption #2."""
    king_sq = board.king(color)
    if king_sq is None:
        return 0
    kf = chess.square_file(king_sq)
    kr = chess.square_rank(king_sq)
    forward = 1 if color == chess.WHITE else -1
    count = 0
    for df in (-1, 0, 1):
        f = kf + df
        if not 0 <= f <= 7:
            continue
        for dr in (1, 2):
            r = kr + dr * forward
            if not 0 <= r <= 7:
                continue
            sq = chess.square(f, r)
            piece = board.piece_at(sq)
            if piece and piece.piece_type == chess.PAWN and piece.color == color:
                count += 1
    return count


def king_in_center(board: chess.Board, color: chess.Color) -> bool:
    """King on d/e file and on the back rank (1 for white, 8 for black)."""
    king_sq = board.king(color)
    if king_sq is None:
        return False
    kf = chess.square_file(king_sq)
    kr = chess.square_rank(king_sq)
    home_rank = 0 if color == chess.WHITE else 7
    return kf in (3, 4) and kr == home_rank


def detect_castle(move: chess.Move, board_before: chess.Board) -> Optional[str]:
    """Detect a castling move from the board-before-move and the move.
    Returns 'k', 'q', or None.
    """
    piece = board_before.piece_at(move.from_square)
    if piece is None or piece.piece_type != chess.KING:
        return None
    ff = chess.square_file(move.from_square)
    tf = chess.square_file(move.to_square)
    if abs(ff - tf) != 2:
        return None
    return 'k' if tf == 6 else ('q' if tf == 2 else None)


def compute_all_features(game: chess.pgn.Game, subject_color: chess.Color) -> Optional[dict]:
    """Walk the game once and accumulate all features. Returns None if
    game is too short to yield features."""
    board = game.board()
    moves = list(game.mainline_moves())
    total_plies = len(moves)
    if total_plies < 20:
        return None

    # Initialize features
    feats: dict = {
        "ply_first_capture": -1,
        "ply_queens_off": -1,
        "ply_first_minor_trade": -1,
        "endgame_reached_ply": -1,
        "endgame_proportion": 0.0,
        "ply_castled": -1,
        "castle_side": "none",
        "doubled_pawns_at_move20": -1,
        "isolated_pawns_at_move20": -1,
        "passed_pawns_at_move20": -1,
        "pawn_islands_at_move20": -1,
        "subject_captures_total": 0,
        "subject_checks_total": 0,
        "material_max_deficit": 0.0,  # stored as positive at end
        "material_max_surplus": 0.0,
    }

    # Accumulators for averaged / windowed features
    shield_samples = []
    sub_mob_samples = []
    opp_mob_samples = []
    pair_mob_samples = []  # (sub_mob_sample, opp_mob_sample) zipped pairs
    last_sub_mob_for_pair = None
    king_center_count = 0
    endgame_plies = 0

    # Material balance window for "accepted deficit"
    deficit_run = 0
    accepted_deficit_flag = 0

    # The pawn-structure-at-move-20 ply we care about
    target_pawn_ply = 39 if subject_color == chess.WHITE else 40

    for ply_idx, move in enumerate(moves, start=1):
        # Pre-move detection (capture, castle)
        is_capture = board.is_capture(move)
        captured_piece_type = None
        if is_capture:
            if board.is_en_passant(move):
                captured_piece_type = chess.PAWN
            else:
                captured = board.piece_at(move.to_square)
                if captured:
                    captured_piece_type = captured.piece_type

        side_to_move = board.turn  # who is about to move = side that owns this ply
        is_subject_move = (side_to_move == subject_color)

        # Castling detection (subject only)
        if is_subject_move:
            cs = detect_castle(move, board)
            if cs is not None and feats["ply_castled"] == -1:
                feats["ply_castled"] = ply_idx
                feats["castle_side"] = cs

        # First-capture (any side)
        if is_capture and feats["ply_first_capture"] == -1:
            feats["ply_first_capture"] = ply_idx

        # First minor trade (capture of N or B by either side)
        if is_capture and captured_piece_type in (chess.KNIGHT, chess.BISHOP):
            if feats["ply_first_minor_trade"] == -1:
                feats["ply_first_minor_trade"] = ply_idx

        # Subject-specific aggression counters
        if is_subject_move:
            if is_capture:
                feats["subject_captures_total"] += 1
            # Push the move and check for check after; use gives_check for efficiency
            gives_check = board.gives_check(move)
            board.push(move)
            if gives_check:
                feats["subject_checks_total"] += 1
        else:
            board.push(move)

        # Now board reflects position AFTER this ply.

        # Queens-off detection
        if feats["ply_queens_off"] == -1:
            if not board.pieces(chess.QUEEN, chess.WHITE) and not board.pieces(chess.QUEEN, chess.BLACK):
                feats["ply_queens_off"] = ply_idx

        # Endgame phase detection
        if total_nonpawn_material(board) < 13:
            if feats["endgame_reached_ply"] == -1:
                feats["endgame_reached_ply"] = ply_idx
            endgame_plies += 1

        # Pawn-structure-at-move-20 snapshot (after subject's 20th move)
        if ply_idx == target_pawn_ply:
            feats["doubled_pawns_at_move20"] = count_doubled_pawns(board, subject_color)
            feats["isolated_pawns_at_move20"] = count_isolated_pawns(board, subject_color)
            feats["passed_pawns_at_move20"] = count_passed_pawns(board, subject_color)
            feats["pawn_islands_at_move20"] = count_pawn_islands(board, subject_color)

        # Per-ply windowed samples (plies 20-60)
        if 20 <= ply_idx <= 60 and not board.is_game_over(claim_draw=False):
            if is_subject_move:
                # Just after subject's move: position is opponent-to-move.
                # subject mobility = sample legal-move count from a phantom
                # board with subject to move. Cheaper proxy: count subject's
                # pseudo-legal moves on this position (turn=opponent). We use
                # a copy with turn flipped.
                phantom = board.copy(stack=False)
                phantom.turn = subject_color
                sub_mob = phantom.legal_moves.count()
                sub_mob_samples.append(sub_mob)
                last_sub_mob_for_pair = sub_mob

                # Pawn shield sample (subject's perspective)
                shield_samples.append(pawn_shield_count(board, subject_color))
            else:
                # Just after opponent's move: position is subject-to-move.
                opp_mob = board.legal_moves.count()
                # Wait — board.turn after opp move = subject. So legal_moves is subject's.
                # We want OPPONENT mobility; flip.
                phantom = board.copy(stack=False)
                phantom.turn = (not subject_color)
                opp_mob_real = phantom.legal_moves.count()
                opp_mob_samples.append(opp_mob_real)
                if last_sub_mob_for_pair is not None and opp_mob_real > 0:
                    pair_mob_samples.append(last_sub_mob_for_pair / opp_mob_real)
                    last_sub_mob_for_pair = None

        # King-in-center after ply 30 (sampled after subject's moves)
        if ply_idx > 30 and is_subject_move:
            if king_in_center(board, subject_color):
                king_center_count += 1

        # Material balance after every ply
        bal = material_balance(board, subject_color)
        if bal < -feats["material_max_deficit"]:
            feats["material_max_deficit"] = -bal  # stored positive
        if bal > feats["material_max_surplus"]:
            feats["material_max_surplus"] = bal

        # Accepted-deficit window: subject deficit <= -1
        if bal <= -1:
            deficit_run += 1
            if deficit_run >= 10:
                accepted_deficit_flag = 1
        else:
            deficit_run = 0

    # Final aggregate features
    feats["total_plies"] = total_plies
    feats["endgame_proportion"] = endgame_plies / total_plies if total_plies else 0.0
    feats["pawn_shield_score_avg"] = (
        sum(shield_samples) / len(shield_samples) if shield_samples else -1.0
    )
    feats["king_in_center_plies_after_ply30"] = king_center_count
    feats["avg_subject_mobility"] = (
        sum(sub_mob_samples) / len(sub_mob_samples) if sub_mob_samples else -1.0
    )
    feats["avg_opponent_mobility"] = (
        sum(opp_mob_samples) / len(opp_mob_samples) if opp_mob_samples else -1.0
    )
    feats["mobility_ratio"] = (
        sum(pair_mob_samples) / len(pair_mob_samples) if pair_mob_samples else -1.0
    )

    # Determine result for accepted_deficit gate
    result = game.headers.get("Result", "?")
    subject_lost = (
        (subject_color == chess.WHITE and result == "0-1") or
        (subject_color == chess.BLACK and result == "1-0")
    )
    feats["accepted_material_deficit_for_10_plies_and_didnt_lose"] = (
        accepted_deficit_flag if (accepted_deficit_flag and not subject_lost) else 0
    )

    return feats


CSV_FIELDS = [
    "game_id", "year", "subject_color", "result", "subject_won", "total_plies", "eco",
    "ply_first_capture", "ply_queens_off", "ply_first_minor_trade",
    "endgame_reached_ply", "endgame_proportion",
    "ply_castled", "castle_side",
    "pawn_shield_score_avg", "king_in_center_plies_after_ply30",
    "doubled_pawns_at_move20", "isolated_pawns_at_move20",
    "passed_pawns_at_move20", "pawn_islands_at_move20",
    "avg_subject_mobility", "avg_opponent_mobility", "mobility_ratio",
    "subject_captures_total", "subject_checks_total",
    "material_max_deficit", "material_max_surplus",
    "accepted_material_deficit_for_10_plies_and_didnt_lose",
]


def parse_year(date_header: str) -> int:
    if not date_header:
        return -1
    s = date_header.split(".")[0]
    return int(s) if s.isdigit() else -1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pgn_path")
    ap.add_argument("name_substring")
    ap.add_argument("color", choices=["white", "black"])
    ap.add_argument("--year-min", type=int, default=None)
    ap.add_argument("--year-max", type=int, default=None)
    args = ap.parse_args()

    target_color = chess.WHITE if args.color == "white" else chess.BLACK

    writer = csv.DictWriter(sys.stdout, fieldnames=CSV_FIELDS)
    writer.writeheader()

    counts = {
        "processed": 0,
        "skipped_color": 0,
        "skipped_year": 0,
        "skipped_short": 0,
        "skipped_unfinished": 0,
        "skipped_no_subject": 0,
        "skipped_error": 0,
    }
    error_reasons = defaultdict(int)

    with open(args.pgn_path, encoding="utf-8", errors="replace") as f:
        game_id = 0
        while True:
            try:
                game = chess.pgn.read_game(f)
            except Exception as e:
                error_reasons[f"parse:{type(e).__name__}"] += 1
                counts["skipped_error"] += 1
                continue
            if game is None:
                break
            game_id += 1

            white = game.headers.get("White", "")
            black = game.headers.get("Black", "")

            if args.name_substring in white:
                subject_color = chess.WHITE
            elif args.name_substring in black:
                subject_color = chess.BLACK
            else:
                counts["skipped_no_subject"] += 1
                continue

            if subject_color != target_color:
                counts["skipped_color"] += 1
                continue

            year = parse_year(game.headers.get("Date", ""))
            if args.year_min is not None and (year == -1 or year < args.year_min):
                counts["skipped_year"] += 1
                continue
            if args.year_max is not None and (year != -1 and year > args.year_max):
                counts["skipped_year"] += 1
                continue

            result = game.headers.get("Result", "?")
            if result == "*":
                counts["skipped_unfinished"] += 1
                continue

            try:
                feats = compute_all_features(game, subject_color)
            except Exception as e:
                error_reasons[f"compute:{type(e).__name__}"] += 1
                counts["skipped_error"] += 1
                continue

            if feats is None:
                counts["skipped_short"] += 1
                continue

            # Result mapping
            if result == "1-0":
                won = 1.0 if subject_color == chess.WHITE else 0.0
            elif result == "0-1":
                won = 1.0 if subject_color == chess.BLACK else 0.0
            elif result == "1/2-1/2":
                won = 0.5
            else:
                won = -1.0

            row = {
                "game_id": game_id,
                "year": year,
                "subject_color": "w" if subject_color == chess.WHITE else "b",
                "result": result,
                "subject_won": won,
                "eco": game.headers.get("ECO", ""),
                **feats,
            }
            # Ensure ordering for CSV
            writer.writerow({k: row.get(k, "") for k in CSV_FIELDS})
            counts["processed"] += 1

    print(f"Counts: {dict(counts)}", file=sys.stderr)
    if error_reasons:
        print(f"Error reasons: {dict(error_reasons)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

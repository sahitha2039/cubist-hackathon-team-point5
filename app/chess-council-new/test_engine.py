import chess
from engine.board import GameBoard
from engine.eval import evaluate
from engine.search import find_best_move

# -------------------------
# BOARD TESTS
# -------------------------
b = GameBoard()
print("Start FEN:", b.get_fen())
print("Legal moves:", b.get_legal_moves()[:5])

b.push_move("e2e4")
print("After e4:", b.get_fen())

b.push_move("e7e5")
print("After e5:", b.get_fen())

print("Illegal move accepted?", b.push_move("e2e4"))
print("Game over?", b.is_game_over())

# -------------------------
# EVAL TESTS
# -------------------------
b2 = GameBoard()
b2.push_move("e2e4")
print("\n--- Eval test ---")
print("balanced:  ", evaluate(b2.board, "balanced"))
print("karpov:    ", evaluate(b2.board, "karpov"))
print("kasparov:  ", evaluate(b2.board, "kasparov"))
print("petrosian: ", evaluate(b2.board, "petrosian"))
print("carlsen:   ", evaluate(b2.board, "carlsen"))

# -------------------------
# SEARCH TEST — starting position (depth 3)
# -------------------------
b3 = GameBoard()
print("\n--- Search test (depth 3, starting position) ---")
print("balanced:  ", find_best_move(b3.board, depth=3, mode="balanced"))
print("karpov:    ", find_best_move(b3.board, depth=3, mode="karpov"))
print("kasparov:  ", find_best_move(b3.board, depth=3, mode="kasparov"))
print("petrosian: ", find_best_move(b3.board, depth=3, mode="petrosian"))
print("carlsen:   ", find_best_move(b3.board, depth=3, mode="carlsen"))

# -------------------------
# MIDDLEGAME TEST (depth 3)
# -------------------------
b4 = GameBoard()
b4.board = chess.Board("r1bqkb1r/pp2pppp/2np1n2/3pP3/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 6")
print("\n--- Middlegame test (depth 3) ---")
print("balanced:  ", find_best_move(b4.board, depth=3, mode="balanced"))
print("karpov:    ", find_best_move(b4.board, depth=3, mode="karpov"))
print("kasparov:  ", find_best_move(b4.board, depth=3, mode="kasparov"))
print("petrosian: ", find_best_move(b4.board, depth=3, mode="petrosian"))
print("carlsen:   ", find_best_move(b4.board, depth=3, mode="carlsen"))

# -------------------------
# DEMO POSITION TEST (depth 4)
# -------------------------
b5 = GameBoard()
b5.board = chess.Board("r2qk2r/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 8")
print("\n--- Demo position test (depth 4) ---")
print("karpov:    ", find_best_move(b5.board, depth=4, mode="karpov"))
print("kasparov:  ", find_best_move(b5.board, depth=4, mode="kasparov"))
print("petrosian: ", find_best_move(b5.board, depth=4, mode="petrosian"))
print("carlsen:   ", find_best_move(b5.board, depth=4, mode="carlsen"))

# -------------------------
# ENDGAME POSITION TEST (depth 4)
# -------------------------
b6 = GameBoard()
b6.board = chess.Board("8/5pk1/6p1/7p/8/5K2/5PP1/8 w - - 0 1")
print("\n--- Endgame position test (depth 4) ---")
print("karpov:    ", find_best_move(b6.board, depth=4, mode="karpov"))
print("kasparov:  ", find_best_move(b6.board, depth=4, mode="kasparov"))
print("petrosian: ", find_best_move(b6.board, depth=4, mode="petrosian"))
print("carlsen:   ", find_best_move(b6.board, depth=4, mode="carlsen"))


from engine.eval import evaluate_breakdown

b_test = GameBoard()
b_test.push_move("e2e4")
print("\n--- Eval breakdown test ---")
print("karpov breakdown:")
breakdown = evaluate_breakdown(b_test.board, "karpov")
for term, value in breakdown.items():
    print(f"  {term:20s}: {value}")


# add to test_engine.py
from engine.search import find_best_move

b_search = GameBoard()
b_search.board = chess.Board("r2qk2r/ppp2ppp/2n1pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 8")
print("\n--- Search with candidates ---")
best, candidates = find_best_move(b_search.board, depth=3, mode="karpov", return_candidates=True)
print("Best move:", best)
print("Top 3 candidates:")
for c in candidates:
    print(f"  {c['move']} : {c['score']}")
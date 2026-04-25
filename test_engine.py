from engine.board import GameBoard

b = GameBoard()
print("Start FEN:", b.get_fen())
print("Legal moves:", b.get_legal_moves()[:5])

b.push_move("e2e4")
print("After e4:", b.get_fen())

b.push_move("e7e5")
print("After e5:", b.get_fen())

print("Illegal move accepted?", b.push_move("e2e4"))
print("Game over?", b.is_game_over())


from engine.eval import evaluate

b2 = GameBoard()
b2.push_move("e2e4")
print("\n--- Eval test ---")
print("balanced:    ", evaluate(b2.board, "balanced"))
print("gambler:     ", evaluate(b2.board, "gambler"))
print("risk_manager:", evaluate(b2.board, "risk_manager"))
print("tactician:   ", evaluate(b2.board, "tactician"))
print("positional:  ", evaluate(b2.board, "positional"))
print("endgame:     ", evaluate(b2.board, "endgame"))

from engine.search import find_best_move

b3 = GameBoard()
print("\n--- Search test (depth 4, starting position) ---")
print("balanced:    ", find_best_move(b3.board, depth=4, mode="balanced"))
print("gambler:     ", find_best_move(b3.board, depth=4, mode="gambler"))
print("risk_manager:", find_best_move(b3.board, depth=4, mode="risk_manager"))
print("tactician:   ", find_best_move(b3.board, depth=4, mode="tactician"))
print("positional:  ", find_best_move(b3.board, depth=4, mode="positional"))


import chess

# Middlegame position - Sicilian structure, lots of imbalance
b4 = GameBoard()
b4.board = chess.Board("r1bqkb1r/pp2pppp/2np1n2/3pP3/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 6")
print("\n--- Middlegame test (depth 4) ---")
print("balanced:    ", find_best_move(b4.board, depth=4, mode="balanced"))
print("gambler:     ", find_best_move(b4.board, depth=4, mode="gambler"))
print("risk_manager:", find_best_move(b4.board, depth=4, mode="risk_manager"))
print("tactician:   ", find_best_move(b4.board, depth=4, mode="tactician"))
print("positional:  ", find_best_move(b4.board, depth=4, mode="positional"))
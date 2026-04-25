import chess

class GameBoard:
    def __init__(self):
        self.board = chess.Board()

    def push_move(self, uci_string):
        try:
            move = chess.Move.from_uci(uci_string)
            if move in self.board.legal_moves:
                self.board.push(move)
                return True
            return False
        except Exception:
            return False

    def get_fen(self):
        return self.board.fen()

    def get_legal_moves(self):
        return [move.uci() for move in self.board.legal_moves]

    def is_game_over(self):
        if not self.board.is_game_over():
            return {"over": False, "reason": ""}
        outcome = self.board.outcome()
        return {
            "over": True,
            "reason": outcome.termination.name
        }
import chess
from flask import Flask, request, jsonify
from flask_cors import CORS
from engine.board import GameBoard
from engine.search import find_best_move
import chess.engine
import os
from dotenv import load_dotenv

load_dotenv()



app = Flask(__name__)
CORS(app)

game = GameBoard()

def board_state():
    return {
        "fen": game.get_fen(),
        "legal_moves": game.get_legal_moves(),
        "turn": "white" if game.board.turn == chess.WHITE else "black",
        "game_over": game.is_game_over(),
        "active_mode": current_mode
    }

current_mode = "balanced"

STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "./stockfish")

def get_stockfish_analysis(board):
    try:
        with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as sf:
            info = sf.analyse(board, chess.engine.Limit(depth=12), multipv=2)

            # top move and score
            best = info[0]
            score = best["score"].relative
            cp = score.score(mate_score=10000)

            # win percentage via sigmoid
            import math
            win_pct = round(100 / (1 + math.exp(-cp / 400)), 1)

            # principal variation — next 5 moves engine expects
            pv = [m.uci() for m in best.get("pv", [])[:5]]

            # second best move if available
            second_move = None
            second_cp = None
            if len(info) > 1:
                second_move = info[1]["pv"][0].uci() if info[1].get("pv") else None
                second_cp = info[1]["score"].relative.score(mate_score=10000)

            return {
                "stockfish_score": cp,
                "win_pct": win_pct,
                "pv": pv,
                "second_move": second_move,
                "second_cp": second_cp,
            }
    except Exception as e:
        print(f"Stockfish error: {e}")
        return {
            "stockfish_score": 0,
            "win_pct": 50.0,
            "pv": [],
            "second_move": None,
            "second_cp": None,
        }

def grade_move(cp_loss):
    if cp_loss <= 0:   return "brilliant"
    elif cp_loss <= 10: return "good"
    elif cp_loss <= 30: return "inaccuracy"
    elif cp_loss <= 100: return "mistake"
    else:               return "blunder"

@app.route("/reset", methods=["POST"])
def reset():
    global game, current_mode
    game = GameBoard()
    current_mode = "balanced"
    return jsonify(board_state())

@app.route("/state", methods=["GET"])
def state():
    return jsonify(board_state())

@app.route("/mode", methods=["POST"])
def set_mode():
    global current_mode
    data = request.get_json()
    current_mode = data.get("mode", "balanced")
    return jsonify({"active_mode": current_mode})

@app.route("/move", methods=["POST"])
def move():
    global current_mode
    data = request.get_json()
    from_sq = data.get("from_sq")
    to_sq   = data.get("to_sq")
    mode    = data.get("mode", current_mode)
    current_mode = mode

    # handle promotion
    uci = from_sq + to_sq
    piece = game.board.piece_at(chess.parse_square(from_sq))
    if piece and piece.piece_type == chess.PAWN:
        rank = chess.square_rank(chess.parse_square(to_sq))
        if rank == 7 or rank == 0:
            uci += "q"

    # get stockfish score BEFORE human move
    sf_before = get_stockfish_analysis(game.board)
    cp_before = sf_before["stockfish_score"]

    # apply human move
    success = game.push_move(uci)
    if not success:
        return jsonify({"error": "Illegal move"}), 400

    # get stockfish score AFTER human move
    sf_after = get_stockfish_analysis(game.board)
    cp_after  = sf_after["stockfish_score"]

    # compute cp loss and grade
    cp_loss = cp_before - cp_after
    grade   = grade_move(cp_loss)

    # check game over after human move
    game_over = game.is_game_over()
    if game_over["over"]:
        return jsonify({
            **board_state(),
            "engine_move":      None,
            "grade":            "game_over",
            "cp_loss":          0,
            "win_pct":          sf_after["win_pct"],
            "stockfish_score":  sf_after["stockfish_score"],
            "pv":               [],
            "second_move":      None,
            "second_cp":        None,
        })

    # engine reply
    engine_move = find_best_move(game.board, depth=4, mode=mode)
    if engine_move:
        game.push_move(engine_move)

    # stockfish score after engine reply
    sf_final = get_stockfish_analysis(game.board)

    return jsonify({
        **board_state(),
        "engine_move":      engine_move,
        "grade":            grade,
        "cp_loss":          cp_loss,
        "win_pct":          sf_final["win_pct"],
        "stockfish_score":  sf_final["stockfish_score"],
        "pv":               sf_final["pv"],
        "second_move":      sf_final["second_move"],
        "second_cp":        sf_final["second_cp"],
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
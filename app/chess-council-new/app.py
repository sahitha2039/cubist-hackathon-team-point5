from dotenv import load_dotenv
load_dotenv()

import chess
from flask import Flask, request, jsonify
from flask_cors import CORS
from engine.board import GameBoard
from engine.search import find_best_move
from engine.eval import evaluate_breakdown
from engine.causal import get_causal_analysis
import chess.engine
import os
import math
import anthropic

app = Flask(__name__)
CORS(app)

game           = GameBoard()
current_mode   = "balanced"
eval_history   = []
move_history   = []
winpct_history = []

STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "./stockfish.exe")
client         = anthropic.Anthropic("ANTHROPIC_API_KEY")

def board_state():
    return {
        "fen":         game.get_fen(),
        "legal_moves": game.get_legal_moves(),
        "turn":        "white" if game.board.turn == chess.WHITE else "black",
        "game_over":   game.is_game_over(),
        "active_mode": current_mode,
    }

def get_stockfish_analysis(board):
    try:
        with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as sf:
            info = sf.analyse(board, chess.engine.Limit(depth=12), multipv=2)
            best    = info[0]
            score   = best["score"].white()
            cp      = score.score(mate_score=10000)
            win_pct = round(100 / (1 + math.exp(-cp / 400)), 1)
            pv      = [m.uci() for m in best.get("pv", [])[:5]]
            second_move = None
            second_cp   = None
            if len(info) > 1:
                second_move = info[1]["pv"][0].uci() if info[1].get("pv") else None
                second_cp   = info[1]["score"].white().score(mate_score=10000)
            return {
                "stockfish_score": cp,
                "win_pct":         win_pct,
                "pv":              pv,
                "second_move":     second_move,
                "second_cp":       second_cp,
            }
    except Exception as e:
        print(f"Stockfish error: {e}")
        return {
            "stockfish_score": 0,
            "win_pct":         50.0,
            "pv":              [],
            "second_move":     None,
            "second_cp":       None,
        }

def grade_move(cp_loss):
    if cp_loss <= 0:     return "brilliant"
    elif cp_loss <= 10:  return "good"
    elif cp_loss <= 30:  return "inaccuracy"
    elif cp_loss <= 100: return "mistake"
    else:                return "blunder"

@app.route("/reset", methods=["POST"])
def reset():
    global game, current_mode, eval_history, move_history, winpct_history
    game           = GameBoard()
    current_mode   = "balanced"
    eval_history   = []
    move_history   = []
    winpct_history = []
    return jsonify(board_state())

@app.route("/state", methods=["GET"])
def state():
    return jsonify(board_state())

@app.route("/mode", methods=["POST"])
def set_mode():
    global current_mode
    data         = request.get_json()
    current_mode = data.get("mode", "balanced")
    return jsonify({"active_mode": current_mode})

@app.route("/move", methods=["POST"])
def move():
    global current_mode, eval_history, move_history, winpct_history

    data    = request.get_json()
    from_sq = data.get("from_sq")
    to_sq   = data.get("to_sq")
    mode    = data.get("mode", current_mode)
    current_mode = mode

    # handle promotion
    uci   = from_sq + to_sq
    piece = game.board.piece_at(chess.parse_square(from_sq))
    if piece and piece.piece_type == chess.PAWN:
        rank = chess.square_rank(chess.parse_square(to_sq))
        if rank == 7 or rank == 0:
            uci += "q"

    # stockfish BEFORE human move
    sf_before = get_stockfish_analysis(game.board)
    cp_before = sf_before["stockfish_score"]

    # save FEN before move for causal analysis
    fen_before_human_move = game.get_fen()

    # validate and apply human move — check FIRST before touching history
    success = game.push_move(uci)
    if not success:
        return jsonify({"error": "Illegal move"}), 400

    # stockfish AFTER human move
    sf_after = get_stockfish_analysis(game.board)
    cp_after = sf_after["stockfish_score"]

    # now safe to update history
    move_history.append(uci)
    breakdown_after = evaluate_breakdown(game.board, mode)
    eval_history.append({
        "ply":       len(move_history),
        "move":      uci,
        "breakdown": breakdown_after,
        "total":     breakdown_after["total"],
    })
    winpct_history.append(sf_after["win_pct"])

    # cp loss and grade
    cp_loss = cp_before - cp_after
    grade   = grade_move(cp_loss)
    print(f"DEBUG cp_before={cp_before} cp_after={cp_after} cp_loss={cp_loss}")

    # check game over after human move
    game_over = game.is_game_over()
    if game_over["over"]:
        return jsonify({
            **board_state(),
            "engine_move":      None,
            "grade":            grade,
            "cp_loss":          cp_loss,
            "win_pct":          sf_after["win_pct"],
            "stockfish_score":  sf_after["stockfish_score"],
            "pv":               [],
            "second_move":      None,
            "second_cp":        None,
            "depth":            12,
            "causal_analysis":  None,
            "hinge_moves":      [],
            "winpct_history":   winpct_history,
            "engine_reasoning": None,
        })

    # engine reply
    engine_move = find_best_move(game.board, depth=4, mode=mode)
    if engine_move:
        game.push_move(engine_move)

    # stockfish AFTER engine reply
    sf_final = get_stockfish_analysis(game.board)

    # causal analysis — runs search again on the pre-move board
    board_before_copy = chess.Board(fen_before_human_move)
    best_move_uci, top3 = find_best_move(
        board_before_copy,
        depth=3,
        mode=mode,
        return_candidates=True,
    )

    causal = get_causal_analysis(
        board_before    = board_before_copy,
        played_move     = uci,
        best_move       = best_move_uci,
        top3_candidates = top3,
        sf_before       = sf_before,
        sf_after        = sf_after,
        eval_history    = eval_history,
        move_history    = move_history,
        mode            = mode,
    )

    return jsonify({
        **board_state(),
        "engine_move":        engine_move,
        "grade":              grade,
        "cp_loss":            cp_loss,
        "win_pct":            sf_final["win_pct"],
        "stockfish_score":    sf_final["stockfish_score"],
        "pv":                 sf_final["pv"],
        "second_move":        sf_final["second_move"],
        "second_cp":          sf_final["second_cp"],
        "depth":              12,
        "causal_analysis":    causal,
        "hinge_moves":        [],
        "winpct_history":     winpct_history,
        "engine_reasoning":   causal["explanation"],
        "council":            [],
        "council_confidence": 75,
        "verdict":            None,
    })

@app.route("/summary", methods=["POST"])
def summary():
    global eval_history, move_history, winpct_history, current_mode

    if len(winpct_history) < 2:
        return jsonify({
            "summary":        "Game too short to analyze.",
            "dag":            {"nodes": [], "edges": [], "backdoor_paths": []},
            "backdoor_paths": [],
            "hinge_move":     None,
            "hinge_idx":      None,
        })

    from engine.causal import build_causal_dag, real_backdoor_analysis

    # find hinge move — biggest win% swing
    swings    = [abs(winpct_history[i+1] - winpct_history[i])
                 for i in range(len(winpct_history)-1)]
    hinge_idx  = swings.index(max(swings))
    hinge_move = move_history[hinge_idx] if hinge_idx < len(move_history) else "unknown"

    # build causal DAG
    dag = build_causal_dag(eval_history, move_history)

    # run real backdoor analysis — this takes 10-15 seconds
    print("Running backdoor analysis...")
    backdoor_paths = real_backdoor_analysis(move_history, eval_history, current_mode)
    print(f"Found {len(backdoor_paths)} backdoor paths")

    # merge backdoor paths into DAG
    dag["backdoor_paths"] = backdoor_paths

    # format for prompt
    root       = dag.get("root_cause")
    root_text  = (
        f"The root cause was move {root['move']} on ply {root['ply']} "
        f"(eval delta: {root['delta']}cp)"
        if root else ""
    )

    backdoor_text = ""
    if backdoor_paths:
        backdoor_text = "Hidden causal paths found:\n" + "\n".join([
            f"- {p['description']}" for p in backdoor_paths
        ])

    prompt = f"""You are a chess coach giving a post-game summary.

The game lasted {len(move_history)} moves.
The most decisive moment was move {hinge_idx + 1} ({hinge_move}) where win probability swung {round(max(swings))}%.

{root_text}

{backdoor_text}

Write exactly 3 sentences:
1. What was the turning point and what caused it — be specific about the move and what it created or destroyed
2. If there was a hidden mistake that looked fine at the time but caused damage later, name it and explain how the damage propagated forward
3. One concrete thing to practice before the next game

Be direct, warm, and specific. Plain English only, no jargon."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}]
        )
        summary_text = message.content[0].text.strip()
    except Exception as e:
        print(f"Summary Claude error: {e}")
        summary_text = (
            f"The game turned at move {hinge_idx + 1} ({hinge_move}). "
            f"{'A hidden mistake was found earlier in the game.' if backdoor_paths else ''} "
            f"Focus on developing pieces before launching attacks."
        )

    return jsonify({
        "summary":        summary_text,
        "dag":            dag,
        "hinge_move":     hinge_move,
        "hinge_idx":      hinge_idx,
        "backdoor_paths": backdoor_paths,
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
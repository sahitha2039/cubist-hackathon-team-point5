import os
import chess
from engine.eval import evaluate_breakdown
import anthropic

client = anthropic.Anthropic("ANTHROPIC_API_KEY")


def but_for_test(
        eval_history: list,
        suspect_ply: int,
        threshold: float = 40.0,
) -> dict:
    if suspect_ply >= len(eval_history):
        return {"is_causal": False}

    suspect_entry       = eval_history[suspect_ply]
    current_total       = eval_history[-1]["total"]
    total_at_entry      = suspect_entry["total"]
    counterfactual_eval = total_at_entry
    actual_eval         = current_total
    causal_effect       = counterfactual_eval - actual_eval

    return {
        "is_causal":           causal_effect > threshold,
        "suspect_ply":         suspect_ply,
        "suspect_move":        suspect_entry["move"],
        "counterfactual_eval": round(counterfactual_eval, 2),
        "actual_eval":         round(actual_eval, 2),
        "causal_effect":       round(causal_effect, 2),
        "verdict":             "causal" if causal_effect > threshold else "not_causal",
    }


def find_root_cause(eval_history: list, threshold: float = 40.0) -> dict | None:
    if len(eval_history) < 3:
        return None

    current_total = eval_history[-1]["total"]

    for i, entry in enumerate(eval_history[:-1]):
        future_totals = [e["total"] for e in eval_history[i + 1:]]
        if not future_totals:
            continue
        # only flag moves that caused a drop — not gains
        if entry["total"] > 0 and max(future_totals) < entry["total"] - threshold:
            result = but_for_test(eval_history, i, threshold)
            if result["is_causal"]:
                return {
                    "ply":                entry["ply"],
                    "move":               entry["move"],
                    "eval_at_that_point": round(entry["total"], 2),
                    "eval_now":           round(current_total, 2),
                    "total_drop":         round(entry["total"] - current_total, 2),
                    "never_recovered":    True,
                    "but_for_test":       result,
                    "pearl_level":        3,
                    "description": (
                        f"But for {entry['move']} on ply {entry['ply']}, "
                        f"the position would be approximately "
                        f"{round(entry['total'] - current_total)}cp better. "
                        f"This move is causally responsible for the current deficit."
                    ),
                }
    return None


def structural_diff(breakdown_played: dict, breakdown_best: dict) -> dict:
    diffs = {}
    for term in breakdown_played:
        if term == "total":
            continue
        played_val = breakdown_played.get(term, 0)
        best_val   = breakdown_best.get(term, 0)
        delta      = best_val - played_val
        if abs(delta) > 2:
            diffs[term] = {
                "played":  round(played_val, 2),
                "best":    round(best_val, 2),
                "delta":   round(delta, 2),
                "verdict": "better_with_best" if delta > 0 else "worse_with_best",
            }
    return diffs


def _biggest_term_change(before: dict, after: dict) -> tuple[str, float]:
    biggest_term  = "material"
    biggest_delta = 0.0
    for term in before:
        if term == "total":
            continue
        delta = abs(after.get(term, 0) - before.get(term, 0))
        if delta > biggest_delta:
            biggest_delta = delta
            biggest_term  = term
    return biggest_term, round(biggest_delta, 2)


def _format_breakdown(breakdown: dict) -> str:
    lines = []
    for term, value in breakdown.items():
        if term == "total":
            continue
        bar = "+" if value >= 0 else ""
        lines.append(f"  {term:20s}: {bar}{value}")
    lines.append(f"  {'TOTAL':20s}: {breakdown['total']}")
    return "\n".join(lines)


def _grade(cp_loss: float) -> str:
    if cp_loss <= 0:      return "brilliant"
    elif cp_loss <= 10:   return "good"
    elif cp_loss <= 30:   return "inaccuracy"
    elif cp_loss <= 100:  return "mistake"
    else:                 return "blunder"


def get_causal_analysis(
        board_before,
        played_move:     str,
        best_move:       str,
        top3_candidates: list,
        sf_before:       dict,
        sf_after:        dict,
        eval_history:    list,
        move_history:    list,
        mode:            str = "balanced",
) -> dict:

    cp_loss = sf_before["stockfish_score"] - sf_after["stockfish_score"]

    base = {
        "pearl_levels_applied": [1, 2, 3],
        "played_move":          played_move,
        "best_move":            best_move,
        "cp_loss":              round(cp_loss, 1),
        "grade":                _grade(cp_loss),
        "explanation":          None,
        "root_cause":           None,
        "intervention_diff":    None,
        "term_changed":         None,
        "candidates":           top3_candidates,
    }

    # level 1 — eval breakdown
    breakdown_before = evaluate_breakdown(board_before, mode)

    # level 2 — intervention comparison
    board_after_played = board_before.copy()
    board_after_played.push(chess.Move.from_uci(played_move))
    breakdown_played = evaluate_breakdown(board_after_played, mode)

    board_after_best = board_before.copy()
    try:
        board_after_best.push(chess.Move.from_uci(best_move))
        breakdown_best = evaluate_breakdown(board_after_best, mode)
    except Exception:
        breakdown_best = breakdown_before

    diff = structural_diff(breakdown_played, breakdown_best)
    base["intervention_diff"] = diff

    biggest_term, biggest_delta = _biggest_term_change(breakdown_before, breakdown_played)
    base["term_changed"] = {"term": biggest_term, "delta": biggest_delta}

    # level 3 — root cause
    root_cause = find_root_cause(eval_history)
    base["root_cause"] = root_cause

    # good moves — short message, no API call
    if played_move == best_move or cp_loss <= 0:
        base["explanation"] = (
            "Good move — that's exactly what the engine would have played. "
            "You're reading the position well."
        )
        return base

    # build root cause context
    root_cause_text = (
        f"Earlier in the game, the move {root_cause['move']} on move "
        f"{root_cause['ply']} started a problem that still affects the position now."
        if root_cause else ""
    )

    prompt = f"""You are a chess coach helping a beginner improve.

The player just played {played_move}. The better move was {best_move}. This cost them {round(cp_loss)} centipawns.

{root_cause_text}

Write 3 short sentences coaching them:
1. What was okay or not okay about {played_move} — be specific about which pieces or squares were affected
2. If they had played {best_move} instead, what would be better right now — imagine the position and describe it
3. One simple thing to remember next time

Keep it friendly, simple, and direct. Talk to them like a patient coach sitting next to them. No numbers, no technical terms, just plain chess language."""

    try:
        print(f"DEBUG calling Claude for move {played_move}, cp_loss={cp_loss}")
        message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        explanation = message.content[0].text.strip()
        print(f"DEBUG Claude response: {explanation}")
    except Exception as e:
        print(f"API error: {e}")
        explanation = (
            f"You played {played_move} which wasn't the strongest choice here. "
            f"The engine preferred {best_move} which would have given you a better position. "
            f"Next time, look for moves that improve your least active piece."
        )

    base["explanation"] = explanation
    return base


def build_causal_dag(eval_history: list, move_history: list, threshold: float = 30.0) -> dict:
    if len(eval_history) < 3:
        return {"nodes": [], "edges": [], "backdoor_paths": []}

    significant = []
    for i in range(len(eval_history)):
        entry = eval_history[i]
        if i == 0:
            significant.append(i)
            continue
        delta = abs(entry["total"] - eval_history[i-1]["total"])
        if delta > threshold:
            significant.append(i)

    if 0 not in significant:
        significant.insert(0, 0)
    if len(eval_history) - 1 not in significant:
        significant.append(len(eval_history) - 1)

    nodes = []
    for idx in significant:
        entry = eval_history[idx]
        move = move_history[idx - 1] if idx > 0 and idx - 1 < len(move_history) else "start"
        delta = 0
        if idx > 0:
            delta = entry["total"] - eval_history[idx-1]["total"]
        nodes.append({
            "id":    idx,
            "move":  move,
            "ply":   entry["ply"],
            "eval":  entry["total"],
            "delta": round(delta, 1),
            "type":  "loss" if delta < -threshold else "gain" if delta > threshold else "neutral",
        })

    edges = []
    backdoor_paths = []

    for i in range(len(significant)):
        for j in range(i + 1, len(significant)):
            idx_a = significant[i]
            idx_b = significant[j]



            eval_at_b      = eval_history[idx_b]["total"]
            eval_before_a  = eval_history[idx_a - 1]["total"] if idx_a > 0 else eval_history[0]["total"]
            eval_after_a   = eval_history[idx_a]["total"]
            direct_delta_a = eval_after_a - eval_before_a
            causal_effect  = eval_before_a - eval_at_b

            if causal_effect > threshold:
                edges.append({
                    "from":          idx_a,
                    "to":            idx_b,
                    "causal_effect": round(causal_effect, 1),
                    "type":          "causal",
                })

                if abs(direct_delta_a) < threshold * 0.5 and causal_effect > threshold * 1.5:
                    backdoor_paths.append({
                        "cause_ply":     eval_history[idx_a]["ply"],
                        "cause_move":    move_history[idx_a - 1] if idx_a - 1 < len(move_history) else "?",
                        "effect_ply":    eval_history[idx_b]["ply"],
                        "effect_move":   move_history[idx_b - 1] if idx_b - 1 < len(move_history) else "?",
                        "direct_delta":  round(direct_delta_a, 1),
                        "hidden_damage": round(causal_effect, 1),
                        "description": (
                            f"Move {move_history[idx_a-1] if idx_a-1 < len(move_history) else '?'} "
                            f"looked fine at the time (only {round(abs(direct_delta_a), 1)}cp change) "
                            f"but caused {round(causal_effect, 1)}cp of hidden damage "
                            f"that surfaced at move {eval_history[idx_b]['ply']}. "
                            f"This is a backdoor causal path."
                        ),
                    })

    # root cause is the first significant LOSS node, not a gain
    root_cause_node = None
    for node in nodes[1:]:
        if node["type"] == "loss":
            root_cause_node = node
            break

    return {
        "nodes":       nodes,
        "edges":       edges,
        "backdoor_paths": backdoor_paths,
        "root_cause":  root_cause_node,
    }


def real_backdoor_analysis(move_history: list, eval_history: list, mode: str) -> list:
    if len(move_history) < 4:
        return []

    from engine.search import find_best_move
    from engine.eval import evaluate

    backdoor_paths = []

    candidates = []
    for i in range(1, len(eval_history) - 2):
        direct_delta = abs(eval_history[i]["total"] - eval_history[i-1]["total"])
        if direct_delta < 25:
            candidates.append((i, direct_delta))

    candidates.sort(key=lambda x: x[1])
    candidates = candidates[:3]

    for i, direct_delta in candidates:
        replay_board = chess.Board()
        for m in move_history[:i]:
            try:
                replay_board.push(chess.Move.from_uci(m))
            except Exception:
                break

        best_alt = find_best_move(replay_board, depth=3, mode=mode)
        if not best_alt or best_alt == move_history[i]:
            continue

        alt_board = replay_board.copy()
        try:
            alt_board.push(chess.Move.from_uci(best_alt))
        except Exception:
            continue

        for m in move_history[i+1:]:
            try:
                move = chess.Move.from_uci(m)
                if move in alt_board.legal_moves:
                    alt_board.push(move)
            except Exception:
                break

        actual_final         = eval_history[-1]["total"]
        counterfactual_final = evaluate(alt_board, mode)
        hidden_damage        = counterfactual_final - actual_final

        if hidden_damage > 50:
            backdoor_paths.append({
                "cause_ply":           eval_history[i]["ply"],
                "cause_move":          move_history[i],
                "best_alternative":    best_alt,
                "direct_delta":        round(direct_delta, 1),
                "hidden_damage":       round(hidden_damage, 1),
                "counterfactual_eval": round(counterfactual_final, 1),
                "actual_eval":         round(actual_final, 1),
                "description": (
                    f"Move {move_history[i]} on ply {eval_history[i]['ply']} "
                    f"looked harmless at the time ({round(direct_delta, 1)}cp change). "
                    f"But if you had played {best_alt} instead, "
                    f"the final position would be {round(hidden_damage, 1)}cp better. "
                    f"The damage was hidden — this is a backdoor causal path."
                ),
            })

    return backdoor_paths
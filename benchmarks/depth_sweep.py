import csv
import sys
import time
from pathlib import Path

# Ensure the project root is on sys.path when the script is run directly
sys.path.insert(0, str(Path(__file__).parent.parent))

import chess
import engine.search as _search_mod
from engine.search import find_best_move

POSITIONS = [
    ("Start",        chess.STARTING_FEN),
    ("Italian Game", "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"),
    ("KP Endgame",   "8/8/4k3/8/3K4/8/4P3/8 w - - 0 1"),
]
DEPTHS = [1, 2, 3, 4]
MODES  = ["balanced", "kasparov", "karpov", "carlsen", "kramnik"]

OUTPUT_CSV = "benchmarks/depth_sweep_results.csv"


def _run_sweep():
    results = []
    total = len(POSITIONS) * len(DEPTHS) * len(MODES)
    done = 0
    for label, fen in POSITIONS:
        for depth in DEPTHS:
            for mode in MODES:
                board = chess.Board(fen)
                t0 = time.perf_counter()
                move = find_best_move(board, depth=depth, mode=mode)
                elapsed = time.perf_counter() - t0
                nodes = _search_mod._node_count
                results.append({
                    "position": label,
                    "depth":    depth,
                    "mode":     mode,
                    "move":     move,
                    "time_s":   round(elapsed, 6),
                    "nodes":    nodes,
                })
                done += 1
                print(f"  [{done:>3}/{total}] {label:12s} d={depth} {mode:14s} "
                      f"move={move} nodes={nodes:>7} t={elapsed:.4f}s")
    return results


def _print_branching_table(results):
    print("\n--- Effective Branching Factor (nodes[d] / nodes[d-1]) ---")
    header = f"{'Position':<14} {'Mode':<14}" + "".join(f"  d{d}/d{d-1}" for d in DEPTHS[1:])
    print(header)
    print("-" * len(header))

    # Index results by (position, depth, mode) → nodes, averaged over runs
    index = {}
    for r in results:
        index[(r["position"], r["depth"], r["mode"])] = r["nodes"]

    for label, _ in POSITIONS:
        for mode in MODES:
            row = f"{label:<14} {mode:<14}"
            for depth in DEPTHS[1:]:
                prev = index.get((label, depth - 1, mode), 0)
                curr = index.get((label, depth,     mode), 0)
                bf = (curr / prev) if prev > 0 else float("nan")
                row += f"  {bf:>7.1f}"
            print(row)


def _save_csv(results):
    fields = ["position", "depth", "mode", "move", "time_s", "nodes"]
    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(results)
    print(f"\nResults saved to {OUTPUT_CSV}")


if __name__ == "__main__":
    print("=== Depth Sweep Benchmark ===\n")
    results = _run_sweep()
    _print_branching_table(results)
    _save_csv(results)

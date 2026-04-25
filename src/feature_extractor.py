"""
feature_extractor.py  —  Batch feature extraction for all Grandmasters.

Wraps extract_features.py (the per-PGN, per-color engine) and runs it over
every PGN file in a directory, writing one CSV per GM to an output directory.

Usage
-----
    python src/feature_extractor.py \
        --pgn-dir  data/ \
        --out-dir  data/features/ \
        [--color   white]          # default: white
        [--year-min 1970]
        [--year-max 2024]
        [--workers 4]              # parallel jobs (default: 4)

The GM name is inferred from the PGN filename stem (e.g. "Carlsen.pgn" → "Carlsen").
Output files are named  <GM>_<color>.csv  (e.g. Carlsen_white.csv).

ASSUMPTIONS
-----------
See extract_features.py for the full 10-point ASSUMPTIONS block.  This script
adds one convention:
  - The PGN filename stem is used verbatim as the name_substring filter, so
    "Carlsen.pgn" will match any header containing "Carlsen" (case-sensitive).
  - If you supply --color both, the script runs white then black for each PGN
    and writes two CSVs.

DEPENDENCIES
------------
    pip install python-chess
"""
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import os
import subprocess
import sys
import time
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _run_one(
    pgn_path: Path,
    name_substring: str,
    color: str,
    out_dir: Path,
    year_min: int | None,
    year_max: int | None,
    script_path: Path,
) -> dict:
    """Run extract_features.py for a single (PGN, name, color) triple.

    Returns a summary dict with keys: gm, color, rows, elapsed_s, log.
    """
    out_csv = out_dir / f"{name_substring}_{color}.csv"
    log_file = out_dir / f"{name_substring}_{color}.log"

    cmd = [
        sys.executable, str(script_path),
        str(pgn_path), name_substring, color,
    ]
    if year_min is not None:
        cmd += ["--year-min", str(year_min)]
    if year_max is not None:
        cmd += ["--year-max", str(year_max)]

    t0 = time.perf_counter()
    with out_csv.open("w", encoding="utf-8") as out_fh, \
         log_file.open("w", encoding="utf-8") as err_fh:
        result = subprocess.run(cmd, stdout=out_fh, stderr=err_fh, check=False)

    elapsed = time.perf_counter() - t0

    # Count data rows (excluding header)
    row_count = 0
    if out_csv.exists() and out_csv.stat().st_size > 0:
        with out_csv.open(encoding="utf-8") as f:
            row_count = sum(1 for _ in csv.reader(f)) - 1  # minus header

    log_tail = ""
    if log_file.exists():
        lines = log_file.read_text(encoding="utf-8").strip().splitlines()
        log_tail = " | ".join(lines[-3:]) if lines else ""

    return {
        "gm": name_substring,
        "color": color,
        "csv": str(out_csv),
        "rows": row_count,
        "returncode": result.returncode,
        "elapsed_s": round(elapsed, 1),
        "log": log_tail,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Batch feature extraction for all Grandmasters.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    ap.add_argument(
        "--pgn-dir", type=Path, default=Path("data"),
        help="Directory containing *.pgn files (default: data/)",
    )
    ap.add_argument(
        "--out-dir", type=Path, default=Path("data/features"),
        help="Output directory for CSV files (default: data/features/)",
    )
    ap.add_argument(
        "--color", choices=["white", "black", "both"], default="white",
        help="Which side to extract (default: white)",
    )
    ap.add_argument("--year-min", type=int, default=None)
    ap.add_argument("--year-max", type=int, default=None)
    ap.add_argument(
        "--workers", type=int, default=4,
        help="Parallel extraction jobs (default: 4)",
    )
    ap.add_argument(
        "--script", type=Path,
        default=Path(__file__).parent / "extract_features.py",
        help="Path to extract_features.py (default: same directory as this script)",
    )
    args = ap.parse_args()

    # Discover PGN files
    pgn_files = sorted(args.pgn_dir.glob("*.pgn"))
    if not pgn_files:
        print(f"ERROR: no *.pgn files found in {args.pgn_dir}", file=sys.stderr)
        return 1

    args.out_dir.mkdir(parents=True, exist_ok=True)

    colors = ["white", "black"] if args.color == "both" else [args.color]

    jobs = [
        (pgn, pgn.stem, color)
        for pgn in pgn_files
        for color in colors
    ]

    print(f"Extracting features for {len(jobs)} job(s) using {args.workers} worker(s)…")
    print(f"  PGN dir : {args.pgn_dir.resolve()}")
    print(f"  Out dir : {args.out_dir.resolve()}")
    print(f"  Script  : {args.script.resolve()}")
    print()

    summaries = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(
                _run_one,
                pgn, name, color,
                args.out_dir,
                args.year_min, args.year_max,
                args.script,
            ): (name, color)
            for pgn, name, color in jobs
        }
        for fut in concurrent.futures.as_completed(futures):
            name, color = futures[fut]
            try:
                summary = fut.result()
                summaries.append(summary)
                status = "OK" if summary["returncode"] == 0 else f"ERR(rc={summary['returncode']})"
                print(
                    f"  [{status}] {summary['gm']:12s} {summary['color']:5s} "
                    f"→ {summary['rows']:5d} rows  ({summary['elapsed_s']:.1f}s)"
                )
                if summary["log"]:
                    print(f"           {summary['log']}")
            except Exception as exc:
                print(f"  [FAIL] {name} {color}: {exc}", file=sys.stderr)

    # Summary table
    print()
    print("─" * 60)
    total_rows = sum(s["rows"] for s in summaries)
    errors = [s for s in summaries if s["returncode"] != 0]
    print(f"Total games extracted : {total_rows:,}")
    print(f"Errors                : {len(errors)}")
    if errors:
        for e in errors:
            print(f"  {e['gm']} {e['color']}: rc={e['returncode']}, log={e['log']}")
    print()
    print("CSVs written to:", args.out_dir.resolve())
    print()
    print("Next step — run the validation notebook:")
    print("  jupyter notebook notebooks/pipeline_validation.ipynb")
    print("  (or)  jupyter nbconvert --to notebook --execute notebooks/pipeline_validation.ipynb")

    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())

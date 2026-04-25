# Grandmaster Chess Engine

A Grandmaster-mimicking chess engine built on Stockfish. The engine's evaluation function is reweighted per GM persona using multipliers derived from a **rigorous, multi-agent AI research pipeline** — not intuition or hand-tuning.

---

## Grandmaster Personas

| Style | Grandmaster | Engine Signature |
|---|---|---|
| The Complete Strategist | Anatoly Karpov | Universally balanced — no extreme stylistic signature; the neutral reference point |
| The Activist | Garry Kasparov | High Piece Activity (1.3×) and Mobility (1.15×); shorter decisive games |
| The Iron Fortress | Tigran Petrosian | Suppressed King Attack (0.7×); elevated Pawn Structure (1.15×); positional grinding |
| The Pragmatist | Magnus Carlsen | Elevated King Attack (1.15×) and King Activity (1.15×); endgame precision |

Weights are derived from **7,798 real games** (White only) using leave-one-out peer benchmarking and Cohen's d effect sizes mapped through a deterministic threshold table.

---

## Repository Layout

```
research/
  01_EDA_AI_Exploration.ipynb     ← Process record: AI-assisted EDA methodology
  02_GM_Pipeline_Master.ipynb     ← Executable pipeline: PGN → engine weights

src/
  extract_features.py             ← Per-game feature extractor (python-chess)
  feature_extractor.py            ← Batch runner (parallel, subprocess-based)

data/
  Carlsen.pgn                     ← 3,780 White games
  Karpov.pgn                      ← 1,867 White games
  Kasparov.pgn                    ← 1,205 White games
  Petrosian.pgn                   ←   946 White games
  features/
    Carlsen_white.csv             ← 28-column feature CSVs (auto-generated)
    Karpov_white.csv
    Kasparov_white.csv
    Petrosian_white.csv

engine_config.json                ← Final output: GM weights consumed by the engine

next-app/                         ← React/Next.js front-end
docs/                             ← Supporting charts and AI usage notes
```

---

## Running the Pipeline

### 1 — Extract features from PGN files (~20 seconds)

```bash
python src/feature_extractor.py \
    --pgn-dir  data/ \
    --out-dir  data/features/ \
    --color    white \
    --workers  4
```

### 2 — Derive weights and write `engine_config.json`

```bash
jupyter nbconvert --to notebook --execute \
    research/02_GM_Pipeline_Master.ipynb --inplace
```

Or open the notebook interactively — all nine cells run cleanly top-to-bottom.

The pipeline is **fully deterministic**: same PGNs → same CSVs → same Cohen's d values → same weights.

---

## Methodology Overview

The weight derivation uses **Pipeline A** — the winner of a three-pipeline blind audit conducted during the EDA phase:

1. **Feature extraction** — `python-chess` board replay snapshots pawn structure at move 20, mobility across plies 20–60, king position after ply 30. Normalized rates (`capture_rate`, `check_rate`) prevent game-length confounds.

2. **Leave-one-out baseline** — Each GM is compared against the pooled stats of the other three. This avoids the color confound (within-player color comparison) and the fixed-baseline problem (Karpov + Kasparov as baseline makes their d values ≈ 0 by construction).

3. **Cohen's d → multiplier** — Effect sizes are mapped to discrete multiplier bands:

   | |d| range | Multiplier (toward feature) | Multiplier (away from feature) |
   |---|---|---|
   | < 0.30 (noise floor) | 1.0 | 1.0 |
   | 0.30 – 0.70 | 1.3 | 0.7 |
   | 0.70 – 1.20 | 1.7 | 0.5 |
   | ≥ 1.20 | 2.0 | 0.3 |

   Discretization prevents over-fitting to sampling noise. Features where *more is worse* (doubled pawns, isolated pawns, pawn islands) are sign-inverted before mapping.

See `research/01_EDA_AI_Exploration.ipynb` for the full process record — the four-session AI architecture, the two bugs the Critic caught, the color confound discovery, and the parallel audit that selected Pipeline A.

---

## Why Karpov's Weights Are All 1.0

Among these four GMs, Karpov is the most stylistically **balanced** — no feature clears the 0.30 noise floor in leave-one-out benchmarking. This accurately reflects his reputation as the most complete player of the group. His engine persona is correctly the nearest thing to a neutral reference within this peer group, not a data failure.

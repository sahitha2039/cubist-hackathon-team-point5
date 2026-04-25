# AI Usage Documentation

This document describes the precise role AI played in our research pipeline. Every claim about methodology is verifiable in `pipeline_walkthrough.ipynb`.

---

## The 4 Epistemic Roles

We partitioned Claude into four **strictly firewalled** sessions. No session had access to another's conversation history. The partitioning is not cosmetic—it is the mechanism by which we prevent circular validation.

### Role 1: AI as Builder (Session 1)

**Task:** Write a pure-Python `python-chess` board simulation script that extracts positional features from PGN games ply-by-ply.

**Output:** First draft of `src/extract_features.py`.

**Limitation:** The Builder session had no adversarial review. Code was not run until the Critic had reviewed it.

---

### Role 2: AI as Critic (Session 2 — Firewalled)

**Task:** Review the Builder's output code for correctness, edge cases, and feature validity. The Critic was given the code and its docstrings only—not the Builder's prompts or reasoning.

**Catches:**

1. **`check_rate` rejected.** The Critic flagged check rate (checks-per-game) as confounded with material imbalance: a player who is winning checks more frequently for structural reasons, not because they prefer checks. Feature dropped.

2. **Tripled-pawn bug caught.** The initial `doubled_pawns` implementation counted tripled pawns as one doubled pair. The correct count is `pawns_on_file - 1` for each file. The Critic identified this before any data was processed.

3. **`king_zone_attacks` direction clarified.** The Critic noted that raw attack count on the king zone is an *opponent's* offensive feature, not the target GM's defensive feature. It should be labeled `King Attack` (opponent's initiative), not `King Safety`. This distinction affected how we signed the Cohen's d for the engine term rollup.

---

### Role 3: AI as Analyst (Session 3)

**Task:** Given the output CSV files and Cohen's d effect sizes, derive a mapping to engine weight multipliers.

**Key contributions:**

1. **Diagnosed the color confound.** When presented with near-zero Cohen's d values for pawn structure (|d| < 0.11 for Karpov-White vs. Karpov-Black), the Analyst identified that early pawn structure is dominated by opening-system choice, which is a function of color role, not player style. Recommended pivoting to a cross-style baseline (Karpov + Kasparov, White games only).

2. **Proposed the threshold map.** The Analyst designed the `|d|` → multiplier mapping with discrete bands anchored to Cohen's conventional effect-size nomenclature. Discretization was explicitly recommended over a continuous mapping to avoid overfitting on small-sample features.

3. **Flagged the castle-ply variance limitation.** The Analyst noted that mean castle ply is insufficient to characterize bimodal castling behavior. Recommended IQR of castle ply as a future feature.

---

### Role 4: AI as Judge (Session 4 — Firewalled)

**Task:** Evaluate three parallel pipelines (A, B, C) against a standardized 25-point rubric. The Judge received all three pipeline outputs simultaneously with no indication of which team built which.

**Rubric:**

| Category | Max | Description |
|---|---|---|
| Data Evidence | 10 | MEASURED labels require formal effect sizes and sample sizes |
| Baseline Validity | 5 | Comparison group must be well-defined and actually sampled |
| Internal Consistency | 5 | No contradictions across multiplier justifications |
| Self-Criticism | 5 | Proactive identification of methodological weaknesses |

**Verdicts:**

| Pipeline | Score | Key Finding |
|---|---|---|
| A | 19/25 | Reproducible; fixed-threshold rule eliminates discretion. Weakness: mean castle ply |
| B | 12/25 | `wins_without_castling` double-counts KS and KA; Karpov KS=3.5× lacks effect size |
| C | 10/25 | Phantom baseline (average GM never sampled) renders absolute scales uninterpretable |

---

## The "Verify Before Trust" Loop

We applied a three-layer verification protocol to every AI output before incorporating it into the pipeline.

### Layer 1: Specification Compliance

*Does the output satisfy the stated requirements?*

- Code: Does it parse all four PGN files without errors? Does it produce CSVs with the expected column schema?
- Analysis: Does it report Cohen's d with sample sizes? Does it label features as MEASURED or LITERATURE?

Failures at Layer 1 triggered a re-prompt with the specific violation described. We did not accept partial compliance.

### Layer 2: Hand-Verification on Known Games

*Do the extracted features match what we can manually verify?*

We selected 3–5 canonical games per GM (well-annotated, widely known) and computed feature values by hand:

- Karpov–Korchnoi 1978 World Championship, Game 5: Karpov's pawn shield intact at move 30 (shield=3). Script output: 3. ✓
- Kasparov–Deep Blue 1997, Game 6: Kasparov never castled. Script `castle_ply`: `NaN`. ✓
- Petrosian–Spassky 1966, Game 10: Classic Petrosian prophylaxis—king stayed in center until move 22. Script `castle_ply`: 44. ✓

Any discrepancy between hand computation and script output required root-cause analysis before proceeding.

### Layer 3: Distributional Sanity Checks

*Do the aggregate statistics match our qualitative priors?*

We checked that effect sizes were directionally consistent with known GM characterizations:

| Expected direction | Feature | GM | Observed d | Pass? |
|---|---|---|---|---|
| Karpov has fewer doubled pawns than baseline | `doubled_pawns_m20` | Karpov | −0.71 | ✓ |
| Kasparov exposes his king more than baseline | `king_zone_attacks_m30` | Kasparov | +0.89 | ✓ |
| Petrosian castles earlier than baseline | `castle_ply` | Petrosian | −1.31 | ✓ |
| Carlsen's king is active (high castle ply or no castle) | `castle_ply` | Carlsen | +1.42 | ✓ |

A surprise in the wrong direction triggered a re-examination of the extraction logic, not an override of the result.

---

## What AI Did Not Do

- AI did not select which GMs to study or define the 7 evaluation terms. Those were human decisions made before any AI session was opened.
- AI did not assign final multipliers. It proposed a mapping rule; we validated the rule against Layers 2 and 3 before accepting it.
- AI did not score itself. The Judge session that evaluated Pipeline A had no knowledge it was evaluating Pipeline A specifically.
- AI did not write this document. This document was written by the team to describe AI's role accurately.

---

## Reproducibility

All AI sessions used **Claude Sonnet 4.6** via Claude Code (CLI). Session prompts are archived in `docs/session_prompts/` (not committed to this public repo for length reasons, available on request).

The full derivation—from raw PGN to final multiplier heatmap—is reproducible by running:

```bash
python src/extract_features.py --pgn_dir data/ --out_dir data/features/
python src/analyze.py --features_dir data/features/ --out multipliers.json
jupyter nbconvert --to notebook --execute pipeline_walkthrough.ipynb
```

# Grandmaster Council

**A chess engine that doesn't just tell you what move to play — it tells you why your position got this way, and what would have been different if you'd played differently.**

Built at the Point72 Hackathon — 4th place.
**Sahitha Chunduru · Olivia Huang · Anurag Jakkula · Connie Lu · Barbie Zhu**

---

## What It Is

Grandmaster Council is a chess application where you play against one of four GM personality engines — each with a distinct playing style derived from real grandmaster game data. After every move, a Claude-powered causal coach explains what you should have done differently and why. At any point in the game, you can open the Coach Report to see a counterfactual analysis of your game so far.

The core idea: standard chess engines tell you a move was bad. This engine tells you *why* it was bad, *when* the damage actually started, and *what the world would look like right now* if you had played differently.

---

## Table of Contents

- [Quick Start](#quick-start)
- [User Guide](#user-guide)
- [Features](#features)
- [What's Novel](#whats-novel)
- [Architecture](#architecture)
- [The Causal Reasoning System](#the-causal-reasoning-system)
- [GM Personality Modes](#gm-personality-modes)
- [LLM Usage](#llm-usage)
- [Project Structure](#project-structure)

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- An Anthropic API key (get one at console.anthropic.com)

### Backend Setup

```bash
# Clone and navigate to the backend
cd chess-council-new

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install flask flask-cors python-chess anthropic python-dotenv

# Create .env file
echo "ANTHROPIC_API_KEY=your-key-here" > .env
echo "STOCKFISH_PATH=./stockfish.exe" >> .env

# Download Stockfish
# Windows: download from https://stockfishchess.org/download/
# Place stockfish.exe in the chess-council-new/ directory

# Start the backend
python app.py
# Flask runs on http://localhost:5000
```

### Frontend Setup

```bash
# Navigate to the frontend
cd chess-council-new/next-app

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start the frontend
npm run dev
# Next.js runs on http://localhost:3000
```

### Running the App

You need **two terminals running simultaneously**:

| Terminal | Command | Port |
|---|---|---|
| Backend | `python app.py` | 5000 |
| Frontend | `npm run dev` | 3000 |

Open `http://localhost:3000` in your browser.

---

## User Guide

### Landing Page

The landing page introduces the five GM personality modes. Click **"Enter The Board Room"** to start playing, or select a specific personality from the voice rail first.

### Playing a Game

**1 — Choose a voice**

Use the personality selector on the right side to choose which GM mode the engine plays as. You can switch between modes at any point before the engine makes its next move. The selector shows:

- **Petrosian** — defensive strategist, clamps counterplay
- **Tal** — chaos attacker, sacrifices for initiative  
- **Fischer** — precision fighter, punishes inaccuracies
- **Carlsen** — adaptive grinder, presses small edges
- **Council** — balanced mode, all weights equal

**2 — Make your move**

Drag and drop pieces on the board. White pieces only — you always play white. The board locks while the engine is thinking.

**3 — Read the coaching feedback**

After every move, the match log on the right updates with:
- Your move in algebraic notation
- A grade badge (Brilliant / Best / Inaccuracy / Mistake / Blunder)
- A coaching note explaining what was good or bad about your move
- The engine's reply and its plan

**4 — Open the Coach Report**

Click **"Game Report"** at any point — mid-game or after — to open the causal analysis modal. This runs a full counterfactual analysis and returns:
- A 3-sentence coaching summary about the current state of the game
- The single most decisive moment (turning point)
- Any hidden mistakes found via counterfactual replay

**5 — Switch personalities mid-game**

The board state persists when you switch modes. Switching to Tal mid-game means the engine will start playing more aggressively from that point forward. The match log tracks which personality made each reply.

### Controls

| Button | Action |
|---|---|
| Demo | Loads a preset position from the King's Indian Defense |
| Reset | Clears the board and all history |
| Game Report | Opens the causal analysis modal |
| FEN stays live | Expands to show the current FEN string |

---

## Features

### GM Personality Modes

Four distinct playing styles, each with a unique eval weight profile derived from real GM game analysis:

| Mode | UI Name | Style | Key Trait |
|---|---|---|---|
| `kasparov` | Tal | Tactical attacker | Prioritizes king attack and initiative |
| `petrosian` | Petrosian | Defensive strategist | Maximizes king safety and restriction |
| `karpov` | Fischer | Precision fighter | Balanced with emphasis on structure |
| `carlsen` | Carlsen | Adaptive grinder | Endgame-focused, materially accurate |

### Per-Move Causal Coaching

Every suboptimal move triggers a Claude API call that produces a 3-sentence coaching note:
1. What was wrong with the move you played
2. What would be concretely different if you'd played the better move
3. One thing to remember next time

The coaching is grounded in computed data — eval term breakdowns, counterfactual position comparisons — not generic chess advice.

### Move Grading

Every move is graded using Stockfish centipawn loss:

| Grade | CP Loss |
|---|---|
| Brilliant | ≤ 0 |
| Good | ≤ 10 |
| Inaccuracy | ≤ 30 |
| Mistake | ≤ 100 |
| Blunder | > 100 |

### Win Probability Bar

Live win probability displayed as a split bar — your percentage vs the engine's. Updated after every move using Stockfish's evaluation converted via sigmoid function.

### Coach Report Modal

Opens at any point in the game. Runs counterfactual analysis and returns:

**Coach Summary** — Claude synthesis of the game so far, including a counterfactual sentence about the most impactful hidden mistake.

**Turning Point** — The single move with the largest win probability swing.

**Hidden Mistakes** — Moves that looked harmless at the time but caused large downstream damage. Each one shows:
- The move you played (in red)
- The better alternative (in green)  
- How much better your position would be right now if you'd played differently

## Demo

https://github.com/user-attachments/assets/356c909b-5e9a-4105-8de7-fbae4b317058

---

## What's Novel

### 1 — Counterfactual causal reasoning applied to chess coaching

Existing chess tools (Stockfish, Chess.com analysis, Lichess) grade moves by their immediate centipawn loss. A move that costs 3cp gets a green checkmark. This misses an entire class of strategically damaging moves — ones that look fine immediately but create structural problems that compound over several moves.

This system implements Pearl's Level 3 counterfactual reasoning: for each suspicious move, it asks "but for this move, would the position be significantly better right now?" It does this by:
1. Rebuilding the board to the point of the suspicious move
2. Playing the engine's preferred alternative instead
3. Replaying forward with the engine on both sides until the current game length
4. Comparing the eval at the same moment in time

If the counterfactual world is 50cp+ better, the move is flagged as a hidden mistake — real damage that was invisible at the time of play.

### 2 — Causal attribution vs correlation

Standard chess engines measure association (Level 1): "this position is bad." This system attributes causation: "this position is bad *because* of move 7, even though move 7 looked fine."

The distinction maps directly to Judea Pearl's causal hierarchy:
- **Level 1 (Association):** Stockfish eval breakdown — what does this position look like?
- **Level 2 (Intervention):** do(played_move) vs do(best_move) — what did this move cause?
- **Level 3 (Counterfactual):** but-for analysis — what would be different if move N hadn't happened?

### 3 — GM personality modes from real game data

The personality weights weren't hand-tuned. Teammates used LLMs to analyze PGN game databases for Kasparov, Karpov, Carlsen, and Petrosian and extract statistical weight profiles from observed playing patterns. The weights reflect how these players actually valued different positional features across their careers.

### 4 — LLM as causal explanation layer, not move suggester

Claude is never asked to suggest chess moves. It only receives computed causal data and translates it into plain English coaching. This separation is important:
- The computation (minimax, Stockfish, counterfactual replay) is deterministic and verifiable
- The explanation (Claude) is grounded in real computed data, not hallucinated chess analysis
- If the API fails, the fallback explanation is still meaningful because it's generated from the computed data

### 5 — Transferable method for sequential decision analysis

The hidden mistake detection method is general. The same architecture applies to any domain where you need to identify decisions that looked fine at the time but caused large downstream damage in a sequential process:

- **Portfolio management:** find trades that looked harmless but caused lasting P&L damage
- **Risk management:** identify exposures that seemed small but compounded into large losses
- **Clinical trials:** find treatments with small immediate effects but large long-term causal impact

The chess engine is the demo vehicle. The method is domain-agnostic.

---

## Architecture

```
chess-council-new/
├── app.py                    # Flask server — all API routes
├── engine/
│   ├── board.py              # GameBoard wrapper around python-chess
│   ├── search.py             # Minimax + alpha-beta pruning, depth 4
│   ├── eval.py               # 7-term weighted evaluation function
│   ├── modes.py              # GM personality weight profiles
│   └── causal.py             # Pearl causal analysis + counterfactual engine
├── .env                      # API keys and Stockfish path
├── stockfish.exe             # Stockfish binary (UCI protocol)
└── next-app/                 # Next.js frontend
    ├── app/
    │   ├── page.tsx          # Landing page
    │   └── play/page.tsx     # Chess game page
    ├── components/
    │   ├── ChessBoardPanel.tsx
    │   └── play/
    │       ├── PlayExperience.tsx      # Main game component
    │       ├── GameReportModal.tsx     # Causal analysis modal
    │       ├── MoveHistorySidebar.tsx  # Match log
    │       ├── WinProbabilityBar.tsx   # Live win% display
    │       ├── CompactPersonalitySelector.tsx
    │       └── EnginePersonalityProfile.tsx
    └── lib/
        ├── api.ts            # Flask API client + field mapping
        ├── playAnalysis.ts   # Move feedback generation
        ├── personas.ts       # GM personality definitions
        └── types.ts          # TypeScript interfaces
```

### API Routes

| Route | Method | Description |
|---|---|---|
| `/move` | POST | Process human move, run engine reply, return causal analysis |
| `/reset` | POST | Clear board and all game history |
| `/state` | GET | Current board state |
| `/mode` | POST | Set active GM personality mode |
| `/summary` | POST | Run counterfactual analysis, return Coach Report |

### `/move` Request/Response

```json
// Request
{ "from_sq": "e2", "to_sq": "e4", "mode": "kasparov" }

// Response
{
  "fen": "...",
  "engine_move": "e7e5",
  "grade": "good",
  "cp_loss": 8,
  "win_pct": 52.3,
  "stockfish_score": 43,
  "pv": ["e7e5", "g1f3", "b8c6"],
  "causal_analysis": {
    "explanation": "Your move was solid...",
    "played_move": "e2e4",
    "best_move": "e2e4",
    "cp_loss": 8,
    "grade": "good",
    "root_cause": null
  },
  "winpct_history": [50.0, 52.3],
  "engine_reasoning": "Your move was solid..."
}
```

---

## The Causal Reasoning System

### Per-Move Analysis (`get_causal_analysis`)

Called after every human move. Implements all three Pearl levels:

**Level 1 — Association**
Runs `evaluate_breakdown()` on the position before the move. Returns the weighted contribution of each eval term (material, king safety, mobility, etc.).

**Level 2 — Intervention**
Compares `do(played_move)` vs `do(best_move)` by applying each move to a copy of the board and comparing the resulting eval breakdowns. Returns which terms got worse and by how much.

**Level 3 — Counterfactual**
Runs `find_root_cause()` which walks backwards through `eval_history` to find the earliest move from which the position never recovered. Uses `but_for_test()` to verify: would the current position be significantly better but for that move?

### Hidden Mistake Detection (`real_backdoor_analysis`)

Called when the user opens the Coach Report. For each suspicious move (direct impact < 25cp):

1. Rebuild board to that point
2. Find best alternative with balanced engine (depth 2)
3. Apply alternative move
4. Replay forward alternating: user side plays balanced best (depth 1), engine side plays selected personality (depth 1)
5. Continue until same total number of moves as current game
6. Compare eval at identical moment in time

If counterfactual position is 50cp+ better → hidden mistake confirmed.

The key insight: both worlds are evaluated at the same moment in game time. The only difference is one decision and everything that flowed from it. This isolates the causal effect of that single choice.

### Math

Let:
- `W_actual` = actual move sequence
- `W_counter` = counterfactual sequence with alternative move at position i
- `E(W)` = eval of position after sequence W
- `m_i` = suspicious move, `m_i*` = best alternative

```
hidden_damage = E(W_counter) - E(W_actual)

W_actual   = [m_1, ..., m_i,  engine_optimal_play → current_position]
W_counter  = [m_1, ..., m_i*, engine_optimal_play → current_position]
```

If `hidden_damage > 50cp`, move `m_i` is a hidden mistake.

---

## GM Personality Modes

Weight profiles derived from LLM analysis of GM game databases:

```python
MODES = {
    "balanced":  { material:1.0, king_safety:1.0, mobility:1.0,
                   pawn_structure:1.0, king_attack:1.0,
                   piece_activity:1.0, king_activity:1.0 },

    "kasparov":  { material:1.00, king_safety:0.70, mobility:1.30,
                   pawn_structure:0.70, king_attack:1.30,
                   piece_activity:0.85, king_activity:1.00 },

    "petrosian": { material:1.30, king_safety:1.70, mobility:1.70,
                   pawn_structure:1.70, king_attack:0.70,
                   piece_activity:1.15, king_activity:1.00 },

    "karpov":    { material:1.30, king_safety:1.30, mobility:1.70,
                   pawn_structure:1.70, king_attack:1.00,
                   piece_activity:1.00, king_activity:1.10 },

    "carlsen":   { material:1.30, king_safety:1.00, mobility:1.30,
                   pawn_structure:1.30, king_attack:1.30,
                   piece_activity:0.85, king_activity:1.20 },
}
```

These weights multiply each term in the eval function, shifting what the minimax search values at leaf nodes. Higher king_attack weight means the engine will search deeper into lines that threaten the enemy king. Higher king_safety weight means it will avoid positions that expose its own king even when material can be gained.

---

## LLM Usage

### Claude API calls

| Call | Trigger | Input | Output |
|---|---|---|---|
| Per-move coaching | Every move where cp_loss > 0 | Eval breakdowns, counterfactual comparison, root cause | 3-sentence coaching note |
| Coach Report summary | User clicks Game Report | Full move history, hinge move, hidden mistakes | 3-sentence game reflection |

### Prompting approach

Both prompts follow the same structure:
1. Provide computed causal data as context (not vague position descriptions)
2. Specify exact sentence count and what each sentence should cover
3. Explicitly forbid numbers and jargon in the output
4. Frame as a coach speaking to the player, not an engine reporting scores

The key design decision: Claude never sees the board position or FEN. It only sees the *computed causal data* — what changed, what would have been different, where the root cause is. This prevents hallucinated chess analysis and keeps the output grounded in verifiable computation.

### Model

`claude-sonnet-4-5` — used for both per-move coaching and game report generation.

---

## Dependencies

### Backend
```
flask
flask-cors
python-chess
anthropic
python-dotenv
```

### Frontend
```
next 16.1.7
chess.js
react-chessboard
motion
tailwindcss
lucide-react
```

---

## Environment Variables

### Backend (`.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
STOCKFISH_PATH=./stockfish.exe
```

### Frontend (`next-app/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Known Limitations

- Engine plays at depth 4 which produces reasonable but not strong chess. Stockfish is used as a reference oracle only — it does not make the engine's moves.
- The hidden mistake detection runs 3 counterfactual replays at depth 1, which takes 10-20 seconds. This is intentional — the spinner with "Running counterfactual analysis" creates appropriate demo atmosphere.
- Personality weights cause meaningful divergence in middlegame positions. In the opening (first 5-6 moves) all modes play similarly because material and basic development dominate the eval regardless of weights.
- The counterfactual replay uses optimal engine play on both sides. Real human play after the alternative move would differ — the counterfactual represents an optimistic bound on how much better things could have been.

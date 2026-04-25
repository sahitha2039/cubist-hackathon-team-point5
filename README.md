# Grandmaster Chess Engine

A Grandmaster-mimicking chess engine built on Stockfish. The engine's evaluation function is reweighted per GM personality using multipliers derived from a **rigorous, multi-agent AI research pipeline**—not intuition or hand-tuning.

---

## Grandmaster Personalities

| Style | Grandmaster | Engine Signature |
|---|---|---|
| The Activist | Garry Kasparov | Aggresive initiative plays |
| The Reflector | Anatoly Karpov | Deep thinking to prevent counterplays |
| The Pragmatic | Magnus Carlsen | Maximizes winning chances by exploiting small inaccuracies |
| The Theorist | Vladamir Kramnik | Deep preparation and understanding of opening systems |

We’re taking the historical data of each GM to learn about how they play. We change the parameters of the chess engine to mirror their strategy, whether they’re more defensive, an attacker, positional, or universal

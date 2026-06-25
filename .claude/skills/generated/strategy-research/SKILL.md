---
name: strategy-research
description: "Skill for the Strategy-research area of multiAgentTrader. 4 symbols across 1 files."
---

# Strategy-research

4 symbols | 1 files | Cohesion: 86%

## When to Use

- Working with code in `agents/`
- Understanding how do_GET, do_POST, read_json work
- Modifying strategy-research-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `agents/strategy-research/server.py` | do_GET, do_POST, read_json, write_json |

## Entry Points

Start here when exploring this area:

- **`do_GET`** (Function) — `agents/strategy-research/server.py:22`
- **`do_POST`** (Function) — `agents/strategy-research/server.py:36`
- **`read_json`** (Function) — `agents/strategy-research/server.py:55`
- **`write_json`** (Function) — `agents/strategy-research/server.py:65`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `do_GET` | Function | `agents/strategy-research/server.py` | 22 |
| `do_POST` | Function | `agents/strategy-research/server.py` | 36 |
| `read_json` | Function | `agents/strategy-research/server.py` | 55 |
| `write_json` | Function | `agents/strategy-research/server.py` | 65 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Do_POST → BacktestConfig` | cross_community | 6 |
| `Do_POST → Normalize_asset` | cross_community | 6 |
| `Do_POST → Equity_from_returns` | cross_community | 6 |
| `Do_POST → Max_drawdown_pct` | cross_community | 6 |
| `Do_POST → As_float` | cross_community | 6 |
| `Do_POST → As_int` | cross_community | 6 |
| `Do_POST → Normalize_strategies` | cross_community | 4 |
| `Do_POST → Extract_nested` | cross_community | 3 |
| `Do_POST → Summarize` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tests | 1 calls |

## How to Explore

1. `gitnexus_context({name: "do_GET"})` — see callers and callees
2. `gitnexus_query({query: "strategy-research"})` — find related execution flows
3. Read key files listed above for implementation details

---
name: market-data
description: "Skill for the Market-data area of multiAgentTrader. 4 symbols across 1 files."
---

# Market-data

4 symbols | 1 files | Cohesion: 86%

## When to Use

- Working with code in `agents/`
- Understanding how do_GET, do_POST, read_json work
- Modifying market-data-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `agents/market-data/server.py` | do_GET, do_POST, read_json, write_json |

## Entry Points

Start here when exploring this area:

- **`do_GET`** (Function) — `agents/market-data/server.py:22`
- **`do_POST`** (Function) — `agents/market-data/server.py:36`
- **`read_json`** (Function) — `agents/market-data/server.py:74`
- **`write_json`** (Function) — `agents/market-data/server.py:84`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `do_GET` | Function | `agents/market-data/server.py` | 22 |
| `do_POST` | Function | `agents/market-data/server.py` | 36 |
| `read_json` | Function | `agents/market-data/server.py` | 74 |
| `write_json` | Function | `agents/market-data/server.py` | 84 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Do_POST → Require_forex_pair` | cross_community | 4 |
| `Do_POST → Candle` | cross_community | 4 |
| `Do_POST → Normalize_asset` | cross_community | 4 |
| `Do_POST → Mean` | cross_community | 4 |
| `Do_POST → Serialize_candle` | cross_community | 4 |
| `Do_POST → Volatility_level` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Agents | 1 calls |

## How to Explore

1. `gitnexus_context({name: "do_GET"})` — see callers and callees
2. `gitnexus_query({query: "market-data"})` — find related execution flows
3. Read key files listed above for implementation details

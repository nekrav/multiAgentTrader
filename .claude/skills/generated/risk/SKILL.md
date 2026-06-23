---
name: risk
description: "Skill for the Risk area of multiAgentTrader. 4 symbols across 1 files."
---

# Risk

4 symbols | 1 files | Cohesion: 75%

## When to Use

- Working with code in `agents/`
- Understanding how do_GET, do_POST, read_json work
- Modifying risk-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `agents/risk/server.py` | do_GET, do_POST, read_json, write_json |

## Entry Points

Start here when exploring this area:

- **`do_GET`** (Function) — `agents/risk/server.py:22`
- **`do_POST`** (Function) — `agents/risk/server.py:36`
- **`read_json`** (Function) — `agents/risk/server.py:53`
- **`write_json`** (Function) — `agents/risk/server.py:63`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `do_GET` | Function | `agents/risk/server.py` | 22 |
| `do_POST` | Function | `agents/risk/server.py` | 36 |
| `read_json` | Function | `agents/risk/server.py` | 53 |
| `write_json` | Function | `agents/risk/server.py` | 63 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Do_POST → RiskThresholds` | cross_community | 3 |
| `Do_POST → Normalize_snapshot` | cross_community | 3 |
| `Do_POST → As_float` | cross_community | 3 |
| `Do_POST → As_int` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Agents | 2 calls |

## How to Explore

1. `gitnexus_context({name: "do_GET"})` — see callers and callees
2. `gitnexus_query({query: "risk"})` — find related execution flows
3. Read key files listed above for implementation details

---
name: event-analysis
description: "Skill for the Event-analysis area of multiAgentTrader. 4 symbols across 1 files."
---

# Event-analysis

4 symbols | 1 files | Cohesion: 86%

## When to Use

- Working with code in `agents/`
- Understanding how do_GET, do_POST, read_json work
- Modifying event-analysis-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `agents/event-analysis/server.py` | do_GET, do_POST, read_json, write_json |

## Entry Points

Start here when exploring this area:

- **`do_GET`** (Function) — `agents/event-analysis/server.py:22`
- **`do_POST`** (Function) — `agents/event-analysis/server.py:36`
- **`read_json`** (Function) — `agents/event-analysis/server.py:55`
- **`write_json`** (Function) — `agents/event-analysis/server.py:65`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `do_GET` | Function | `agents/event-analysis/server.py` | 22 |
| `do_POST` | Function | `agents/event-analysis/server.py` | 36 |
| `read_json` | Function | `agents/event-analysis/server.py` | 55 |
| `write_json` | Function | `agents/event-analysis/server.py` | 65 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Do_POST → List_from` | cross_community | 4 |
| `Do_POST → Infer_asset_classes` | cross_community | 4 |
| `Do_POST → Normalize_event_type` | cross_community | 4 |
| `Do_POST → Normalize_surprise` | cross_community | 4 |
| `Do_POST → HistoricalEventTemplate` | cross_community | 4 |
| `Do_POST → Jaccard` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Agents | 1 calls |

## How to Explore

1. `gitnexus_context({name: "do_GET"})` — see callers and callees
2. `gitnexus_query({query: "event-analysis"})` — find related execution flows
3. Read key files listed above for implementation details

---
name: aitraders
description: "Skill for the Aitraders area of multiAgentTrader. 12 symbols across 4 files."
---

# Aitraders

12 symbols | 4 files | Cohesion: 70%

## When to Use

- Working with code in `aitraders/`
- Understanding how test_journal_round_trip, sample_trade, main work
- Modifying aitraders-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `aitraders/schemas.py` | MarketSnapshot, TradeRecord, utc_now_iso, JournalEvent, to_plain |
| `aitraders/journal.py` | JsonlJournal, read_events, iter_events, append |
| `aitraders/review_cli.py` | sample_trade, main |
| `tests/test_journal.py` | test_journal_round_trip |

## Entry Points

Start here when exploring this area:

- **`test_journal_round_trip`** (Function) — `tests/test_journal.py:4`
- **`sample_trade`** (Function) — `aitraders/review_cli.py:10`
- **`main`** (Function) — `aitraders/review_cli.py:55`
- **`read_events`** (Function) — `aitraders/journal.py:22`
- **`iter_events`** (Function) — `aitraders/journal.py:27`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `MarketSnapshot` | Class | `aitraders/schemas.py` | 40 |
| `TradeRecord` | Class | `aitraders/schemas.py` | 66 |
| `JsonlJournal` | Class | `aitraders/journal.py` | 9 |
| `JournalEvent` | Class | `aitraders/schemas.py` | 103 |
| `test_journal_round_trip` | Function | `tests/test_journal.py` | 4 |
| `sample_trade` | Function | `aitraders/review_cli.py` | 10 |
| `main` | Function | `aitraders/review_cli.py` | 55 |
| `read_events` | Function | `aitraders/journal.py` | 22 |
| `iter_events` | Function | `aitraders/journal.py` | 27 |
| `utc_now_iso` | Function | `aitraders/schemas.py` | 35 |
| `to_plain` | Function | `aitraders/schemas.py` | 109 |
| `append` | Function | `aitraders/journal.py` | 15 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → TradeRecord` | intra_community | 3 |
| `Main → Utc_now_iso` | cross_community | 3 |
| `Main → MarketSnapshot` | intra_community | 3 |
| `Main → RiskCheck` | cross_community | 3 |
| `Main → _classify` | cross_community | 3 |
| `Main → _summary` | cross_community | 3 |
| `Main → PostTradeReview` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tests | 3 calls |

## How to Explore

1. `gitnexus_context({name: "test_journal_round_trip"})` — see callers and callees
2. `gitnexus_query({query: "aitraders"})` — find related execution flows
3. Read key files listed above for implementation details

---
name: tests
description: "Skill for the Tests area of multiAgentTrader. 18 symbols across 5 files."
---

# Tests

18 symbols | 5 files | Cohesion: 81%

## When to Use

- Working with code in `tests/`
- Understanding how resolved_trade, snapshot, test_review_classifies_favorite_held_win work
- Modifying tests-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `tests/test_post_trade_review.py` | resolved_trade, snapshot, test_review_classifies_favorite_held_win, test_review_classifies_late_reversal_loss, test_review_prioritizes_risk_veto (+1) |
| `aitraders/agents/post_trade_review.py` | PostTradeReviewAgent, review, _classify, _summary |
| `tests/test_strategy_research_agent.py` | test_strategy_research_rejects_high_risk, test_strategy_research_promotes_positive_backtest, test_strategy_research_observes_without_inputs |
| `aitraders/agents/strategy_research.py` | research_strategy, summarize, extract_nested |
| `aitraders/schemas.py` | RiskCheck, PostTradeReview |

## Entry Points

Start here when exploring this area:

- **`resolved_trade`** (Function) — `tests/test_post_trade_review.py:13`
- **`snapshot`** (Function) — `tests/test_post_trade_review.py:31`
- **`test_review_classifies_favorite_held_win`** (Function) — `tests/test_post_trade_review.py:46`
- **`test_review_classifies_late_reversal_loss`** (Function) — `tests/test_post_trade_review.py:58`
- **`test_review_prioritizes_risk_veto`** (Function) — `tests/test_post_trade_review.py:70`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `RiskCheck` | Class | `aitraders/schemas.py` | 56 |
| `PostTradeReview` | Class | `aitraders/schemas.py` | 92 |
| `PostTradeReviewAgent` | Class | `aitraders/agents/post_trade_review.py` | 16 |
| `resolved_trade` | Function | `tests/test_post_trade_review.py` | 13 |
| `snapshot` | Function | `tests/test_post_trade_review.py` | 31 |
| `test_review_classifies_favorite_held_win` | Function | `tests/test_post_trade_review.py` | 46 |
| `test_review_classifies_late_reversal_loss` | Function | `tests/test_post_trade_review.py` | 58 |
| `test_review_prioritizes_risk_veto` | Function | `tests/test_post_trade_review.py` | 70 |
| `test_review_requires_resolved_trade` | Function | `tests/test_post_trade_review.py` | 81 |
| `review` | Function | `aitraders/agents/post_trade_review.py` | 23 |
| `test_strategy_research_rejects_high_risk` | Function | `tests/test_strategy_research_agent.py` | 3 |
| `test_strategy_research_promotes_positive_backtest` | Function | `tests/test_strategy_research_agent.py` | 13 |
| `test_strategy_research_observes_without_inputs` | Function | `tests/test_strategy_research_agent.py` | 26 |
| `research_strategy` | Function | `aitraders/agents/strategy_research.py` | 12 |
| `summarize` | Function | `aitraders/agents/strategy_research.py` | 163 |
| `extract_nested` | Function | `aitraders/agents/strategy_research.py` | 183 |
| `_classify` | Function | `aitraders/agents/post_trade_review.py` | 48 |
| `_summary` | Function | `aitraders/agents/post_trade_review.py` | 103 |

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
| `Main → RiskCheck` | cross_community | 3 |
| `Main → _classify` | cross_community | 3 |
| `Main → _summary` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Agents | 4 calls |
| Aitraders | 3 calls |

## How to Explore

1. `gitnexus_context({name: "resolved_trade"})` — see callers and callees
2. `gitnexus_query({query: "tests"})` — find related execution flows
3. Read key files listed above for implementation details

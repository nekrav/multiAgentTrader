---
name: agents
description: "Skill for the Agents area of multiAgentTrader. 109 symbols across 27 files."
---

# Agents

109 symbols | 27 files | Cohesion: 89%

## When to Use

- Working with code in `aitraders/`
- Understanding how test_options_skew_and_strategy_rules, input_hash, run_once work
- Modifying agents-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `aitraders/agents/event_analysis.py` | analyze_event, score_event_similarity, serialize_comparable, build_cross_asset_impact, build_trade_guidance (+11) |
| `aitraders/agents/backtesting.py` | fetch_history, BacktestConfig, run_real_history_backtest, config_from_payload, aggregate_portfolio (+7) |
| `aitraders/agents/market_data.py` | Candle, normalize_asset, fetch_coinbase_candles, fetch_frankfurter_candles, compute_market_metrics (+4) |
| `aitraders/agents/strategy_research.py` | build_proposals, summarize_backtest, normalize_strategies, preferred_assets, first_number (+4) |
| `aitraders/agents/risk.py` | evaluate_risk, normalize_snapshot, compute_risk_score, risk_level, RiskThresholds (+3) |
| `apps/api/src/agents/agents.service.ts` | getStatus, invoke, requireAgent, callAgent, recordInvocation (+2) |
| `tests/test_futures_options_agents.py` | test_options_skew_and_strategy_rules, test_futures_curve_classifies_backwardation_and_contango, test_open_interest_flow_interprets_participation, test_options_expected_move_and_iv_regime |
| `apps/options-worker/src/worker.py` | input_hash, run_once, persist, main |
| `apps/futures-worker/src/worker.py` | input_hash, run_once, persist, main |
| `agents/base_http_agent.py` | do_GET, do_POST, read_json, write_json |

## Entry Points

Start here when exploring this area:

- **`test_options_skew_and_strategy_rules`** (Function) — `tests/test_futures_options_agents.py:39`
- **`input_hash`** (Function) — `apps/options-worker/src/worker.py:17`
- **`run_once`** (Function) — `apps/options-worker/src/worker.py:20`
- **`persist`** (Function) — `apps/options-worker/src/worker.py:31`
- **`main`** (Function) — `apps/options-worker/src/worker.py:42`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `Candle` | Class | `aitraders/agents/market_data.py` | 54 |
| `HistoricalEventTemplate` | Class | `aitraders/agents/event_analysis.py` | 7 |
| `BacktestConfig` | Class | `aitraders/agents/backtesting.py` | 13 |
| `RiskThresholds` | Class | `aitraders/agents/risk.py` | 7 |
| `test_options_skew_and_strategy_rules` | Function | `tests/test_futures_options_agents.py` | 39 |
| `input_hash` | Function | `apps/options-worker/src/worker.py` | 17 |
| `run_once` | Function | `apps/options-worker/src/worker.py` | 20 |
| `persist` | Function | `apps/options-worker/src/worker.py` | 31 |
| `main` | Function | `apps/options-worker/src/worker.py` | 42 |
| `loop` | Function | `apps/options-worker/src/main.py` | 7 |
| `do_GET` | Function | `apps/options-worker/src/main.py` | 22 |
| `classify_vol_term_structure` | Function | `apps/options-worker/src/agents/vol_term_structure.py` | 0 |
| `run_vol_term_agent` | Function | `apps/options-worker/src/agents/vol_term_structure.py` | 10 |
| `run_underlying_context_agent` | Function | `apps/options-worker/src/agents/underlying_context.py` | 0 |
| `recommend_strategy_family` | Function | `apps/options-worker/src/agents/strategy_recommender.py` | 0 |
| `run_strategy_agent` | Function | `apps/options-worker/src/agents/strategy_recommender.py` | 17 |
| `classify_skew` | Function | `apps/options-worker/src/agents/skew_smile.py` | 0 |
| `run_skew_agent` | Function | `apps/options-worker/src/agents/skew_smile.py` | 13 |
| `run_meta_consensus` | Function | `apps/options-worker/src/agents/meta_consensus.py` | 2 |
| `run_greeks_risk_agent` | Function | `apps/options-worker/src/agents/greeks_risk.py` | 0 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Do_POST → BacktestConfig` | cross_community | 6 |
| `Do_POST → Normalize_asset` | cross_community | 6 |
| `Do_POST → Equity_from_returns` | cross_community | 6 |
| `Do_POST → Max_drawdown_pct` | cross_community | 6 |
| `Do_POST → As_float` | cross_community | 6 |
| `Do_POST → As_int` | cross_community | 6 |
| `Run_real_history_backtest → Mean` | cross_community | 5 |
| `Do_POST → Normalize_strategies` | cross_community | 4 |
| `Do_POST → Require_forex_pair` | cross_community | 4 |
| `Do_POST → Candle` | cross_community | 4 |

## How to Explore

1. `gitnexus_context({name: "test_options_skew_and_strategy_rules"})` — see callers and callees
2. `gitnexus_query({query: "agents"})` — find related execution flows
3. Read key files listed above for implementation details

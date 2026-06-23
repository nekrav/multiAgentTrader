---
name: agents
description: "Skill for the Agents area of multiAgentTrader. 74 symbols across 10 files."
---

# Agents

74 symbols | 10 files | Cohesion: 86%

## When to Use

- Working with code in `aitraders/`
- Understanding how test_normalize_asset, test_volatility_level, test_compute_market_metrics work
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
| `agents/base_http_agent.py` | do_GET, do_POST, read_json, write_json |
| `tests/test_market_data_agent.py` | test_normalize_asset, test_volatility_level, test_compute_market_metrics |
| `tests/test_event_analysis_agent.py` | test_event_analysis_matches_macro_event, test_event_analysis_uses_supplied_history, test_event_analysis_handles_sparse_payload |
| `tests/test_risk_agent.py` | test_risk_agent_passes_calm_snapshot, test_risk_agent_vetoes_volatile_snapshot, test_risk_agent_accepts_nested_agent_result |

## Entry Points

Start here when exploring this area:

- **`test_normalize_asset`** (Function) — `tests/test_market_data_agent.py:3`
- **`test_volatility_level`** (Function) — `tests/test_market_data_agent.py:8`
- **`test_compute_market_metrics`** (Function) — `tests/test_market_data_agent.py:14`
- **`normalize_asset`** (Function) — `aitraders/agents/market_data.py:75`
- **`fetch_coinbase_candles`** (Function) — `aitraders/agents/market_data.py:85`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `Candle` | Class | `aitraders/agents/market_data.py` | 54 |
| `HistoricalEventTemplate` | Class | `aitraders/agents/event_analysis.py` | 7 |
| `BacktestConfig` | Class | `aitraders/agents/backtesting.py` | 13 |
| `RiskThresholds` | Class | `aitraders/agents/risk.py` | 7 |
| `test_normalize_asset` | Function | `tests/test_market_data_agent.py` | 3 |
| `test_volatility_level` | Function | `tests/test_market_data_agent.py` | 8 |
| `test_compute_market_metrics` | Function | `tests/test_market_data_agent.py` | 14 |
| `normalize_asset` | Function | `aitraders/agents/market_data.py` | 75 |
| `fetch_coinbase_candles` | Function | `aitraders/agents/market_data.py` | 85 |
| `fetch_frankfurter_candles` | Function | `aitraders/agents/market_data.py` | 125 |
| `compute_market_metrics` | Function | `aitraders/agents/market_data.py` | 161 |
| `serialize_candle` | Function | `aitraders/agents/market_data.py` | 208 |
| `volatility_level` | Function | `aitraders/agents/market_data.py` | 221 |
| `build_snapshot` | Function | `aitraders/agents/market_data.py` | 229 |
| `require_forex_pair` | Function | `aitraders/agents/market_data.py` | 244 |
| `fetch_history` | Function | `aitraders/agents/backtesting.py` | 78 |
| `test_event_analysis_matches_macro_event` | Function | `tests/test_event_analysis_agent.py` | 3 |
| `test_event_analysis_uses_supplied_history` | Function | `tests/test_event_analysis_agent.py` | 23 |
| `test_event_analysis_handles_sparse_payload` | Function | `tests/test_event_analysis_agent.py` | 54 |
| `analyze_event` | Function | `aitraders/agents/event_analysis.py` | 89 |

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

1. `gitnexus_context({name: "test_normalize_asset"})` — see callers and callees
2. `gitnexus_query({query: "agents"})` — find related execution flows
3. Read key files listed above for implementation details

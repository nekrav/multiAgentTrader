# Phase 1 Implementation Plan

## Goal

Create a clean foundation for AiTraders that can ingest trade records, preserve normalized journal entries, and generate deterministic post-trade reviews. This phase is intentionally read-only with respect to live trading.

## Files

- `aitraders/schemas.py`: shared dataclasses and enums for market snapshots, trade records, risk checks, journal events, and post-trade reviews.
- `aitraders/journal.py`: JSONL append/read helpers for durable local analysis journals.
- `aitraders/agents/post_trade_review.py`: deterministic review logic for wins/losses and strategy notes.
- `aitraders/review_cli.py`: simple CLI for writing a sample journal and reviewing resolved trades.
- `tests/`: focused tests for schema round trips, journal IO, and review classification.

## Phase 1 Acceptance Criteria

- A resolved trade can be represented without exchange credentials.
- Journal records serialize to JSONL and read back cleanly.
- The review agent classifies likely result reasons from trade, market, and risk context.
- Tests prove the review pipeline is deterministic and side-effect free.

## Next Phases

1. Phase 2: consolidated Risk Agent with deterministic veto tests.
2. Phase 3: Strategy Research Agent wrapper for Strategy Lab sweeps and proposal artifacts.
3. Phase 4: config-promotion flow requiring out-of-sample evidence.
4. Phase 5: optional LLM orchestration for summaries and review only.

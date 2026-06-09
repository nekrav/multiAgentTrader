from __future__ import annotations

import argparse
from pathlib import Path

from aitraders.agents.post_trade_review import PostTradeReviewAgent
from aitraders.journal import JsonlJournal
from aitraders.schemas import MarketSnapshot, RiskCheck, TradeRecord, TradeSide, TradeStatus, utc_now_iso


def sample_trade() -> tuple[TradeRecord, MarketSnapshot, MarketSnapshot, RiskCheck]:
    trade = TradeRecord(
        trade_id="sample-btc-1700000000-up",
        asset="BTC",
        strategy="market_favorite_95",
        side=TradeSide.UP,
        status=TradeStatus.RESOLVED,
        window_ts=1_700_000_000,
        entered_at=utc_now_iso(),
        amount=2.0,
        entry_price=0.95,
        outcome=TradeSide.UP,
        exit_price=1.0,
        pnl=0.105,
        pnl_pct=5.25,
        resolved_at=utc_now_iso(),
        confidence=0.95,
        source="sample",
    )
    entry = MarketSnapshot(
        asset="BTC",
        window_ts=trade.window_ts,
        observed_at=trade.entered_at,
        spot_price=68000.0,
        up_price=0.95,
        down_price=0.05,
        spread=0.02,
        liquidity_usdc=500.0,
        volatility_range_pct=0.12,
        target_crosses=0,
        favorite_side="Up",
        favorite_price=0.95,
    )
    close = MarketSnapshot(
        asset="BTC",
        window_ts=trade.window_ts,
        observed_at=trade.resolved_at or utc_now_iso(),
        spot_price=68020.0,
        favorite_side="Up",
        favorite_price=0.99,
    )
    risk = RiskCheck(passed=True)
    return trade, entry, close, risk


def main() -> int:
    parser = argparse.ArgumentParser(description="Run deterministic post-trade reviews from a JSONL journal.")
    parser.add_argument("--journal", default="data/journal.jsonl", help="Path to JSONL journal.")
    parser.add_argument("--write-sample", action="store_true", help="Append one sample trade and review event.")
    args = parser.parse_args()

    journal = JsonlJournal(Path(args.journal))
    agent = PostTradeReviewAgent()

    if args.write_sample:
        trade, entry, close, risk = sample_trade()
        review = agent.review(trade, entry_snapshot=entry, close_snapshot=close, risk_check=risk)
        journal.append("trade.resolved", trade)
        journal.append("market.entry_snapshot", entry)
        journal.append("market.close_snapshot", close)
        journal.append("risk.check", risk)
        journal.append("post_trade.review", review)
        print(review.summary)
        return 0

    events = journal.read_events()
    print(f"Loaded {len(events)} events from {journal.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

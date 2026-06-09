import pytest

from aitraders.agents.post_trade_review import PostTradeReviewAgent
from aitraders.schemas import (
    MarketSnapshot,
    ReviewReason,
    RiskCheck,
    TradeRecord,
    TradeSide,
    TradeStatus,
)


def resolved_trade(**overrides):
    values = {
        "trade_id": "t1",
        "asset": "BTC",
        "strategy": "market_favorite_95",
        "side": TradeSide.UP,
        "status": TradeStatus.RESOLVED,
        "window_ts": 1,
        "entered_at": "2026-06-06T18:00:00Z",
        "amount": 2.0,
        "entry_price": 0.95,
        "outcome": TradeSide.UP,
        "pnl": 0.10,
    }
    values.update(overrides)
    return TradeRecord(**values)


def snapshot(**overrides):
    values = {
        "asset": "BTC",
        "window_ts": 1,
        "observed_at": "2026-06-06T18:00:00Z",
        "spread": 0.02,
        "liquidity_usdc": 500.0,
        "volatility_range_pct": 0.1,
        "favorite_side": "Up",
        "favorite_price": 0.95,
    }
    values.update(overrides)
    return MarketSnapshot(**values)


def test_review_classifies_favorite_held_win():
    review = PostTradeReviewAgent().review(
        resolved_trade(),
        entry_snapshot=snapshot(),
        close_snapshot=snapshot(favorite_price=0.99),
        risk_check=RiskCheck(passed=True),
    )

    assert review.primary_reason == ReviewReason.FAVORITE_HELD
    assert review.result.value == "WIN"


def test_review_classifies_late_reversal_loss():
    review = PostTradeReviewAgent().review(
        resolved_trade(outcome=TradeSide.DOWN, pnl=-2.0),
        entry_snapshot=snapshot(favorite_side="Up"),
        close_snapshot=snapshot(favorite_side="Down"),
        risk_check=RiskCheck(passed=True),
    )

    assert review.primary_reason == ReviewReason.LATE_REVERSAL
    assert "flipped" in review.notes[0]


def test_review_prioritizes_risk_veto():
    review = PostTradeReviewAgent().review(
        resolved_trade(),
        entry_snapshot=snapshot(),
        close_snapshot=snapshot(),
        risk_check=RiskCheck(passed=False, vetoes=["volatility range too high"]),
    )

    assert review.primary_reason == ReviewReason.VOLATILITY_STOP


def test_review_requires_resolved_trade():
    with pytest.raises(ValueError):
        PostTradeReviewAgent().review(resolved_trade(status=TradeStatus.OPEN, outcome=None))

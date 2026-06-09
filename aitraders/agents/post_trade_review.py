from __future__ import annotations

from typing import List, Optional

from aitraders.schemas import (
    MarketSnapshot,
    PostTradeReview,
    ReviewReason,
    RiskCheck,
    TradeRecord,
    TradeResult,
    TradeStatus,
    utc_now_iso,
)


class PostTradeReviewAgent:
    """Deterministic post-trade classifier.

    This agent explains recorded outcomes. It does not approve trades, place
    orders, or override risk checks.
    """

    def review(
        self,
        trade: TradeRecord,
        *,
        entry_snapshot: Optional[MarketSnapshot] = None,
        close_snapshot: Optional[MarketSnapshot] = None,
        risk_check: Optional[RiskCheck] = None,
    ) -> PostTradeReview:
        if trade.status != TradeStatus.RESOLVED:
            raise ValueError("Post-trade review requires a resolved trade.")

        notes: List[str] = []
        actions: List[str] = []
        reason = self._classify(trade, entry_snapshot, close_snapshot, risk_check, notes, actions)
        summary = self._summary(trade, reason)
        return PostTradeReview(
            trade_id=trade.trade_id,
            reviewed_at=utc_now_iso(),
            result=trade.result,
            primary_reason=reason,
            summary=summary,
            notes=notes,
            recommended_actions=actions,
        )

    def _classify(
        self,
        trade: TradeRecord,
        entry: Optional[MarketSnapshot],
        close: Optional[MarketSnapshot],
        risk: Optional[RiskCheck],
        notes: List[str],
        actions: List[str],
    ) -> ReviewReason:
        if risk and not risk.passed:
            notes.extend(risk.vetoes)
            actions.append("Compare execution record against risk veto source before considering this setup again.")
            if any("volatility" in veto.lower() for veto in risk.vetoes):
                return ReviewReason.VOLATILITY_STOP
            if any("liquidity" in veto.lower() for veto in risk.vetoes):
                return ReviewReason.THIN_LIQUIDITY
            if any("spread" in veto.lower() for veto in risk.vetoes):
                return ReviewReason.WIDE_SPREAD

        if entry is None or close is None:
            notes.append("Missing entry or close snapshot limits attribution.")
            actions.append("Capture entry and close market snapshots for every resolved trade.")
            return ReviewReason.DATA_GAP

        if entry.spread is not None and entry.spread > 0.08:
            notes.append(f"Entry spread was wide at {entry.spread:.3f}.")
            actions.append("Test a stricter max-spread veto before promotion.")
            return ReviewReason.WIDE_SPREAD

        if entry.liquidity_usdc is not None and entry.liquidity_usdc < 100:
            notes.append(f"Entry liquidity was thin at ${entry.liquidity_usdc:.2f}.")
            actions.append("Raise or enforce minimum liquidity for this market family.")
            return ReviewReason.THIN_LIQUIDITY

        if entry.volatility_range_pct is not None and entry.volatility_range_pct > 0.35:
            notes.append(f"Entry volatility range was {entry.volatility_range_pct:.3f}%.")
            actions.append("Review volatility guard threshold against recent windows.")
            return ReviewReason.VOLATILITY_STOP

        if trade.entry_price >= 0.98 and trade.result == TradeResult.LOSS:
            notes.append(f"Loss came from a high entry price of {trade.entry_price:.3f}.")
            actions.append("Check whether max favorite price should stay below this level.")
            return ReviewReason.BAD_ENTRY_PRICE

        if entry.favorite_side and close.favorite_side and entry.favorite_side != close.favorite_side:
            notes.append(f"Favorite flipped from {entry.favorite_side} to {close.favorite_side}.")
            actions.append("Measure late favorite flips by strategy and seconds-left bucket.")
            return ReviewReason.LATE_REVERSAL

        if trade.result == TradeResult.WIN and entry.favorite_side == trade.side.value:
            notes.append("Entry side matched the market favorite and the favorite held.")
            return ReviewReason.FAVORITE_HELD

        return ReviewReason.UNCLASSIFIED

    def _summary(self, trade: TradeRecord, reason: ReviewReason) -> str:
        pnl_text = "unknown PnL" if trade.pnl is None else f"${trade.pnl:+.2f}"
        outcome = trade.outcome.value if trade.outcome else "unknown"
        return (
            f"{trade.asset} {trade.strategy} {trade.side.value} resolved {trade.result.value} "
            f"against {outcome}; PnL {pnl_text}; reason={reason.value}."
        )

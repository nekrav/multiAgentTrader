from aitraders.journal import JsonlJournal
from aitraders.schemas import TradeRecord, TradeSide, TradeStatus


def test_journal_round_trip(tmp_path):
    journal = JsonlJournal(tmp_path / "journal.jsonl")
    trade = TradeRecord(
        trade_id="t1",
        asset="BTC",
        strategy="market_favorite_95",
        side=TradeSide.UP,
        status=TradeStatus.RESOLVED,
        window_ts=1,
        entered_at="2026-06-06T18:00:00Z",
        amount=2.0,
        entry_price=0.95,
        outcome=TradeSide.UP,
    )

    journal.append("trade.resolved", trade)
    events = journal.read_events()

    assert len(events) == 1
    assert events[0].event_type == "trade.resolved"
    assert events[0].payload["side"] == "Up"
    assert events[0].payload["status"] == "resolved"

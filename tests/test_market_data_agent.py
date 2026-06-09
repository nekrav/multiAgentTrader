from aitraders.agents.market_data import Candle, compute_market_metrics, normalize_asset, volatility_level


def test_normalize_asset():
    assert normalize_asset("btc") == "BTC-USD"
    assert normalize_asset("ETH-USD") == "ETH-USD"


def test_volatility_level():
    assert volatility_level(0.8) == "low"
    assert volatility_level(1.2) == "medium"
    assert volatility_level(2.0) == "high"


def test_compute_market_metrics():
    candles = [
        Candle(time=i, low=100 + i, high=101 + i, open=100 + i, close=100.5 + i, volume=10)
        for i in range(30)
    ]
    metrics = compute_market_metrics(candles)
    assert metrics["spotPrice"] == 129.5
    assert metrics["trend"] == "up"
    assert metrics["volatility"]["level"] in {"low", "medium", "high"}
    assert metrics["latestCandle"]["rangePct"] > 0

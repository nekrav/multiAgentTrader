from aitraders.agents.strategy_research import research_strategy


def test_strategy_research_rejects_high_risk():
    result = research_strategy(
        {
            "marketSnapshot": {"volatility": {"level": "high", "severityX": 2.5}},
            "riskCheck": {"passed": False, "riskLevel": "high"},
        }
    )
    assert result["proposals"][0]["action"] == "do_not_trade"


def test_strategy_research_promotes_positive_backtest():
    result = research_strategy(
        {
            "marketSnapshot": {"volatility": {"level": "low", "severityX": 0.8}, "trend": "up"},
            "riskCheck": {"passed": True, "riskLevel": "low"},
            "backtestResult": {"portfolio": {"pnl": 4.2, "max_drawdown_pct": -0.2, "trades": 80}},
        }
    )
    actions = {proposal["action"] for proposal in result["proposals"]}
    assert "propose_config" in actions
    assert result["backtest"]["pnl"] == 4.2


def test_strategy_research_observes_without_inputs():
    result = research_strategy({})
    assert result["proposals"]
    assert result["inputs"]["hasMarketSnapshot"] is False

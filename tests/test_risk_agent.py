from aitraders.agents.risk import evaluate_risk


def test_risk_agent_passes_calm_snapshot():
    result = evaluate_risk(
        {
            "volatility": {"severityX": 0.8, "rangePct": 0.04, "fastMoveX": 1.1},
            "spreadPct": 1.0,
            "liquidityUsdc": 500,
            "recentLosses": 1,
            "evPct": 1.2,
        }
    )
    assert result["passed"] is True
    assert result["riskLevel"] in {"low", "medium"}
    assert result["vetoes"] == []


def test_risk_agent_vetoes_volatile_snapshot():
    result = evaluate_risk(
        {
            "volatility": {"severityX": 2.5, "rangePct": 0.2, "fastMoveX": 5.0},
            "spreadPct": 4.0,
            "liquidityUsdc": 40,
            "recentLosses": 4,
            "evPct": -0.5,
        }
    )
    assert result["passed"] is False
    assert result["riskLevel"] == "high"
    assert len(result["vetoes"]) >= 5


def test_risk_agent_accepts_nested_agent_result():
    result = evaluate_risk(
        {
            "agentId": "market-data",
            "status": "ok",
            "result": {
                "volatility": {"severityX": 0.9, "rangePct": 0.05, "fastMoveX": 1.0},
            },
        }
    )
    assert result["passed"] is True

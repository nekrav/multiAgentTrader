from aitraders.agents.event_analysis import analyze_event


def test_event_analysis_matches_macro_event():
    result = analyze_event(
        {
            "currentEvent": {
                "title": "US CPI came in hotter than forecast",
                "eventType": "cpi",
                "assetClasses": ["forex", "stocks", "crypto"],
                "affectedAssets": ["USD", "DXY", "EUR/USD", "USD/JPY", "QQQ", "BTC"],
                "importance": "high",
                "surpriseDirection": "hot",
            }
        }
    )

    assert result["method"] == "event_similarity_study"
    assert result["comparableEvents"][0]["eventType"] == "cpi"
    assert result["tradeGuidance"]["eventRisk"] == "high"
    assert "risk-agent approval" in result["tradeGuidance"]["setupFilter"]


def test_event_analysis_uses_supplied_history():
    result = analyze_event(
        {
            "currentEvent": {
                "title": "Large exchange outage hits BTC liquidity",
                "eventType": "exchange_outage",
                "assetClasses": ["crypto"],
                "affectedAssets": ["BTC", "ETH"],
                "importance": "high",
                "surpriseDirection": "negative",
            },
            "historicalEvents": [
                {
                    "title": "Prior BTC exchange outage",
                    "eventType": "exchange_outage",
                    "assetClasses": ["crypto"],
                    "affectedAssets": ["BTC", "ETH"],
                    "surpriseDirection": "negative",
                    "typicalImpact": "Spreads widened and majors fell before liquidity normalized.",
                    "tradingLesson": "Wait for spreads to normalize before entry.",
                    "confidence": 0.9,
                }
            ],
        }
    )

    assert result["comparableEvents"][0]["title"] == "Prior BTC exchange outage"
    assert result["comparableEvents"][0]["similarity"] > 0.9
    assert "Crypto Flow Agent" in {idea["agent"] for idea in result["agentUpgradeIdeas"]}


def test_event_analysis_handles_sparse_payload():
    result = analyze_event({})

    assert result["currentEvent"]["title"] == "Market event"
    assert result["comparableEvents"]
    assert result["summary"]

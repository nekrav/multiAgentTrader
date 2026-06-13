from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class HistoricalEventTemplate:
    event_type: str
    title: str
    asset_classes: tuple[str, ...]
    affected: tuple[str, ...]
    surprise_direction: str
    typical_impact: str
    trading_lesson: str
    volatility_window: str
    confidence: float


EVENT_TEMPLATES: tuple[HistoricalEventTemplate, ...] = (
    HistoricalEventTemplate(
        event_type="cpi",
        title="Inflation surprise",
        asset_classes=("forex", "stocks", "crypto"),
        affected=("USD", "DXY", "EUR/USD", "USD/JPY", "QQQ", "BTC"),
        surprise_direction="hot",
        typical_impact="Hot inflation usually supports USD yields, pressures growth stocks, and can pull crypto lower through tighter-liquidity expectations.",
        trading_lesson="Avoid chasing the first candle; wait for spread normalization and confirmation after the first volatility burst.",
        volatility_window="First 30-90 minutes, then possible second move after bond-market repricing.",
        confidence=0.78,
    ),
    HistoricalEventTemplate(
        event_type="nfp",
        title="US jobs surprise",
        asset_classes=("forex", "stocks"),
        affected=("USD", "DXY", "EUR/USD", "GBP/USD", "USD/JPY", "SPY", "QQQ"),
        surprise_direction="strong",
        typical_impact="Strong payrolls can lift USD and yields, but equities may split between growth optimism and rate-pressure selling.",
        trading_lesson="Compare jobs growth with wage inflation; conflicting details often create a whipsaw instead of a clean trend.",
        volatility_window="First 15-60 minutes, with trend continuation more reliable after the first pullback.",
        confidence=0.72,
    ),
    HistoricalEventTemplate(
        event_type="central_bank",
        title="Central bank rate decision",
        asset_classes=("forex", "stocks", "crypto"),
        affected=("USD", "EUR", "GBP", "JPY", "DXY", "QQQ", "BTC"),
        surprise_direction="hawkish",
        typical_impact="Hawkish guidance tends to support the currency tied to the central bank and can pressure long-duration risk assets.",
        trading_lesson="Separate the rate decision from the statement and press conference; the guidance can reverse the initial reaction.",
        volatility_window="Decision minute, statement read-through, then press-conference repricing.",
        confidence=0.8,
    ),
    HistoricalEventTemplate(
        event_type="earnings",
        title="Mega-cap earnings shock",
        asset_classes=("stocks", "crypto"),
        affected=("NVDA", "AAPL", "MSFT", "QQQ", "SPY", "BTC"),
        surprise_direction="beat",
        typical_impact="Large earnings beats can lift the single stock and related index basket; misses can spill into sector and risk sentiment.",
        trading_lesson="Check guidance and margins, not just EPS/revenue, before assuming continuation.",
        volatility_window="After-hours gap, next cash-session open, then analyst revision cycle.",
        confidence=0.7,
    ),
    HistoricalEventTemplate(
        event_type="crypto_regulation",
        title="Crypto regulation or enforcement event",
        asset_classes=("crypto", "stocks"),
        affected=("BTC", "ETH", "SOL", "COIN", "MSTR"),
        surprise_direction="negative",
        typical_impact="Negative regulatory shocks often hit exchange tokens, high-beta crypto, and crypto-linked equities before majors stabilize.",
        trading_lesson="Prefer liquidity leaders first; smaller tokens can overshoot when venue risk is unclear.",
        volatility_window="Immediate headline move, then follow-up as exchanges and regulators clarify scope.",
        confidence=0.67,
    ),
    HistoricalEventTemplate(
        event_type="crypto_etf",
        title="Crypto ETF or institutional-flow event",
        asset_classes=("crypto", "stocks"),
        affected=("BTC", "ETH", "COIN", "MSTR", "QQQ"),
        surprise_direction="positive",
        typical_impact="Approval or strong inflow headlines can support BTC/ETH and crypto-linked equities, but post-event profit taking is common.",
        trading_lesson="Compare spot move with flow confirmation; approval headlines without sustained flows can fade.",
        volatility_window="Headline spike, US cash open for crypto equities, then fund-flow confirmation window.",
        confidence=0.68,
    ),
)


def analyze_event(payload: dict[str, Any]) -> dict[str, Any]:
    current = normalize_current_event(payload)
    history = normalize_history(payload.get("historicalEvents"))
    candidates = history + list(EVENT_TEMPLATES)
    ranked = sorted(
        ((score_event_similarity(current, event), event) for event in candidates),
        key=lambda item: item[0],
        reverse=True,
    )
    comparables = [serialize_comparable(score, event) for score, event in ranked[:5]]
    impact = build_cross_asset_impact(current, comparables)
    guidance = build_trade_guidance(current, comparables, impact)

    return {
        "agent": "event-analysis",
        "method": "event_similarity_study",
        "currentEvent": current,
        "summary": build_summary(current, comparables, guidance),
        "comparableEvents": comparables,
        "crossAssetImpact": impact,
        "tradeGuidance": guidance,
        "riskControls": build_risk_controls(current, comparables),
        "recommendedAgentChain": [
            "event-analysis",
            "market-data",
            "risk",
            "strategy-research",
            "post-trade-review",
        ],
        "agentUpgradeIdeas": build_agent_upgrade_ideas(),
    }


def normalize_current_event(payload: dict[str, Any]) -> dict[str, Any]:
    event = payload.get("currentEvent") if isinstance(payload.get("currentEvent"), dict) else payload
    affected_assets = list_from(event.get("affectedAssets") or event.get("affected"))
    asset_classes = [item.lower() for item in list_from(event.get("assetClasses") or event.get("assetClass"))]
    if not asset_classes:
        asset_classes = infer_asset_classes(affected_assets)
    return {
        "title": str(event.get("title") or event.get("name") or "Market event"),
        "eventType": normalize_event_type(str(event.get("eventType") or event.get("type") or "macro")),
        "assetClasses": asset_classes or ["forex", "stocks", "crypto"],
        "affectedAssets": affected_assets or ["USD", "SPY", "QQQ", "BTC"],
        "importance": str(event.get("importance") or "high").lower(),
        "surpriseDirection": normalize_surprise(str(event.get("surpriseDirection") or event.get("surprise") or "unknown")),
        "actual": event.get("actual"),
        "forecast": event.get("forecast"),
        "previous": event.get("previous"),
        "timeWindow": str(event.get("timeWindow") or "next 0-24h"),
    }


def normalize_history(value: Any) -> list[HistoricalEventTemplate]:
    if not isinstance(value, list):
        return []
    events: list[HistoricalEventTemplate] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        events.append(
            HistoricalEventTemplate(
                event_type=normalize_event_type(str(item.get("eventType") or item.get("type") or "macro")),
                title=str(item.get("title") or "Supplied historical event"),
                asset_classes=tuple(item.lower() for item in list_from(item.get("assetClasses") or item.get("assetClass"))),
                affected=tuple(list_from(item.get("affectedAssets") or item.get("affected"))),
                surprise_direction=normalize_surprise(str(item.get("surpriseDirection") or item.get("surprise") or "unknown")),
                typical_impact=str(item.get("typicalImpact") or item.get("impact") or "Historical event moved related assets."),
                trading_lesson=str(item.get("tradingLesson") or item.get("lesson") or "Compare volatility and follow-through before trading."),
                volatility_window=str(item.get("volatilityWindow") or "Event window and next session."),
                confidence=float(item.get("confidence") or 0.55),
            )
        )
    return events


def score_event_similarity(current: dict[str, Any], event: HistoricalEventTemplate) -> float:
    score = 0.0
    if current["eventType"] == event.event_type:
        score += 0.42
    current_classes = set(current["assetClasses"])
    event_classes = set(event.asset_classes)
    if current_classes and event_classes:
        score += 0.22 * jaccard(current_classes, event_classes)
    current_assets = {asset.upper() for asset in current["affectedAssets"]}
    event_assets = {asset.upper() for asset in event.affected}
    if current_assets and event_assets:
        score += 0.2 * jaccard(current_assets, event_assets)
    if current["surpriseDirection"] == event.surprise_direction:
        score += 0.1
    if current["importance"] == "high":
        score += 0.03
    score += min(max(event.confidence, 0.0), 1.0) * 0.03
    return round(min(score, 1.0), 3)


def serialize_comparable(score: float, event: HistoricalEventTemplate) -> dict[str, Any]:
    return {
        "similarity": score,
        "eventType": event.event_type,
        "title": event.title,
        "assetClasses": list(event.asset_classes),
        "affectedAssets": list(event.affected),
        "surpriseDirection": event.surprise_direction,
        "typicalImpact": event.typical_impact,
        "tradingLesson": event.trading_lesson,
        "volatilityWindow": event.volatility_window,
        "confidence": event.confidence,
    }


def build_cross_asset_impact(current: dict[str, Any], comparables: list[dict[str, Any]]) -> dict[str, Any]:
    top = comparables[0] if comparables else {}
    event_type = current["eventType"]
    surprise = current["surpriseDirection"]
    impact = {
        "forex": "Watch USD direction, yield-sensitive pairs, and spread widening around the event window.",
        "stocks": "Watch index beta, sector concentration, earnings sensitivity, and gap/fade risk.",
        "crypto": "Watch BTC/ETH liquidity, crypto-equity sympathy, ETF-flow headlines, and leverage flush risk.",
    }
    if event_type in {"cpi", "nfp", "central_bank"}:
        impact["forex"] = "Highest sensitivity: USD crosses, DXY, USD/JPY, EUR/USD, and GBP/USD can reprice quickly."
        impact["stocks"] = "Rate-sensitive indices and mega-cap growth can move opposite USD/yields after a hot or hawkish surprise."
        impact["crypto"] = "BTC/ETH can behave like liquidity-sensitive risk assets when the event changes rate expectations."
    if event_type == "earnings":
        impact["stocks"] = "Highest sensitivity: the reporting stock, sector peers, QQQ/SPY, and guidance-linked names."
        impact["crypto"] = "Crypto impact is second-order unless the event changes broader risk appetite or chip/AI demand."
    if event_type in {"crypto_regulation", "crypto_etf"}:
        impact["crypto"] = "Highest sensitivity: BTC/ETH first, then high-beta tokens, exchange-linked equities, and miners."
        impact["stocks"] = "Crypto-linked equities can amplify the move during US cash hours."
    return {
        "primaryEventType": event_type,
        "surpriseDirection": surprise,
        "bestHistoricalMatch": top.get("title", "No close match"),
        "byAssetClass": impact,
    }


def build_trade_guidance(current: dict[str, Any], comparables: list[dict[str, Any]], impact: dict[str, Any]) -> dict[str, Any]:
    top_similarity = float(comparables[0]["similarity"]) if comparables else 0.0
    event_risk = "high" if current["importance"] == "high" or top_similarity >= 0.65 else "medium"
    action = "wait_for_confirmation" if event_risk == "high" else "trade_reduced_size"
    return {
        "eventRisk": event_risk,
        "preferredAction": action,
        "beforeEvent": "Do not open new full-size trades immediately before a high-impact event.",
        "duringEvent": "Avoid the first volatility burst unless the strategy explicitly trades news spikes.",
        "afterEvent": "Re-check trend, spread, liquidity, and whether price held the first pullback after the event.",
        "setupFilter": "Require market-data confirmation plus risk-agent approval before strategy promotion.",
        "bestHistoricalMatch": impact["bestHistoricalMatch"],
    }


def build_risk_controls(current: dict[str, Any], comparables: list[dict[str, Any]]) -> list[str]:
    controls = [
        "Cut default position risk by at least 50% when event risk is high.",
        "Block entries when spreads are wider than normal for the asset class.",
        "Treat correlated symbols as one exposure group during the event window.",
        "Record event outcome for post-trade review and future comparable-event scoring.",
    ]
    if current["eventType"] in {"cpi", "nfp", "central_bank"}:
        controls.append("For forex, require a second candle or session confirmation after the initial macro release.")
    if comparables and float(comparables[0]["similarity"]) < 0.45:
        controls.append("Historical match confidence is weak; prefer observation over promotion.")
    return controls


def build_agent_upgrade_ideas() -> list[dict[str, str]]:
    return [
        {"agent": "Macro Event Agent", "role": "Economic calendar, central bank, inflation, jobs, and rates event interpretation."},
        {"agent": "Earnings Agent", "role": "EPS/revenue/guidance surprise analysis, peer spillover, and index impact."},
        {"agent": "Crypto Flow Agent", "role": "ETF flows, exchange incidents, regulatory events, on-chain stress, and leverage liquidation risk."},
        {"agent": "Correlation/Exposure Agent", "role": "Detects duplicated portfolio bets across FX, stocks, crypto, commodities, and indices."},
        {"agent": "Bull/Bear Debate Agents", "role": "Separate bullish and bearish analysts challenge each setup before the risk gate."},
        {"agent": "Quality Control Agent", "role": "Rejects weak analyses, missing data, stale feeds, and unsupported recommendations."},
    ]


def build_summary(current: dict[str, Any], comparables: list[dict[str, Any]], guidance: dict[str, Any]) -> str:
    match = comparables[0]["title"] if comparables else "no strong historical match"
    return (
        f"{current['title']} is classified as {current['eventType']} with {guidance['eventRisk']} event risk. "
        f"The closest comparable is {match}. Preferred action: {guidance['preferredAction']}."
    )


def normalize_event_type(value: str) -> str:
    normalized = value.strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "inflation": "cpi",
        "consumer_price_index": "cpi",
        "jobs": "nfp",
        "payrolls": "nfp",
        "fed": "central_bank",
        "fomc": "central_bank",
        "rate_decision": "central_bank",
        "regulation": "crypto_regulation",
        "crypto_regulatory": "crypto_regulation",
        "etf": "crypto_etf",
    }
    return aliases.get(normalized, normalized)


def normalize_surprise(value: str) -> str:
    normalized = value.strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "higher": "hot",
        "above_forecast": "hot",
        "lower": "cool",
        "below_forecast": "cool",
        "good": "positive",
        "bad": "negative",
    }
    return aliases.get(normalized, normalized)


def infer_asset_classes(assets: list[str]) -> list[str]:
    joined = " ".join(asset.upper() for asset in assets)
    classes: list[str] = []
    if any(token in joined for token in ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "DXY"]):
        classes.append("forex")
    if any(token in joined for token in ["SPY", "QQQ", "NVDA", "AAPL", "MSFT", "COIN", "MSTR"]):
        classes.append("stocks")
    if any(token in joined for token in ["BTC", "ETH", "SOL", "CRYPTO"]):
        classes.append("crypto")
    return classes


def list_from(value: Any) -> list[str]:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, list) or isinstance(value, tuple):
        return [str(item).strip() for item in value if str(item).strip()]
    return []


def jaccard(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)

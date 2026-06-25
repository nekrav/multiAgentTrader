import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(path: str):
    spec = importlib.util.spec_from_file_location(path.replace('/', '_').replace('-', '_'), ROOT / path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module

f_term = load("apps/futures-worker/src/agents/term_structure.py")
f_flow = load("apps/futures-worker/src/agents/flow_open_interest.py")
o_iv = load("apps/options-worker/src/agents/implied_vol.py")
o_skew = load("apps/options-worker/src/agents/skew_smile.py")
o_strategy = load("apps/options-worker/src/agents/strategy_recommender.py")


def test_futures_curve_classifies_backwardation_and_contango():
    assert f_term.classify_curve_state([75.2, 74.6, 74.1])["curve_state"] == "backwardation"
    assert f_term.classify_curve_state([72.1, 72.8, 73.4])["curve_state"] == "contango"


def test_open_interest_flow_interprets_participation():
    bullish = f_flow.interpret_open_interest_flow(price_change=1.4, open_interest_change=2500, volume_change=1200)
    fragile = f_flow.interpret_open_interest_flow(price_change=1.4, open_interest_change=-900, volume_change=300)
    assert bullish["participation"] == "long_building"
    assert bullish["bias"] == "bullish"
    assert fragile["risk_flag"] == "short_covering_or_fragile_rally"


def test_options_expected_move_and_iv_regime():
    move = o_iv.calculate_expected_move(spot=2000, atm_iv=0.18, days_to_expiry=30)
    assert round(move["expected_move_pct"], 2) == 5.16
    assert move["upper_expected_bound"] > 2000
    assert o_iv.classify_iv_regime(atm_iv=0.24, realized_vol=0.14, iv_rank=72)["classification"] == "rich"


def test_options_skew_and_strategy_rules():
    skew = o_skew.classify_skew(put_25_delta_iv=0.29, call_25_delta_iv=0.21, prior_skew=0.03)
    assert skew["classification"] == "downside_fear"
    strategy = o_strategy.recommend_strategy_family(
        underlying_bias="bullish",
        iv_classification="rich",
        skew_classification="downside_fear",
        term_structure="front_loaded",
        risk_profile="balanced",
    )
    assert strategy["strategy_family"] == "bull call spread"

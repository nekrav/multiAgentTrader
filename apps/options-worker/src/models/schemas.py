from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field

Bias = Literal["bullish", "bearish", "neutral", "vol_expansion", "vol_compression", "curve_bullish", "curve_bearish", "mixed"]

class AgentOutput(BaseModel):
    market: str
    instrument_type: Literal["option"] = "option"
    timeframe: str
    timestamp: str
    agent_key: str
    bias: Bias
    confidence: float = Field(ge=0.0, le=1.0)
    score: float
    summary: str
    risk_flags: list[str] = []
    features: dict = {}
    model_version: str
    input_hash: str | None = None

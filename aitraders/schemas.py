from __future__ import annotations

from dataclasses import asdict, dataclass, field, is_dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class TradeSide(str, Enum):
    UP = "Up"
    DOWN = "Down"


class TradeStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class TradeResult(str, Enum):
    WIN = "WIN"
    LOSS = "LOSS"
    UNKNOWN = "UNKNOWN"


class ReviewReason(str, Enum):
    FAVORITE_HELD = "favorite_held"
    LATE_REVERSAL = "late_reversal"
    VOLATILITY_STOP = "volatility_stop"
    THIN_LIQUIDITY = "thin_liquidity"
    WIDE_SPREAD = "wide_spread"
    BAD_ENTRY_PRICE = "bad_entry_price"
    DATA_GAP = "data_gap"
    UNCLASSIFIED = "unclassified"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class MarketSnapshot:
    asset: str
    window_ts: int
    observed_at: str
    spot_price: Optional[float] = None
    up_price: Optional[float] = None
    down_price: Optional[float] = None
    spread: Optional[float] = None
    liquidity_usdc: Optional[float] = None
    volatility_range_pct: Optional[float] = None
    target_crosses: Optional[int] = None
    favorite_side: Optional[str] = None
    favorite_price: Optional[float] = None


@dataclass(frozen=True)
class RiskCheck:
    passed: bool
    vetoes: List[str] = field(default_factory=list)
    max_spread: Optional[float] = None
    min_liquidity_usdc: Optional[float] = None
    max_volatility_range_pct: Optional[float] = None
    notes: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class TradeRecord:
    trade_id: str
    asset: str
    strategy: str
    side: TradeSide
    status: TradeStatus
    window_ts: int
    entered_at: str
    amount: float
    entry_price: float
    outcome: Optional[TradeSide] = None
    exit_price: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    resolved_at: Optional[str] = None
    confidence: Optional[float] = None
    source: str = "imported"

    @property
    def result(self) -> TradeResult:
        if self.status != TradeStatus.RESOLVED or self.outcome is None:
            return TradeResult.UNKNOWN
        return TradeResult.WIN if self.side == self.outcome else TradeResult.LOSS


@dataclass(frozen=True)
class PostTradeReview:
    trade_id: str
    reviewed_at: str
    result: TradeResult
    primary_reason: ReviewReason
    summary: str
    notes: List[str] = field(default_factory=list)
    recommended_actions: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class JournalEvent:
    event_type: str
    created_at: str
    payload: Dict[str, Any]


def to_plain(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if is_dataclass(value):
        return {k: to_plain(v) for k, v in asdict(value).items()}
    if isinstance(value, dict):
        return {str(k): to_plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [to_plain(v) for v in value]
    return value

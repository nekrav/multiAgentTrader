from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List, Union

from .schemas import JournalEvent, to_plain, utc_now_iso


class JsonlJournal:
    """Append-only JSONL journal for local analytics records."""

    def __init__(self, path: Union[str, Path]) -> None:
        self.path = Path(path)

    def append(self, event_type: str, payload: object) -> JournalEvent:
        event = JournalEvent(event_type=event_type, created_at=utc_now_iso(), payload=to_plain(payload))
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(to_plain(event), sort_keys=True, separators=(",", ":")) + "\n")
        return event

    def read_events(self) -> List[JournalEvent]:
        if not self.path.exists():
            return []
        return list(self.iter_events())

    def iter_events(self) -> Iterable[JournalEvent]:
        with self.path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                stripped = line.strip()
                if not stripped:
                    continue
                raw = json.loads(stripped)
                try:
                    yield JournalEvent(
                        event_type=str(raw["event_type"]),
                        created_at=str(raw["created_at"]),
                        payload=dict(raw["payload"]),
                    )
                except KeyError as exc:
                    raise ValueError(f"Invalid journal event at line {line_number}: missing {exc.args[0]}") from exc

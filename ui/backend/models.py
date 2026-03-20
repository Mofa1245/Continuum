"""Pydantic models for Continuum UI API."""

from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel


class RunSummary(BaseModel):
    id: str
    status: str  # "verified" | "drift" | "unknown"


class RunMetadata(BaseModel):
    id: str
    timestamp: str
    status: str


class DriftEntry(BaseModel):
    path: str
    expected: Any
    received: Any
    drift_type: Optional[str] = None
    phase: Optional[str] = None


class TimelineEntry(BaseModel):
    phase: str
    status: str  # "ok" | "drift"

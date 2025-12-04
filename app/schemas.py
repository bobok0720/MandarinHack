"""Pydantic schemas for request and response payloads."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str


class UserRead(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        orm_mode = True


class WordCreate(BaseModel):
    term: str = Field(..., min_length=1)
    definition: str = Field(..., min_length=1)


class WordRead(BaseModel):
    id: int
    term: str
    definition: str

    class Config:
        orm_mode = True


class ListCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ListRead(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        orm_mode = True


class ListWordAttach(BaseModel):
    word_id: int


class UserWordRead(BaseModel):
    id: int
    user_id: int
    word_id: int
    status: str
    interval_days: float
    strength: float
    due_at: datetime
    consec_correct: int
    lapses: int
    assumed_known: bool

    class Config:
        orm_mode = True


class DueCard(BaseModel):
    user_word_id: int
    word_id: int
    term: str
    definition: str
    due_at: datetime


class AttachWordRequest(BaseModel):
    word_id: int
    assumed_known: bool = False


class ReviewRequest(BaseModel):
    user_word_id: int
    rating: str = Field(..., regex=r"^(AGAIN|HARD|GOOD)$")


class StatsRead(BaseModel):
    total_cards: int
    strong_cards: int
    due_cards: int

"""Spaced repetition scheduling helpers."""
from __future__ import annotations

from datetime import datetime, timedelta

from .models import UserWord

MIN_INTERVAL = 0.04  # days (~1 hour)


def init_new_user_word(user_id: int, word_id: int, assumed_known: bool, now: datetime) -> UserWord:
    """Initialize a new UserWord record with default SRS values."""
    if assumed_known:
        due_at = now + timedelta(days=3)
        return UserWord(
            user_id=user_id,
            word_id=word_id,
            status="review",
            strength=0.7,
            interval_days=3.0,
            consec_correct=0,
            lapses=0,
            due_at=due_at,
            assumed_known=True,
        )

    return UserWord(
        user_id=user_id,
        word_id=word_id,
        status="learning",
        strength=0.1,
        interval_days=0.25,
        consec_correct=0,
        lapses=0,
        due_at=now,
        assumed_known=False,
    )


def update_user_word_srs(user_word: UserWord, rating: str, now: datetime) -> None:
    """Mutate ``user_word`` in-place according to rating rules."""
    rating = rating.upper()

    if rating == "AGAIN":
        user_word.lapses += 1
        user_word.strength = max(0.0, user_word.strength - 0.3)
        user_word.consec_correct = 0
        user_word.status = "learning"
        if user_word.lapses == 1:
            user_word.interval_days = 0.04
        else:
            user_word.interval_days = 0.25

    elif rating in {"HARD", "GOOD"}:
        user_word.consec_correct += 1
        if user_word.status == "learning" and user_word.consec_correct >= 2:
            user_word.status = "review"

        if rating == "GOOD":
            user_word.strength = min(1.0, user_word.strength + 0.15)
            growth = 2.0 + user_word.strength
        else:  # HARD
            user_word.strength = min(1.0, user_word.strength + 0.05)
            growth = 1.2 + 0.6 * user_word.strength

        if user_word.interval_days < MIN_INTERVAL:
            user_word.interval_days = 1.0 if rating == "GOOD" else 0.5
        else:
            user_word.interval_days = max(MIN_INTERVAL, user_word.interval_days * growth)

    else:
        raise ValueError("Invalid rating")

    user_word.due_at = now + timedelta(days=user_word.interval_days)


def is_strong(user_word: UserWord) -> bool:
    return (
        user_word.status == "review"
        and user_word.strength >= 0.8
        and user_word.interval_days >= 7.0
    )

"""Data access helpers for the SRS backend."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, List, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session

from . import schemas
from .models import List, ListWord, Review, User, UserWord, Word
from .srs import init_new_user_word, is_strong, update_user_word_srs


class NotFoundError(Exception):
    """Raised when a requested resource is not found."""


class ConflictError(Exception):
    """Raised when a unique constraint would be violated."""


# User operations

def create_user(db: Session, user_in: schemas.UserCreate) -> User:
    user = User(email=user_in.email)
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Email already registered") from exc
    db.refresh(user)
    return user


# Word operations

def create_word(db: Session, word_in: schemas.WordCreate) -> Word:
    word = Word(term=word_in.term, definition=word_in.definition)
    db.add(word)
    db.commit()
    db.refresh(word)
    return word


def list_words(db: Session, *, limit: int = 100, offset: int = 0) -> List[Word]:
    stmt = select(Word).order_by(Word.id).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars().all())


# List operations

def create_list(db: Session, user_id: Optional[int], list_in: schemas.ListCreate) -> List:
    if user_id is not None and not db.get(User, user_id):
        raise NotFoundError("User not found")
    word_list = List(name=list_in.name, description=list_in.description, user_id=user_id)
    db.add(word_list)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("List name already exists for this user") from exc
    db.refresh(word_list)
    return word_list


def list_lists(db: Session, user_id: Optional[int] = None) -> List[List]:
    stmt = select(List)
    if user_id is not None:
        stmt = stmt.where(List.user_id == user_id)
    stmt = stmt.order_by(List.id)
    return list(db.execute(stmt).scalars().all())


def add_word_to_list(db: Session, list_id: int, word_id: int) -> ListWord:
    if not db.get(List, list_id):
        raise NotFoundError("List not found")
    if not db.get(Word, word_id):
        raise NotFoundError("Word not found")

    link = ListWord(list_id=list_id, word_id=word_id)
    db.add(link)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Word already attached to list") from exc
    db.refresh(link)
    return link


# User-word operations

def ensure_user_word(db: Session, user_id: int, word_id: int, assumed_known: bool) -> UserWord:
    stmt = select(UserWord).where(UserWord.user_id == user_id, UserWord.word_id == word_id)
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        return existing

    if not db.get(User, user_id):
        raise NotFoundError("User not found")
    if not db.get(Word, word_id):
        raise NotFoundError("Word not found")

    now = datetime.now(timezone.utc)
    user_word = init_new_user_word(user_id=user_id, word_id=word_id, assumed_known=assumed_known, now=now)
    db.add(user_word)
    db.commit()
    db.refresh(user_word)
    return user_word


def get_due_user_words(db: Session, user_id: int, now: datetime, limit: int = 20) -> List[UserWord]:
    stmt = (
        select(UserWord)
        .where(UserWord.user_id == user_id, UserWord.due_at <= now)
        .order_by(UserWord.due_at, UserWord.strength, UserWord.id)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def count_user_total_cards(db: Session, user_id: int) -> int:
    stmt = select(UserWord).where(UserWord.user_id == user_id)
    return len(list(db.execute(stmt).scalars().all()))


def count_user_strong_cards(db: Session, user_id: int) -> int:
    stmt = select(UserWord).where(UserWord.user_id == user_id)
    cards: Iterable[UserWord] = db.execute(stmt).scalars().all()
    return sum(1 for card in cards if is_strong(card))


# Review operations

def submit_review(db: Session, user_id: int, user_word_id: int, rating: str, now: datetime) -> UserWord:
    user_word = db.get(UserWord, user_word_id)
    if not user_word or user_word.user_id != user_id:
        raise NotFoundError("UserWord not found")

    rating = rating.upper()
    update_user_word_srs(user_word, rating, now)
    review = Review(user_id=user_id, word_id=user_word.word_id, rating=rating)
    db.add(review)
    db.add(user_word)
    db.commit()
    db.refresh(user_word)
    return user_word


def get_user_word_or_404(db: Session, user_word_id: int) -> UserWord:
    try:
        stmt = select(UserWord).where(UserWord.id == user_word_id)
        return db.execute(stmt).scalar_one()
    except NoResultFound as exc:
        raise NotFoundError("UserWord not found") from exc

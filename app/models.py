"""SQLAlchemy ORM models for spaced repetition backend."""
from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    lists = relationship("List", back_populates="owner", cascade="all, delete-orphan")
    user_words = relationship("UserWord", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, autoincrement=True)
    term = Column(String(255), nullable=False)
    definition = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    lists = relationship("ListWord", back_populates="word", cascade="all, delete-orphan")
    user_words = relationship("UserWord", back_populates="word", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="word", cascade="all, delete-orphan")


class List(Base):
    __tablename__ = "lists"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_list_user_name"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    owner = relationship("User", back_populates="lists")
    words = relationship("ListWord", back_populates="list", cascade="all, delete-orphan")


class ListWord(Base):
    __tablename__ = "list_words"
    __table_args__ = (UniqueConstraint("list_id", "word_id", name="uq_list_word"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    list_id = Column(Integer, ForeignKey("lists.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)

    list = relationship("List", back_populates="words")
    word = relationship("Word", back_populates="lists")


class UserWord(Base):
    __tablename__ = "user_words"
    __table_args__ = (UniqueConstraint("user_id", "word_id", name="uq_user_word"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="new")
    interval_days = Column(Float, nullable=False, default=0.0)
    strength = Column(Float, nullable=False, default=0.0)
    due_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    consec_correct = Column(Integer, nullable=False, default=0)
    lapses = Column(Integer, nullable=False, default=0)
    assumed_known = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="user_words")
    word = relationship("Word", back_populates="user_words")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    rating = Column(String(10), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="reviews")
    word = relationship("Word", back_populates="reviews")

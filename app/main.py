"""FastAPI application entrypoint for the vocabulary SRS backend."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import Depends, FastAPI, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import get_db, init_db
from .models import Word

app = FastAPI(title="MandarinHack SRS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init_database() -> None:
    init_db()


@app.exception_handler(crud.NotFoundError)
def not_found_handler(exc: crud.NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc) or "Resource not found"})


@app.exception_handler(crud.ConflictError)
def conflict_handler(exc: crud.ConflictError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


# User endpoints
@app.post("/api/users", response_model=schemas.UserRead, status_code=201)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)


# Word endpoints
@app.post("/api/words", response_model=schemas.WordRead, status_code=201)
def create_word(word: schemas.WordCreate, db: Session = Depends(get_db)):
    return crud.create_word(db, word)


@app.get("/api/words", response_model=List[schemas.WordRead])
def list_words(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return crud.list_words(db, limit=limit, offset=offset)


# List endpoints
@app.post("/api/lists", response_model=schemas.ListRead, status_code=201)
def create_list(
    list_in: schemas.ListCreate,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.create_list(db, user_id=user_id, list_in=list_in)


@app.get("/api/lists", response_model=List[schemas.ListRead])
def list_lists(user_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    return crud.list_lists(db, user_id=user_id)


@app.post("/api/lists/{list_id}/add_word", response_model=schemas.ListWordAttach, status_code=201)
def add_word_to_list(
    list_id: int = Path(..., ge=1),
    payload: schemas.ListWordAttach = ...,  # noqa: B008
    db: Session = Depends(get_db),
):
    return crud.add_word_to_list(db, list_id=list_id, word_id=payload.word_id)


# User-word endpoints
@app.post("/api/users/{user_id}/attach_word", response_model=schemas.UserWordRead, status_code=201)
def attach_word_to_user(
    user_id: int = Path(..., ge=1),
    payload: schemas.AttachWordRequest = ...,  # noqa: B008
    db: Session = Depends(get_db),
):
    return crud.ensure_user_word(
        db, user_id=user_id, word_id=payload.word_id, assumed_known=payload.assumed_known
    )


@app.get("/api/users/{user_id}/due_cards", response_model=List[schemas.DueCard])
def get_due_cards(
    user_id: int = Path(..., ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    due_cards = crud.get_due_user_words(db, user_id=user_id, now=now, limit=limit)
    word_ids = [card.word_id for card in due_cards]
    word_map = {}
    if word_ids:
        word_map = {word.id: word for word in db.query(Word).filter(Word.id.in_(word_ids))}
    return [
        schemas.DueCard(
            user_word_id=card.id,
            word_id=card.word_id,
            term=word_map[card.word_id].term,
            definition=word_map[card.word_id].definition,
            due_at=card.due_at,
        )
        for card in due_cards
    ]


@app.post("/api/users/{user_id}/review", response_model=schemas.DueCard)
def review_card(
    user_id: int = Path(..., ge=1),
    payload: schemas.ReviewRequest = ...,  # noqa: B008
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    updated = crud.submit_review(db, user_id=user_id, user_word_id=payload.user_word_id, rating=payload.rating, now=now)
    word = db.get(Word, updated.word_id)
    return schemas.DueCard(
        user_word_id=updated.id,
        word_id=updated.word_id,
        term=word.term,
        definition=word.definition,
        due_at=updated.due_at,
    )


@app.get("/api/users/{user_id}/stats", response_model=schemas.StatsRead)
def stats(user_id: int = Path(..., ge=1), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    total_cards = crud.count_user_total_cards(db, user_id=user_id)
    strong_cards = crud.count_user_strong_cards(db, user_id=user_id)
    due_cards = len(crud.get_due_user_words(db, user_id=user_id, now=now, limit=10000))
    return schemas.StatsRead(total_cards=total_cards, strong_cards=strong_cards, due_cards=due_cards)


@app.get("/api/health")
def healthcheck():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import APIRouter, Depends, HTTPException

from backend.models.schemas import ProgressIn, ProgressOut
from backend.models.database import supabase
from backend.services.auth import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/{book_id}", response_model=ProgressOut)
async def save_progress(
    book_id: str,
    body: ProgressIn,
    user_id: str = Depends(get_current_user),
):
    book = supabase.table("books").select("id, user_id").eq("id", book_id).single().execute()
    if not book.data or book.data["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Book not found")

    scroll_percent = max(0.0, min(100.0, body.scroll_percent))

    supabase.table("reading_progress").upsert(
        {
            "user_id": user_id,
            "book_id": book_id,
            "scroll_percent": scroll_percent,
        },
        on_conflict="user_id,book_id",
    ).execute()

    return {"book_id": book_id, "scroll_percent": scroll_percent}


@router.get("/{book_id}", response_model=ProgressOut)
async def get_progress(
    book_id: str,
    user_id: str = Depends(get_current_user),
):
    book = supabase.table("books").select("id, user_id").eq("id", book_id).single().execute()
    if not book.data or book.data["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Book not found")

    row = (
        supabase.table("reading_progress")
        .select("scroll_percent")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .maybe_single()
        .execute()
    )

    scroll_percent = row.data["scroll_percent"] if (row and row.data) else 0.0
    return {"book_id": book_id, "scroll_percent": scroll_percent}

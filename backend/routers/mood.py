from fastapi import APIRouter, Depends, HTTPException

from backend.models.schemas import MoodChunk, MoodTimeline
from backend.models.database import supabase
from backend.services.auth import get_current_user
from backend.services.nlp import smooth_emotions

router = APIRouter(prefix="/mood", tags=["mood"])


@router.get("/{book_id}", response_model=MoodTimeline)
async def get_mood_timeline(book_id: str, user_id: str = Depends(get_current_user)):
    book = supabase.table("books").select("id, status, user_id").eq("id", book_id).single().execute()
    if not book.data:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if book.data["status"] != "ready":
        raise HTTPException(status_code=409, detail=f"Book not ready (status: {book.data['status']})")

    rows = (
        supabase.table("mood_timelines")
        .select("chunk_index, emotion, confidence, text")
        .eq("book_id", book_id)
        .order("chunk_index")
        .execute()
    )
    smoothed = smooth_emotions([row["emotion"] for row in rows.data])
    timeline = [
        {**row, "smoothed_emotion": smoothed[i]}
        for i, row in enumerate(rows.data)
    ]
    return {
        "book_id": book_id,
        "total_chunks": len(timeline),
        "timeline": timeline,
    }


@router.get("/{book_id}/at/{chunk_index}", response_model=MoodChunk)
async def get_mood_at_chunk(book_id: str, chunk_index: int, user_id: str = Depends(get_current_user)):
    book = supabase.table("books").select("user_id, status").eq("id", book_id).single().execute()
    if not book.data or book.data["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Book not found")

    row = (
        supabase.table("mood_timelines")
        .select("chunk_index, emotion, confidence")
        .eq("book_id", book_id)
        .eq("chunk_index", chunk_index)
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail=f"No mood data for chunk {chunk_index}")
    return row.data

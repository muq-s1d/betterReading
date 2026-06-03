import os
from backend.models.database import supabase


async def upload_book(user_id: str, book_id: str, file_bytes: bytes, ext: str) -> str:
    bucket = supabase.storage.from_("books")
    file_path = f"{user_id}/{book_id}.{ext}"
    bucket.upload(file_path, file_bytes)
    return file_path


async def delete_book(file_path: str) -> None:
    bucket = supabase.storage.from_("books")
    bucket.remove([file_path])

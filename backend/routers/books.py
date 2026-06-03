from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from uuid import uuid4
import filetype

from backend.models.schemas import BookOut
from backend.models.database import supabase
from backend.services.storage import upload_book, delete_book
from backend.services.extractor import get_pdf_metadata, get_epub_metadata
from backend.services.auth import get_current_user

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/upload", response_model=BookOut, status_code=201)
async def upload_book_endpoint(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    author: str = Form(default=""),
    user_id: str = Depends(get_current_user),
):
    file_bytes = await file.read()

    if len(file_bytes) > 52_428_800:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    if not file.filename or not file.filename.endswith((".pdf", ".epub")):
        raise HTTPException(status_code=400, detail="Invalid file extension")

    guess = filetype.guess(file_bytes)
    if not guess or guess.mime not in ["application/pdf", "application/epub+zip"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    ext = "pdf" if guess.mime == "application/pdf" else "epub"

    try:
        if ext == "pdf":
            metadata = get_pdf_metadata(file_bytes)
        else:
            metadata = get_epub_metadata(file_bytes)
    except Exception:
        metadata = {"title": None, "author": None}

    final_title = title or metadata.get("title") or file.filename.rsplit(".", 1)[0]
    final_author = author or metadata.get("author")

    book_id = str(uuid4())

    try:
        await upload_book(user_id, book_id, file_bytes, ext)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    file_path = f"{user_id}/{book_id}.{ext}"

    try:
        result = supabase.table("books").insert({
            "id": book_id,
            "user_id": user_id,
            "title": final_title,
            "author": final_author,
            "file_path": file_path,
            "file_format": ext,
            "file_size": len(file_bytes),
            "status": "pending",
        }).execute()
    except Exception as e:
        await delete_book(file_path)
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

    return result.data[0]


@router.get("", response_model=list[BookOut])
async def list_books(user_id: str = Depends(get_current_user)):
    result = supabase.table("books").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data

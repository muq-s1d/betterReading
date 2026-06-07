from backend.models.database import supabase
from backend.services.extractor import extract_pdf_text, extract_epub_text, chunk_paragraphs
from backend.services.nlp import classify_chunks


def run_pipeline(book_id: str, file_path: str, file_format: str) -> None:
    book = supabase.table("books").select("status").eq("id", book_id).single().execute()
    if book.data and book.data["status"] in ("processing", "ready"):
        return

    supabase.table("books").update({"status": "processing"}).eq("id", book_id).execute()

    try:
        file_bytes = supabase.storage.from_("books").download(file_path)

        if file_format == "pdf":
            paragraphs = extract_pdf_text(file_bytes)
        else:
            paragraphs = extract_epub_text(file_bytes)

        if not paragraphs:
            supabase.table("books").update({
                "status": "error",
                "processing_error": "No extractable text found",
            }).eq("id", book_id).execute()
            return

        chunks = chunk_paragraphs(paragraphs)

        if not chunks:
            supabase.table("books").update({
                "status": "error",
                "processing_error": "No text chunks produced",
            }).eq("id", book_id).execute()
            return

        results = classify_chunks(chunks)

        rows = [
            {
                "book_id": book_id,
                "chunk_index": r["chunk_index"],
                "emotion": r["emotion"],
                "confidence": r["confidence"],
                "text": chunks[r["chunk_index"]],
            }
            for r in results
        ]

        page_size = 500
        for i in range(0, len(rows), page_size):
            supabase.table("mood_timelines").insert(rows[i:i + page_size]).execute()

        supabase.table("books").update({"status": "ready"}).eq("id", book_id).execute()

    except Exception as e:
        supabase.table("books").update({
            "status": "error",
            "processing_error": str(e)[:500],
        }).eq("id", book_id).execute()

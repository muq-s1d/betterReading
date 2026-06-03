import io
import pdfplumber
from ebooklib import epub
from bs4 import BeautifulSoup


def get_pdf_metadata(file_bytes: bytes) -> dict:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        meta = pdf.metadata or {}
        return {
            "title": meta.get("Title") or None,
            "author": meta.get("Author") or None,
        }


def get_epub_metadata(file_bytes: bytes) -> dict:
    book = epub.read_epub(io.BytesIO(file_bytes))
    title = None
    author = None

    try:
        title_list = book.get_metadata("DC", "title")
        if title_list:
            raw = title_list[0] if isinstance(title_list, list) else title_list
            title = raw[0] if isinstance(raw, tuple) else raw
    except:
        pass

    try:
        author_list = book.get_metadata("DC", "creator")
        if author_list:
            raw = author_list[0] if isinstance(author_list, list) else author_list
            author = raw[0] if isinstance(raw, tuple) else raw
    except:
        pass

    return {"title": title, "author": author}

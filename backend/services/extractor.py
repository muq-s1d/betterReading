import io
import pdfplumber
import ebooklib
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


def extract_pdf_text(file_bytes: bytes) -> list[str]:
    try:
        paragraphs = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                lines = text.split("\n")
                buffer = []
                for line in lines:
                    stripped = line.strip()
                    if stripped:
                        buffer.append(stripped)
                    elif buffer:
                        para = " ".join(buffer)
                        if len(para) >= 15:
                            paragraphs.append(para)
                        buffer = []
                if buffer:
                    para = " ".join(buffer)
                    if len(para) >= 15:
                        paragraphs.append(para)
        return paragraphs
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {e}")


def extract_epub_text(file_bytes: bytes) -> list[str]:
    import tempfile, os
    try:
        with tempfile.NamedTemporaryFile(suffix=".epub", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        book = epub.read_epub(tmp_path)
        os.unlink(tmp_path)
        paragraphs = []
        for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
            soup = BeautifulSoup(item.get_content(), "html.parser")
            p_tags = soup.find_all("p")
            if p_tags:
                for p in p_tags:
                    text = p.get_text(separator=" ", strip=True)
                    if len(text) >= 15:
                        paragraphs.append(text)
            else:
                raw = soup.get_text(separator="\n")
                for chunk in raw.split("\n"):
                    text = chunk.strip()
                    if len(text) >= 15:
                        paragraphs.append(text)
        return paragraphs
    except Exception as e:
        raise ValueError(f"EPUB extraction failed: {e}")


def chunk_paragraphs(paragraphs: list[str], target_words: int = 187) -> list[str]:
    chunks = []
    buffer: list[str] = []
    buffer_words = 0

    for para in paragraphs:
        word_count = len(para.split())
        if buffer and buffer_words + word_count > target_words:
            chunks.append("\n\n".join(buffer))
            buffer = []
            buffer_words = 0
        buffer.append(para)
        buffer_words += word_count
        if buffer_words >= target_words:
            chunks.append("\n\n".join(buffer))
            buffer = []
            buffer_words = 0

    if buffer:
        chunks.append("\n\n".join(buffer))

    return [c for c in chunks if c.strip()]

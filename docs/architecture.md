# Architecture Document

## 1. High-Level Architecture

```
Frontend (Next.js)
       ↓
Backend API (FastAPI - Python)
       ↓
  ─────────────────────────
  | PostgreSQL | Supabase  |
  | Storage                |
  ─────────────────────────
       ↓
  NLP (runs inside FastAPI
  as background tasks)
```

## 2. Why This Stack

- **Next.js**: Great for both UI and simple API routes if needed. Easy Vercel deployment.
- **FastAPI**: Python backend means NLP models (RoBERTa, DistilBERT) run in the same service — no separate worker needed. Fast, async, and simple.
- **Supabase**: Managed PostgreSQL + file storage in one. Free tier is generous. No need to run MinIO locally or manage S3 buckets manually.
- **No Redis / BullMQ**: Overkill for 20 users. FastAPI's built-in `BackgroundTasks` handles async NLP processing just fine for MVP.

## 3. Components

### Frontend (Next.js)
- Reader UI
- Book upload form
- Music player component
- Auth pages (login/register)

### Backend (FastAPI)
- Auth endpoints (JWT)
- Book upload + storage (Supabase Storage)
- Text extraction (PyMuPDF for PDF, ebooklib for EPUB)
- NLP emotion analysis (runs as background task after upload)
- Mood timeline API
- Reading progress tracking

### Database (Supabase / PostgreSQL)
- `users` table
- `books` table
- `mood_timelines` table (chunk index → emotion)
- `reading_progress` table

### Storage (Supabase Storage)
- Uploaded PDF/EPUB files
- No local MinIO needed

### NLP (inside FastAPI)
- Text chunking logic
- Emotion model: DistilBERT fine-tuned on emotion (lightweight, no GPU needed)
- Generates mood timeline stored in DB after upload

## 4. Data Flow

```
Upload → FastAPI → Save file to Supabase Storage
                 → Save metadata to DB
                 → Trigger background task:
                     extract text → chunk → classify emotions → save mood timeline

Read   → Frontend fetches mood at current position
       → Backend returns emotion for that chunk
       → Music player switches track
```

## 5. Deployment

- **Frontend**: Vercel (free)
- **Backend**: Railway or Render (free tier, Python support)
- **Database + Storage**: Supabase (free tier)
- **No Docker required for MVP** (optional for local dev)

## 6. Folder Structure

```
/frontend        → Next.js app
/backend         → FastAPI app
  /routers       → auth, books, mood, progress
  /services      → text extraction, NLP, storage
  /models        → DB models
/docs            → PRD, architecture, implementation plan
CLAUDE.md        → Instructions for Claude Code
SPEC.md          → Project spec + checklist
```

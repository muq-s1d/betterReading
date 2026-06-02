# Implementation Plan

## Phase 1: Project Scaffold
- Initialize Next.js frontend
- Initialize FastAPI backend
- Set up Supabase project (get DB URL + storage bucket)
- Connect FastAPI to Supabase PostgreSQL
- Basic folder structure in place
- Environment variables configured (.env files)

## Phase 2: Auth System
- User registration endpoint (FastAPI)
- User login endpoint with JWT token
- Password hashing (bcrypt)
- Auth middleware / dependency
- Login + Register pages (Next.js)
- Store JWT in localStorage / cookie

## Phase 3: Book Upload
- Upload endpoint (FastAPI) — accepts PDF/EPUB
- Save file to Supabase Storage
- Save book metadata to `books` table
- Upload UI (Next.js) — drag and drop or file picker
- Book list page showing uploaded books

## Phase 4: Text Extraction + NLP Pipeline
- PDF text extraction using PyMuPDF
- EPUB text extraction using ebooklib
- Text chunking logic (split by paragraph or fixed token size)
- Integrate DistilBERT emotion classifier
- Run extraction + classification as FastAPI BackgroundTask after upload
- Save mood timeline to `mood_timelines` table

## Phase 5: Reader UI
- Basic scroll-based reader in Next.js
- Fetch book content from backend
- Track reading position (scroll %)
- Fetch mood for current position from backend
- Progress saved to `reading_progress` table

## Phase 6: Music Engine
- Curate small playlist per emotion (6 moods × 2-3 tracks = ~18 tracks)
- Mood → track mapping in frontend
- Audio player component (HTML5 Audio or Howler.js)
- Smooth crossfade transition when mood changes
- Sync music switch with reading position

## Phase 7: Polish + Deployment
- Mobile responsive design
- Loading states, error handling
- Deploy frontend to Vercel
- Deploy backend to Railway or Render
- Connect to Supabase in production
- End-to-end test the full flow

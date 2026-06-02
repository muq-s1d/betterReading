# E-Reader Mood Music — Project Spec

## Overview
An AI-powered e-reader where background music dynamically adapts to the emotional tone of the content being read. Users upload a PDF or EPUB, the system analyzes the text in chunks, generates a mood timeline, and plays matching ambient music while they read.

## Stack
Next.js · FastAPI · Supabase · DistilBERT (HuggingFace)

## Core User Flow
1. User signs up / logs in
2. User uploads a PDF or EPUB book
3. System extracts text and runs emotion classification in the background
4. User opens the reader — music starts playing based on detected mood
5. As user scrolls, music transitions smoothly to match the new mood

## Emotion Categories
Joy · Sadness · Fear · Anger · Romance · Neutral

## Phase Checklist

### Phase 1 — Scaffold
- [ ] Next.js frontend initialized
- [ ] FastAPI backend initialized
- [ ] Supabase project created (DB URL + storage bucket)
- [ ] .env files configured
- [ ] Both services run locally

### Phase 2 — Auth
- [ ] Register endpoint (FastAPI)
- [ ] Login endpoint with JWT
- [ ] Auth middleware
- [ ] Login + Register pages (Next.js)

### Phase 3 — Book Upload
- [ ] Upload endpoint (PDF/EPUB)
- [ ] File saved to Supabase Storage
- [ ] Metadata saved to `books` table
- [ ] Upload UI in Next.js
- [ ] Book list page

### Phase 4 — NLP Pipeline
- [ ] PDF extraction (PyMuPDF)
- [ ] EPUB extraction (ebooklib)
- [ ] Text chunking
- [ ] DistilBERT emotion classifier integrated
- [ ] Pipeline runs as FastAPI BackgroundTask
- [ ] Mood timeline saved to `mood_timelines` table

### Phase 5 — Reader
- [ ] Scroll-based reader UI
- [ ] Fetch mood at current reading position
- [ ] Progress saved to DB

### Phase 6 — Music Engine
- [ ] Playlist per emotion (6 moods)
- [ ] Audio player component (Howler.js)
- [ ] Smooth crossfade on mood change
- [ ] Synced with scroll position

### Phase 7 — Deployment
- [ ] Frontend on Vercel
- [ ] Backend on Railway or Render
- [ ] Production Supabase connected
- [ ] Full flow tested end-to-end

# Project: AI-Powered E-Reader with Mood Music

## What We're Building
An e-reader web app that uploads PDF/EPUB books, analyzes emotional tone using NLP, and plays adaptive background music based on what the user is reading.

## Stack
- **Frontend**: Next.js (deployed on Vercel)
- **Backend**: FastAPI — Python (deployed on Railway or Render)
- **Database + Storage**: Supabase (managed PostgreSQL + file storage)
- **NLP**: DistilBERT via HuggingFace — runs inside FastAPI as BackgroundTasks
- **No Redis, No Docker, No BullMQ** — intentionally kept simple for MVP

## Folder Structure
```
/frontend        → Next.js app
/backend         → FastAPI app
  /routers       → auth, books, mood, progress
  /services      → text extraction, NLP, storage
  /models        → DB models
/docs            → prd.md, architecture.md, implementation_plan.md
CLAUDE.md        → this file
SPEC.md          → project spec + phase checklist
```

## Code Style
- Keep frontend and backend completely separate
- All NLP runs as FastAPI BackgroundTasks — never block an endpoint
- Use async functions in FastAPI where possible
- Simple and readable over clever and complex

## Workflow Rules
- Always test each endpoint works before moving to the next phase
- Commit after each working phase
- Run `uvicorn main:app --reload` to test backend
- Run `npm run dev` to test frontend

## Implementation Order (strict)
1. Project scaffold + Supabase setup
2. Auth (register/login with JWT)
3. Book upload + Supabase Storage
4. Text extraction + NLP pipeline (BackgroundTask)
5. Reader UI + mood fetch
6. Music engine (mood → audio)
7. Polish + deployment

## Golden Rule
Build vertical slice first: **upload → extract → read → mood music**
One working phase at a time. Do not skip ahead.

## Communication Style
- Explain things simply without jargon
- Concise over verbose — simple and direct
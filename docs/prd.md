# Product Requirements Document (PRD)

## 1. Project Overview

An AI-powered e-reader web app where users upload PDF/EPUB books and background music dynamically adapts to the emotional tone of the content being read.

The system analyzes text in chunks, generates a mood timeline, and plays matching ambient music in real-time while the user reads.

## 2. Goals

### Primary Goals
- Upload and read PDF/EPUB books
- Extract and process book content
- Analyze emotional tone using NLP
- Generate mood timeline
- Dynamically adjust background music based on mood
- Mobile + desktop support

### Secondary Goals
- Clean, simple architecture that's easy to host
- Learning project: FastAPI, NLP models, Next.js

## 3. Core Features

### User System
- Register / Login (JWT auth)
- Session management
- Reading history

### Book Management
- Upload PDF/EPUB
- Text extraction
- Metadata storage

### Reader
- Scroll-based reading
- Progress tracking
- Fullscreen mode

### Emotion Analysis
- Text chunking
- Emotion classification: Joy, Sadness, Fear, Anger, Romance, Neutral
- Mood timeline generation and storage

### Music Engine
- Mood → playlist mapping
- Dynamic switching with smooth transitions
- Synced with reading position

## 4. Non-Functional Requirements
- Simple to deploy (minimal services)
- Low latency reader experience
- Mobile-first design
- Cost-efficient (free tiers where possible)

## 5. Constraints
- ~20 users initial deployment
- MVP first — no over-engineering
- Free/cheap hosting preferred

## 6. Future Enhancements
- AI-generated music
- Personalization per user
- Audiobook sync

-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  hashed_password text not null,
  created_at timestamptz default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  file_path text not null,
  status text not null default 'pending', -- pending | processing | ready
  created_at timestamptz default now()
);

create table if not exists mood_timelines (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade not null,
  chunk_index integer not null,
  emotion text not null, -- joy | sadness | fear | anger | romance | neutral
  confidence real not null,
  created_at timestamptz default now()
);

create table if not exists reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  scroll_percent real not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

-- Indexes for common query patterns
create index if not exists idx_books_user_id on books(user_id);
create index if not exists idx_mood_timelines_book_id on mood_timelines(book_id);
create index if not exists idx_mood_timelines_chunk on mood_timelines(book_id, chunk_index);
create index if not exists idx_reading_progress_user_book on reading_progress(user_id, book_id);

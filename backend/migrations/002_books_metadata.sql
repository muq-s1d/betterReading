-- Phase 3: Add metadata columns to books table
ALTER TABLE books
  ADD COLUMN author text,
  ADD COLUMN file_format text CHECK (file_format IN ('pdf', 'epub')),
  ADD COLUMN file_size bigint;

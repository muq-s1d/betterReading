-- Phase 4: add processing_error column for pipeline failure diagnostics
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS processing_error text;

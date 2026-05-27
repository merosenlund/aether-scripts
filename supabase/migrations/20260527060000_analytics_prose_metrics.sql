-- Expand writing_sessions with prose readability metrics and character-level efficiency tracking.
-- All new columns are nullable so pre-migration rows are unaffected; NULL means "no data yet."
ALTER TABLE public.writing_sessions
  ADD COLUMN IF NOT EXISTS starting_char_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_characters        INTEGER,
  ADD COLUMN IF NOT EXISTS avg_sentence_length   FLOAT,
  ADD COLUMN IF NOT EXISTS avg_word_length       FLOAT,
  ADD COLUMN IF NOT EXISTS flesch_reading_ease   FLOAT,
  ADD COLUMN IF NOT EXISTS type_token_ratio      FLOAT;

-- Index for date-windowed trend queries
CREATE INDEX IF NOT EXISTS idx_writing_sessions_author_start
  ON public.writing_sessions (author_id, start_time DESC);

-- Partial index to efficiently filter sessions that have readability data
CREATE INDEX IF NOT EXISTS idx_writing_sessions_has_readability
  ON public.writing_sessions (author_id, start_time DESC)
  WHERE flesch_reading_ease IS NOT NULL;

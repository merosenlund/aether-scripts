-- Add word_count column to scenes to easily query/cache latest scene length
ALTER TABLE public.scenes 
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0 NOT NULL CHECK (word_count >= 0);

-- Update existing scenes to have some default word count (0 is fine)
UPDATE public.scenes SET word_count = 0 WHERE word_count IS NULL;

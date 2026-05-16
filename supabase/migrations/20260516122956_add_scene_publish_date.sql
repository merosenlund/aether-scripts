-- Add published_at to scenes
ALTER TABLE public.scenes 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Create an index for faster sorting by publish date
CREATE INDEX IF NOT EXISTS idx_scenes_published_at ON public.scenes(published_at) WHERE published_at IS NOT NULL;

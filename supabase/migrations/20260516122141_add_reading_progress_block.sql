-- Add current_block_id and current_scene_id to reading_progress
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS current_block_id TEXT,
ADD COLUMN IF NOT EXISTS current_scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL;

-- Add trigger for updated_at on reading_progress
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reading_progress_updated_at ON public.reading_progress;
CREATE TRIGGER set_reading_progress_updated_at
BEFORE UPDATE ON public.reading_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

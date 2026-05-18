-- Phase 4: Serial Management & Publishing Workflows

-- 1. Alter scenes table
ALTER TABLE public.scenes
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('Hidden', 'Published', 'Beta', 'Editing', 'Playing')) DEFAULT 'Playing',
ADD COLUMN IF NOT EXISTS semantic_version TEXT DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS scheduled_status TEXT CHECK (scheduled_status IN ('Hidden', 'Published', 'Beta', 'Editing', 'Playing')),
ADD COLUMN IF NOT EXISTS scheduled_status_at TIMESTAMP WITH TIME ZONE;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_scenes_status ON public.scenes(status);
CREATE INDEX IF NOT EXISTS idx_scenes_scheduled ON public.scenes(scheduled_status_at) WHERE scheduled_status_at IS NOT NULL;

-- 2. Alter serials table
ALTER TABLE public.serials
ADD COLUMN IF NOT EXISTS next_scene_completion_percentage INTEGER DEFAULT 0 CHECK (next_scene_completion_percentage >= 0 AND next_scene_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS next_scene_update_note TEXT;

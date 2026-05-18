-- Create author_goals table to track word count goals
CREATE TABLE IF NOT EXISTS public.author_goals (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_word_goal INTEGER DEFAULT 0 CHECK (daily_word_goal >= 0),
    weekly_word_goal INTEGER DEFAULT 0 CHECK (weekly_word_goal >= 0),
    monthly_word_goal INTEGER DEFAULT 0 CHECK (monthly_word_goal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on author_goals
ALTER TABLE public.author_goals ENABLE ROW LEVEL SECURITY;

-- Policies for author_goals
CREATE POLICY "Users can manage their own goals" 
ON public.author_goals 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create writing_sessions table to track writing time & metrics
CREATE TABLE IF NOT EXISTS public.writing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    serial_id UUID REFERENCES public.serials(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
    session_type TEXT CHECK (session_type IN ('play', 'edit')) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    active_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_duration_seconds >= 0),
    starting_word_count INTEGER NOT NULL DEFAULT 0 CHECK (starting_word_count >= 0),
    ending_word_count INTEGER NOT NULL DEFAULT 0 CHECK (ending_word_count >= 0),
    keystrokes INTEGER NOT NULL DEFAULT 0 CHECK (keystrokes >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on writing_sessions
ALTER TABLE public.writing_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for writing_sessions
CREATE POLICY "Users can manage their own writing sessions" 
ON public.writing_sessions 
FOR ALL 
TO authenticated 
USING (auth.uid() = author_id) 
WITH CHECK (auth.uid() = author_id);

-- Alter scenes to add status_word_counts
ALTER TABLE public.scenes 
ADD COLUMN IF NOT EXISTS status_word_counts JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Trigger to update updated_at on author_goals
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_author_goals_timestamp
BEFORE UPDATE ON public.author_goals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index for analytics querying
CREATE INDEX IF NOT EXISTS idx_writing_sessions_author ON public.writing_sessions(author_id);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_scene ON public.writing_sessions(scene_id);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_serial ON public.writing_sessions(serial_id);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_type ON public.writing_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_writing_sessions_start_time ON public.writing_sessions(start_time);

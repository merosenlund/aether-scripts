-- Create waitlist table for capturing early-access signup interests
CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    email text NOT NULL UNIQUE,
    interest_note text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (the signup interest form is public)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Only service_role/admin can read (for back-office list exporting)
CREATE POLICY "Service role reads waitlist" ON public.waitlist
    FOR SELECT USING (auth.role() = 'service_role');

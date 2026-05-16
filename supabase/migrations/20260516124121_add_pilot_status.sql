-- Update serials status constraint to include 'pilot'
DO $$ 
BEGIN 
    -- Try to drop the existing constraint if it exists (assuming default naming)
    ALTER TABLE public.serials DROP CONSTRAINT IF EXISTS serials_status_check;
END $$;

ALTER TABLE public.serials 
ADD CONSTRAINT serials_status_check 
CHECK (status IN ('draft', 'pilot', 'active', 'complete', 'hiatus'));

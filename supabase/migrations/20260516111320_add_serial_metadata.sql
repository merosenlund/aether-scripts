-- Add status and color_theme to serials table
ALTER TABLE serials 
ADD COLUMN IF NOT EXISTS color_theme TEXT NOT NULL DEFAULT 'from-violet-600 to-indigo-600',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'complete', 'hiatus'));

-- Add updated_at if it doesn't exist for serials
ALTER TABLE serials
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_serials_updated_at ON serials;
CREATE TRIGGER update_serials_updated_at
    BEFORE UPDATE ON serials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

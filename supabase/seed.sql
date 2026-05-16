-- Seed data for Aether Scripts local development

-- Create a dummy user ID (we'll use a fixed one for local dev)
DO $$
DECLARE
    user_id UUID := '00000000-0000-0000-0000-000000000000';
    serial_id UUID := 'e285448b-70c8-47bc-8484-82a933f57243';
    scene_id UUID := 'd198448b-70c8-47bc-8484-82a933f57242';
BEGIN
    -- Insert a test user into auth.users
    INSERT INTO auth.users (id, email)
    VALUES (user_id, 'test@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- Insert Serial
    INSERT INTO serials (id, author_id, title)
    VALUES (serial_id, user_id, 'Test Serial')
    ON CONFLICT (id) DO NOTHING;

    -- Insert Scene
    INSERT INTO scenes (id, serial_id, order_index, author_title, content_blocks)
    VALUES (scene_id, serial_id, 1, 'Chapter 1: The Awakening', '[]'::jsonb)
    ON CONFLICT (id) DO NOTHING;
END $$;

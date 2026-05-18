-- Seed data for Aether Scripts local development

-- Modify the handle_new_user function to assign the first real user as an author and give them the seed data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  IF new.id = '00000000-0000-0000-0000-000000000000' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'author');
  ELSIF user_count = 2 THEN
    -- First real user (since 0000... is the first user)
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'author');
    -- Transfer ownership of seed data from dummy user to this new user
    UPDATE public.serials SET author_id = new.id WHERE author_id = '00000000-0000-0000-0000-000000000000';
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'reader');
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a dummy user ID (we'll use a fixed one for local dev)
DO $$
DECLARE
    user_id UUID := '00000000-0000-0000-0000-000000000000';
    serial_id UUID := 'e285448b-70c8-47bc-8484-82a933f57243';
    scene_id_1 UUID := 'd198448b-70c8-47bc-8484-82a933f57242';
    scene_id_2 UUID := 'd198448b-70c8-47bc-8484-82a933f57243';
BEGIN
    -- Insert a test user into auth.users
    INSERT INTO auth.users (id, email)
    VALUES (user_id, 'test@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- Insert Serial
    INSERT INTO serials (id, author_id, title)
    VALUES (serial_id, user_id, 'Test Serial')
    ON CONFLICT (id) DO NOTHING;

    -- Insert Scene 1 (Published)
    INSERT INTO scenes (id, serial_id, order_index, author_title, status, content_blocks)
    VALUES (
        scene_id_1, 
        serial_id, 
        1, 
        'Chapter 1: The Awakening', 
        'Published', 
        '{
          "type": "doc",
          "content": [
            {
              "type": "heading",
              "attrs": { "level": 2 },
              "content": [
                { "type": "text", "text": "Chapter 1: The Awakening" }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "The morning sun peeked over the horizon, casting a golden hue over the quiet city of Midland. Aether hummed in the air, a faint vibration that only the attuned could feel." }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "Elias woke with a start, the lingering echoes of a dream fading from his mind. Today was the day." }
              ]
            }
          ]
        }'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert Scene 2 (Editing)
    INSERT INTO scenes (id, serial_id, order_index, author_title, status, content_blocks)
    VALUES (
        scene_id_2, 
        serial_id, 
        2, 
        'Chapter 2: The Journey Begins', 
        'Editing', 
        '{
          "type": "doc",
          "content": [
            {
              "type": "heading",
              "attrs": { "level": 2 },
              "content": [
                { "type": "text", "text": "Chapter 2: The Journey Begins" }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "Stepping out into the bustling streets, Elias could feel the weight of his new responsibilities. The journey ahead would be long and fraught with peril." }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "(Needs more description here about the marketplace)" }
              ]
            }
          ]
        }'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

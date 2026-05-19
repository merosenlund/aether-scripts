-- Drop legacy wiki_facts table
DROP TABLE IF EXISTS wiki_facts CASCADE;

-- Create wiki_events table
CREATE TABLE IF NOT EXISTS wiki_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES wiki_entities(id) ON DELETE CASCADE NOT NULL,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    block_id TEXT, -- Nullable to support scene-level or unanchored events
    event_type TEXT NOT NULL, -- 'create', 'update_description', 'add_fact', 'remove_fact', 'set_clock', 'increment_clock', 'decrement_clock', 'set_track'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning-fast queries by entity and block sequence
CREATE INDEX IF NOT EXISTS idx_wiki_events_entity_id ON wiki_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_wiki_events_scene_block ON wiki_events(scene_id, block_id);

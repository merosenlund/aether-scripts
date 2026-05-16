-- 1. Scene Versions (Explicit snapshots)
CREATE TABLE IF NOT EXISTS scene_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL DEFAULT '[]'::jsonb, -- Tiptap JSON
    stage TEXT NOT NULL DEFAULT 'Draft' CHECK (stage IN ('Draft', 'Edit', 'Published')),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_scene_versions_scene_id ON scene_versions(scene_id);

-- 2. Yjs Updates (CRDT Storage for granular history)
CREATE TABLE IF NOT EXISTS scene_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    update_data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scene_updates_scene_id ON scene_updates(scene_id);

-- 3. Refactor Wiki Entities
ALTER TABLE wiki_entities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE wiki_entities ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Wiki Anchors (Tying entities to specific blocks)
CREATE TABLE IF NOT EXISTS wiki_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES wiki_entities(id) ON DELETE CASCADE NOT NULL,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    block_id TEXT NOT NULL, -- The specific Tiptap block ID
    reveal_type TEXT NOT NULL DEFAULT 'scroll' CHECK (reveal_type IN ('scroll', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_anchors_scene_id ON wiki_anchors(scene_id);
CREATE INDEX IF NOT EXISTS idx_wiki_anchors_entity_id ON wiki_anchors(entity_id);

-- 5. Add block_id and visibility to existing content_blocks structure (comment only for schema understanding)
-- We will handle block_id generation in the editor logic, but the JSONB structure in 'scenes' 
-- and 'scene_versions' should now expect: { id: string, type: string, content: [...], attrs: { visibility: 'prose' | 'mechanics' | 'director' } }

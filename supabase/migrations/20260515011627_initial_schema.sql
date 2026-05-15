-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Serials
CREATE TABLE serials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arcs
CREATE TABLE arcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id UUID REFERENCES serials(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- Scenes
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id UUID REFERENCES serials(id) ON DELETE CASCADE NOT NULL,
    arc_id UUID REFERENCES arcs(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL,
    author_title TEXT,
    display_title TEXT,
    description TEXT,
    summary TEXT,
    content_blocks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wiki Entities
CREATE TABLE wiki_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id UUID REFERENCES serials(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Character', 'Location'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wiki Facts
CREATE TABLE wiki_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES wiki_entities(id) ON DELETE CASCADE NOT NULL,
    valid_from_scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    valid_until_scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Progress
CREATE TABLE reading_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    serial_id UUID REFERENCES serials(id) ON DELETE CASCADE NOT NULL,
    furthest_read_scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, serial_id)
);

-- Reading Lists
CREATE TABLE reading_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    serial_id UUID REFERENCES serials(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading List Arcs
CREATE TABLE reading_list_arcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES reading_lists(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- Reading List Items
-- reading_mode: 'prose', 'summary', 'description', 'skip'
CREATE TABLE reading_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES reading_lists(id) ON DELETE CASCADE NOT NULL,
    list_arc_id UUID REFERENCES reading_list_arcs(id) ON DELETE SET NULL,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER NOT NULL,
    reading_mode TEXT NOT NULL DEFAULT 'prose' CHECK (reading_mode IN ('prose', 'summary', 'description', 'skip'))
);

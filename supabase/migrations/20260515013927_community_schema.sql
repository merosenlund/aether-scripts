-- User Roles
CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'beta_reader', 'author')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inline Comments
CREATE TABLE inline_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    block_id TEXT NOT NULL,
    selected_text TEXT,
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Private Notes
CREATE TABLE private_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE NOT NULL,
    block_id TEXT NOT NULL,
    selected_text TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

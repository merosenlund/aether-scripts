-- Phase 8: Comprehensive Row Level Security (RLS) Enablement

-- Enable RLS
ALTER TABLE serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inline_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_notes ENABLE ROW LEVEL SECURITY;

-- Note: author_goals and writing_sessions already have RLS enabled.

-- 1. Serials
CREATE POLICY "Public can view serials" ON serials FOR SELECT USING (true);
CREATE POLICY "Authors can manage their own serials" ON serials FOR ALL USING (auth.uid() = author_id);

-- 2. Arcs
CREATE POLICY "Public can view arcs" ON arcs FOR SELECT USING (true);
CREATE POLICY "Authors can manage arcs of their serials" ON arcs FOR ALL USING (
    EXISTS (SELECT 1 FROM serials WHERE serials.id = arcs.serial_id AND serials.author_id = auth.uid())
);

-- 3. Scenes
CREATE POLICY "Public can view published scenes" ON scenes FOR SELECT USING (status = 'Published');
CREATE POLICY "Authors can view all scenes of their serials" ON scenes FOR SELECT USING (
    EXISTS (SELECT 1 FROM serials WHERE serials.id = scenes.serial_id AND serials.author_id = auth.uid())
);
CREATE POLICY "Authors can insert scenes to their serials" ON scenes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM serials WHERE serials.id = scenes.serial_id AND serials.author_id = auth.uid())
);
CREATE POLICY "Authors can update scenes of their serials" ON scenes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM serials WHERE serials.id = scenes.serial_id AND serials.author_id = auth.uid())
);
CREATE POLICY "Authors can delete scenes of their serials" ON scenes FOR DELETE USING (
    EXISTS (SELECT 1 FROM serials WHERE serials.id = scenes.serial_id AND serials.author_id = auth.uid())
);

-- 4. Scene Versions & Updates
CREATE POLICY "Authors can manage scene versions" ON scene_versions FOR ALL USING (
    EXISTS (SELECT 1 FROM scenes s JOIN serials se ON s.serial_id = se.id WHERE s.id = scene_versions.scene_id AND se.author_id = auth.uid())
);
CREATE POLICY "Authors can manage scene updates" ON scene_updates FOR ALL USING (
    EXISTS (SELECT 1 FROM scenes s JOIN serials se ON s.serial_id = se.id WHERE s.id = scene_updates.scene_id AND se.author_id = auth.uid())
);

-- 5. Wiki Entities & Events & Anchors
CREATE POLICY "Public can view wiki entities" ON wiki_entities FOR SELECT USING (true);
CREATE POLICY "Authors can manage wiki entities" ON wiki_entities FOR ALL USING (
    EXISTS (SELECT 1 FROM serials WHERE serials.id = wiki_entities.serial_id AND serials.author_id = auth.uid())
);

CREATE POLICY "Public can view wiki events" ON wiki_events FOR SELECT USING (true);
CREATE POLICY "Authors can manage wiki events" ON wiki_events FOR ALL USING (
    EXISTS (SELECT 1 FROM wiki_entities w JOIN serials s ON w.serial_id = s.id WHERE w.id = wiki_events.entity_id AND s.author_id = auth.uid())
);

CREATE POLICY "Public can view wiki anchors" ON wiki_anchors FOR SELECT USING (true);
CREATE POLICY "Authors can manage wiki anchors" ON wiki_anchors FOR ALL USING (
    EXISTS (SELECT 1 FROM scenes sc JOIN serials s ON sc.serial_id = s.id WHERE sc.id = wiki_anchors.scene_id AND s.author_id = auth.uid())
);

-- Handle wiki_facts if it still exists (deprecated in Phase 7)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wiki_facts') THEN
    EXECUTE 'ALTER TABLE wiki_facts ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'CREATE POLICY "Public can view wiki facts" ON wiki_facts FOR SELECT USING (true);';
    EXECUTE 'CREATE POLICY "Authors can manage wiki facts" ON wiki_facts FOR ALL USING (EXISTS (SELECT 1 FROM wiki_entities w JOIN serials s ON w.serial_id = s.id WHERE w.id = wiki_facts.entity_id AND s.author_id = auth.uid()));';
  END IF;
END $$;

-- 6. Reader Progress & Lists
CREATE POLICY "Users can manage their reading progress" ON reading_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their reading lists" ON reading_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage reading list arcs" ON reading_list_arcs FOR ALL USING (
    EXISTS (SELECT 1 FROM reading_lists rl WHERE rl.id = reading_list_arcs.list_id AND rl.user_id = auth.uid())
);
CREATE POLICY "Users can manage reading list items" ON reading_list_items FOR ALL USING (
    EXISTS (SELECT 1 FROM reading_lists rl WHERE rl.id = reading_list_items.list_id AND rl.user_id = auth.uid())
);

-- 7. Community (User Roles, Comments, Notes)
CREATE POLICY "Public can view user roles" ON user_roles FOR SELECT USING (true);
-- Service role only for mutating user roles

CREATE POLICY "Users can manage their inline comments" ON inline_comments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view inline comments on published scenes" ON inline_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM scenes s WHERE s.id = inline_comments.scene_id AND s.status = 'Published')
);

CREATE POLICY "Users can manage their private notes" ON private_notes FOR ALL USING (auth.uid() = user_id);

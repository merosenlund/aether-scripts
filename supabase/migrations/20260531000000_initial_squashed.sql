


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'reader');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_scene_publish_reset_teaser"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the scene status is being changed to 'Published'
    IF NEW.status = 'Published' AND (OLD.status IS DISTINCT FROM 'Published' OR OLD.status IS NULL) THEN
        -- Reset the serial's teaser columns if this scene is the current teaser target
        UPDATE public.serials
        SET 
            next_scene_completion_percentage = 0,
            next_scene_update_note = NULL,
            teaser_target_scene_id = NULL
        WHERE id = NEW.serial_id AND teaser_target_scene_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_scene_publish_reset_teaser"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."arcs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "serial_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "order_index" integer NOT NULL
);


ALTER TABLE "public"."arcs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."author_goals" (
    "user_id" "uuid" NOT NULL,
    "daily_word_goal" integer DEFAULT 0,
    "weekly_word_goal" integer DEFAULT 0,
    "monthly_word_goal" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "author_goals_daily_word_goal_check" CHECK (("daily_word_goal" >= 0)),
    CONSTRAINT "author_goals_monthly_word_goal_check" CHECK (("monthly_word_goal" >= 0)),
    CONSTRAINT "author_goals_weekly_word_goal_check" CHECK (("weekly_word_goal" >= 0))
);


ALTER TABLE "public"."author_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inline_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "block_id" "text" NOT NULL,
    "selected_text" "text",
    "content" "text" NOT NULL,
    "resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inline_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."private_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "block_id" "text" NOT NULL,
    "selected_text" "text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."private_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_list_arcs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "order_index" integer NOT NULL
);


ALTER TABLE "public"."reading_list_arcs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "list_arc_id" "uuid",
    "scene_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "reading_mode" "text" DEFAULT 'prose'::"text" NOT NULL,
    CONSTRAINT "reading_list_items_reading_mode_check" CHECK (("reading_mode" = ANY (ARRAY['prose'::"text", 'summary'::"text", 'description'::"text", 'skip'::"text"])))
);


ALTER TABLE "public"."reading_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "serial_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "user_id" "uuid" NOT NULL,
    "serial_id" "uuid" NOT NULL,
    "furthest_read_scene_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "current_block_id" "text",
    "current_scene_id" "uuid"
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scene_updates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "update_data" "bytea" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scene_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scene_versions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "content" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "stage" "text" DEFAULT 'Draft'::"text" NOT NULL,
    "is_active" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scene_versions_stage_check" CHECK (("stage" = ANY (ARRAY['Draft'::"text", 'Edit'::"text", 'Published'::"text"])))
);


ALTER TABLE "public"."scene_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scenes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "serial_id" "uuid" NOT NULL,
    "arc_id" "uuid",
    "order_index" integer NOT NULL,
    "author_title" "text",
    "display_title" "text",
    "description" "text",
    "summary" "text",
    "content_blocks" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "status" "text" DEFAULT 'Playing'::"text",
    "semantic_version" "text" DEFAULT '1.0.0'::"text",
    "scheduled_status" "text",
    "scheduled_status_at" timestamp with time zone,
    "status_word_counts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "word_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "scenes_scheduled_status_check" CHECK (("scheduled_status" = ANY (ARRAY['Hidden'::"text", 'Published'::"text", 'Beta'::"text", 'Editing'::"text", 'Playing'::"text"]))),
    CONSTRAINT "scenes_status_check" CHECK (("status" = ANY (ARRAY['Hidden'::"text", 'Published'::"text", 'Beta'::"text", 'Editing'::"text", 'Playing'::"text"]))),
    CONSTRAINT "scenes_word_count_check" CHECK (("word_count" >= 0))
);


ALTER TABLE "public"."scenes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."serials" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "color_theme" "text" DEFAULT 'from-violet-600 to-indigo-600'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "next_scene_completion_percentage" integer DEFAULT 0,
    "next_scene_update_note" "text",
    "teaser_target_scene_id" "uuid",
    CONSTRAINT "serials_next_scene_completion_percentage_check" CHECK ((("next_scene_completion_percentage" >= 0) AND ("next_scene_completion_percentage" <= 100))),
    CONSTRAINT "serials_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pilot'::"text", 'active'::"text", 'complete'::"text", 'hiatus'::"text"])))
);


ALTER TABLE "public"."serials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'reader'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['reader'::"text", 'beta_reader'::"text", 'author'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_anchors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "block_id" "text" NOT NULL,
    "reveal_type" "text" DEFAULT 'scroll'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "wiki_anchors_reveal_type_check" CHECK (("reveal_type" = ANY (ARRAY['scroll'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."wiki_anchors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_entities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "serial_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."wiki_entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "scene_id" "uuid" NOT NULL,
    "block_id" "text",
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wiki_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."writing_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "serial_id" "uuid",
    "scene_id" "uuid",
    "session_type" "text" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "active_duration_seconds" integer DEFAULT 0 NOT NULL,
    "starting_word_count" integer DEFAULT 0 NOT NULL,
    "ending_word_count" integer DEFAULT 0 NOT NULL,
    "keystrokes" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "starting_char_count" integer DEFAULT 0 NOT NULL,
    "net_characters" integer,
    "avg_sentence_length" double precision,
    "avg_word_length" double precision,
    "flesch_reading_ease" double precision,
    "type_token_ratio" double precision,
    CONSTRAINT "writing_sessions_active_duration_seconds_check" CHECK (("active_duration_seconds" >= 0)),
    CONSTRAINT "writing_sessions_ending_word_count_check" CHECK (("ending_word_count" >= 0)),
    CONSTRAINT "writing_sessions_keystrokes_check" CHECK (("keystrokes" >= 0)),
    CONSTRAINT "writing_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['play'::"text", 'edit'::"text"]))),
    CONSTRAINT "writing_sessions_starting_word_count_check" CHECK (("starting_word_count" >= 0))
);


ALTER TABLE "public"."writing_sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."arcs"
    ADD CONSTRAINT "arcs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."author_goals"
    ADD CONSTRAINT "author_goals_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."inline_comments"
    ADD CONSTRAINT "inline_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_notes"
    ADD CONSTRAINT "private_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_list_arcs"
    ADD CONSTRAINT "reading_list_arcs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("user_id", "serial_id");



ALTER TABLE ONLY "public"."scene_updates"
    ADD CONSTRAINT "scene_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scene_versions"
    ADD CONSTRAINT "scene_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."serials"
    ADD CONSTRAINT "serials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."wiki_anchors"
    ADD CONSTRAINT "wiki_anchors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_entities"
    ADD CONSTRAINT "wiki_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_events"
    ADD CONSTRAINT "wiki_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."writing_sessions"
    ADD CONSTRAINT "writing_sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_scene_updates_scene_id" ON "public"."scene_updates" USING "btree" ("scene_id");



CREATE INDEX "idx_scene_versions_scene_id" ON "public"."scene_versions" USING "btree" ("scene_id");



CREATE INDEX "idx_scenes_published_at" ON "public"."scenes" USING "btree" ("published_at") WHERE ("published_at" IS NOT NULL);



CREATE INDEX "idx_scenes_scheduled" ON "public"."scenes" USING "btree" ("scheduled_status_at") WHERE ("scheduled_status_at" IS NOT NULL);



CREATE INDEX "idx_scenes_status" ON "public"."scenes" USING "btree" ("status");



CREATE INDEX "idx_wiki_anchors_entity_id" ON "public"."wiki_anchors" USING "btree" ("entity_id");



CREATE INDEX "idx_wiki_anchors_scene_id" ON "public"."wiki_anchors" USING "btree" ("scene_id");



CREATE INDEX "idx_wiki_events_entity_id" ON "public"."wiki_events" USING "btree" ("entity_id");



CREATE INDEX "idx_wiki_events_scene_block" ON "public"."wiki_events" USING "btree" ("scene_id", "block_id");



CREATE INDEX "idx_writing_sessions_author" ON "public"."writing_sessions" USING "btree" ("author_id");



CREATE INDEX "idx_writing_sessions_author_start" ON "public"."writing_sessions" USING "btree" ("author_id", "start_time" DESC);



CREATE INDEX "idx_writing_sessions_has_readability" ON "public"."writing_sessions" USING "btree" ("author_id", "start_time" DESC) WHERE ("flesch_reading_ease" IS NOT NULL);



CREATE INDEX "idx_writing_sessions_scene" ON "public"."writing_sessions" USING "btree" ("scene_id");



CREATE INDEX "idx_writing_sessions_serial" ON "public"."writing_sessions" USING "btree" ("serial_id");



CREATE INDEX "idx_writing_sessions_start_time" ON "public"."writing_sessions" USING "btree" ("start_time");



CREATE INDEX "idx_writing_sessions_type" ON "public"."writing_sessions" USING "btree" ("session_type");



CREATE OR REPLACE TRIGGER "set_reading_progress_updated_at" BEFORE UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_reset_serial_teaser_on_publish" AFTER UPDATE OF "status" ON "public"."scenes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_scene_publish_reset_teaser"();



CREATE OR REPLACE TRIGGER "trigger_update_author_goals_timestamp" BEFORE UPDATE ON "public"."author_goals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_serials_updated_at" BEFORE UPDATE ON "public"."serials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."arcs"
    ADD CONSTRAINT "arcs_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "public"."serials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."author_goals"
    ADD CONSTRAINT "author_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inline_comments"
    ADD CONSTRAINT "inline_comments_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inline_comments"
    ADD CONSTRAINT "inline_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_notes"
    ADD CONSTRAINT "private_notes_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_notes"
    ADD CONSTRAINT "private_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_list_arcs"
    ADD CONSTRAINT "reading_list_arcs_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_list_arc_id_fkey" FOREIGN KEY ("list_arc_id") REFERENCES "public"."reading_list_arcs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."reading_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_list_items"
    ADD CONSTRAINT "reading_list_items_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "public"."serials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_lists"
    ADD CONSTRAINT "reading_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_current_scene_id_fkey" FOREIGN KEY ("current_scene_id") REFERENCES "public"."scenes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_furthest_read_scene_id_fkey" FOREIGN KEY ("furthest_read_scene_id") REFERENCES "public"."scenes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "public"."serials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scene_updates"
    ADD CONSTRAINT "scene_updates_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scene_versions"
    ADD CONSTRAINT "scene_versions_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_arc_id_fkey" FOREIGN KEY ("arc_id") REFERENCES "public"."arcs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scenes"
    ADD CONSTRAINT "scenes_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "public"."serials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."serials"
    ADD CONSTRAINT "serials_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."serials"
    ADD CONSTRAINT "serials_teaser_target_scene_id_fkey" FOREIGN KEY ("teaser_target_scene_id") REFERENCES "public"."scenes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_anchors"
    ADD CONSTRAINT "wiki_anchors_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."wiki_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_anchors"
    ADD CONSTRAINT "wiki_anchors_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_entities"
    ADD CONSTRAINT "wiki_entities_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "public"."serials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_events"
    ADD CONSTRAINT "wiki_events_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."wiki_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_events"
    ADD CONSTRAINT "wiki_events_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."writing_sessions"
    ADD CONSTRAINT "writing_sessions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."writing_sessions"
    ADD CONSTRAINT "writing_sessions_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."writing_sessions"
    ADD CONSTRAINT "writing_sessions_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "public"."serials"("id") ON DELETE CASCADE;



CREATE POLICY "Authors can delete scenes of their serials" ON "public"."scenes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."serials"
  WHERE (("serials"."id" = "scenes"."serial_id") AND ("serials"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can insert scenes to their serials" ON "public"."scenes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."serials"
  WHERE (("serials"."id" = "scenes"."serial_id") AND ("serials"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage arcs of their serials" ON "public"."arcs" USING ((EXISTS ( SELECT 1
   FROM "public"."serials"
  WHERE (("serials"."id" = "arcs"."serial_id") AND ("serials"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage scene updates" ON "public"."scene_updates" USING ((EXISTS ( SELECT 1
   FROM ("public"."scenes" "s"
     JOIN "public"."serials" "se" ON (("s"."serial_id" = "se"."id")))
  WHERE (("s"."id" = "scene_updates"."scene_id") AND ("se"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage scene versions" ON "public"."scene_versions" USING ((EXISTS ( SELECT 1
   FROM ("public"."scenes" "s"
     JOIN "public"."serials" "se" ON (("s"."serial_id" = "se"."id")))
  WHERE (("s"."id" = "scene_versions"."scene_id") AND ("se"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage their own serials" ON "public"."serials" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can manage wiki anchors" ON "public"."wiki_anchors" USING ((EXISTS ( SELECT 1
   FROM ("public"."scenes" "sc"
     JOIN "public"."serials" "s" ON (("sc"."serial_id" = "s"."id")))
  WHERE (("sc"."id" = "wiki_anchors"."scene_id") AND ("s"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage wiki entities" ON "public"."wiki_entities" USING ((EXISTS ( SELECT 1
   FROM "public"."serials"
  WHERE (("serials"."id" = "wiki_entities"."serial_id") AND ("serials"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage wiki events" ON "public"."wiki_events" USING ((EXISTS ( SELECT 1
   FROM ("public"."wiki_entities" "w"
     JOIN "public"."serials" "s" ON (("w"."serial_id" = "s"."id")))
  WHERE (("w"."id" = "wiki_events"."entity_id") AND ("s"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can update scenes of their serials" ON "public"."scenes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."serials"
  WHERE (("serials"."id" = "scenes"."serial_id") AND ("serials"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can view all scenes of their serials" ON "public"."scenes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."serials"
  WHERE (("serials"."id" = "scenes"."serial_id") AND ("serials"."author_id" = "auth"."uid"())))));



CREATE POLICY "Public can view arcs" ON "public"."arcs" FOR SELECT USING (true);



CREATE POLICY "Public can view inline comments on published scenes" ON "public"."inline_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."scenes" "s"
  WHERE (("s"."id" = "inline_comments"."scene_id") AND ("s"."status" = 'Published'::"text")))));



CREATE POLICY "Public can view published scenes" ON "public"."scenes" FOR SELECT USING (("status" = 'Published'::"text"));



CREATE POLICY "Public can view serials" ON "public"."serials" FOR SELECT USING (true);



CREATE POLICY "Public can view user roles" ON "public"."user_roles" FOR SELECT USING (true);



CREATE POLICY "Public can view wiki anchors" ON "public"."wiki_anchors" FOR SELECT USING (true);



CREATE POLICY "Public can view wiki entities" ON "public"."wiki_entities" FOR SELECT USING (true);



CREATE POLICY "Public can view wiki events" ON "public"."wiki_events" FOR SELECT USING (true);



CREATE POLICY "Users can manage reading list arcs" ON "public"."reading_list_arcs" USING ((EXISTS ( SELECT 1
   FROM "public"."reading_lists" "rl"
  WHERE (("rl"."id" = "reading_list_arcs"."list_id") AND ("rl"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage reading list items" ON "public"."reading_list_items" USING ((EXISTS ( SELECT 1
   FROM "public"."reading_lists" "rl"
  WHERE (("rl"."id" = "reading_list_items"."list_id") AND ("rl"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their inline comments" ON "public"."inline_comments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own goals" ON "public"."author_goals" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own writing sessions" ON "public"."writing_sessions" TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can manage their private notes" ON "public"."private_notes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their reading lists" ON "public"."reading_lists" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their reading progress" ON "public"."reading_progress" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."arcs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."author_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inline_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_list_arcs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scene_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scene_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."serials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_anchors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_entities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."writing_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_scene_publish_reset_teaser"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_scene_publish_reset_teaser"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_scene_publish_reset_teaser"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."arcs" TO "anon";
GRANT ALL ON TABLE "public"."arcs" TO "authenticated";
GRANT ALL ON TABLE "public"."arcs" TO "service_role";



GRANT ALL ON TABLE "public"."author_goals" TO "anon";
GRANT ALL ON TABLE "public"."author_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."author_goals" TO "service_role";



GRANT ALL ON TABLE "public"."inline_comments" TO "anon";
GRANT ALL ON TABLE "public"."inline_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."inline_comments" TO "service_role";



GRANT ALL ON TABLE "public"."private_notes" TO "anon";
GRANT ALL ON TABLE "public"."private_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."private_notes" TO "service_role";



GRANT ALL ON TABLE "public"."reading_list_arcs" TO "anon";
GRANT ALL ON TABLE "public"."reading_list_arcs" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_list_arcs" TO "service_role";



GRANT ALL ON TABLE "public"."reading_list_items" TO "anon";
GRANT ALL ON TABLE "public"."reading_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."reading_lists" TO "anon";
GRANT ALL ON TABLE "public"."reading_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_lists" TO "service_role";



GRANT ALL ON TABLE "public"."reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."scene_updates" TO "anon";
GRANT ALL ON TABLE "public"."scene_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."scene_updates" TO "service_role";



GRANT ALL ON TABLE "public"."scene_versions" TO "anon";
GRANT ALL ON TABLE "public"."scene_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."scene_versions" TO "service_role";



GRANT ALL ON TABLE "public"."scenes" TO "anon";
GRANT ALL ON TABLE "public"."scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."scenes" TO "service_role";



GRANT ALL ON TABLE "public"."serials" TO "anon";
GRANT ALL ON TABLE "public"."serials" TO "authenticated";
GRANT ALL ON TABLE "public"."serials" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_anchors" TO "anon";
GRANT ALL ON TABLE "public"."wiki_anchors" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_anchors" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_entities" TO "anon";
GRANT ALL ON TABLE "public"."wiki_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_entities" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_events" TO "anon";
GRANT ALL ON TABLE "public"."wiki_events" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_events" TO "service_role";



GRANT ALL ON TABLE "public"."writing_sessions" TO "anon";
GRANT ALL ON TABLE "public"."writing_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."writing_sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();




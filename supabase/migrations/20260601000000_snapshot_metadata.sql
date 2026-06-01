-- Add semantic_version and name to scene_versions
ALTER TABLE "public"."scene_versions"
ADD COLUMN IF NOT EXISTS "semantic_version" text DEFAULT '0.0.0',
ADD COLUMN IF NOT EXISTS "name" text;

-- Remove semantic_version from scenes
ALTER TABLE "public"."scenes"
DROP COLUMN IF EXISTS "semantic_version";

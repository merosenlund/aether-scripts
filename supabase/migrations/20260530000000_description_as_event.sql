-- Phase 7.1: Description Lifecycle Fix
--
-- Migrate any existing entity description values into the payload of their 'create'
-- event (if one exists and doesn't already carry a description). This is a safe,
-- idempotent data migration — entities whose create event already has 'description'
-- in the payload are untouched.
UPDATE wiki_events we
SET payload = payload || jsonb_build_object('description', ent.description)
FROM wiki_entities ent
WHERE we.entity_id = ent.id
  AND we.event_type = 'create'
  AND ent.description IS NOT NULL
  AND ent.description != ''
  AND NOT (we.payload ? 'description');

-- Drop the now-redundant description column. Description is exclusively derived
-- from the event log: the 'create' event payload carries the initial value and
-- 'update_description' events carry subsequent changes.
ALTER TABLE wiki_entities DROP COLUMN IF EXISTS description;

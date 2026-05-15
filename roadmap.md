# Aether Scripts Roadmap

This document outlines the high-level phases and milestones for the **Aether Scripts** platform.
The project is a curated, digital-first actual play fiction platform designed for solo TTRPG journaling, serial novel editing, and a massively enhanced reading ecosystem.

## Phase 1: Foundation & Setup
- [x] Project initialization (SvelteKit + Deno + Tailwind + shadcn-svelte).
- [x] Supabase database schema and connection setup.
- [x] Define core data models (Scenes, Arcs, Serial-Scoped Wikis, Inline Comments).
- [x] Basic authentication (Email/Google OAuth) and protected routing setup.

## Phase 2: Solo TTRPG Journaling & Tiptap Editor
- [ ] Initialize Tiptap rich text editor.
- [ ] Build custom Tiptap blocks for TTRPG mechanics (dice rollers, stat blocks, GM notes).
- [ ] Gameplay journaling interface (writing scenes progressively).
- [ ] Core assistive tools (character sheets, standard tables).
- [ ] State management for active game sessions.

## Phase 3: Serial Novel Editor & Wiki Builder
- [ ] Scene organization interface (grouping Scenes into Arcs).
- [ ] Progressive Revelation Wiki implementation:
  - Create Serial-scoped entities.
  - Implement facts with `valid_from_scene_id` and `valid_until_scene_id` tracking.
- [ ] "Director's Cut" editing: Structuring scenes with separate prose, description, and summary blocks.
- [ ] Drafting states and publishing workflows (hiding author titles to prevent spoilers).

## Phase 4: Digital-First Reading Ecosystem
- [ ] Infinite scroll reader interface (responsive, accessible, seamless scene transitions).
- [ ] "Director's Cut" toggle (allowing readers to see the hidden TTRPG mechanic blocks).
- [ ] Progression-Aware Wiki UI (readers only see facts revealed at their current scene progress).
- [ ] Custom Reading Lists:
  - UI for mixing full prose, summaries, and descriptions to skip "slog" scenes.
  - Sharing reading lists with the community.
- [ ] Navigation controls & Arc Table of Contents.

## Phase 5: Community & Interaction
- [ ] Google Docs-style inline comments (tied to exact characters/blocks).
- [ ] Kindle-style private notes and highlights.
- [ ] User Roles (Reader vs Beta Reader).
- [ ] Beta reader exclusive features (polls, live writing previews).

---
*Note: This roadmap is a living document and will be expanded with granular tasks as each phase commences.*

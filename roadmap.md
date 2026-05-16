# Aether Scripts Roadmap

This document outlines the high-level phases and milestones for the **Aether Scripts** platform.
The project is a curated, digital-first actual play fiction platform designed for solo TTRPG journaling, serial novel editing, and a massively enhanced reading ecosystem.

## Phase 1: Foundation & Setup
- [x] Project initialization (SvelteKit + Deno + Tailwind + shadcn-svelte).
- [x] Supabase database schema and connection setup.
- [x] Define core data models (Scenes, Arcs, Serial-Scoped Wikis, Inline Comments).
- [x] Basic authentication (Email/Google OAuth) and protected routing setup.

## Phase 2: Narrative Engine & Tiptap Editor
- [x] Initialize Tiptap rich text editor.
- [ ] Build Slash Command Engine (`/roll`, `/odds`, `/gm`, `/setup`).
- [ ] Implement block-level visibility tags (Prose, Mechanics, Director's Cut).
- [ ] Implement Dual-Layer Versioning (Yjs CRDT for granular history + Explicit Snapshot Versions).
- [ ] Dynamic UI Modes (Journaling vs Editing toggle) operating on immutable snapshots.

## Phase 2.5: UI Overhaul & Premium Aesthetics
- [x] Global application shell with glassmorphism sidebar.
- [x] Premium typography (Outfit & Lora) and rich dark mode palette.
- [x] Interactive placeholder dashboards for Authors and Readers.
- [x] Refined editor UI with smooth transitions and micro-animations.

## Phase 3: Serial Novel Editor & Flexible Wiki
- [ ] Scene organization interface (grouping Scenes into Arcs).
- [ ] Flexible Wiki implementation:
  - Create generic Wiki Entities with custom properties/components (Characters, Clocks, Threads).
  - Implement smart `wiki_anchors` tied to specific Tiptap `block_id`s.
  - Anchor shift-forward logic when blocks are deleted during edit mode.
- [ ] "Director's Cut" editing workflows and reader visibility filtering.

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

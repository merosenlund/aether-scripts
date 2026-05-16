# Aether Scripts - Product Roadmap

Aether Scripts is a curated, digital-first actual play fiction platform designed for solo TTRPG journaling, serial novel editing, and a massively enhanced reading ecosystem.

## Phase 1: Foundation & Setup
- [x] Project initialization (SvelteKit + Deno + Tailwind + shadcn-svelte).
- [x] Supabase database schema and connection setup.
- [x] Define core data models (Scenes, Arcs, Serial-Scoped Wikis, Inline Comments).
- [x] Basic authentication (Email/Google OAuth) and protected routing setup.

## Phase 2: Narrative Engine (COMPLETED)
- [x] Slash Command Engine (`/roll`, `/odds`, `/gm`).
- [x] Block-level visibility tags (Journal vs. Public).
- [x] Dual-Layer Versioning (Yjs history + Explicit Snapshots).
- [x] Block-ID Anchoring system for Wiki reveal logic.
- [x] Reader Preview mode with scroll-spy reveal for anchored entities.

## Phase 2.5: UI Overhaul & Premium Aesthetics
- [x] Global application shell with glassmorphism sidebar.
- [x] Premium typography (Outfit & Lora) and rich dark mode palette.
- [x] Interactive placeholder dashboards for Authors and Readers.
- [x] Refined editor UI with smooth transitions and micro-animations.

## Phase 3: Clocks, Tracks & Game Mechanics (COMPLETED)
- [x] **Interactive Clocks**: Multi-segment circular trackers (4, 6, 8, 10, 12 segments).
- [x] **Progress Tracks**: Horizontal bars for long-term narrative goals.
- [x] **Mechanical Dashboard**: Sidebar tab that aggregates all active clocks/tracks in a scene.
- [x] **Oracle Integration**: Deep integration with GM Emulator logic (Mythic style) in-editor.

## Phase 4: Serial Management & Arcs
- [ ] **Arc Organization**: Drag-and-drop interface for grouping Scenes into Arcs.
- [ ] **Version Diffing**: UI to compare different snapshots of a scene.
- [ ] **Director's Cut**: Advanced editing workflows for refining journaled sessions into public prose.

## Phase 5: Social & Reader Engagement
- [ ] **Reader Reactions**: Inline sentiment emoji reactions for readers.
- [ ] **Wiki Deep-Links**: One-click navigation from reader prose to wiki lore.
- [ ] **Author Notes**: Exclusive commentary layers for premium readers.

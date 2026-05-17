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

## Phase 4: Serial Management & Publishing Workflows
- [ ] **Linear Snapshot Versioning**: A "single editable track" system where users save snapshots (V1, V2) that become read-only history. Older snapshots can be copied to create a new editable track if needed.
- [ ] **Cherry-Picking Diff Tool**: UI to diff the active track against historical snapshots and selectively pull elements from the past into the present.
- [ ] **Semantic Scene Versioning**: Reader-facing manual versioning (Major.Minor.Patch) to communicate the significance of scene updates (typo fix vs minor polish vs major rewrite), displayed subtly in the reader UI.
- [ ] **Workflow Routing**: Explicit routes for different modes of operation (`/play`, `/edit`, `/history`, `/share`) rather than complex internal state toggles, with seamless UI switching. Newly created scenes drop immediately into `/play`.
- [ ] **Database Statuses & Progress Teasers**: Access-based hierarchy (`Hidden` -> `Published` -> `Beta` -> `Editing` -> `Playing`) to control feed visibility. The Serial model will track `next_scene_completion_percentage` and `next_scene_update_note` to tease upcoming content when a reader hits the end of their available scroll.
- [ ] **Scheduled Status Changes**: Ability to queue a scene's status change (e.g., auto-publish at 8:00 AM).
- [ ] **Arc Organization**: Drag-and-drop interface for grouping Scenes into Arcs.

## Phase 5: Social & Reader Engagement
- [ ] **Reader Reactions**: Inline sentiment emoji reactions for readers.
- [ ] **Wiki Deep-Links**: One-click navigation from reader prose to wiki lore.
- [ ] **Author Notes**: Exclusive commentary layers for premium readers.

## Phase 6: PWA & Live Notifications
- [ ] **PWA Transformation**: Manifest and Service Worker setup for "Install to Home Screen" support.
- [ ] **Push Notifications**: Browser-level push alerts for new scene releases and live-writing events.
- [ ] **Offline Reading**: Cached scene content for reading your library without a connection.
- [ ] **Kindle-Sync Logic**: Finalize cross-device scroll and block-level progress synchronization.

## Phase 7: Community, Polling & Ethical Monetization
- [ ] **Merchant of Record (MoR) Integration**: Secure payment processing (e.g., Lemon Squeezy or Paddle) to handle global tax liability automatically. Focus on flat support with a budget-friendly yearly option (e.g., $3/month minimum or $10/year) to bypass micro-transaction fees.
- [ ] **Self-Serve Subscription Management**: Tools for users to turn off auto-renew or adjust future support amounts seamlessly.
- [ ] **Ethical Billing & Refunds**: Generous manual refund policy (14 days) paired with an automated 30-day resubscription block to prevent fee abuse. Auto-cancellation of subscriptions for users inactive for 30+ days.
- [ ] **Transparent "Runway" Goals**: Progress bars for sustainability milestones (e.g., host costs, securing 12 months of full-time runway).
- [ ] **Art Commission & Fan Art Credits**: Public commemoration of users who fund specific art commissions, alongside a system for users to donate and select alternate fan-made cover art for series.
- [ ] **Community Wall**: Dashboard feed celebrating reader milestones equally (e.g., "Account created", "Reading for 2 months", "Supported again") without displaying monetary amounts, streaks, or leaderboards.
- [ ] **Targeted Polling System**: Ability to send story-decision polls to all users, or segment them to specific groups (e.g., long-time readers) using Admin CRM data.
- [ ] **Admin Supporter CRM & Dedication Engine**: Private tools to view reader engagement and track who has received dedications (scenes, polls, blocks) to ensure equitable, human-driven gratitude. Includes cohort targeting (e.g., dedicating a poll to the "1-Year Club" at scale).
- [ ] **Opt-In Transparent Analytics**: Analytics and inclusion in the Admin CRM are strictly opt-in (configurable during sign-up or in settings). Tracks meaningful engagement (milestones, comments) rather than speed metrics, and provides users a personal "Reading Stats" dashboard so data collection is a shared, transparent feature.
- [ ] **Unified Community Experience**: Ensuring premium support enhances the reading experience without fragmenting the community (no paywalled comments, no FOMO mechanics).

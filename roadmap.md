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

## Phase 4: Serial Management & Publishing Workflows (COMPLETED)

- [x] **Linear Snapshot Versioning**: A "single editable track" system where users save snapshots (V1, V2) that become read-only history. Older snapshots can be copied to create a new editable track if needed.
- [x] **Cherry-Picking Diff Tool**: UI to diff the active track against historical snapshots and selectively pull elements from the past into the present.
- [x] **Semantic Scene Versioning**: Reader-facing manual versioning (Major.Minor.Patch) to communicate the significance of scene updates (typo fix vs minor polish vs major rewrite), displayed subtly in the reader UI.
- [x] **Workflow Routing**: Explicit routes for different modes of operation (`/play`, `/edit`, `/history`, `/share`) rather than complex internal state toggles, with seamless UI switching. Newly created scenes drop immediately into `/play`.
- [x] **Database Statuses & Progress Teasers**: Access-based hierarchy (`Hidden` -> `Published` -> `Beta` -> `Editing` -> `Playing`) to control feed visibility. The Serial model will track `next_scene_completion_percentage` and `next_scene_update_note` to tease upcoming content when a reader hits the end of their available scroll.
- [x] **Scheduled Status Changes**: Ability to queue a scene's status change (e.g., auto-publish at 8:00 AM).
- [x] **Arc Organization**: Drag-and-drop interface for grouping Scenes into Arcs.

## Phase 4.5: Transparent Author Analytics (COMPLETED)

- [x] **Session Telemetry**: Track live author metrics including online status, active typing indicator, session word count, and Words Per Minute (WPM).
- [x] **Editing Insights (Churn)**: Track word churn during editing sessions (words added vs. deleted) to understand rewriting effort.
- [x] **Goal Tracking**: UI for the author to set and track personal writing goals (words per day/week/month/year).
- [x] **Status-Based Word Counts**: Track and compare the word count of a scene across its different lifecycle statuses (e.g., Raw Play vs. Published length).
- [x] **Public Dashboard & Scroll Teaser**: Inject these metrics directly into the end-of-scroll "preview" for readers. This includes showing if you are currently online, typing, working on another series, or if the next scene is queued with a "go live" date.

## Phase 4.8: Reader Lists & Discovery (COMPLETED)

- [x] **Curated Lists (`/lists`)**: Build out the `/lists` route to allow users to group, manage, and share serials/scenes.
- [x] **List Management**: UI for creating new lists, adding/removing entries, and setting lists as public or private.
- [x] **Discovery**: Feature public lists on the dashboard to help readers discover new content curated by the community.

## Phase 5: Architectural Reboot (Block-Level Event Sourcing) (COMPLETED)

- [x] **Database Foundation**: Rebuild Supabase schema around a strict Event-Sourcing pattern (`wiki_entities`, `wiki_events`).
- [x] **Block-Level Temporal Granularity**: Ensure all facts, clocks, and game mechanics are stored as immutable events tied to specific Tiptap `block_id`s, enabling mathematically perfect, spoiler-free time-travel.
- [x] **Dedicated World Manager UI**: Create a robust `/serial/[id]/wiki` dashboard for authors to explicitly manage entities and events, removing "magic" hidden metadata from the prose editor.
- [x] **Context Engine Refactor**: Rebuild the Reader Context Engine to derive entity state by chronologically reducing database events up to the reader's current block ID.
- [x] **Extensive Codebase Cleanup**: Perform a deep purge of deprecated code, old Tiptap extensions (e.g., hidden metadata blocks), obsolete API endpoints, and unused database tables to ensure the new foundation isn't poisoned by technical debt from previous iterations.

## Phase 6: Authoring Experience Reboot (COMPLETED)

### Phase 6.1: Reactive State Architecture Refactor
- [x] **Shared Entity State**: Move fetching and storage of `entities` into the global `contextEngine.svelte.ts` store to act as the single source of truth.
- [x] **Reactive Sidebars**: Update sidebars to read directly from `contextEngine.entities` so they update instantaneously across the app without manual refresh.
- [x] **Dynamic Node Views**: Refactor NodeViews (like `ClockBlock.ts`) to derive their state reactively by scanning `contextEngine.rawEvents`, ensuring PERFECT sync between what the sidebars see and what the prose displays.

### Phase 6.2: Command Formula Engine ✅
- [x] **Command Formula & UI Upgrades**: Built a passive Google Sheets-style hint panel that shows parameter expectations inline. Cursor stays in the editor — space triggers hint mode, Tab advances params, arrow keys navigate select dropdowns, Enter executes.
- [x] **Unified `/oracle` Fate Check**: Accepts raw odds number + question via inline params (e.g., `/oracle 75 Is the door locked?`). Implements 20% exceptional threshold (Exceptional Yes/No).
- [x] **Improved `/roll` Dice Roller**: Accepts custom dice formulas (e.g., `2d6+3`), validates with real-time feedback (✓/✗), inserts stylized inline node, and logs to sidebar roll log via `gameSession.addRoll()`.
- [x] **Intelligent Clock Commands**: `/increment` and `/decrement` populate a dropdown of active clocks from contextEngine. Arrow keys navigate, Enter selects.
- [x] **New `/advance` Track Command**: Advances progress tracks with optional amount param, using active tracks from contextEngine.

### Phase 6.3: Editor Synchronization & Rewind Logic ✅
- [x] **Entity-Head-Aware Command Filtering**: Replaced binary "rewind mode" with intelligent per-entity filtering. Slash command dropdowns (`/increment`, `/decrement`, `/advance`) only show entities whose chronological head is at or before the cursor's block position, naturally preventing timeline pollution. Creation commands (`/clock`, `/track`) remain unrestricted.
- [x] **Sidebar-Initiated Anchor Indicators**: Both WikiSidebar and MechanicsTab entities are now expandable, revealing events/facts with delete controls. Hovering an event highlights its anchored block in the editor; clicking scrolls to it with a flash animation. Added `openConfirm()` dialog for clean delete confirmations.

### Phase 6.4: World Manager UX Overhaul
- [x] **Optimizing the Layout**: Acknowledge the two distinct purposes of the World Manager: (1) overview of entities and (2) adjusting event attachments. The middle section needs an overhaul—consider a tabbed view or a separate route specifically designed for managing event attachment points painlessly. 
- [x] **Context-Rich Events**: Allow clocks/tracks to have content attached to trigger events so the reason for the tick is recorded in the timeline. Fix broken buttons like "New Wiki Entry".
- [x] **Readable Block Connections**: Replace raw UUID `block_id` text fields with intelligent select dropdowns that parse the scene and present readable text snippets for linking prose.
- [x] **Intuitive Entity Editing & Drawer Fixes**: Fix state leak in the "Trigger Event" drawer (e.g., clock drawer incorrectly showing character fields). Replace database-centric forms (`event_type: add_fact`) with intuitive UI elements natively on the entity view (e.g., an inline "Add new fact..." input).

## Phase 7: Wiki Editing & Lifecycle Management (COMPLETED)

### Phase 7.1: Description Lifecycle Fix ✅
- [x] **Description-as-Event**: Remove `description` from the `wiki_entities` table. The initial description is captured in the `create` event payload, and all subsequent changes flow through `update_description` events. The context engine derives current description by reducing events, consistent with how all other entity state is handled.
- [x] **Guaranteed Creation Event**: Ensure the entity creation flow always produces a `create` event anchored to a prose block. This is the author's mechanism for controlling when a reader first encounters the entity in the timeline — no entity should exist outside the event log.

### Phase 7.2: Direct Entity Editing (Editorial Mode) ✅
- [x] **Inline Name & Category Editing**: Click-to-edit entity name and category directly on the overview page. These are pure editorial mutations — no event is created. Intended for cleanup (typos, renaming placeholders, reorganization) not narrative reveals.
- [x] **Inline Fact Editing**: Edit the content of existing facts in place on the entity overview. Mutates the `add_fact` event payload directly — no new event. Narrative fact reveals (new information discovered during play) continue to use the existing `add_fact` event workflow.
- [x] **Entity Deletion**: Delete an entity with a confirmation dialog showing the count of associated events and anchored prose blocks. Cascade-deletes all events and clears prose anchors.

### Phase 7.3: Direct Event Editing (Editorial Mode) ✅
- [x] **Inline Event Payload Editing**: Edit the content and reason fields of existing events directly from the event timeline — for correcting typos or rewording without altering the narrative structure or creating new events.
- [x] **Bulk Event Cleanup**: Multi-select events in the timeline with a bulk-delete action for rapidly pruning stale or incorrectly created events.

### Phase 7.4: Entity Organization ✅
- [x] **Archive / Soft-Hide Entities**: Hide entities from the active entity list without deleting them (e.g., NPCs cut from the story). Archived entities retain their full event history so the context engine remains accurate.
- [x] **Archive Filter**: Extend the entity list filter to include archive status alongside the existing category and search filters.

## Phase 8: Deployment Readiness & Security (COMPLETED)

- [x] **Supabase Row Level Security (RLS) & Policies**: Enable RLS on all 15 active tables (including `scenes`, `scene_updates`, `wiki_events`, `serials`) and write precise, tested policies to prevent public access/tampering via the `anon` key while keeping public read access open for published items.
- [x] **SvelteKit Production Build Verification**: Ensure the SvelteKit production build (`deno task build` or equivalent) compiles successfully with zero TypeScript or bundler errors.
- [x] **Environment Variable & Secret Management Audit**: Securely configure and verify all production secrets (Supabase Service Keys, OAuth Client Credentials, JWT Secrets, App URLs) within the hosting provider's environment variables.
- [x] **CORS & Domain Configurations**: Configure CORS settings in the Supabase instance and SvelteKit endpoints to strictly allow only the final production domain.
- [x] **SSL, Custom Domains & DNS Routing**: Connect the custom domain, configure DNS records, and verify that SSL is properly issued and enforced.
- [x] **Supabase Database Backups & Point-in-Time Recovery**: Confirm database backups are enabled and point-in-time recovery is verified for production peace of mind.
- [x] **Basic Error Tracking & Logging**: Integrate simple runtime error monitoring (e.g., Sentry, Supabase Logs, or structured logging) to catch any silent production crashes.

## Phase 9: Social & Reader Engagement

- [ ] **Immersion-First Commenting**: Comments default to hidden to preserve reading immersion. Includes three viewing modes:
  - _Proximity Reveal_: Making an inline comment temporarily reveals other comments in that paragraph to foster contextual discussion.
  - _Global Toggle_: A reader setting to turn all comment indicators on for "second read-throughs".
  - _End-of-Scene Aggregation_: A traditional bottom-of-page section that aggregates all inline comments (with context snippets and jump-links) alongside general scene-level comments.
  - _Nested Threads & Reactions_: Supports Reddit-style nested replies and comment-level emoji reactions for deep discussion.
- [ ] **Reader Reactions**: Inline sentiment emoji reactions for readers.
- [ ] **Wiki Deep-Links**: One-click navigation from reader prose to wiki lore.
- [ ] **Reader-Facing Wiki** (`/(reader)/serials/[id]/wiki`): A public, read-only wiki route for readers. Entity state is filtered by two axes: (1) the reader's access tier — published scenes are visible to all, beta scenes to beta readers, all other statuses are author-only; (2) the reader's furthest read block position within each scene — entities and facts are revealed progressively as they read, matching the spoiler-free mechanic in the author's play view. No authentication required for published content.
- [ ] **Author Notes**: Exclusive commentary layers for premium readers.
- [ ] **Comment Promotion**: UI to elevate a reader's comment directly into a narrative "Thread" or turn it into a community Poll, visually showing the community that their input is driving the story.

## Phase 10: PWA & Live Notifications

- [ ] **PWA Transformation**: Manifest and Service Worker setup for "Install to Home Screen" support.
- [ ] **Push Notifications & Personalized Delivery**: Browser-level push alerts for live-writing events and scene releases. Instead of global release times, scenes go live immediately but readers configure their own notification schedules (e.g., Morning Coffee, Bedtime Reading, or Saturday Batches).
- [ ] **Offline Reading**: Cached scene content for reading your library without a connection.
- [ ] **Kindle-Sync Logic**: Finalize cross-device scroll and block-level progress synchronization.

## Phase 11: Community, Polling & Ethical Monetization

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

## Phase 12: Live Stream Writing (Stretch Goal)

- [ ] **Twitch/YouTube Companion UI**: The `/stream` route acts as a high-fidelity, interactive companion to a video stream (e.g., embedding a Twitch player). It solves the "blurry text on a 1080p stream" problem by letting readers read the raw, crisp text updates locally while listening to your audio/video commentary.
- [ ] **Audience Oracle (Crowdsourced GM)**: A `/chat_poll` feature where the author can prompt the audience with a story decision. The vote is cast natively in the app and the winning result is injected directly into the editor.
- [ ] **Live Inline Reactions**: Readers watching the raw feed can highlight specific sentences as they are written and drop "cheer" emoji reactions, providing immediate positive feedback to the author.

## Future Technical Enhancements

- [ ] **Yjs Database Compaction**: Add a background process (e.g., Supabase Edge Function cron job) to periodically squash granular `scene_updates` CRDT rows into single snapshots. This will prevent editor load times from degrading on massive scenes containing tens of thousands of keystrokes while preserving edit history for any future "Time Travel" UI.
- [ ] **Serial-Scoped Author Roles**: Extend the current global `user_roles` model to per-serial role assignments, enabling curated multi-author collaboration on a single serial without granting platform-wide author access. Intended roles: `owner`, `co-author`, `editor`, `guest-writer`. Groundwork for the collaborative writing model where select contracted authors can work together on shared serials.

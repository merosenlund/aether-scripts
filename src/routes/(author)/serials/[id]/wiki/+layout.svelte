<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import {
		Sparkles,
		User,
		MapPin,
		Flag,
		Timer,
		Activity,
		Plus,
		ArrowLeft
	} from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { setContext } from 'svelte';
	import { type WikiEntity, type WikiEvent } from '$lib/api/wiki';
	import { reduceEntityEvents } from '$lib/stores/contextEngine.svelte';
	import type { Snippet } from 'svelte';
	import CreateWikiEntryModal from '$lib/components/wiki/CreateWikiEntryModal.svelte';

	export type WikiLayoutEvent = WikiEvent & { wiki_entities?: WikiEntity; scenes?: any };
	export type WikiLayoutContext = {
		readonly entities: WikiEntity[];
		readonly events: WikiLayoutEvent[];
		addEvent: (event: WikiLayoutEvent) => void;
		removeEvent: (eventId: string) => void;
		updateEntity: (entityId: string, updates: Partial<Pick<WikiEntity, 'name' | 'category'>>) => void;
		updateEvent: (eventId: string, payload: Record<string, unknown>) => void;
		removeEntity: (entityId: string) => void;
	};

	let { data, children }: { data: any; children: Snippet } = $props();

	// State arrays driven by load data
	let entities = $state<WikiEntity[]>([...data.entities]);
	let events = $state<
		(WikiEvent & {
			wiki_entities?: WikiEntity;
			scenes?: { order_index: number; display_title?: string; author_title?: string };
		})[]
	>([...data.events]);
	let scenes = $state<
		{ id: string; author_title: string; display_title: string; order_index: number }[]
	>([...data.scenes]);
	let serial = $state(data.serial);

	// Shared reactive context so child pages always see optimistically-updated state
	// (the layout server load won't re-run on same-serial navigation, so data.entities
	// would be stale in child pages without this).
	setContext<WikiLayoutContext>('wiki', {
		get entities() { return entities; },
		get events() { return events; },
		addEvent(event: WikiLayoutEvent) { events = [event, ...events]; },
		removeEvent(eventId: string) { events = events.filter((e) => e.id !== eventId); },
		updateEntity(entityId: string, updates: Partial<Pick<WikiEntity, 'name' | 'category'>>) {
			entities = entities.map((e) => (e.id === entityId ? { ...e, ...updates } : e));
		},
		updateEvent(eventId: string, payload: Record<string, unknown>) {
			events = events.map((ev) => (ev.id === eventId ? { ...ev, payload } : ev));
		},
		removeEntity(entityId: string) {
			entities = entities.filter((e) => e.id !== entityId);
			events = events.filter((ev) => ev.entity_id !== entityId);
		}
	});

	// UI state
	let searchQuery = $state('');
	let selectedCategory = $state<'all' | 'character' | 'location' | 'clock' | 'track' | 'thread'>(
		'all'
	);
	let showInactive = $state(false);

	// Derive active entity from URL
	const activeEntityId = $derived(($page as any).params.entityId || null);

	// Derive current sub-route so sidebar links preserve it (e.g. /events stays on /events)
	const currentSubRoute = $derived(() => {
		const path = $page.url.pathname;
		if (path.endsWith('/events')) return 'events';
		return 'overview';
	});

	// Create entry modal state
	let showCreateModal = $state(false);

	// Reduce an entity's events (server loads DESC; sort ASC before reducing)
	function reduceEntityState(entityId: string) {
		const entity = entities.find((e) => e.id === entityId);
		if (!entity) return null;

		const chronological = events
			.filter((ev) => ev.entity_id === entityId)
			.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

		return reduceEntityEvents(chronological, entity);
	}

	// Search reduced name + description so the description column removal is transparent
	const filteredEntities = $derived(
		entities.filter((e) => {
			const reduced = reduceEntityState(e.id);
			if (!showInactive && reduced && reduced.isActive === false) return false;
			const matchSearch =
				(reduced?.name ?? e.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
				(reduced?.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
			const matchCat = selectedCategory === 'all' || e.category?.toLowerCase() === selectedCategory;
			return matchSearch && matchCat;
		})
	);

	// Get icons for categories
	function getIcon(category: string) {
		switch (category?.toLowerCase()) {
			case 'character':
				return User;
			case 'location':
				return MapPin;
			case 'thread':
				return Flag;
			case 'clock':
				return Timer;
			case 'track':
				return Activity;
			default:
				return Sparkles;
		}
	}

	// Handle entity created from shared modal
	function handleEntityCreated(entity: WikiEntity, event?: WikiLayoutEvent) {
		entities = [...entities, entity];
		if (event) events = [event, ...events];
		goto(`/serials/${serial.id}/wiki/${entity.id}/overview`);
	}
</script>

<div
	data-component="wiki-dashboard-layout"
	class="absolute inset-0 flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100"
>
	<!-- Top Navigation Header -->
	<header
		data-component="dashboard-header"
		class="z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-stone-900/40 px-8 backdrop-blur-2xl"
	>
		<div data-component="header-left" class="flex items-center gap-4">
			<a
				data-component="back-link"
				href="/serials/{serial.id}"
				class="rounded-xl border border-white/10 p-2 text-stone-400 transition-all hover:border-white/20 hover:text-white"
			>
				<ArrowLeft size={16} />
			</a>
			<div data-component="header-titles">
				<h1
					data-component="dashboard-title"
					class="flex items-center gap-2 text-base leading-tight font-bold text-white"
				>
					{serial.title}
					<span
						data-component="title-badge"
						class="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase"
						>World Manager</span
					>
				</h1>
				<p
					data-component="dashboard-subtitle"
					class="mt-0.5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
				>
					Append-Only Chronicle & Lore Sourcing Log
				</p>
			</div>
		</div>

		<button
			data-component="new-wiki-entry-btn"
			onclick={() => (showCreateModal = true)}
			class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-5 py-2.5 font-sans text-xs font-bold shadow-lg transition-all hover:opacity-90"
		>
			<Plus class="mr-2 h-4 w-4" />
			New Wiki Entry
		</button>
	</header>

	<!-- Dashboard Workspace split screen -->
	<div data-component="dashboard-workspace" class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Left Sidebar: Entities Directory -->
		<aside
			data-component="sidebar-entities"
			class="flex min-h-0 w-80 shrink-0 flex-col border-r border-white/5 bg-stone-900/10"
		>
			<div data-component="sidebar-search-area" class="space-y-4 border-b border-white/5 p-6">
				<input
					data-component="search-input"
					type="text"
					bind:value={searchQuery}
					placeholder="Search world index..."
					class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-stone-500 transition-colors focus:outline-none"
				/>

				<!-- Category Filters -->
				<div data-component="category-filters" class="flex flex-wrap gap-1.5">
					{#each ['all', 'character', 'location', 'clock', 'track', 'thread'] as cat (cat)}
						<button
							data-component="category-filter-btn"
							onclick={() =>
								(selectedCategory = cat as
									| 'all'
									| 'character'
									| 'location'
									| 'clock'
									| 'track'
									| 'thread')}
							class="rounded-lg px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all {selectedCategory ===
							cat
								? 'border border-white/20 bg-white/10 text-white'
								: 'border border-transparent bg-transparent text-stone-500 hover:text-white'}"
						>
							{cat}
						</button>
					{/each}
					<div class="w-full h-px bg-white/5 my-1"></div>
					<button
						data-component="inactive-filter-btn"
						onclick={() => (showInactive = !showInactive)}
						class="rounded-lg px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all {showInactive
							? 'border border-white/20 bg-white/10 text-white'
							: 'border border-transparent bg-transparent text-stone-500 hover:text-white'}"
					>
						Show Inactive
					</button>
				</div>
			</div>

			<!-- Entities Scroller -->
			<div data-component="entities-scroller" class="flex-1 space-y-1.5 overflow-y-auto p-4">
				{#if filteredEntities.length === 0}
					<div
						data-component="sidebar-empty"
						class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"
					>
						<p
							data-component="sidebar-empty-text"
							class="text-[10px] font-bold tracking-widest text-stone-600 uppercase"
						>
							No entries match filters
						</p>
					</div>
				{:else}
					{#each filteredEntities as entity (entity.id)}
						{@const reducedState = reduceEntityState(entity.id)}
						{@const Icon = getIcon(entity.category)}
						{@const isSelected = activeEntityId === entity.id}

						<a
							data-component="entity-card-select"
							href="/serials/{serial.id}/wiki/{entity.id}/{currentSubRoute()}"
							class="group flex w-full items-start justify-between rounded-xl border p-4 text-left transition-all {isSelected
								? 'bg-primary/10 border-primary/30 text-white'
								: 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/5'}"
						>
							<div data-component="card-left" class="flex min-w-0 items-start gap-3">
								<div
									data-component="card-icon-box"
									class="shrink-0 rounded-lg p-2 transition-transform group-hover:scale-105 {isSelected
										? 'bg-primary/20 text-primary'
										: 'bg-stone-800 text-stone-400'}"
								>
									<Icon size={14} />
								</div>
								<div data-component="card-titles" class="min-w-0">
									<h4 data-component="card-name" class="truncate text-xs leading-snug font-bold">
										{reducedState?.name || entity.name}
									</h4>
									<span
										data-component="card-category"
										class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
										>{entity.category}</span
									>
								</div>
							</div>

							{#if isSelected}
								<div
									data-component="selection-marker"
									class="bg-primary mt-1.5 h-1.5 w-1.5 animate-pulse rounded-full"
								></div>
							{/if}
						</a>
					{/each}
				{/if}
			</div>
		</aside>

		<!-- Main Content Area (child pages rendered here) -->
		<main
			data-component="main-workspace"
			class="relative flex min-h-0 flex-1 flex-col bg-stone-950"
		>
			{@render children()}
		</main>
	</div>

	<CreateWikiEntryModal
		serialId={serial.id}
		{scenes}
		open={showCreateModal}
		onClose={() => (showCreateModal = false)}
		onCreated={handleEntityCreated}
	/>
</div>

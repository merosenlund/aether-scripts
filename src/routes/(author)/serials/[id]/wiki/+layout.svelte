<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { slide } from 'svelte/transition';
	import {
		Sparkles,
		User,
		MapPin,
		Flag,
		Timer,
		Activity,
		Plus,
		ArrowLeft,
		X
	} from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { notifications } from '$lib/stores/notifications';
	import {
		createWikiEntity,
		createWikiEvent,
		type WikiEntity,
		type WikiEvent
	} from '$lib/api/wiki';
	import type { Snippet } from 'svelte';

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

	// UI state
	let searchQuery = $state('');
	let selectedCategory = $state<'all' | 'character' | 'location' | 'clock' | 'track' | 'thread'>(
		'all'
	);

	// Derive active entity from URL
	const activeEntityId = $derived(($page as any).params.entityId || null);

	// New Entity Form State
	let showCreateModal = $state(false);
	let newEntityName = $state('');
	let newEntityCategory = $state<'character' | 'location' | 'clock' | 'track' | 'thread'>(
		'character'
	);
	let newEntityDesc = $state('');
	let clockSegments = $state(4);
	let trackMax = $state(10);
	let isCreatingEntity = $state(false);

	// Filtered lists
	const filteredEntities = $derived(
		entities.filter((e) => {
			const matchSearch =
				e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(e.description || '').toLowerCase().includes(searchQuery.toLowerCase());
			const matchCat = selectedCategory === 'all' || e.category?.toLowerCase() === selectedCategory;
			return matchSearch && matchCat;
		})
	);

	// Derive dynamic state for an entity by reducing all its events chronologically
	function reduceEntityState(entityId: string) {
		const entity = entities.find((e) => e.id === entityId);
		if (!entity) return null;

		// Filter events for this entity and sort ascending for chronological reduction
		const entityEvs = events
			.filter((ev) => ev.entity_id === entityId)
			.slice()
			.reverse();

		const state = {
			name: entity.name,
			category: entity.category,
			description: entity.description || '',
			metadata: { ...entity.metadata } as Record<string, unknown>,
			facts: [] as Array<{ id: string; content: string }>
		};

		for (const ev of entityEvs) {
			switch (ev.event_type) {
				case 'create':
					if (ev.payload.name) state.name = ev.payload.name as string;
					if (ev.payload.category) state.category = ev.payload.category as WikiEntity['category'];
					if (ev.payload.description) state.description = ev.payload.description as string;
					state.metadata = {
						...state.metadata,
						...((ev.payload.metadata as Record<string, unknown>) || {})
					};
					break;
				case 'update_description':
					state.description = (ev.payload.description as string) || '';
					break;
				case 'add_fact':
					if (!state.facts.some((f) => f.id === ev.payload.id)) {
						state.facts.push({
							id: (ev.payload.id as string) || ev.id,
							content: (ev.payload.content as string) || ''
						});
					}
					break;
				case 'remove_fact':
					state.facts = state.facts.filter((f) => f.id !== ev.payload.id);
					break;
				case 'set_clock':
					state.metadata = {
						...state.metadata,
						segments: (ev.payload.segments as number) ?? (state.metadata.segments as number) ?? 4,
						filled: (ev.payload.filled as number) ?? (state.metadata.filled as number) ?? 0
					};
					break;
				case 'increment_clock': {
					const incAmount = (ev.payload.amount as number) ?? 1;
					const maxSegments = (state.metadata.segments as number) ?? 4;
					state.metadata.filled = Math.min(
						maxSegments,
						((state.metadata.filled as number) ?? 0) + incAmount
					);
					break;
				}
				case 'decrement_clock': {
					const decAmount = (ev.payload.amount as number) ?? 1;
					state.metadata.filled = Math.max(0, ((state.metadata.filled as number) ?? 0) - decAmount);
					break;
				}
				case 'set_track':
					state.metadata = {
						...state.metadata,
						max: (ev.payload.max as number) ?? (state.metadata.max as number) ?? 10,
						current: (ev.payload.current as number) ?? (state.metadata.current as number) ?? 0
					};
					break;
			}
		}

		return state;
	}

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

	// Handle entity creation
	async function handleCreateEntity() {
		if (!newEntityName.trim()) {
			notifications.error('Please enter a name');
			return;
		}

		isCreatingEntity = true;
		try {
			let initialMeta = {};
			if (newEntityCategory === 'clock') {
				initialMeta = { segments: clockSegments, filled: 0 };
			} else if (newEntityCategory === 'track') {
				initialMeta = { max: trackMax, current: 0 };
			}

			// 1. Insert Entity
			const entity = await createWikiEntity(
				serial.id,
				newEntityName,
				newEntityCategory,
				newEntityDesc,
				initialMeta
			);

			// 2. Write matching 'create' event to log (first scene if exists)
			const sceneId = scenes[0]?.id;
			if (sceneId) {
				const createEvent = await createWikiEvent({
					entity_id: entity.id,
					scene_id: sceneId,
					block_id: null,
					event_type: 'create',
					payload: {
						name: newEntityName,
						category: newEntityCategory,
						description: newEntityDesc,
						metadata: initialMeta
					}
				});

				// Refresh local events list
				const fullEvent = {
					...createEvent,
					wiki_entities: entity,
					scenes: scenes[0]
				};
				events = [fullEvent, ...events];
			}

			entities = [...entities, entity];
			showCreateModal = false;
			notifications.success(`${entity.name} created!`);

			// Navigate to new entity
			goto(`/serials/${serial.id}/wiki/${entity.id}/overview`);

			// Reset form
			newEntityName = '';
			newEntityDesc = '';
			newEntityCategory = 'character';
		} catch (e) {
			console.error(e);
			notifications.error('Failed to create entity');
		} finally {
			isCreatingEntity = false;
		}
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
			data-component="create-entity-btn"
			onclick={() => (showCreateModal = true)}
			class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-5 py-2.5 font-sans text-xs font-bold shadow-lg transition-all hover:opacity-90"
		>
			<Plus class="mr-2 h-4 w-4" />
			Create Entity
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
							href="/serials/{serial.id}/wiki/{entity.id}/overview"
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

	<!-- Create Entity Modal -->
	{#if showCreateModal}
		<div
			data-component="create-modal-overlay"
			class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md"
		>
			<div
				data-component="create-modal-container"
				class="relative w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-stone-900/90 p-6 shadow-2xl backdrop-blur-3xl"
			>
				<div data-component="modal-header" class="flex items-center justify-between">
					<h3
						data-component="modal-title"
						class="text-sm font-bold tracking-tight text-white uppercase"
					>
						Create Wiki Entity
					</h3>
					<button
						data-component="modal-close-btn"
						onclick={() => (showCreateModal = false)}
						class="p-1 text-stone-400 hover:text-white"
					>
						<X size={16} />
					</button>
				</div>

				<div data-component="modal-body" class="space-y-4">
					<div data-component="form-name" class="space-y-1">
						<label
							for="new_name"
							class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>Entity Name</label
						>
						<input
							id="new_name"
							type="text"
							bind:value={newEntityName}
							placeholder="e.g. Elena the Mystic"
							class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white transition-colors focus:outline-none"
						/>
					</div>

					<div data-component="form-cat" class="space-y-1">
						<label
							for="new_cat"
							class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Category</label
						>
						<select
							id="new_cat"
							bind:value={newEntityCategory}
							class="w-full rounded-xl border border-white/10 bg-stone-900 px-4 py-2.5 text-xs text-white focus:outline-none"
						>
							<option value="character">Character</option>
							<option value="location">Location</option>
							<option value="clock">Progress Clock</option>
							<option value="track">Progress Track</option>
							<option value="thread">Lore Thread</option>
						</select>
					</div>

					<div data-component="form-desc" class="space-y-1">
						<label
							for="new_desc_field"
							class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>Brief Description</label
						>
						<textarea
							id="new_desc_field"
							bind:value={newEntityDesc}
							placeholder="Short introductory description..."
							rows="3"
							class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
						></textarea>
					</div>

					<!-- Category specific details -->
					{#if newEntityCategory === 'clock'}
						<div data-component="form-clock-seg" class="space-y-1" transition:slide>
							<label
								for="clock_seg_field"
								class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
								>Clock Segments</label
							>
							<select
								id="clock_seg_field"
								bind:value={clockSegments}
								class="w-full rounded-xl border border-white/10 bg-stone-900 px-4 py-2.5 text-xs text-white"
							>
								<option value={4}>4 Segments</option>
								<option value={6}>6 Segments</option>
								<option value={8}>8 Segments</option>
								<option value={10}>10 Segments</option>
								<option value={12}>12 Segments</option>
							</select>
						</div>
					{:else if newEntityCategory === 'track'}
						<div data-component="form-track-max" class="space-y-1" transition:slide>
							<label
								for="track_max_field"
								class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
								>Track Length (Steps)</label
							>
							<input
								id="track_max_field"
								type="number"
								bind:value={trackMax}
								class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
							/>
						</div>
					{/if}
				</div>

				<div data-component="modal-footer" class="flex gap-3 pt-2">
					<button
						data-component="modal-submit"
						onclick={handleCreateEntity}
						disabled={isCreatingEntity}
						class="bg-primary text-primary-foreground flex-1 rounded-xl py-2.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{isCreatingEntity ? 'Creating...' : 'Create Entity'}
					</button>
					<button
						data-component="modal-cancel"
						onclick={() => (showCreateModal = false)}
						class="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold hover:bg-white/5"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

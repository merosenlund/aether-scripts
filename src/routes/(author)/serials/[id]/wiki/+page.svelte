<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { slide, fade } from 'svelte/transition';
	import {
		Sparkles,
		User,
		MapPin,
		Flag,
		Timer,
		Activity,
		Plus,
		Trash2,
		Edit3,
		ArrowLeft,
		BookOpen,
		X,
		Calendar,
		Link,
		FileText
	} from '@lucide/svelte';
	import { supabase } from '$lib/supabaseClient';
	import { notifications } from '$lib/stores/notifications';
	import {
		createWikiEntity,
		createWikiEvent,
		deleteWikiEvent,
		updateWikiEventPayload,
		updateWikiEventBlock,
		type WikiEntity,
		type WikiEvent
	} from '$lib/api/wiki';

	let { data } = $props<{
		data: {
			entities: WikiEntity[];
			events: (WikiEvent & {
				wiki_entities?: WikiEntity;
				scenes?: { order_index: number; display_title?: string; author_title?: string };
			})[];
			scenes: { id: string; author_title: string; display_title: string; order_index: number }[];
			serial: { id: string; title: string };
		};
	}>();

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
	let selectedEntityId = $state<string | null>(null);

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

	// New Event Form State
	let showAddEventForm = $state(false);
	let newEventType = $state<string>('add_fact');
	let newEventSceneId = $state<string>(scenes[0]?.id || '');
	let newEventBlockId = $state<string>('');
	let newEventPayloadContent = $state('');
	let newEventPayloadDescription = $state('');
	let newEventPayloadClockSegments = $state(4);
	let newEventPayloadClockFilled = $state(0);
	let newEventPayloadTrackMax = $state(10);
	let newEventPayloadTrackCurrent = $state(0);
	let isCreatingEvent = $state(false);

	// Event Editing State
	let editingEventId = $state<string | null>(null);
	let editingPayloadContent = $state('');
	let editingPayloadDescription = $state('');
	let editingPayloadClockSegments = $state(4);
	let editingPayloadClockFilled = $state(0);
	let editingPayloadTrackMax = $state(10);
	let editingPayloadTrackCurrent = $state(0);
	let editingBlockId = $state<string>('');
	let editingSceneId = $state<string>('');
	let isSavingEventEdit = $state(false);

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

	const selectedEntity = $derived(entities.find((e) => e.id === selectedEntityId) || null);

	const selectedEntityEvents = $derived(events.filter((ev) => ev.entity_id === selectedEntityId));

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
			selectedEntityId = entity.id;
			notifications.success(`${entity.name} created!`);

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

	// Handle event addition
	async function handleAddEvent() {
		if (!selectedEntityId || !selectedEntity) return;

		isCreatingEvent = true;
		try {
			let payload: Record<string, unknown> = {};
			if (newEventType === 'add_fact') {
				payload = { id: crypto.randomUUID(), content: newEventPayloadContent };
			} else if (newEventType === 'update_description') {
				payload = { description: newEventPayloadDescription };
			} else if (newEventType === 'set_clock') {
				payload = { segments: newEventPayloadClockSegments, filled: newEventPayloadClockFilled };
			} else if (newEventType === 'set_track') {
				payload = { max: newEventPayloadTrackMax, current: newEventPayloadTrackCurrent };
			} else if (newEventType === 'increment_clock') {
				payload = { amount: 1 };
			} else if (newEventType === 'decrement_clock') {
				payload = { amount: 1 };
			}

			const rawEvent = await createWikiEvent({
				entity_id: selectedEntityId,
				scene_id: newEventSceneId,
				block_id: newEventBlockId.trim() || null,
				event_type: newEventType as WikiEvent['event_type'],
				payload
			});

			const scene = scenes.find((s) => s.id === newEventSceneId);
			const fullEvent = {
				...rawEvent,
				wiki_entities: selectedEntity,
				scenes: scene
			};

			events = [fullEvent, ...events];
			showAddEventForm = false;

			// Clear forms
			newEventPayloadContent = '';
			newEventPayloadDescription = '';
			newEventBlockId = '';

			notifications.success('Lore event added!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to add lore event');
		} finally {
			isCreatingEvent = false;
		}
	}

	// Edit event start
	function startEditEvent(ev: WikiEvent) {
		editingEventId = ev.id;
		editingBlockId = ev.block_id || '';
		editingSceneId = ev.scene_id;

		// Pre-populate fields based on event type
		if (ev.event_type === 'add_fact') {
			editingPayloadContent = (ev.payload.content as string) || '';
		} else if (ev.event_type === 'update_description') {
			editingPayloadDescription = (ev.payload.description as string) || '';
		} else if (ev.event_type === 'set_clock') {
			editingPayloadClockSegments = (ev.payload.segments as number) || 4;
			editingPayloadClockFilled = (ev.payload.filled as number) || 0;
		} else if (ev.event_type === 'set_track') {
			editingPayloadTrackMax = (ev.payload.max as number) || 10;
			editingPayloadTrackCurrent = (ev.payload.current as number) || 0;
		}
	}

	// Edit event save
	async function saveEventEdit(eventId: string) {
		isSavingEventEdit = true;
		try {
			const ev = events.find((e) => e.id === eventId);
			if (!ev) return;

			let payload = { ...ev.payload };
			if (ev.event_type === 'add_fact') {
				payload.content = editingPayloadContent;
			} else if (ev.event_type === 'update_description') {
				payload.description = editingPayloadDescription;
			} else if (ev.event_type === 'set_clock') {
				payload.segments = editingPayloadClockSegments;
				payload.filled = editingPayloadClockFilled;
			} else if (ev.event_type === 'set_track') {
				payload.max = editingPayloadTrackMax;
				payload.current = editingPayloadTrackCurrent;
			}

			await updateWikiEventPayload(eventId, payload);
			await updateWikiEventBlock(eventId, editingBlockId.trim() || null);

			// If scene ID was changed, update it too
			if (editingSceneId !== ev.scene_id) {
				const { error } = await supabase
					.from('wiki_events')
					.update({ scene_id: editingSceneId })
					.eq('id', eventId);
				if (error) throw error;
			}

			// Update local event item
			const index = events.findIndex((e) => e.id === eventId);
			if (index !== -1) {
				const updatedScene = scenes.find((s) => s.id === editingSceneId);
				events[index] = {
					...events[index],
					payload,
					block_id: editingBlockId.trim() || null,
					scene_id: editingSceneId,
					scenes: updatedScene
				};
			}

			editingEventId = null;
			notifications.success('Event updated successfully');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update event');
		} finally {
			isSavingEventEdit = false;
		}
	}

	// Delete event
	async function handleDeleteEvent(eventId: string) {
		if (
			!confirm('Are you sure you want to delete this event? This will recalculate the active lore.')
		)
			return;

		try {
			await deleteWikiEvent(eventId);
			events = events.filter((e) => e.id !== eventId);
			notifications.success('Event deleted');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to delete event');
		}
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
						{@const isSelected = selectedEntityId === entity.id}

						<button
							data-component="entity-card-select"
							onclick={() => (selectedEntityId = entity.id)}
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
						</button>
					{/each}
				{/if}
			</div>
		</aside>

		<!-- Main Workspace Content Panel -->
		<main
			data-component="main-workspace"
			class="relative flex min-h-0 flex-1 flex-col bg-stone-950"
		>
			{#if selectedEntity}
				{@const dynamicState = reduceEntityState(selectedEntity.id)}
				{@const DetailIcon = getIcon(selectedEntity.category)}

				<div
					data-component="entity-details-view"
					class="animate-fade-in flex min-h-0 flex-1 overflow-hidden"
					in:fade
				>
					<!-- Middle Panel: Entity Status & Active Lore State -->
					<section
						data-component="entity-lore-panel"
						class="flex-1 space-y-6 overflow-y-auto border-r border-white/5 p-8"
					>
						<div
							data-component="entity-details-header"
							class="flex items-start justify-between border-b border-white/5 pb-6"
						>
							<div data-component="entity-details-meta" class="flex items-center gap-4">
								<div
									data-component="entity-details-icon"
									class="bg-primary/10 border-primary/20 text-primary shadow-primary/5 rounded-2xl border p-4 shadow-lg"
								>
									<DetailIcon size={24} />
								</div>
								<div>
									<span
										data-component="entity-details-cat-label"
										class="text-primary text-[9px] font-bold tracking-widest uppercase"
										>{selectedEntity.category}</span
									>
									<h2
										data-component="entity-details-name"
										class="mt-0.5 text-xl font-bold tracking-tight text-white"
									>
										{dynamicState?.name || selectedEntity.name}
									</h2>
								</div>
							</div>
						</div>

						<!-- Description -->
						<div
							data-component="description-section"
							class="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-6"
						>
							<h3
								data-component="description-title"
								class="text-[10px] font-bold tracking-widest text-stone-500 uppercase"
							>
								Active Description
							</h3>
							{#if dynamicState?.description}
								<p
									data-component="description-text"
									class="font-serif text-sm leading-relaxed font-medium text-stone-300"
								>
									{dynamicState.description}
								</p>
							{:else}
								<p data-component="description-text-empty" class="text-xs text-stone-600 italic">
									No description has been written for this entity yet.
								</p>
							{/if}
						</div>

						<!-- Facts (Only relevant for Characters/Locations/Threads) -->
						{#if !['clock', 'track'].includes(selectedEntity.category?.toLowerCase())}
							<div data-component="facts-section" class="space-y-3">
								<h3
									data-component="facts-title"
									class="text-[10px] font-bold tracking-widest text-stone-500 uppercase"
								>
									Active Lore Facts
								</h3>
								{#if dynamicState?.facts && dynamicState.facts.length > 0}
									<div data-component="facts-list" class="grid grid-cols-1 gap-2">
										{#each dynamicState.facts as fact (fact.id)}
											<div
												data-component="fact-row"
												class="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-4"
											>
												<span data-component="fact-bullet" class="text-primary font-bold">•</span>
												<p data-component="fact-text" class="text-xs text-stone-300">
													{fact.content}
												</p>
											</div>
										{/each}
									</div>
								{:else}
									<div
										data-component="facts-empty"
										class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-6 text-center"
									>
										<p
											data-component="facts-empty-text"
											class="text-[10px] font-bold tracking-wider text-stone-600 uppercase"
										>
											No active lore facts
										</p>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Clock/Track Visualizer status -->
						{#if selectedEntity.category?.toLowerCase() === 'clock'}
							<div
								data-component="clock-section"
								class="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6"
							>
								<h3
									data-component="clock-section-title"
									class="w-full text-[10px] font-bold tracking-widest text-stone-500 uppercase"
								>
									Clock Progress Status
								</h3>

								<div data-component="clock-stats" class="text-center">
									<div
										data-component="clock-numbers"
										class="text-primary font-mono text-3xl font-bold drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]"
									>
										{dynamicState?.metadata?.filled || 0} / {dynamicState?.metadata?.segments || 4}
									</div>
									<div
										data-component="clock-label"
										class="mt-1 text-[9px] font-black tracking-widest text-stone-500 uppercase"
									>
										Filled Segments
									</div>
								</div>
							</div>
						{:else if selectedEntity.category?.toLowerCase() === 'track'}
							<div
								data-component="track-section"
								class="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6"
							>
								<h3
									data-component="track-section-title"
									class="w-full text-[10px] font-bold tracking-widest text-stone-500 uppercase"
								>
									Track Progress Status
								</h3>

								<div data-component="track-stats" class="w-full text-center">
									<div data-component="track-progress-bar" class="mb-3 flex h-3 w-full gap-1">
										<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
										{#each Array((dynamicState?.metadata?.max as number) || 10) as _, i (i)}
											<div
												data-component="track-step"
												class="flex-1 rounded-sm border border-stone-800 {i <
												((dynamicState?.metadata?.current as number) || 0)
													? 'bg-primary'
													: 'bg-stone-900'}"
											></div>
										{/each}
									</div>
									<div
										data-component="track-numbers"
										class="text-primary font-mono text-3xl font-bold drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]"
									>
										{dynamicState?.metadata?.current || 0} / {dynamicState?.metadata?.max || 10}
									</div>
									<div
										data-component="track-label"
										class="mt-1 text-[9px] font-black tracking-widest text-stone-500 uppercase"
									>
										Active Tracker Value
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- Right Panel: Chronological Audit Log (Events Timeline) -->
					<section
						data-component="events-timeline-panel"
						class="flex min-h-0 w-96 flex-col overflow-y-auto border-l border-white/5 bg-stone-900/5"
					>
						<div
							data-component="timeline-header"
							class="flex shrink-0 items-center justify-between border-b border-white/5 bg-stone-900/10 p-6"
						>
							<h3
								data-component="timeline-title"
								class="text-[10px] font-bold tracking-widest text-stone-400 uppercase"
							>
								Chronological Log
							</h3>

							<button
								data-component="trigger-event-btn"
								onclick={() => (showAddEventForm = !showAddEventForm)}
								class="flex items-center rounded-lg border border-white/10 px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-colors hover:border-white/20"
							>
								<Plus size={10} class="mr-1.5" />
								Trigger Event
							</button>
						</div>

						<!-- New Event Trigger Form Drawer -->
						{#if showAddEventForm}
							<div
								data-component="trigger-event-drawer"
								class="space-y-4 border-b border-white/5 bg-white/[0.01] p-6"
								transition:slide
							>
								<div data-component="form-grid" class="grid grid-cols-1 gap-3">
									<div data-component="form-group-type" class="space-y-1">
										<label
											for="event_type"
											class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
											>Event Type</label
										>
										<select
											id="event_type"
											bind:value={newEventType}
											class="focus:border-primary/50 w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs text-stone-100 focus:outline-none"
										>
											{#if !['clock', 'track'].includes(selectedEntity.category?.toLowerCase())}
												<option value="add_fact">Add Fact</option>
												<option value="update_description">Update Description</option>
											{:else if selectedEntity.category?.toLowerCase() === 'clock'}
												<option value="set_clock">Set Clock Bounds</option>
												<option value="increment_clock">Increment Clock</option>
												<option value="decrement_clock">Decrement Clock</option>
											{:else if selectedEntity.category?.toLowerCase() === 'track'}
												<option value="set_track">Set Track progress</option>
											{/if}
										</select>
									</div>

									<div data-component="form-group-scene" class="space-y-1">
										<label
											for="event_scene"
											class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
											>Scene Anchor</label
										>
										<select
											id="event_scene"
											bind:value={newEventSceneId}
											class="focus:border-primary/50 w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs text-stone-100 focus:outline-none"
										>
											{#each scenes as scene (scene.id)}
												<option value={scene.id}
													>{scene.order_index + 1}. {scene.display_title ||
														scene.author_title ||
														'Unnamed Scene'}</option
												>
											{/each}
										</select>
									</div>

									<div data-component="form-group-block" class="space-y-1">
										<label
											for="event_block"
											class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
											>Paragraph Block ID (Optional)</label
										>
										<input
											id="event_block"
											type="text"
											bind:value={newEventBlockId}
											placeholder="e.g. paragraph-id-from-editor"
											class="focus:border-primary/50 w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs text-stone-100 focus:outline-none"
										/>
									</div>

									<!-- Dynamic payload inputs -->
									{#if newEventType === 'add_fact'}
										<div data-component="payload-add-fact" class="space-y-1">
											<label
												for="fact_content"
												class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
												>Fact Content</label
											>
											<input
												id="fact_content"
												type="text"
												bind:value={newEventPayloadContent}
												placeholder="e.g. Exiled from the High Council"
												class="w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs focus:outline-none"
											/>
										</div>
									{:else if newEventType === 'update_description'}
										<div data-component="payload-desc" class="space-y-1">
											<label
												for="new_desc"
												class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
												>New Description</label
											>
											<textarea
												id="new_desc"
												bind:value={newEventPayloadDescription}
												placeholder="Enter the updated character description..."
												rows="3"
												class="w-full resize-none rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs focus:outline-none"
											></textarea>
										</div>
									{:else if newEventType === 'set_clock'}
										<div data-component="payload-set-clock" class="grid grid-cols-2 gap-2">
											<div data-component="set-clock-seg" class="space-y-1">
												<label
													for="clock_seg"
													class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
													>Max Segments</label
												>
												<input
													id="clock_seg"
													type="number"
													bind:value={newEventPayloadClockSegments}
													class="w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs focus:outline-none"
												/>
											</div>
											<div data-component="set-clock-filled" class="space-y-1">
												<label
													for="clock_filled"
													class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
													>Filled</label
												>
												<input
													id="clock_filled"
													type="number"
													bind:value={newEventPayloadClockFilled}
													class="w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs focus:outline-none"
												/>
											</div>
										</div>
									{:else if newEventType === 'set_track'}
										<div data-component="payload-set-track" class="grid grid-cols-2 gap-2">
											<div data-component="set-track-max" class="space-y-1">
												<label
													for="track_max"
													class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
													>Max Value</label
												>
												<input
													id="track_max"
													type="number"
													bind:value={newEventPayloadTrackMax}
													class="w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs focus:outline-none"
												/>
											</div>
											<div data-component="set-track-curr" class="space-y-1">
												<label
													for="track_curr"
													class="text-[9px] font-bold tracking-wider text-stone-400 uppercase"
													>Current Value</label
												>
												<input
													id="track_curr"
													type="number"
													bind:value={newEventPayloadTrackCurrent}
													class="w-full rounded-lg border border-white/10 bg-stone-900 px-3 py-2 text-xs focus:outline-none"
												/>
											</div>
										</div>
									{/if}

									<div data-component="drawer-actions" class="flex gap-2 pt-2">
										<button
											data-component="drawer-submit"
											onclick={handleAddEvent}
											disabled={isCreatingEvent}
											class="bg-primary text-primary-foreground flex-1 rounded-lg py-2 text-xs font-bold transition-opacity hover:opacity-90"
										>
											{isCreatingEvent ? 'Adding...' : 'Add Event'}
										</button>
										<button
											data-component="drawer-cancel"
											onclick={() => (showAddEventForm = false)}
											class="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/5"
										>
											Cancel
										</button>
									</div>
								</div>
							</div>
						{/if}

						<!-- Events List -->
						<div data-component="events-timeline-list" class="flex-1 space-y-4 overflow-y-auto p-4">
							{#if selectedEntityEvents.length === 0}
								<div
									data-component="timeline-empty"
									class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"
								>
									<p
										data-component="timeline-empty-text"
										class="text-[10px] font-bold tracking-wider text-stone-600 uppercase"
									>
										No events recorded yet
									</p>
								</div>
							{:else}
								<div
									data-component="timeline-container"
									class="relative space-y-6 border-l border-white/5 pl-4"
								>
									{#each selectedEntityEvents as ev (ev.id)}
										{@const isEditing = editingEventId === ev.id}

										<div data-component="timeline-event-card" class="group relative">
											<!-- Dot indicator on timeline -->
											<div
												data-component="timeline-dot"
												class="bg-primary absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ring-4 ring-stone-950"
											></div>

											<div
												data-component="event-card-wrapper"
												class="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
											>
												<!-- Event Info Header -->
												<div data-component="event-header" class="flex items-start justify-between">
													<div>
														<span
															data-component="event-type-badge"
															class="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-stone-400 uppercase"
														>
															{ev.event_type}
														</span>
														<div
															data-component="event-time"
															class="mt-1 flex items-center gap-2 text-[8px] font-bold tracking-wider text-stone-500 uppercase"
														>
															<Calendar size={10} />
															{ev.scenes?.display_title ||
																ev.scenes?.author_title ||
																'Unanchored Scene'}
														</div>
													</div>

													{#if !isEditing}
														<div
															data-component="event-action-group"
															class="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
														>
															<button
																data-component="edit-event-btn"
																onclick={() => startEditEvent(ev)}
																class="rounded p-1 text-stone-500 transition-colors hover:bg-white/5 hover:text-white"
															>
																<Edit3 size={11} />
															</button>
															<button
																data-component="delete-event-btn"
																onclick={() => handleDeleteEvent(ev.id)}
																class="rounded p-1 text-stone-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
															>
																<Trash2 size={11} />
															</button>
														</div>
													{/if}
												</div>

												<!-- Event Payload Details (Viewing or Editing) -->
												{#if isEditing}
													<div
														data-component="event-edit-form"
														class="space-y-3 pt-2"
														transition:slide
													>
														<!-- Inline Payload Editor based on type -->
														{#if ev.event_type === 'add_fact'}
															<div data-component="edit-fact-group" class="space-y-1">
																<label
																	for="edit_fact"
																	class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																	>Fact Content</label
																>
																<input
																	id="edit_fact"
																	type="text"
																	bind:value={editingPayloadContent}
																	class="w-full rounded-lg border border-white/10 bg-stone-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
																/>
															</div>
														{:else if ev.event_type === 'update_description'}
															<div data-component="edit-desc-group" class="space-y-1">
																<label
																	for="edit_desc"
																	class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																	>Description</label
																>
																<textarea
																	id="edit_desc"
																	bind:value={editingPayloadDescription}
																	rows="3"
																	class="w-full resize-none rounded-lg border border-white/10 bg-stone-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
																></textarea>
															</div>
														{:else if ev.event_type === 'set_clock'}
															<div
																data-component="edit-clock-bounds"
																class="grid grid-cols-2 gap-2"
															>
																<div data-component="edit-clock-seg-group" class="space-y-1">
																	<label
																		for="edit_clock_seg"
																		class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																		>Segments</label
																	>
																	<input
																		id="edit_clock_seg"
																		type="number"
																		bind:value={editingPayloadClockSegments}
																		class="w-full rounded-lg border border-white/10 bg-stone-900 px-2 py-1 text-xs"
																	/>
																</div>
																<div data-component="edit-clock-filled-group" class="space-y-1">
																	<label
																		for="edit_clock_filled"
																		class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																		>Filled</label
																	>
																	<input
																		id="edit_clock_filled"
																		type="number"
																		bind:value={editingPayloadClockFilled}
																		class="w-full rounded-lg border border-white/10 bg-stone-900 px-2 py-1 text-xs"
																	/>
																</div>
															</div>
														{:else if ev.event_type === 'set_track'}
															<div
																data-component="edit-track-bounds"
																class="grid grid-cols-2 gap-2"
															>
																<div data-component="edit-track-max-group" class="space-y-1">
																	<label
																		for="edit_track_max"
																		class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																		>Max steps</label
																	>
																	<input
																		id="edit_track_max"
																		type="number"
																		bind:value={editingPayloadTrackMax}
																		class="w-full rounded-lg border border-white/10 bg-stone-900 px-2 py-1 text-xs"
																	/>
																</div>
																<div data-component="edit-track-curr-group" class="space-y-1">
																	<label
																		for="edit_track_curr"
																		class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																		>Current</label
																	>
																	<input
																		id="edit_track_curr"
																		type="number"
																		bind:value={editingPayloadTrackCurrent}
																		class="w-full rounded-lg border border-white/10 bg-stone-900 px-2 py-1 text-xs"
																	/>
																</div>
															</div>
														{/if}

														<!-- Scene and block anchors -->
														<div data-component="edit-anchors-grid" class="grid grid-cols-2 gap-2">
															<div data-component="edit-anchor-scene-group" class="space-y-1">
																<label
																	for="edit_anchor_scene"
																	class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																	>Scene Anchor</label
																>
																<select
																	id="edit_anchor_scene"
																	bind:value={editingSceneId}
																	class="w-full rounded border border-white/10 bg-stone-900 px-2 py-1 text-[10px] text-white focus:outline-none"
																>
																	{#each scenes as scene (scene.id)}
																		<option value={scene.id}
																			>{scene.display_title ||
																				scene.author_title ||
																				'Unnamed'}</option
																		>
																	{/each}
																</select>
															</div>
															<div data-component="edit-anchor-block-group" class="space-y-1">
																<label
																	for="edit_anchor_block"
																	class="text-[9px] font-bold tracking-wider text-stone-500 uppercase"
																	>Block ID</label
																>
																<input
																	id="edit_anchor_block"
																	type="text"
																	bind:value={editingBlockId}
																	placeholder="No block ID"
																	class="w-full rounded border border-white/10 bg-stone-900 px-2 py-1 text-[10px]"
																/>
															</div>
														</div>

														<div data-component="edit-actions" class="flex gap-1.5 pt-2">
															<button
																data-component="edit-save"
																onclick={() => saveEventEdit(ev.id)}
																disabled={isSavingEventEdit}
																class="flex-1 rounded bg-emerald-500 py-1.5 text-[10px] font-bold tracking-wider text-stone-950 uppercase transition-opacity hover:opacity-90"
															>
																{isSavingEventEdit ? 'Saving...' : 'Save'}
															</button>
															<button
																data-component="edit-cancel"
																onclick={() => (editingEventId = null)}
																class="rounded border border-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase hover:bg-white/5"
															>
																Cancel
															</button>
														</div>
													</div>
												{:else}
													<!-- Default view of event payload -->
													<div
														data-component="event-payload-content"
														class="text-xs text-stone-300"
													>
														{#if ev.event_type === 'add_fact'}
															<p data-component="payload-fact">
																Content: <span
																	data-component="payload-fact-value"
																	class="font-medium text-white">"{ev.payload.content}"</span
																>
															</p>
														{:else if ev.event_type === 'update_description'}
															<p data-component="payload-description-label">
																Description updated to:
															</p>
															<p
																data-component="payload-description-value"
																class="mt-1 font-serif text-white italic"
															>
																"{ev.payload.description}"
															</p>
														{:else if ev.event_type === 'set_clock'}
															<p data-component="payload-clock">
																Clock configured: <span
																	data-component="payload-clock-val"
																	class="text-primary font-bold"
																	>{ev.payload.filled} / {ev.payload.segments}</span
																>
															</p>
														{:else if ev.event_type === 'increment_clock'}
															<p
																data-component="payload-clock-inc"
																class="font-bold text-emerald-400"
															>
																+1 Segment Added
															</p>
														{:else if ev.event_type === 'decrement_clock'}
															<p data-component="payload-clock-dec" class="font-bold text-rose-400">
																-1 Segment Removed
															</p>
														{:else if ev.event_type === 'set_track'}
															<p data-component="payload-track">
																Track configured: <span
																	data-component="payload-track-val"
																	class="text-primary font-bold"
																	>{ev.payload.current} / {ev.payload.max}</span
																>
															</p>
														{:else if ev.event_type === 'create'}
															<p data-component="payload-create" class="text-stone-400">
																Entity born / created with initial details
															</p>
														{:else if ev.event_type === 'anchor'}
															<p
																data-component="payload-anchor"
																class="flex items-center gap-1 text-stone-400"
															>
																<Link size={10} /> Entity anchored to paragraph block
															</p>
														{/if}
													</div>

													{#if ev.block_id}
														<div
															data-component="event-anchor-info"
															class="mt-1.5 flex items-center gap-1.5 border-t border-white/5 pt-1.5 text-[8px] font-bold tracking-wider text-stone-500 uppercase"
														>
															<FileText size={10} />
															Block: {ev.block_id}
														</div>
													{/if}
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</section>
				</div>
			{:else}
				<!-- No Entity Selected: Welcome & Serial Overview -->
				<div
					data-component="welcome-view"
					class="animate-fade-in flex flex-1 flex-col items-center justify-center p-12 text-center"
					in:fade
				>
					<div
						data-component="welcome-banner"
						class="text-primary relative mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] shadow-xl"
					>
						<div
							data-component="banner-glow"
							class="bg-primary/20 absolute inset-0 rounded-3xl opacity-50 blur-xl"
						></div>
						<BookOpen size={28} class="relative" />
					</div>
					<h2 data-component="welcome-title" class="text-lg font-bold tracking-tight text-white">
						World Lore Ledger
					</h2>
					<p
						data-component="welcome-description"
						class="mt-2 max-w-sm text-xs leading-relaxed text-stone-500"
					>
						Select a character, location, track or progress clock from the sidebar to inspect its
						chronological event timeline and manage events.
					</p>

					<div data-component="overview-grid" class="mt-10 grid w-full max-w-xl grid-cols-2 gap-4">
						<div
							data-component="summary-card-entities"
							class="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-left"
						>
							<span data-component="entities-count" class="font-mono text-2xl font-bold text-white"
								>{entities.length}</span
							>
							<h4
								data-component="entities-label"
								class="mt-1 text-[9px] font-black tracking-widest text-stone-500 uppercase"
							>
								Total World Entities
							</h4>
						</div>
						<div
							data-component="summary-card-events"
							class="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-left"
						>
							<span data-component="events-count" class="font-mono text-2xl font-bold text-white"
								>{events.length}</span
							>
							<h4
								data-component="events-label"
								class="mt-1 text-[9px] font-black tracking-widest text-stone-500 uppercase"
							>
								Sourced Ledger Events
							</h4>
						</div>
					</div>
				</div>
			{/if}
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

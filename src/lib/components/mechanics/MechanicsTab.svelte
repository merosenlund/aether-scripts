<script lang="ts">
	import { onMount } from 'svelte';
	import { getWikiEvents, type WikiEntity } from '$lib/api/wiki';
	import { Plus, Timer, Activity } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import { slide } from 'svelte/transition';
	import { supabase } from '$lib/supabaseClient';
	import { openPrompt } from '$lib/stores/prompt.svelte';
	import { contextEngine } from '$lib/stores/contextEngine.svelte';

	let {
		serialId,
		sceneId,
		cursorState = { clocks: {} }
	} = $props<{
		serialId: string;
		sceneId: string;
		cursorState?: {
			clocks?: Record<string, { entityId: string; name: string; segments: number; filled: number }>;
		};
	}>();

	let isLoading = $state(true);

	const entities = $derived(
		contextEngine.baseEntities.filter(
			(e) => e.category?.toLowerCase() === 'clock' || e.category?.toLowerCase() === 'track'
		)
	);

	async function loadMechanics() {
		try {
			if (contextEngine.baseEntities.length === 0) {
				await contextEngine.loadBaseEntities(serialId);
			}

			// Initialize events in contextEngine if not loaded
			if (contextEngine.rawEvents.length === 0) {
				contextEngine.rawEvents = await getWikiEvents(sceneId);
			}
		} catch (e) {
			console.error(e);
			notifications.error('Failed to load mechanics.');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadMechanics();
	});

	async function createNewMechanic(type: 'clock' | 'track') {
		const name = await openPrompt(`New ${type}`, `Enter a name for the new ${type}:`);
		if (!name) return;

		let metadata: Record<string, unknown>;
		if (type === 'clock') {
			const segmentsStr = await openPrompt(
				'Clock Segments',
				'How many segments? (4, 6, 8, 10, 12)',
				'4'
			);
			const segments = parseInt(segmentsStr || '4');
			metadata = { segments: [4, 6, 8, 10, 12].includes(segments) ? segments : 4, filled: 0 };
		} else {
			metadata = { max: 10, current: 0 };
		}

		try {
			const entityId = crypto.randomUUID();
			const { data, error } = await supabase
				.from('wiki_entities')
				.insert({
					id: entityId,
					serial_id: serialId,
					name,
					category: type === 'clock' ? 'Clock' : 'Track',
					metadata
				})
				.select()
				.single();

			if (error) throw error;

			// Write matching event to event sourcing log
			await supabase.from('wiki_events').insert({
				entity_id: entityId,
				scene_id: sceneId,
				block_id: null,
				event_type: 'create',
				payload: { name, category: type === 'clock' ? 'Clock' : 'Track', metadata }
			});

			// Refresh events in contextEngine
			contextEngine.rawEvents = await getWikiEvents(sceneId);

			// Update baseEntities reactively
			contextEngine.baseEntities = [...contextEngine.baseEntities, data as WikiEntity];
			notifications.success(`${type} created!`);
		} catch (e) {
			console.error(e);
			notifications.error(`Failed to create ${type}`);
		}
	}

	async function updateProgress(entity: WikiEntity, delta: number) {
		const reduced = contextEngine.reducedEntities.get(entity.id);
		const currentMetadata = reduced ? reduced.metadata : entity.metadata;
		const isClock = entity.category?.toLowerCase() === 'clock';

		try {
			if (isClock) {
				await supabase.from('wiki_events').insert({
					entity_id: entity.id,
					scene_id: sceneId,
					block_id: null,
					event_type: delta > 0 ? 'increment_clock' : 'decrement_clock',
					payload: { amount: Math.abs(delta) }
				});
			} else {
				const currentVal = (currentMetadata.current as number) ?? 0;
				const maxVal = (currentMetadata.max as number) ?? 10;
				const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

				await supabase.from('wiki_events').insert({
					entity_id: entity.id,
					scene_id: sceneId,
					block_id: null,
					event_type: 'set_track',
					payload: { max: maxVal, current: newVal }
				});
			}

			// Refresh events in contextEngine reactively
			contextEngine.rawEvents = await getWikiEvents(sceneId);
			notifications.success('Progress saved!');
		} catch (e) {
			console.error(e);
			notifications.error('Failed to update progress');
		}
	}

	function getReducedMetadata(entity: WikiEntity) {
		const reduced = contextEngine.reducedEntities.get(entity.id);
		return reduced ? reduced.metadata : entity.metadata;
	}
</script>

<div data-component="mechanics-root" class="flex h-full flex-col">
	<div data-component="mechanics-list" class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
		{#if isLoading}
			<div data-component="loading-container" class="animate-pulse p-8 text-center">
				<div
					data-component="loading-dot"
					class="mx-auto mb-4 h-8 w-8 rounded-full bg-white/10"
				></div>
			</div>
		{:else if entities.length === 0}
			<div
				data-component="empty-state"
				class="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"
			>
				<p
					data-component="empty-text"
					class="text-[10px] font-bold tracking-widest text-stone-600 uppercase"
				>
					No mechanics active
				</p>
			</div>
		{:else}
			{#each entities as entity (entity.id)}
				{@const isClock = entity.category?.toLowerCase() === 'clock'}
				{@const reducedMeta = getReducedMetadata(entity)}
				{@const cursorClock = isClock
					? cursorState?.clocks?.[entity.id] || cursorState?.clocks?.[entity.name]
					: null}

				<div
					data-component="mechanic-card"
					class="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 shadow-sm transition-all duration-300 hover:bg-white/[0.03]"
					transition:slide
				>
					{#if cursorClock}
						<div
							data-component="live-marker"
							class="bg-primary/[0.01] border-primary/10 pointer-events-none absolute inset-0 rounded-2xl border"
						></div>
					{/if}

					<div data-component="mechanic-header" class="mb-3 flex items-center gap-3">
						<div
							data-component="mechanic-icon-box"
							class="bg-primary/10 text-primary rounded-lg p-2 transition-all group-hover:scale-105"
						>
							{#if isClock}
								<Timer size={16} />
							{:else}
								<Activity size={16} />
							{/if}
						</div>
						<div data-component="mechanic-titles">
							<h4
								data-component="mechanic-name"
								class="group-hover:text-primary text-sm leading-tight font-bold text-white transition-colors"
							>
								{entity.name}
							</h4>
							<div data-component="mechanic-subtitle" class="mt-0.5 flex items-center gap-1.5">
								<span
									data-component="mechanic-category"
									class="text-[10px] font-bold tracking-widest text-stone-500 uppercase"
									>{entity.category}</span
								>
								{#if cursorClock}
									<span
										data-component="live-dot"
										class="bg-primary h-1.5 w-1.5 animate-pulse rounded-full"
										title="Cursor Contextual Value"
									></span>
									<span
										data-component="live-label"
										class="text-primary text-[8px] font-bold tracking-wider uppercase">Live</span
									>
								{/if}
							</div>
						</div>
					</div>

					<div
						data-component="progress-control-row"
						class="mt-2 flex items-center justify-between gap-4"
					>
						<button
							data-component="decrement-btn"
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-bold text-stone-400 hover:bg-white/10 hover:text-white"
							onclick={() => updateProgress(entity, -1)}
						>
							-
						</button>

						<div
							data-component="progress-val-display"
							class="text-primary flex-1 text-center font-mono text-xl font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]"
						>
							{#if isClock}
								{#if cursorClock}
									{cursorClock.filled || 0} / {cursorClock.segments}
								{:else}
									{reducedMeta.filled || 0} / {reducedMeta.segments}
								{/if}
							{:else}
								{reducedMeta.current || 0} / {reducedMeta.max || 10}
							{/if}
						</div>

						<button
							data-component="increment-btn"
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-bold text-stone-400 hover:bg-white/10 hover:text-white"
							onclick={() => updateProgress(entity, 1)}
						>
							+
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<div
		data-component="mechanics-actions"
		class="space-y-2 border-t border-white/5 bg-white/[0.02] p-4"
	>
		<button
			data-component="add-clock-btn"
			class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
			onclick={() => createNewMechanic('clock')}
		>
			<Plus size={14} />
			New Clock
		</button>
		<button
			data-component="add-track-btn"
			class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-[10px] font-bold tracking-widest text-stone-500 uppercase transition-all hover:border-white/20 hover:text-white"
			onclick={() => createNewMechanic('track')}
		>
			<Plus size={14} />
			New Track
		</button>
	</div>
</div>

<script lang="ts">
	import { slide } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import { notifications } from '$lib/stores/notifications';
	import {
		createWikiEntity,
		createWikiEvent,
		type WikiEntity,
		type WikiEvent
	} from '$lib/api/wiki';

	let {
		serialId,
		scenes = [],
		open = false,
		onClose = () => {},
		onCreated = (_entity: WikiEntity, _event?: WikiEvent & { wiki_entities?: WikiEntity; scenes?: any }) => {}
	} = $props<{
		serialId: string;
		scenes: { id: string; author_title: string; display_title: string; order_index: number }[];
		open: boolean;
		onClose: () => void;
		onCreated: (entity: WikiEntity, event?: WikiEvent & { wiki_entities?: WikiEntity; scenes?: any }) => void;
	}>();

	// Form state
	let newEntityName = $state('');
	let newEntityCategory = $state<'character' | 'location' | 'clock' | 'track' | 'thread'>(
		'character'
	);
	let newEntityDesc = $state('');
	let clockSegments = $state(4);
	let trackMax = $state(10);
	let isCreating = $state(false);

	function resetForm() {
		newEntityName = '';
		newEntityDesc = '';
		newEntityCategory = 'character';
		clockSegments = 4;
		trackMax = 10;
	}

	async function handleCreate() {
		if (!newEntityName.trim()) {
			notifications.error('Please enter a name');
			return;
		}

		isCreating = true;
		try {
			let initialMeta = {};
			if (newEntityCategory === 'clock') {
				initialMeta = { segments: clockSegments, filled: 0 };
			} else if (newEntityCategory === 'track') {
				initialMeta = { max: trackMax, current: 0 };
			}

			// 1. Insert Entity
			const entity = await createWikiEntity(
				serialId,
				newEntityName,
				newEntityCategory,
				newEntityDesc,
				initialMeta
			);

			// 2. Write matching 'create' event to log (first scene if exists)
			let fullEvent: (WikiEvent & { wiki_entities?: WikiEntity; scenes?: any }) | undefined;
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

				fullEvent = {
					...createEvent,
					wiki_entities: entity,
					scenes: scenes[0]
				};
			}

			notifications.success(`${entity.name} created!`);
			resetForm();
			onCreated(entity, fullEvent);
			onClose();
		} catch (e) {
			console.error(e);
			notifications.error('Failed to create entry');
		} finally {
			isCreating = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-component="create-entry-modal-overlay"
		class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md"
		onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
	>
		<div
			data-component="create-entry-modal-container"
			class="relative w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-stone-900/90 p-6 shadow-2xl backdrop-blur-3xl"
		>
			<div data-component="modal-header" class="flex items-center justify-between">
				<h3
					data-component="modal-title"
					class="text-sm font-bold tracking-tight text-white uppercase"
				>
					New Wiki Entry
				</h3>
				<button
					data-component="modal-close-btn"
					onclick={onClose}
					class="p-1 text-stone-400 hover:text-white"
				>
					<X size={16} />
				</button>
			</div>

			<div data-component="modal-body" class="space-y-4">
				<div data-component="form-name" class="space-y-1">
					<label
						for="new_entry_name"
						class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
						>Entry Name</label
					>
					<input
						id="new_entry_name"
						type="text"
						bind:value={newEntityName}
						placeholder="e.g. Elena the Mystic"
						class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white transition-colors focus:outline-none"
					/>
				</div>

				<div data-component="form-cat" class="space-y-1">
					<label
						for="new_entry_cat"
						class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Category</label
					>
					<select
						id="new_entry_cat"
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
						for="new_entry_desc"
						class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
						>Brief Description</label
					>
					<textarea
						id="new_entry_desc"
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
					onclick={handleCreate}
					disabled={isCreating}
					class="bg-primary text-primary-foreground flex-1 rounded-xl py-2.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{isCreating ? 'Creating...' : 'Create Entry'}
				</button>
				<button
					data-component="modal-cancel"
					onclick={onClose}
					class="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold hover:bg-white/5"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

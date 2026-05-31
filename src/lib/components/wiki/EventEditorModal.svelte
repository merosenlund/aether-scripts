<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { WikiEvent } from '$lib/api/wiki';

	let {
		event,
		isOpen,
		onClose,
		onSubmit
	} = $props<{
		event: WikiEvent | null;
		isOpen: boolean;
		onClose: () => void;
		onSubmit: (result: { mode: 'correct' | 'evolve'; payload: any }) => void;
	}>();

	let mode = $state<'correct' | 'evolve'>('correct');
	
	let editedContent = $state('');
	let editedReason = $state('');

	// Reset state when event changes
	$effect(() => {
		if (event && isOpen) {
			mode = 'correct';
			editedReason = (event.payload?.reason as string) || '';
			
			if (event.event_type === 'add_fact') {
				editedContent = (event.payload?.content as string) || '';
			} else if (event.event_type === 'update_name' || event.event_type === 'create') {
				editedContent = (event.payload?.name as string) || '';
			} else if (event.event_type === 'update_description') {
				editedContent = (event.payload?.description as string) || '';
			} else {
				editedContent = '';
			}
		}
	});

	const canEvolve = $derived(
		event && ['add_fact', 'update_name', 'update_description'].includes(event.event_type)
	);

	function handleSubmit() {
		if (!event) return;
		
		const payload: Record<string, any> = {};
		if (editedReason.trim()) payload.reason = editedReason.trim();

		if (event.event_type === 'add_fact') {
			payload.content = editedContent.trim();
		} else if (event.event_type === 'update_name' || event.event_type === 'create') {
			payload.name = editedContent.trim();
		} else if (event.event_type === 'update_description') {
			payload.description = editedContent.trim();
		} else {
            // Keep existing payload properties for non-evolvable events, 
            // except reason which we override
            Object.assign(payload, event.payload, payload);
        }

		onSubmit({ mode, payload });
	}

	function formatEventType(type: string) {
		return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

{#if isOpen && event}
	<div
		class="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4"
		role="button"
		tabindex="-1"
		onclick={onClose}
		onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
	>
		<div
			class="w-full max-w-md rounded-2xl border border-white/10 bg-stone-900 shadow-2xl overflow-hidden"
			role="dialog"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="border-b border-white/5 p-4 flex items-center justify-between bg-white/[0.02]">
				<h3 class="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
					Edit <span class="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px]">{formatEventType(event.event_type)}</span>
				</h3>
				<button onclick={onClose} class="text-stone-500 hover:text-white transition-colors">✕</button>
			</div>

			<div class="p-6 space-y-6">
				{#if canEvolve}
					<div class="flex bg-stone-950/50 rounded-lg p-1 border border-white/5">
						<button
							class="flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all {mode === 'correct' ? 'bg-primary text-primary-foreground' : 'text-stone-500 hover:text-stone-300'}"
							onclick={() => mode = 'correct'}
						>
							Correct Typo
						</button>
						<button
							class="flex-1 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-md transition-all {mode === 'evolve' ? 'bg-indigo-500 text-white' : 'text-stone-500 hover:text-stone-300'}"
							onclick={() => mode = 'evolve'}
						>
							Evolve Narrative
						</button>
					</div>

					{#if mode === 'correct'}
						<div class="text-[10px] text-stone-400 bg-white/5 rounded-lg p-3" transition:slide>
							<strong>Correct Mode:</strong> Edits the event payload directly. Use this to fix spelling mistakes or reword something without changing the chronological history.
						</div>
					{:else}
						<div class="text-[10px] text-indigo-300 bg-indigo-500/10 rounded-lg p-3" transition:slide>
							<strong>Evolve Mode:</strong> Leaves the original event untouched. Drops a new event in the timeline to represent this narrative advancement.
						</div>
					{/if}
				{/if}

				<div class="space-y-4">
					{#if ['add_fact', 'update_name', 'update_description', 'create'].includes(event.event_type)}
						<div class="space-y-1.5">
							<label for="edit-content-input" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
								{event.event_type === 'add_fact' ? 'Fact Content' : event.event_type === 'update_description' ? 'Description' : 'Name'}
							</label>
							{#if event.event_type === 'update_name' || event.event_type === 'create'}
								<input
									id="edit-content-input"
									type="text"
									bind:value={editedContent}
									class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
								/>
							{:else}
								<textarea
									id="edit-content-input"
									bind:value={editedContent}
									rows="3"
									class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
								></textarea>
							{/if}
						</div>
					{/if}

					<div class="space-y-1.5">
						<label for="edit-reason-input" class="text-[10px] font-bold tracking-widest text-stone-500 uppercase">
							Reason <span class="font-normal normal-case opacity-50">(optional)</span>
						</label>
						<input
							id="edit-reason-input"
							type="text"
							bind:value={editedReason}
							placeholder="Why did this happen?"
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50"
						/>
					</div>
				</div>
			</div>

			<div class="border-t border-white/5 p-4 flex gap-3 bg-white/[0.02]">
				<button
					onclick={onClose}
					class="flex-1 py-2.5 text-xs font-bold text-stone-400 hover:text-white transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleSubmit}
					class="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all {mode === 'evolve' ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-primary text-primary-foreground hover:opacity-90'}"
				>
					{mode === 'evolve' ? 'Evolve Event' : 'Save Changes'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { promptState, closePrompt } from '$lib/stores/prompt.svelte';
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	let inputRef: HTMLInputElement | undefined = $state(undefined);
	let confirmRef: HTMLButtonElement | undefined = $state(undefined);
	let inputValue = $state('');

	$effect(() => {
		if (promptState.isOpen) {
			inputValue = promptState.defaultValue;
			setTimeout(() => {
				if (promptState.isConfirm) {
					// In confirm mode, focus the Confirm button for quick Enter
					confirmRef?.focus();
				} else if (inputRef) {
					inputRef.focus();
					inputRef.select();
				}
			}, 50);
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		closePrompt(inputValue);
	}

	function handleCancel() {
		closePrompt(null);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && promptState.isOpen) {
			handleCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if promptState.isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={handleCancel}
	>
		<!-- Modal -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-stone-900 p-6 shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Ambient Glow -->
			<div
				class="bg-primary/20 pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl"
			></div>

			<h3 class="mb-2 text-xl font-bold text-white">{promptState.title}</h3>
			{#if promptState.description}
				<p class="mb-6 text-sm text-stone-400">{promptState.description}</p>
			{/if}

			<form onsubmit={handleSubmit} class="relative z-10 space-y-6">
				{#if !promptState.isConfirm}
					<div>
						<input
							bind:this={inputRef}
							bind:value={inputValue}
							type="text"
							class="focus:border-primary/50 focus:ring-primary/50 w-full rounded-xl border border-white/10 bg-stone-950/50 px-4 py-3 text-stone-100 shadow-inner transition-all placeholder:text-stone-600 focus:ring-1 focus:outline-none"
							placeholder="Type here..."
						/>
					</div>
				{/if}

				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={handleCancel}
						class="rounded-xl px-4 py-2 text-sm font-bold text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
					>
						Cancel
					</button>
					<button
						bind:this={confirmRef}
						type="submit"
						class="bg-primary text-primary-foreground shadow-primary/20 rounded-xl px-6 py-2 text-sm font-bold shadow-lg transition-opacity hover:opacity-90"
					>
						Confirm
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

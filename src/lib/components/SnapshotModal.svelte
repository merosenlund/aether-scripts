<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { GitBranch, Save } from '@lucide/svelte';

	let { isOpen = false, mode = 'create', initialName = '', initialSemanticVersion = '0.0.0', onConfirm, onCancel } = $props<{
		isOpen: boolean;
		mode?: 'create' | 'edit';
		initialName?: string;
		initialSemanticVersion?: string;
		onConfirm: (name: string, semanticVersion: string) => void;
		onCancel: () => void;
	}>();

	let name = $state('');
	let semanticVersion = $state('');

	$effect(() => {
		if (isOpen) {
			name = initialName || '';
			semanticVersion = initialSemanticVersion || '0.0.0';
		}
	});

	function bumpVersion(type: 'major' | 'minor' | 'patch') {
		const parts = semanticVersion.split('.').map(Number);
		if (parts.length !== 3 || parts.some(isNaN)) return;

		if (type === 'major') {
			parts[0] += 1;
			parts[1] = 0;
			parts[2] = 0;
		} else if (type === 'minor') {
			parts[1] += 1;
			parts[2] = 0;
		} else if (type === 'patch') {
			parts[2] += 1;
		}
		semanticVersion = parts.join('.');
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		onConfirm(name, semanticVersion);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={onCancel}
	>
		<!-- Modal -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-stone-900 shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Ambient Glow -->
			<div
				class="bg-primary/20 pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl"
			></div>

			<form onsubmit={handleSubmit} class="flex flex-col p-6 space-y-6">
                <div>
                    <h3 class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase">
                        <Save class="text-primary h-4 w-4" />
                        {mode === 'edit' ? 'Edit Snapshot' : 'Create Snapshot'}
                    </h3>
                </div>

                <div class="space-y-4">
                    <div class="space-y-1.5">
                        <label for="snapshot_name" class="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                            Snapshot Name (Optional)
                        </label>
                        <input
                            id="snapshot_name"
                            type="text"
                            bind:value={name}
                            class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-100 transition-all focus:outline-none placeholder:text-stone-600"
                            placeholder="e.g. First Draft Finished"
                        />
                    </div>
                </div>

				<div class="space-y-4 pt-2">
                    <div class="flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest text-stone-400 uppercase">
                        <GitBranch class="text-primary h-4 w-4" />
                        Semantic Versioning
                    </div>
					<div class="space-y-1.5">
						<label
							for="sem_ver"
							class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>Reader-facing Version</label
						>
						<input
							id="sem_ver"
							type="text"
							bind:value={semanticVersion}
							class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center font-mono text-sm tracking-widest text-stone-100 transition-all focus:outline-none"
							placeholder="e.g. 1.0.0"
						/>
					</div>

					<div class="grid grid-cols-3 gap-2">
						<button
                            type="button"
							onclick={() => bumpVersion('major')}
							class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5"
						>
							+ Major
						</button>
						<button
                            type="button"
							onclick={() => bumpVersion('minor')}
							class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5"
						>
							+ Minor
						</button>
						<button
                            type="button"
							onclick={() => bumpVersion('patch')}
							class="rounded-xl border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold tracking-wider uppercase transition-all hover:border-white/10 hover:bg-white/5"
						>
							+ Patch
						</button>
					</div>

					<p class="text-[9px] leading-relaxed font-medium text-stone-500">
						Use Major for full rewrites, Minor for polish/additions, and Patch for small typo
						fixes.
					</p>
				</div>

				<div class="flex justify-end gap-3 pt-4 border-t border-white/5">
					<button
						type="button"
						onclick={onCancel}
						class="rounded-xl px-4 py-2 text-sm font-bold text-stone-400 transition-colors hover:bg-white/5 hover:text-white"
					>
						Cancel
					</button>
					<button
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

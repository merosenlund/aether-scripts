<script lang="ts">
	import Tiptap from '$lib/editor/Tiptap.svelte';
	import { History, Eye, ArrowRight, Calendar, AlertCircle } from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';
	import { supabase } from '$lib/supabaseClient';

	let { data } = $props<{ data: any }>();

	let currentSceneContent = $state(data.scene.content_blocks || '');
	let selectedVersionId = $state<string | null>(null);
	let selectedVersionNumber = $state<number | null>(null);
	let selectedVersionContent = $state<any>('');
	let isLoadingVersion = $state(false);

	async function selectVersion(versionId: string, versionNumber: number) {
		if (selectedVersionId === versionId) return;
		selectedVersionId = versionId;
		selectedVersionNumber = versionNumber;
		isLoadingVersion = true;

		// Fetch the version content from Supabase
		const { data: verData, error } = await supabase
			.from('scene_versions')
			.select('content')
			.eq('id', versionId)
			.single();

		isLoadingVersion = false;
		if (!error && verData) {
			// In production/Tiptap, content is stored as JSON or HTML. We'll stringify JSON to HTML or use it.
			// If it's a JSON object, convert to HTML using a parser, or if stored as HTML, use directly.
			if (typeof verData.content === 'object' && verData.content !== null) {
				selectedVersionContent = verData.content;
			} else {
				selectedVersionContent = verData.content || '';
			}
		}
	}

	// Format helper for dates
	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="absolute inset-0 flex overflow-hidden bg-stone-950 font-sans text-stone-100">
	<!-- Left Sidebar: Snapshots List -->
	<aside class="flex w-80 shrink-0 flex-col border-r border-white/5 bg-stone-900/10">
		<div class="border-b border-white/5 bg-white/[0.02] p-6">
			<h3
				class="flex items-center gap-2 text-xs font-bold tracking-widest text-stone-500 uppercase"
			>
				<History class="text-primary h-4 w-4" />
				Snapshot History
			</h3>
			<p class="mt-1 text-[10px] leading-relaxed font-medium text-stone-600">
				Select a read-only snapshot from the past to compare against your active track.
			</p>
		</div>

		<div class="flex-1 space-y-2.5 overflow-y-auto p-4">
			{#if data.versions.length === 0}
				<div
					class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"
				>
					<p class="mb-1 text-[10px] font-bold tracking-widest text-stone-600 uppercase">
						No Snapshots
					</p>
					<p class="text-xs text-stone-700 italic">
						Save a snapshot in the Editor to start version tracking.
					</p>
				</div>
			{:else}
				{#each data.versions as ver}
					<button
						onclick={() => selectVersion(ver.id, ver.version_number)}
						class="group flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all {selectedVersionId ===
						ver.id
							? 'bg-primary/10 border-primary shadow-[0_0_12px_rgba(var(--primary),0.05)]'
							: 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5'}"
					>
						<div class="flex w-full items-center justify-between">
							<span
								class="text-xs font-bold tracking-wider uppercase {selectedVersionId === ver.id
									? 'text-primary'
									: 'text-stone-300'}"
							>
								Snapshot v{ver.version_number}
							</span>
							<span
								class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-stone-500 uppercase"
							>
								{ver.stage}
							</span>
						</div>

						<div class="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
							<Calendar class="h-3 w-3 text-stone-600" />
							<span>{formatDate(ver.created_at)}</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</aside>

	<!-- Split View Compare / Diff Canvas -->
	<div class="relative flex flex-1 overflow-hidden">
		{#if !selectedVersionId}
			<!-- Empty State -->
			<div
				class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
				in:fade
			>
				<div
					class="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-white/[0.02]"
				>
					<History class="h-8 w-8 text-stone-600" />
				</div>
				<h3 class="mb-2 font-serif text-lg font-bold text-white/90">
					Compare Historical Snapshots
				</h3>
				<p class="max-w-md text-sm leading-relaxed text-stone-500">
					Select any past version from the left panel to open the side-by-side comparison screen.
					You'll be able to review history and cherry-pick elements back into your current timeline.
				</p>
			</div>
		{:else}
			<!-- Active Split Screen -->
			<div class="grid h-full min-h-0 flex-1 grid-cols-2 gap-4 overflow-hidden p-6" in:fade>
				<!-- Left: Past Version (Read-Only) -->
				<div class="flex h-full min-h-0 flex-col">
					<div
						class="flex shrink-0 items-center justify-between rounded-t-2xl border border-b-0 border-white/5 bg-stone-900/40 px-4 py-2"
					>
						<span
							class="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-stone-500 uppercase"
						>
							<Eye class="h-3.5 w-3.5 text-stone-600" />
							Snapshot v{selectedVersionNumber} (Read-Only)
						</span>
					</div>
					<div
						class="relative min-h-0 flex-1 overflow-hidden rounded-b-2xl border border-white/5 bg-stone-950"
					>
						{#if isLoadingVersion}
							<div
								class="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm"
							>
								<span class="text-xs font-bold tracking-wider text-stone-500"
									>Loading snapshot...</span
								>
							</div>
						{/if}
						<Tiptap content={selectedVersionContent} editable={false} sceneId={data.scene.id} />
					</div>
				</div>

				<!-- Right: Active Version (Editable) -->
				<div class="relative flex h-full min-h-0 flex-col">
					<div
						class="flex shrink-0 items-center justify-between rounded-t-2xl border border-b-0 border-white/5 bg-stone-900/40 px-4 py-2"
					>
						<span
							class="text-primary flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase"
						>
							Active Track (Editable)
						</span>
						<div class="flex items-center gap-1 text-[10px] font-bold text-stone-600">
							<AlertCircle class="h-3 w-3" />
							<span>Copy-paste block contents to cherry-pick</span>
						</div>
					</div>
					<div
						class="min-h-0 flex-1 overflow-hidden rounded-b-2xl border border-white/5 bg-stone-950"
					>
						<Tiptap bind:content={currentSceneContent} sceneId={data.scene.id} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

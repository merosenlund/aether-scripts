<script lang="ts">
	import Tiptap from '$lib/editor/Tiptap.svelte';
	import WikiSidebar from '$lib/components/WikiSidebar.svelte';
	import EditorTelemetryHUD from '$lib/components/editor/EditorTelemetryHUD.svelte';
	import { Save, BookOpen, FileText, Settings2 } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { supabase } from '$lib/supabaseClient';

	let { data } = $props<{ data: any }>();
	let content = $state(data.scene.content_blocks || '');
	let authorTitle = $state(data.scene.author_title || '');
	let displayTitle = $state(data.scene.display_title || '');
	let description = $state(data.scene.description || '');
	let summary = $state(data.scene.summary || '');
	let activeBlockId = $state('');
	let visibleBlockIds = $state<string[]>([]);
	let activeTab = $state('wiki');
	let editorComponent = $state<any>();
	let isSavingSettings = $state(false);
	let saveSuccess = $state(false);
	let saveStatus = $state<'synced' | 'saving' | 'error'>('synced');

	async function saveMetadata() {
		isSavingSettings = true;
		const { error } = await supabase
			.from('scenes')
			.update({
				author_title: authorTitle,
				display_title: displayTitle,
				description,
				summary
			})
			.eq('id', data.scene.id);

		isSavingSettings = false;
		if (!error) {
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3000);
			// Reload scene data if needed or let client react
		}
	}
</script>

<div class="absolute inset-0 flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100">
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Main Editor Area -->
		<div
			class="animate-fade-in relative flex flex-1 flex-col items-center overflow-hidden px-8 pt-8"
		>
			<div class="flex h-full min-h-0 w-full max-w-4xl flex-col">
				<!-- Editor Header / Action Row -->
				<div class="mb-6 flex shrink-0 items-center justify-between">
					<!-- Left side: Autosave Status Indicator -->
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-widest text-stone-400 uppercase select-none transition-all duration-300 shadow-sm">
							{#if saveStatus === 'saving'}
								<span class="relative flex h-1.5 w-1.5">
									<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
									<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
								</span>
								<span class="text-amber-400/90 animate-pulse font-bold">Saving...</span>
							{:else if saveStatus === 'error'}
								<span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
								<span class="text-rose-400 font-extrabold">Save Error</span>
							{:else}
								<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
								<span class="text-stone-400 text-opacity-80">Synced</span>
							{/if}
						</div>
					</div>

					<!-- Right side: Buttons -->
					<div class="flex gap-3">
						<button
							onclick={() => editorComponent?.save()}
							disabled={editorComponent?.getIsSaving?.()}
							class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-5 py-2 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
						>
							<Save class="mr-2 h-3.5 w-3.5" />
							{editorComponent?.getIsSaving?.() ? 'Saving...' : 'Create Snapshot'}
						</button>
					</div>
				</div>

				<!-- Editor Canvas -->
				<div class="group relative min-h-0 flex-1">
					<Tiptap
						bind:this={editorComponent}
						bind:content
						bind:saveStatus
						initialContent={data.scene.content_blocks || null}
						bind:activeBlockId
						sceneId={data.scene.id}
						serialId={data.scene.serial_id}
						onUpdate={(html) => (content = html)}
					/>
				</div>
			</div>
		</div>

		<!-- Sidebar: Draft & Revision Tools -->
		<aside
			class="z-20 flex w-85 flex-col overflow-y-auto border-l border-white/5 bg-stone-900/20 shadow-2xl backdrop-blur-3xl"
		>
			<div class="flex gap-2 border-b border-white/5 bg-white/5 p-4">
				<button
					onclick={() => (activeTab = 'wiki')}
					class="flex flex-1 items-center justify-center rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all {activeTab ===
					'wiki'
						? 'bg-primary shadow-primary/20 text-white shadow-lg'
						: 'text-stone-500 hover:bg-white/5 hover:text-white'}"
				>
					<BookOpen class="mr-2 h-3.5 w-3.5" />
					Wiki
				</button>
				<button
					onclick={() => (activeTab = 'metadata')}
					class="flex flex-1 items-center justify-center rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all {activeTab ===
					'metadata'
						? 'bg-primary shadow-primary/20 text-white shadow-lg'
						: 'text-stone-500 hover:bg-white/5 hover:text-white'}"
				>
					<FileText class="mr-2 h-3.5 w-3.5" />
					Meta
				</button>
			</div>

			<div class="flex-1 overflow-hidden">
				{#if activeTab === 'metadata'}
					<div class="h-full space-y-5 overflow-y-auto p-6" in:fade>
						<div class="mb-2 flex items-center justify-between">
							<h3
								class="flex items-center text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase"
							>
								Scene Metadata
								<div class="ml-2 h-px w-12 bg-white/5"></div>
							</h3>
							{#if saveSuccess}
								<span class="text-[10px] font-bold text-emerald-400" transition:fade>Saved!</span>
							{/if}
						</div>

						<div class="space-y-4">
							<div class="space-y-1.5">
								<label
									for="author_title"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Author Title (Internal)</label
								>
								<input
									id="author_title"
									type="text"
									bind:value={authorTitle}
									class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-serif text-sm text-stone-100 transition-all focus:outline-none"
									placeholder="e.g. Chapter 1: The Awakening (Draft)"
								/>
							</div>

							<div class="space-y-1.5">
								<label
									for="display_title"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Display Title (Reader-facing)</label
								>
								<input
									id="display_title"
									type="text"
									bind:value={displayTitle}
									class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-serif text-sm text-stone-100 transition-all focus:outline-none"
									placeholder="e.g. Chapter I: The Awakening"
								/>
							</div>

							<div class="space-y-1.5">
								<label
									for="description"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Teaser / Description</label
								>
								<textarea
									id="description"
									bind:value={description}
									rows="3"
									class="focus:border-primary/50 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-200 transition-all focus:outline-none"
									placeholder="A short teaser displayed in feeds..."
								></textarea>
							</div>

							<div class="space-y-1.5">
								<label
									for="summary"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Scene Summary</label
								>
								<textarea
									id="summary"
									bind:value={summary}
									rows="4"
									class="focus:border-primary/50 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-stone-200 transition-all focus:outline-none"
									placeholder="A brief summary for reading lists..."
								></textarea>
							</div>

							<button
								onclick={saveMetadata}
								disabled={isSavingSettings}
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold transition-all hover:border-white/20 hover:bg-white/10"
							>
								<Settings2 class="h-4 w-4 text-stone-400" />
								{isSavingSettings ? 'Saving...' : 'Save Metadata'}
							</button>
						</div>
					</div>
				{:else}
					<div class="h-full" in:fade>
						<WikiSidebar
							serialId={data.scene.serial_id}
							sceneId={data.scene.id}
							{activeBlockId}
							{visibleBlockIds}
						/>
					</div>
				{/if}
			</div>
		</aside>
	</div>

	<!-- Sticky Telemetry HUD -->
	<EditorTelemetryHUD
		serialId={data.scene.serial_id}
		sceneId={data.scene.id}
		serialTitle={data.scene.serials?.title || ''}
		sessionType="edit"
		initialContent={data.scene.content_blocks || ''}
	/>
</div>

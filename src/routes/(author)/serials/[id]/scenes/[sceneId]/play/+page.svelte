<script lang="ts">
	import { onMount } from 'svelte';
	import Reader from '$lib/components/Reader.svelte';
	import Tiptap from '$lib/editor/Tiptap.svelte';
	import WikiSidebar from '$lib/components/WikiSidebar.svelte';
	import MechanicsTab from '$lib/components/mechanics/MechanicsTab.svelte';
	import EditorTelemetryHUD from '$lib/components/editor/EditorTelemetryHUD.svelte';
	import { PenTool, Eye, Save, Dices, Trash2, Clock, BookOpen, Activity, Sidebar } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import { gameSession } from '$lib/stores/gameSession.svelte';

	let { data } = $props<{ data: any }>();
	
	let initialContent = data.scene.content_blocks || '';
	let content = $state(initialContent);
	let activeBlockId = $state('');
	let visibleBlockIds = $state<string[]>([]);
	let activeTab = $state('wiki');
	let isPreview = $state(false);
	let editorComponent = $state<any>();
	let cursorState = $state<any>({ clocks: {} });
	let saveStatus = $state<'synced' | 'saving' | 'error'>('synced');
	let showSidebar = $state(false);

	// Sidebar-initiated editor highlighting
	function handleHighlightBlock(blockId: string | null) {
		if (!isPreview) {
			editorComponent?.highlightBlock(blockId);
		}
	}

	function handleFocusBlock(blockId: string) {
		if (!isPreview) {
			editorComponent?.scrollToBlock(blockId);
		}
	}

	onMount(() => {
		showSidebar = window.innerWidth >= 768;
	});
</script>

<div class="absolute inset-0 flex flex-col overflow-hidden bg-stone-950 font-sans text-stone-100">
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Main Play Area -->
		<div
			class="animate-fade-in relative flex flex-1 flex-col items-center overflow-hidden px-4 md:px-8 pt-4 md:pt-8"
		>
			<div class="flex h-full min-h-0 w-full max-w-4xl flex-col">
				<!-- Controls -->
				<div class="mb-6 flex shrink-0 items-center justify-between">
					<!-- Left side: Autosave Status Indicator -->
					<div class="flex items-center gap-2">
						{#if !isPreview}
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
						{/if}
					</div>

					<!-- Right side: Buttons -->
					<div class="flex gap-3">
						<button
							onclick={() => (isPreview = !isPreview)}
							class="rounded-xl border p-2.5 shadow-sm transition-all {isPreview
								? 'bg-primary/20 border-primary text-primary'
								: 'border-white/10 bg-white/5 text-stone-400 hover:border-white/20 hover:text-white'}"
							title={isPreview ? 'Back to Editor' : 'Reader Preview'}
						>
							<Eye class="h-4 w-4" />
						</button>
						
						<button
							onclick={() => (showSidebar = !showSidebar)}
							class="rounded-xl border p-2.5 shadow-sm transition-all {showSidebar
								? 'bg-primary/20 border-primary text-primary'
								: 'border-white/10 bg-white/5 text-stone-400 hover:border-white/20 hover:text-white'}"
							title="Toggle Sidebar"
						>
							<Sidebar class="h-4 w-4" />
						</button>

						{#if !isPreview}
							<button
								onclick={() => editorComponent?.save()}
								disabled={editorComponent?.getIsSaving?.()}
								class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-3 py-2 md:px-5 md:py-2 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
							>
								<Save class="mr-1.5 md:mr-2 h-3.5 w-3.5" />
								<span>{editorComponent?.getIsSaving?.() ? 'Saving...' : ''}</span>
								{#if !editorComponent?.getIsSaving?.()}
									<span class="hidden md:inline">Create Snapshot</span>
									<span class="inline md:hidden">Snapshot</span>
								{/if}
							</button>
						{/if}
					</div>
				</div>

				<!-- Editor Canvas -->
				<div class="group relative min-h-0 flex-1">
					{#if isPreview}
						<div in:fade class="h-full overflow-y-auto scroll-smooth pr-2">
							<Reader {content} onVisibleBlocksChange={(ids) => (visibleBlockIds = ids)} />
							<div class="h-32"></div>
						</div>
					{:else}
						<Tiptap
							bind:this={editorComponent}
							bind:content
							bind:saveStatus
							initialContent={data.scene.content_blocks || null}
							bind:activeBlockId
							bind:cursorState
							sceneId={data.scene.id}
							serialId={data.scene.serial_id}
							onUpdate={(html) => (content = html)}
						/>
					{/if}
				</div>
			</div>
		</div>

		{#if showSidebar}
			<!-- Mobile Backdrop Overlay -->
			<div
				onclick={() => (showSidebar = false)}
				keydown={(e) => e.key === 'Escape' && (showSidebar = false)}
				role="button"
				tabindex="0"
				class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
			></div>
		{/if}

		<!-- Sidebar: Assistive Tools -->
		<aside
			class="fixed inset-y-0 right-0 z-40 flex w-[85vw] max-w-sm flex-col overflow-y-auto border-l border-white/5 bg-stone-900 shadow-2xl backdrop-blur-3xl transition-transform duration-300 md:relative md:inset-auto md:z-20 md:flex md:w-80
			{showSidebar ? 'translate-x-0' : 'translate-x-full md:hidden'}"
		>
			<div class="flex gap-2 border-b border-white/5 bg-white/5 p-4">
				<button
					onclick={() => (activeTab = 'log')}
					class="flex flex-1 items-center justify-center rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all {activeTab ===
					'log'
						? 'bg-primary shadow-primary/20 text-white shadow-lg'
						: 'text-stone-500 hover:bg-white/5 hover:text-white'}"
				>
					<Dices class="mr-2 h-3.5 w-3.5" />
					Log
				</button>
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
					onclick={() => (activeTab = 'mechanics')}
					class="flex flex-1 items-center justify-center rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all {activeTab ===
					'mechanics'
						? 'bg-primary shadow-primary/20 text-white shadow-lg'
						: 'text-stone-500 hover:bg-white/5 hover:text-white'}"
				>
					<Activity class="mr-2 h-3.5 w-3.5" />
					Mech
				</button>
			</div>

			<div class="flex-1 overflow-hidden">
				{#if activeTab === 'log'}
					<div class="h-full space-y-4 overflow-y-auto p-6" in:fade>
						<div class="flex items-center justify-between">
							<h3
								class="flex items-center text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase"
							>
								Recent Log
								<div class="ml-2 h-px w-12 bg-white/5"></div>
							</h3>
							{#if gameSession.rolls.length > 0}
								<button
									class="flex items-center text-[10px] font-bold text-stone-600 transition-colors hover:text-rose-400"
									onclick={() => gameSession.clearRolls()}
								>
									<Trash2 class="mr-1 h-3 w-3" />
									CLEAR
								</button>
							{/if}
						</div>

						<div class="space-y-3">
							{#if gameSession.rolls.length === 0}
								<div
									class="rounded-2xl border border-dashed border-white/5 bg-white/[0.02] p-8 text-center"
									transition:fade
								>
									<p class="mb-2 text-[10px] font-bold tracking-widest text-stone-600 uppercase">
										Empty Log
									</p>
									<p class="text-xs text-stone-700 italic">No rolls recorded in this session.</p>
								</div>
							{:else}
								{#each gameSession.rolls as roll (roll.id)}
									<div
										transition:fly={{ y: 10, duration: 300 }}
										class="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm transition-all hover:bg-white/10"
									>
										<div class="space-y-1">
											<span
												class="text-primary block text-[10px] font-bold tracking-widest uppercase"
												>{roll.formula}</span
											>
											<div class="flex items-center text-[10px] font-medium text-stone-500">
												<Clock class="mr-1 h-2.5 w-2.5" />
												{new Date(roll.timestamp).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</div>
										</div>
										<div class="relative">
											<div
												class="bg-primary/20 absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity group-hover:opacity-100"
											></div>
											<span
												class="group-hover:text-primary relative text-2xl font-bold text-white transition-colors"
												>{roll.result}</span
											>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{:else if activeTab === 'mechanics'}
					<div class="h-full" in:fade>
						<MechanicsTab
							serialId={data.scene.serial_id}
							sceneId={data.scene.id}
							{cursorState}
							onHighlightBlock={handleHighlightBlock}
							onFocusBlock={handleFocusBlock}
						/>
					</div>
				{:else}
					<div class="h-full" in:fade>
						<WikiSidebar
							serialId={data.scene.serial_id}
							sceneId={data.scene.id}
							scenes={[{ id: data.scene.id, author_title: data.scene.author_title, display_title: data.scene.display_title, order_index: data.scene.order_index }]}
							{activeBlockId}
							{visibleBlockIds}
							onHighlightBlock={handleHighlightBlock}
							onFocusBlock={handleFocusBlock}
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
		sessionType="play"
		initialContent={data.scene.content_blocks || ''}
	/>
</div>

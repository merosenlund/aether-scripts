<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		Settings,
		BookOpen,
		Compass,
		Plus,
		ChevronRight,
		Layers,
		Save,
		Trash2,
		ArrowLeft,
		Eye,
		EyeOff,
		Check,
		X,
		GripVertical
	} from '@lucide/svelte';
	import { slide, fade } from 'svelte/transition';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	let { data } = $props<{ data: any }>();

	// State
	let editTitle = $state(data.list.title);
	let editIsPublic = $state(data.list.is_public);
	let showSettings = $state(false);
	let showAddArc = $state(false);
	let newArcTitle = $state('');

	let isSaving = $state(false);
	let saveSuccess = $state(false);

	// Curation items matching svelte-dnd-action requirements (needs unique id, let's map list items)
	let itemsState = $state<any[]>([]);

	// Synchronize state with data from backend load
	$effect(() => {
		// Each list item needs its scene's title joined for UI rendering
		itemsState = data.items
			.map((item: any) => {
				const scene = data.scenes.find((s: any) => s.id === item.scene_id);
				return {
					...item,
					scene_title:
						scene?.display_title || scene?.author_title || `Scene ${scene?.order_index || ''}`
				};
			})
			.sort((a: any, b: any) => a.order_index - b.order_index);
	});

	const flipDurationMs = 200;

	// DND Handlers
	function handleConsider(e: CustomEvent) {
		itemsState = e.detail.items;
	}

	function handleFinalize(e: CustomEvent) {
		itemsState = e.detail.items;
	}

	// Update a specific item's reading mode locally in state
	function updateLocalMode(itemId: string, mode: 'prose' | 'summary' | 'description' | 'skip') {
		itemsState = itemsState.map((item) => {
			if (item.id === itemId) {
				return { ...item, reading_mode: mode };
			}
			return item;
		});
	}

	// Update a specific item's arc locally in state
	function updateLocalArc(itemId: string, arcId: string | null) {
		itemsState = itemsState.map((item) => {
			if (item.id === itemId) {
				return { ...item, list_arc_id: arcId };
			}
			return item;
		});
	}

	// Save all items (order, arc, mode) back to database
	async function saveCuration() {
		isSaving = true;

		// Recalculate order indices
		const updates = itemsState.map((item, index) => ({
			id: item.id,
			order_index: index + 1,
			list_arc_id: item.list_arc_id,
			reading_mode: item.reading_mode
		}));

		const formData = new FormData();
		formData.append('updates', JSON.stringify(updates));

		const response = await fetch('?/updateItems', {
			method: 'POST',
			body: formData
		});

		isSaving = false;
		if (response.ok) {
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
			invalidateAll();
		}
	}

	// Quick check if a scene is already added to the curation list
	function isSceneCurated(sceneId: string) {
		return itemsState.some((item) => item.scene_id === sceneId);
	}
</script>

<div class="relative flex h-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100">
	<!-- Header / Top Bar -->
	<header
		class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/10 px-8 backdrop-blur-xl"
	>
		<div class="flex items-center gap-4">
			<a
				href="/lists"
				class="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
			>
				<ArrowLeft class="h-4 w-4" />
			</a>
			<div class="space-y-0.5">
				<span class="block font-mono text-[9px] font-bold tracking-wider text-zinc-500 uppercase"
					>Curation Hub / {data.list.serial?.title}</span
				>
				<h2 class="block font-serif text-sm font-bold text-white">{data.list.title}</h2>
			</div>
		</div>

		<div class="flex items-center gap-3">
			{#if saveSuccess}
				<span
					transition:fade
					class="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400 shadow-sm"
				>
					<Check class="h-3.5 w-3.5" />
					Curation Saved
				</span>
			{/if}

			<button
				onclick={() => {
					showSettings = !showSettings;
					showAddArc = false;
				}}
				class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold transition-all hover:bg-white/10"
			>
				<Settings class="h-3.5 w-3.5" />
				List Settings
			</button>

			<button
				onclick={() => {
					showAddArc = !showAddArc;
					showSettings = false;
				}}
				class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold transition-all hover:bg-white/10"
			>
				<Plus class="h-3.5 w-3.5" />
				Add Arc Section
			</button>

			<button
				onclick={saveCuration}
				disabled={isSaving}
				class="bg-primary text-primary-foreground shadow-primary/20 flex items-center gap-1.5 rounded-xl border border-white/10 px-5 py-2 text-xs font-bold shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
			>
				{#if isSaving}
					<div
						class="border-primary-foreground h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
					></div>
				{:else}
					<Save class="h-3.5 w-3.5" />
				{/if}
				Save Curation Layout
			</button>
		</div>
	</header>

	<!-- Workspace area -->
	<div class="relative flex flex-1 overflow-hidden">
		<!-- Left panel: Chapters sidebar -->
		<aside
			class="flex w-96 shrink-0 flex-col space-y-6 overflow-y-auto border-r border-white/5 bg-zinc-900/10 p-6 backdrop-blur-2xl"
		>
			<!-- List Settings Dropdown Panel -->
			{#if showSettings}
				<div
					transition:slide
					class="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5"
				>
					<h4
						class="text-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
					>
						<Settings class="h-3.5 w-3.5" />
						Meta Settings
					</h4>

					<form
						method="POST"
						action="?/updateSettings"
						onsubmit={() => (showSettings = false)}
						class="space-y-4"
					>
						<div class="space-y-1.5">
							<label
								for="settings_title"
								class="text-[9px] font-bold tracking-wider text-zinc-400 uppercase"
								>List Title</label
							>
							<input
								id="settings_title"
								name="title"
								type="text"
								required
								bind:value={editTitle}
								class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-serif text-xs text-zinc-100 transition-all focus:outline-none"
							/>
						</div>

						<div class="space-y-1.5">
							<label class="block text-[9px] font-bold tracking-wider text-zinc-400 uppercase"
								>Visibility</label
							>
							<input type="hidden" name="isPublic" value={editIsPublic ? 'true' : 'false'} />

							<div class="grid grid-cols-2 gap-2">
								<button
									type="button"
									onclick={() => (editIsPublic = false)}
									class="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[10px] font-bold transition-all {!editIsPublic
										? 'border-primary bg-primary/10 text-white'
										: 'border-white/5 bg-black/20 text-zinc-400 hover:border-white/10'}"
								>
									<EyeOff class="h-3 w-3" /> Private
								</button>
								<button
									type="button"
									onclick={() => (editIsPublic = true)}
									class="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[10px] font-bold transition-all {editIsPublic
										? 'border-primary bg-primary/10 text-white'
										: 'border-white/5 bg-black/20 text-zinc-400 hover:border-white/10'}"
								>
									<Eye class="h-3 w-3" /> Public
								</button>
							</div>
						</div>

						<button
							type="submit"
							class="bg-primary text-primary-foreground flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 py-2 text-xs font-bold shadow-md transition-all hover:opacity-90"
						>
							<Save class="h-3.5 w-3.5" /> Save Meta
						</button>
					</form>
				</div>
			{/if}

			<!-- Add Arc Section Slidedown -->
			{#if showAddArc}
				<div
					transition:slide
					class="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5"
				>
					<h4
						class="text-primary flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
					>
						<Layers class="h-3.5 w-3.5" />
						Create Reading Section
					</h4>

					<form
						method="POST"
						action="?/createArc"
						onsubmit={() => (showAddArc = false)}
						class="space-y-4"
					>
						<div class="space-y-1.5">
							<label
								for="arc_title"
								class="text-[9px] font-bold tracking-wider text-zinc-400 uppercase"
								>Section Title</label
							>
							<input
								id="arc_title"
								name="title"
								type="text"
								required
								bind:value={newArcTitle}
								class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-serif text-xs text-zinc-100 transition-all focus:outline-none"
								placeholder="e.g. Act I: The Awakening"
							/>
							<input type="hidden" name="orderIndex" value={data.arcs.length + 1} />
						</div>

						<button
							type="submit"
							class="bg-primary text-primary-foreground flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 py-2 text-xs font-bold shadow-md transition-all hover:opacity-90"
						>
							<Plus class="h-3.5 w-3.5" /> Create Section
						</button>
					</form>
				</div>
			{/if}

			<!-- Available published scenes lists -->
			<div class="space-y-4">
				<div>
					<h3
						class="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase"
					>
						<BookOpen class="text-primary h-4 w-4" />
						Published Scenes ({data.scenes.length})
					</h3>
					<p class="mt-1 text-[10px] text-zinc-500">
						Select chapters from the original serial to include in your curation.
					</p>
				</div>

				<div class="space-y-2">
					{#each data.scenes as scene}
						{@const curated = isSceneCurated(scene.id)}
						<div
							class="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-3 transition-all hover:border-white/10"
						>
							<div class="space-y-0.5 truncate pr-2">
								<span class="block truncate font-serif text-xs font-bold text-zinc-200"
									>{scene.display_title || scene.author_title || `Scene ${scene.order_index}`}</span
								>
								<span class="block font-mono text-[8px] text-zinc-500 uppercase"
									>Chapter {scene.order_index}</span
								>
							</div>

							{#if curated}
								<span
									class="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold tracking-wider text-emerald-400 uppercase select-none"
								>
									<Check class="h-3 w-3" /> Included
								</span>
							{:else}
								<form method="POST" action="?/addItem">
									<input type="hidden" name="sceneId" value={scene.id} />
									<input type="hidden" name="orderIndex" value={itemsState.length + 1} />
									<button
										type="submit"
										class="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold tracking-wider text-zinc-400 uppercase transition-all hover:bg-white/10 hover:text-white"
									>
										<Plus
											class="group-hover:text-primary h-3 w-3 text-zinc-400 transition-colors"
										/> Add
									</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Custom Sections list (deletion/ordering) -->
			{#if data.arcs.length > 0}
				<div class="space-y-4 border-t border-white/5 pt-4">
					<h3
						class="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase"
					>
						<Layers class="text-primary h-4 w-4" />
						Custom Sections ({data.arcs.length})
					</h3>

					<div class="space-y-2">
						{#each data.arcs as arc}
							<div
								class="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-3"
							>
								<span class="truncate font-serif text-xs font-bold text-zinc-300">{arc.title}</span>

								<form
									method="POST"
									action="?/deleteArc"
									onsubmit={() => {
										// Reset any local arc assignments that point to this deleted arc
										itemsState = itemsState.map((i) =>
											i.list_arc_id === arc.id ? { ...i, list_arc_id: null } : i
										);
									}}
								>
									<input type="hidden" name="arcId" value={arc.id} />
									<button
										type="submit"
										class="shrink-0 rounded-lg p-1 text-zinc-500 transition-all hover:bg-white/5 hover:text-red-400"
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								</form>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</aside>

		<!-- Main Builder Panel: Curation Playlist Builder -->
		<main class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950 p-8">
			<div class="mx-auto flex h-full w-full max-w-4xl flex-col space-y-6 pb-24">
				<div class="flex items-end justify-between border-b border-white/5 pb-4">
					<div>
						<h3 class="flex items-center gap-2 font-serif text-base font-bold text-white">
							Playlist Curations
						</h3>
						<p class="mt-1 text-xs text-zinc-500">
							Reorder chapters, group them into your custom sections, and adjust their individual
							reading modes.
						</p>
					</div>

					<div
						class="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-zinc-400"
					>
						{itemsState.length} chapters curated
					</div>
				</div>

				{#if itemsState.length === 0}
					<div
						class="flex flex-1 flex-col items-center justify-center space-y-4 rounded-[2.5rem] border border-dashed border-white/5 bg-zinc-900/10 p-12 text-center"
					>
						<Layers class="h-12 w-12 text-zinc-800" />
						<h4 class="text-sm font-bold text-zinc-400">Your Playlist is Empty</h4>
						<p class="max-w-xs text-xs text-zinc-600">
							Use the side column to add published chapters, then customize their orders and
							settings here.
						</p>
					</div>
				{:else}
					<div class="flex-1 space-y-4 overflow-y-auto pr-2">
						<!-- Drag & Drop Container -->
						<div
							use:dndzone={{ items: itemsState, flipDurationMs }}
							onconsider={handleConsider}
							onfinalize={handleFinalize}
							class="min-h-64 space-y-3"
						>
							{#each itemsState as item, index (item.id)}
								<div
									animate:flip={{ duration: flipDurationMs }}
									class="group relative flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60 md:flex-row md:items-center"
								>
									<!-- Drag Handle & Basic Title info -->
									<div class="flex w-full items-center gap-3 md:w-auto">
										<div
											class="shrink-0 cursor-grab p-1 text-zinc-600 transition-colors hover:text-zinc-400 active:cursor-grabbing"
										>
											<GripVertical class="h-4 w-4" />
										</div>
										<div class="space-y-0.5 truncate">
											<span class="block truncate font-serif text-xs font-bold text-zinc-200"
												>{item.scene_title}</span
											>
											<span class="block font-mono text-[8px] font-bold text-zinc-500 uppercase"
												>Sequence {index + 1}</span
											>
										</div>
									</div>

									<!-- Edit layout settings (Reading Mode, Arc Selection) -->
									<div class="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
										<!-- Arc assignment dropdown -->
										{#if data.arcs.length > 0}
											<div class="flex items-center gap-1">
												<span
													class="mr-1 text-[8px] font-bold tracking-wider text-zinc-500 uppercase"
													>Section:</span
												>
												<select
													value={item.list_arc_id || ''}
													onchange={(e) =>
														updateLocalArc(item.id, (e.target as HTMLSelectElement).value || null)}
													class="focus:border-primary/50 cursor-pointer rounded-xl border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-zinc-300 focus:outline-none"
												>
													<option value="">Unassigned</option>
													{#each data.arcs as arc}
														<option value={arc.id}>{arc.title}</option>
													{/each}
												</select>
											</div>
										{/if}

										<!-- Reading Mode toggle buttons -->
										<div
											class="flex shrink-0 items-center gap-1 rounded-xl border border-white/5 bg-black/40 p-1"
										>
											<button
												onclick={() => updateLocalMode(item.id, 'prose')}
												class="rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all
                          {item.reading_mode === 'prose'
													? 'bg-primary/20 text-primary font-bold'
													: 'text-zinc-500 hover:text-zinc-300'}"
											>
												Prose
											</button>
											<button
												onclick={() => updateLocalMode(item.id, 'summary')}
												class="rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all
                          {item.reading_mode === 'summary'
													? 'bg-indigo-500/20 font-bold text-indigo-400'
													: 'text-zinc-500 hover:text-zinc-300'}"
											>
												Summary
											</button>
											<button
												onclick={() => updateLocalMode(item.id, 'description')}
												class="rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all
                          {item.reading_mode === 'description'
													? 'bg-amber-500/20 font-bold text-amber-400'
													: 'text-zinc-500 hover:text-zinc-300'}"
											>
												Desc
											</button>
											<button
												onclick={() => updateLocalMode(item.id, 'skip')}
												class="rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all
                          {item.reading_mode === 'skip'
													? 'bg-rose-500/20 font-bold text-rose-400'
													: 'text-zinc-500 hover:text-zinc-300'}"
											>
												Skip
											</button>
										</div>

										<!-- Remove scene from curation list entirely -->
										<form method="POST" action="?/removeItem">
											<input type="hidden" name="itemId" value={item.id} />
											<button
												type="submit"
												class="rounded-xl border border-white/10 bg-white/5 p-1.5 text-zinc-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
											>
												<Trash2 class="h-3.5 w-3.5" />
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

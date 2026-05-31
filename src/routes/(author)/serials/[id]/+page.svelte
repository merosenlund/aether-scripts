<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		Settings,
		PenTool,
		BookOpen,
		Clock,
		Users,
		Plus,
		ChevronRight,
		FolderPlus,
		Layers,
		Save,
		CheckCircle,
		DownloadCloud
	} from '@lucide/svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { fade, slide } from 'svelte/transition';
	import { generateSerialBackup } from '$lib/utils/export';
	import { supabase } from '$lib/supabaseClient';

	let { data } = $props<{ data: any }>();

	// State
	let showAddArc = $state(false);
	let newArcTitle = $state('');
	let isSavingOrder = $state(false);
	let orderSaved = $state(false);

	let isExporting = $state(false);
	let exportError = $state<string | null>(null);

	let showSettings = $state(false);
	let editTitle = $state('');
	let editStatus = $state('');
	let editColorTheme = $state('');

	$effect(() => {
		if (data.serial) {
			editTitle = data.serial.title;
			editStatus = data.serial.status || 'draft';
			editColorTheme = data.serial.color_theme || 'from-violet-600 to-indigo-600';
		}
	});

	// Group scenes by Arc reactive to data.scenes
	let scenesByArc = $state<Record<string, any[]>>({});

	// Initialize and keep state synced with backend data
	$effect(() => {
		const grouped: Record<string, any[]> = { unassigned: [] };

		// Initialize groups for arcs
		data.arcs.forEach((arc: any) => {
			grouped[arc.id] = [];
		});

		// Populate groups
		data.scenes.forEach((scene: any) => {
			const key = scene.arc_id || 'unassigned';
			if (!grouped[key]) {
				grouped[key] = [];
			}
			grouped[key].push(scene);
		});

		// Sort by order_index within each group
		Object.keys(grouped).forEach((key) => {
			grouped[key].sort((a, b) => a.order_index - b.order_index);
		});

		scenesByArc = grouped;
	});

	const flipDurationMs = 200;

	// DND Handlers
	function handleConsider(arcId: string, e: CustomEvent) {
		scenesByArc[arcId] = e.detail.items;
	}

	async function handleFinalize(arcId: string, e: CustomEvent) {
		scenesByArc[arcId] = e.detail.items;

		// Save new order to database
		isSavingOrder = true;

		// Calculate new order indexes across all groups
		const updates: { id: string; arc_id: string | null; order_index: number }[] = [];

		Object.entries(scenesByArc).forEach(([groupId, items]) => {
			const dbArcId = groupId === 'unassigned' ? null : groupId;
			items.forEach((item, index) => {
				updates.push({
					id: item.id,
					arc_id: dbArcId,
					order_index: index + 1
				});
			});
		});

		const formData = new FormData();
		formData.append('updates', JSON.stringify(updates));

		const response = await fetch('?/updateSceneOrder', {
			method: 'POST',
			body: formData
		});

		isSavingOrder = false;

		if (response.ok) {
			orderSaved = true;
			setTimeout(() => (orderSaved = false), 2000);
			invalidateAll();
		}
	}

	async function handleExport() {
		if (isExporting) return;
		isExporting = true;
		exportError = null;
		try {
			await generateSerialBackup(data.serial.id, data.serial.title, supabase);
		} catch (e) {
			console.error(e);
			exportError = 'Export failed. See console.';
		} finally {
			isExporting = false;
		}
	}

	// Formatting helper
	function formatRelativeTime(dateStr: string | null) {
		if (!dateStr) return 'Unpublished';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	}
</script>

<div class="relative flex h-full flex-col overflow-hidden bg-stone-950 font-sans text-stone-100">
	<!-- Hero Section -->
	<div
		class="h-56 bg-gradient-to-br {data.serial.color_theme ||
			'from-violet-600 to-indigo-600'} relative shrink-0 overflow-hidden"
	>
		<div class="absolute inset-0 bg-black/40"></div>
		<div
			class="absolute inset-0 opacity-20 mix-blend-overlay"
			style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
		></div>

		<div
			class="absolute right-0 bottom-0 left-0 flex items-end justify-between bg-gradient-to-t from-stone-950 to-transparent p-8"
		>
			<div class="space-y-2">
				<div
					class="flex items-center gap-3 text-xs font-bold tracking-widest text-white/80 uppercase"
				>
					<span class="rounded border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur-md">
						{data.serial.status || 'Active'}
					</span>
					<span class="text-stone-300">Author Console</span>
				</div>
				<h1 class="font-serif text-4xl font-bold drop-shadow-xl">{data.serial.title}</h1>
			</div>
			<div class="flex gap-3">
				<!-- Order status indicators -->
				{#if isSavingOrder}
					<div
						class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-stone-400"
						transition:fade
					>
						<div
							class="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
						></div>
						Saving order...
					</div>
				{:else if orderSaved}
					<div
						class="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400"
						transition:fade
					>
						<CheckCircle class="h-3.5 w-3.5" />
						Order Saved
					</div>
				{/if}

				<button
					onclick={() => {
						showSettings = !showSettings;
						showAddArc = false;
					}}
					class="flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:bg-white/10"
				>
					<Settings class="mr-2 h-4 w-4" />
					Settings
				</button>

				<button
					onclick={() => {
						showAddArc = !showAddArc;
						showSettings = false;
					}}
					class="flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:bg-white/10"
				>
					<FolderPlus class="mr-2 h-4 w-4" />
					Add Arc
				</button>

				<a
					data-component="manage-wiki-button"
					href="/serials/{data.serial.id}/wiki"
					class="flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:bg-white/10"
				>
					<BookOpen class="mr-2 h-4 w-4 text-stone-400" />
					Manage Wiki
				</a>

				<form method="POST" action="?/createScene">
					<button
						type="submit"
						class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg transition-all hover:opacity-90"
					>
						<Plus class="mr-2 h-4 w-4" />
						New Scene
					</button>
				</form>
			</div>
		</div>
	</div>

	<!-- Content Workspace split into Columns -->
	<div class="relative flex-1 overflow-y-auto p-8">
		<!-- Add Arc Slide-down Dialog -->
		{#if showAddArc}
			<div
				transition:slide
				class="mx-auto mb-8 max-w-5xl rounded-2xl border border-white/10 bg-stone-900/50 p-6 backdrop-blur-md"
			>
				<form
					method="POST"
					action="?/createArc"
					onsubmit={() => (showAddArc = false)}
					class="flex items-end gap-4"
				>
					<div class="flex-1 space-y-1.5">
						<label
							for="arc_title"
							class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
							>Arc / Group Title</label
						>
						<input
							id="arc_title"
							name="title"
							type="text"
							required
							bind:value={newArcTitle}
							class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-serif text-sm text-stone-100 transition-all focus:outline-none"
							placeholder="e.g. Arc I: The Shadow's Whispers"
						/>
					</div>
					<button
						type="submit"
						class="bg-primary text-primary-foreground shrink-0 rounded-xl px-6 py-2.5 text-xs font-bold shadow-md transition-all hover:opacity-90"
					>
						Create Arc
					</button>
				</form>
			</div>
		{/if}

		<!-- Series Settings Slide-down Dialog -->
		{#if showSettings}
			<div
				transition:slide
				class="relative mx-auto mb-8 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-stone-900/60 p-6 shadow-2xl backdrop-blur-xl md:p-8"
			>
				<!-- Ambient decorative glow inside settings panel -->
				<div
					class="bg-primary/10 absolute top-0 right-0 -z-10 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]"
				></div>

				<h3
					class="text-primary mb-6 flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest uppercase"
				>
					<Settings class="text-primary h-4.5 w-4.5" />
					Series Console Settings
				</h3>

				<form
					method="POST"
					action="?/updateSerialSettings"
					onsubmit={() => (showSettings = false)}
					class="space-y-6"
				>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Title and Status column -->
						<div class="space-y-4">
							<div class="space-y-1.5">
								<label
									for="serial_title"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Series Title</label
								>
								<input
									id="serial_title"
									name="title"
									type="text"
									required
									bind:value={editTitle}
									class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-serif text-sm text-stone-100 transition-all focus:outline-none"
									placeholder="e.g. My Amazing Serial"
								/>
							</div>

							<div class="space-y-1.5">
								<label
									for="serial_status"
									class="text-[10px] font-bold tracking-wider text-stone-400 uppercase"
									>Publication Status</label
								>
								<select
									id="serial_status"
									name="status"
									bind:value={editStatus}
									class="focus:border-primary/50 w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-stone-100 transition-all focus:outline-none"
								>
									<option value="draft" class="bg-stone-900 text-stone-300"
										>Draft (In planning / secret)</option
									>
									<option value="pilot" class="bg-stone-900 text-stone-300"
										>Pilot (Testing narrative rules)</option
									>
									<option value="active" class="bg-stone-900 text-stone-300"
										>Active (Regularly publishing)</option
									>
									<option value="hiatus" class="bg-stone-900 text-stone-300"
										>On Hiatus (Temporarily paused)</option
									>
									<option value="complete" class="bg-stone-900 text-stone-300"
										>Complete (Story is finished)</option
									>
								</select>
							</div>
						</div>

						<!-- Color Theme Column -->
						<div class="space-y-2">
							<span class="mb-1 block text-[10px] font-bold tracking-wider text-stone-400 uppercase"
								>Color Theme Preset</span
							>
							<input type="hidden" name="colorTheme" value={editColorTheme} />

							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<button
									type="button"
									onclick={() => (editColorTheme = 'from-violet-600 to-indigo-600')}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {editColorTheme ===
									'from-violet-600 to-indigo-600'
										? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/5'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<span class="text-xs font-bold text-stone-200">Royal Indigo</span>
									<div
										class="h-4 w-4 rounded-full border border-white/10 bg-gradient-to-br from-violet-600 to-indigo-600"
									></div>
								</button>

								<button
									type="button"
									onclick={() => (editColorTheme = 'from-amber-500 to-rose-600')}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {editColorTheme ===
									'from-amber-500 to-rose-600'
										? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<span class="text-xs font-bold text-stone-200">Sunset Amber</span>
									<div
										class="h-4 w-4 rounded-full border border-white/10 bg-gradient-to-br from-amber-500 to-rose-600"
									></div>
								</button>

								<button
									type="button"
									onclick={() => (editColorTheme = 'from-emerald-600 to-teal-600')}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {editColorTheme ===
									'from-emerald-600 to-teal-600'
										? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<span class="text-xs font-bold text-stone-200">Forest Emerald</span>
									<div
										class="h-4 w-4 rounded-full border border-white/10 bg-gradient-to-br from-emerald-600 to-teal-600"
									></div>
								</button>

								<button
									type="button"
									onclick={() => (editColorTheme = 'from-fuchsia-600 to-pink-600')}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {editColorTheme ===
									'from-fuchsia-600 to-pink-600'
										? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/5'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<span class="text-xs font-bold text-stone-200">Midnight Nebula</span>
									<div
										class="h-4 w-4 rounded-full border border-white/10 bg-gradient-to-br from-fuchsia-600 to-pink-600"
									></div>
								</button>

								<button
									type="button"
									onclick={() => (editColorTheme = 'from-blue-600 to-cyan-600')}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {editColorTheme ===
									'from-blue-600 to-cyan-600'
										? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<span class="text-xs font-bold text-stone-200">Deep Ocean</span>
									<div
										class="h-4 w-4 rounded-full border border-white/10 bg-gradient-to-br from-blue-600 to-cyan-600"
									></div>
								</button>
							</div>
						</div>
					</div>

					<!-- Action buttons -->
					<div class="flex items-center justify-between border-t border-white/5 pt-3">
						<!-- Export Backup Button -->
						<div class="flex items-center gap-3">
							<button
								type="button"
								onclick={handleExport}
								disabled={isExporting}
								class="flex items-center gap-2 rounded-xl border border-stone-700/50 bg-stone-800/50 px-4 py-2.5 text-xs font-bold text-stone-300 transition-all hover:bg-stone-800 hover:text-white disabled:opacity-50"
							>
								{#if isExporting}
									<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-400 border-t-transparent"></div>
									Exporting...
								{:else}
									<DownloadCloud class="h-4 w-4 text-emerald-400" />
									Export Backup
								{/if}
							</button>
							{#if exportError}
								<span class="text-xs font-medium text-red-400">{exportError}</span>
							{/if}
						</div>

						<div class="flex gap-3">
							<button
								type="button"
								onclick={() => (showSettings = false)}
								class="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-stone-300 transition-all hover:bg-white/10"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="bg-primary text-primary-foreground shadow-primary/20 flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg transition-all hover:opacity-90"
							>
								<Save class="h-4 w-4" />
								Save Settings
							</button>
						</div>
					</div>
				</form>
			</div>
		{/if}

		<div class="mx-auto grid h-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Main Columns: Arcs & Scene boards -->
			<div class="space-y-8 pb-32 lg:col-span-2">
				<h2 class="flex items-center border-b border-white/5 pb-3 text-xl font-bold">
					<Layers class="text-primary mr-3 h-5 w-5" />
					Storyboards & Arcs (Drag & Drop)
				</h2>

				<!-- Storyboard container -->
				<div class="space-y-6">
					{#each data.arcs as arc (arc.id)}
						<div class="space-y-4 rounded-3xl border border-white/5 bg-stone-900/20 p-5">
							<div class="flex items-center justify-between">
								<h3 class="flex items-center gap-2 font-serif text-lg font-bold text-white/90">
									<span class="bg-primary/60 h-2 w-2 rounded-full"></span>
									{arc.title}
								</h3>
								<span
									class="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-stone-600 uppercase"
								>
									Arc
								</span>
							</div>

							<!-- Dnd Zone for this Arc -->
							<div
								use:dndzone={{ items: scenesByArc[arc.id] || [], flipDurationMs }}
								onconsider={(e) => handleConsider(arc.id, e)}
								onfinalize={(e) => handleFinalize(arc.id, e)}
								class="min-h-16 space-y-2 rounded-2xl border border-dashed border-white/5 bg-black/10 p-2 transition-colors"
							>
								{#if (scenesByArc[arc.id] || []).length === 0}
									<div class="py-6 text-center text-xs text-stone-600 italic">
										Drag scenes here to add them to this Arc
									</div>
								{:else}
									{#each scenesByArc[arc.id] || [] as scene (scene.id)}
										<div animate:flip={{ duration: flipDurationMs }}>
											<a
												data-component="scene-card-link"
												href="/serials/{data.serial.id}/scenes/{scene.id}/play"
												class="flex cursor-grab items-center justify-between rounded-xl border border-white/5 bg-stone-900/60 p-3.5 transition-all hover:border-white/10 hover:bg-white/5 active:cursor-grabbing"
											>
												<div class="flex items-center gap-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-stone-950"
													>
														<PenTool class="h-3.5 w-3.5 text-stone-400" />
													</div>
													<div>
														<h4 class="text-sm font-bold text-stone-200">
															{scene.author_title || `Scene ${scene.order_index}`}
														</h4>
														<div
															class="flex items-center gap-3 text-[10px] font-medium text-stone-500"
														>
															<span
																class="text-primary text-[9px] font-semibold tracking-wider uppercase"
																>{scene.status}</span
															>
															<div class="flex items-center gap-1">
																<Clock class="h-2.5 w-2.5" />
																<span>{formatRelativeTime(scene.published_at)}</span>
															</div>
														</div>
													</div>
												</div>
												<ChevronRight class="h-4 w-4 text-stone-600" />
											</a>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/each}

					<!-- Unassigned Scenes DND Dropzone -->
					<div class="space-y-4 rounded-3xl border border-white/5 bg-stone-900/20 p-5">
						<h3 class="flex items-center gap-2 font-serif text-lg font-bold text-stone-400">
							<span class="h-2 w-2 rounded-full bg-stone-700"></span>
							Unassigned Scenes
						</h3>

						<div
							use:dndzone={{ items: scenesByArc.unassigned || [], flipDurationMs }}
							onconsider={(e) => handleConsider('unassigned', e)}
							onfinalize={(e) => handleFinalize('unassigned', e)}
							class="min-h-16 space-y-2 rounded-2xl border border-dashed border-white/5 bg-black/10 p-2 transition-colors"
						>
							{#if (scenesByArc.unassigned || []).length === 0}
								<div class="py-6 text-center text-xs text-stone-600 italic">
									No unassigned scenes
								</div>
							{:else}
								{#each scenesByArc.unassigned || [] as scene (scene.id)}
									<div animate:flip={{ duration: flipDurationMs }}>
										<a
											data-component="scene-card-link"
											href="/serials/{data.serial.id}/scenes/{scene.id}/play"
											class="flex cursor-grab items-center justify-between rounded-xl border border-white/5 bg-stone-900/60 p-3.5 transition-all hover:border-white/10 hover:bg-white/5 active:cursor-grabbing"
										>
											<div class="flex items-center gap-3">
												<div
													class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-stone-950"
												>
													<PenTool class="h-3.5 w-3.5 text-stone-400" />
												</div>
												<div>
													<h4 class="text-sm font-bold text-stone-200">
														{scene.author_title || `Scene ${scene.order_index}`}
													</h4>
													<div
														class="flex items-center gap-3 text-[10px] font-medium text-stone-500"
													>
														<span
															class="text-primary text-[9px] font-semibold tracking-wider uppercase"
															>{scene.status}</span
														>
														<div class="flex items-center gap-1">
															<Clock class="h-2.5 w-2.5" />
															<span>{formatRelativeTime(scene.published_at)}</span>
														</div>
													</div>
												</div>
											</div>
											<ChevronRight class="h-4 w-4 text-stone-600" />
										</a>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Analytics At A Glance -->
			<div class="space-y-6">
				<div class="rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md">
					<h3
						class="mb-6 border-b border-white/5 pb-3 text-xs font-bold tracking-widest text-stone-500 uppercase"
					>
						At a Glance
					</h3>
					<div class="space-y-5">
						<div class="flex items-center justify-between">
							<span class="flex items-center text-sm font-medium text-stone-400">
								<BookOpen class="mr-2.5 h-4 w-4 text-stone-500" /> Total Scenes
							</span>
							<span class="text-xl font-bold">{data.scenes.length}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="flex items-center text-sm font-medium text-stone-400">
								<Layers class="mr-2.5 h-4 w-4 text-stone-500" /> Total Arcs
							</span>
							<span class="text-xl font-bold">{data.arcs.length}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="flex items-center text-sm font-medium text-stone-400">
								<Users class="mr-2.5 h-4 w-4 text-stone-500" /> Active Readers
							</span>
							<span class="text-primary text-xl font-bold">{data.readersCount}</span>
						</div>
					</div>
				</div>

				<div
					class="space-y-4 rounded-3xl border border-white/5 bg-stone-900/40 p-6 backdrop-blur-md"
				>
					<h3
						class="border-b border-white/5 pb-3 text-xs font-bold tracking-widest text-stone-500 uppercase"
					>
						Teaser Status
					</h3>

					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs font-medium">
							<span class="text-stone-400">Next Scene Completion</span>
							<span class="text-primary font-mono font-bold"
								>{data.serial.next_scene_completion_percentage || 0}%</span
							>
						</div>
						<div
							class="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner"
						>
							<div
								class="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-500"
								style="width: {data.serial.next_scene_completion_percentage || 0}%"
							></div>
						</div>
						<div
							class="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 text-[10px] leading-relaxed font-medium text-stone-500 italic"
						>
							"{data.serial.next_scene_update_note || 'No teaser updates set.'}"
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

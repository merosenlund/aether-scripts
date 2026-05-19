<script lang="ts">
	import {
		Search,
		Compass,
		BookOpen,
		Plus,
		ArrowRight,
		Lock,
		Globe,
		Layers,
		FolderPlus
	} from '@lucide/svelte';
	import { slide, fade } from 'svelte/transition';

	let { data } = $props<{ data: any }>();

	// State
	let searchQuery = $state('');
	let activeTab = $state<'all' | 'my'>('all');
	let showCreateList = $state(false);

	// New list inputs
	let newListTitle = $state('');
	let newListSerialId = $state('');
	let newListIsPublic = $state(false);

	// Derived filtered lists
	const filteredLists = $derived(
		data.lists.filter((list: any) => {
			const matchesSearch =
				list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				list.serial?.title.toLowerCase().includes(searchQuery.toLowerCase());

			const isOwnList = list.user_id === data.session?.user?.id;
			const matchesTab = activeTab === 'all' ? list.is_public : activeTab === 'my' && isOwnList;

			return matchesSearch && matchesTab;
		})
	);

	// Form submission check
	function resetCreateForm() {
		newListTitle = '';
		newListSerialId = '';
		newListIsPublic = false;
		showCreateList = false;
	}
</script>

<div class="mx-auto max-w-7xl space-y-12 bg-zinc-950 p-8 pb-32 font-sans text-zinc-100">
	<!-- Hero / Header Section -->
	<section
		class="relative flex min-h-[280px] items-center overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-8 shadow-2xl md:p-16"
	>
		<div
			class="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"
		></div>
		<div
			class="from-primary/20 absolute top-0 right-0 h-full w-2/3 translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-br via-indigo-500/10 to-transparent blur-3xl"
		></div>

		<div
			class="relative z-20 flex w-full max-w-3xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"
		>
			<div class="space-y-4">
				<h1 class="text-4xl leading-[1.1] font-bold tracking-tight text-white md:text-5xl">
					Curated <span
						class="from-primary bg-gradient-to-r to-indigo-400 bg-clip-text text-transparent"
						>Reading Lists</span
					> & Cuts.
				</h1>
				<p class="max-w-md text-base text-zinc-400 md:text-lg">
					Explore customized tables of contents, alternate narrative paths, and skipped-filler
					editions created by the community.
				</p>
			</div>

			{#if data.session}
				<button
					onclick={() => (showCreateList = !showCreateList)}
					class="bg-primary text-primary-foreground shadow-primary/20 flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 px-6 py-3.5 text-sm font-bold shadow-lg transition-all hover:opacity-90"
				>
					<FolderPlus class="h-4 w-4" />
					Create New List
				</button>
			{/if}
		</div>
	</section>

	<!-- Create List Slide-down Panel -->
	{#if showCreateList}
		<div
			transition:slide
			class="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl"
		>
			<div
				class="bg-primary/10 absolute top-0 right-0 -z-10 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]"
			></div>

			<h3
				class="text-primary mb-6 flex items-center gap-2 border-b border-white/5 pb-3 text-sm font-bold tracking-widest uppercase"
			>
				<Plus class="text-primary h-4 w-4" />
				New Reading List
			</h3>

			<form method="POST" action="?/createList" class="space-y-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="space-y-4">
						<div class="space-y-1.5">
							<label
								for="list_title"
								class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
								>List Title</label
							>
							<input
								id="list_title"
								name="title"
								type="text"
								required
								bind:value={newListTitle}
								class="focus:border-primary/50 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-serif text-sm text-zinc-100 transition-all focus:outline-none"
								placeholder="e.g. Elias' Journey (Action-Only Cut)"
							/>
						</div>

						<div class="space-y-1.5">
							<label
								for="list_serial"
								class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
								>Target Serial / Series</label
							>
							<select
								id="list_serial"
								name="serialId"
								required
								bind:value={newListSerialId}
								class="focus:border-primary/50 w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-zinc-100 transition-all focus:outline-none"
							>
								<option value="" disabled class="bg-zinc-900 text-zinc-500"
									>Select a serial...</option
								>
								{#each data.serials as serial}
									<option value={serial.id} class="bg-zinc-900 text-zinc-300">{serial.title}</option
									>
								{/each}
							</select>
						</div>
					</div>

					<div class="flex flex-col justify-between space-y-4">
						<div class="space-y-2">
							<span class="mb-1 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
								>Curation Settings</span
							>

							<div class="grid grid-cols-1 gap-3">
								<button
									type="button"
									onclick={() => (newListIsPublic = false)}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {!newListIsPublic
										? 'border-primary/40 bg-primary/5 shadow-md'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<div class="flex items-center gap-3">
										<Lock class="h-4 w-4 text-zinc-400" />
										<div>
											<span class="block text-xs font-bold text-zinc-200">Private List</span>
											<span class="block text-[9px] font-medium text-zinc-500"
												>Only visible to you on your custom dashboard</span
											>
										</div>
									</div>
								</button>

								<button
									type="button"
									onclick={() => (newListIsPublic = true)}
									class="flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all {newListIsPublic
										? 'border-primary/40 bg-primary/5 shadow-md'
										: 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'}"
								>
									<div class="flex items-center gap-3">
										<Globe class="h-4 w-4 text-zinc-400" />
										<div>
											<span class="block text-xs font-bold text-zinc-200">Public Curation</span>
											<span class="block text-[9px] font-medium text-zinc-500"
												>Publish to the global /lists page for everyone</span
											>
										</div>
									</div>
								</button>
							</div>
						</div>

						<input type="hidden" name="isPublic" value={newListIsPublic ? 'true' : 'false'} />
					</div>
				</div>

				<!-- Submit & Close actions -->
				<div class="flex justify-end gap-3 border-t border-white/5 pt-3">
					<button
						type="button"
						onclick={resetCreateForm}
						class="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-zinc-300 transition-all hover:bg-white/10"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="bg-primary text-primary-foreground shadow-primary/20 flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg transition-all hover:opacity-90"
					>
						<FolderPlus class="h-4 w-4" />
						Build Curation List
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Filter Toggles & Search -->
	<div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
		<!-- Tab toggles -->
		<div class="flex shrink-0 gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-1.5">
			<button
				onclick={() => (activeTab = 'all')}
				class="flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-bold whitespace-nowrap capitalize transition-all
          {activeTab === 'all'
					? 'bg-zinc-800 text-white shadow-sm'
					: 'text-zinc-400 hover:text-white'}"
			>
				<Globe class="h-3.5 w-3.5" />
				Community Lists
			</button>

			{#if data.session}
				<button
					onclick={() => (activeTab = 'my')}
					class="flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-bold whitespace-nowrap capitalize transition-all
            {activeTab === 'my'
						? 'bg-zinc-800 text-white shadow-sm'
						: 'text-zinc-400 hover:text-white'}"
				>
					<Lock class="h-3.5 w-3.5" />
					My Playlists
				</button>
			{/if}
		</div>

		<!-- Search Input -->
		<div class="group relative w-full max-w-md">
			<Search class="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Filter by list or serial title..."
				class="focus:border-primary/40 w-full rounded-2xl border border-white/5 bg-zinc-900/50 py-3 pr-4 pl-11 text-sm text-white backdrop-blur-xl transition-all placeholder:text-zinc-500 focus:outline-none"
			/>
		</div>
	</div>

	<!-- Lists Grid -->
	{#if filteredLists.length > 0}
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredLists as list (list.id)}
				<a
					href="/lists/{list.id}"
					class="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/40 p-8 shadow-lg transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60"
				>
					<!-- Banner Overlay containing color theme gradient -->
					<div
						class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r {list.serial?.color_theme ||
							'from-violet-600 to-indigo-600'} opacity-80 transition-opacity group-hover:opacity-100"
					></div>

					<div class="space-y-4">
						<!-- Header Badges -->
						<div class="flex items-center justify-between gap-3 select-none">
							<span
								class="max-w-[160px] truncate font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
							>
								{list.serial?.title || 'Unknown Serial'}
							</span>

							<div class="flex shrink-0 items-center gap-1.5">
								{#if list.is_public}
									<span
										class="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 uppercase"
									>
										<Globe class="h-2.5 w-2.5" />
										Public
									</span>
								{:else}
									<span
										class="flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-indigo-400 uppercase"
									>
										<Lock class="h-2.5 w-2.5" />
										Private
									</span>
								{/if}
							</div>
						</div>

						<!-- Title & Info -->
						<h3
							class="group-hover:text-primary line-clamp-2 font-serif text-2xl leading-tight font-bold text-white transition-colors"
						>
							{list.title}
						</h3>
					</div>

					<!-- Bottom bar -->
					<div class="mt-4 flex items-center justify-between border-t border-white/5 pt-5">
						<div class="flex items-center gap-2 text-xs font-semibold text-zinc-400">
							<Layers class="text-primary h-4 w-4" />
							<span
								>{list.items?.length || 0} {list.items?.length === 1 ? 'chapter' : 'chapters'}</span
							>
						</div>

						<div
							class="group-hover:bg-primary group-hover:border-primary flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 shadow-sm transition-all duration-300 group-hover:text-white"
						>
							<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div
			class="space-y-6 rounded-[2rem] border border-dashed border-white/5 bg-zinc-900/20 p-24 text-center"
		>
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-zinc-900 text-zinc-600"
			>
				<Compass class="h-8 w-8" />
			</div>
			<div class="space-y-2">
				<h3 class="text-xl font-bold text-zinc-300">No curations found</h3>
				<p class="mx-auto max-w-sm text-sm text-zinc-500">
					{#if activeTab === 'my'}
						You haven't created any custom playlists yet. Use "+ Create New List" to get started!
					{:else}
						No community lists match your filters. Try search adjustments.
					{/if}
				</p>
			</div>

			{#if searchQuery !== ''}
				<button
					onclick={() => {
						searchQuery = '';
					}}
					class="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/10"
				>
					Clear search
				</button>
			{/if}
		</div>
	{/if}
</div>

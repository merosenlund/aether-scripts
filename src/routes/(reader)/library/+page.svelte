<script lang="ts">
	import { Search, Compass, BookOpen, Clock, Users, ArrowRight, Rocket } from '@lucide/svelte';
	let { data } = $props();

	let searchQuery = $state('');
	let activeFilter = $state('All');

	const filters = ['All', 'pilot', 'active', 'complete', 'hiatus'];

	const filteredSerials = $derived(
		data.serials.filter((s) => {
			const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesFilter = activeFilter === 'All' || s.status === activeFilter;
			return matchesSearch && matchesFilter;
		})
	);

	function timeAgo(date: string) {
		if (!date) return 'Never';
		const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
		let interval = seconds / 31536000;
		if (interval > 1) return Math.floor(interval) + ' years ago';
		interval = seconds / 2592000;
		if (interval > 1) return Math.floor(interval) + ' months ago';
		interval = seconds / 86400;
		if (interval > 1) return Math.floor(interval) + ' days ago';
		interval = seconds / 3600;
		if (interval > 1) return Math.floor(interval) + ' hours ago';
		interval = seconds / 60;
		if (interval > 1) return Math.floor(interval) + ' minutes ago';
		return Math.floor(seconds) + ' seconds ago';
	}
</script>

<div class="mx-auto max-w-7xl space-y-12 p-8 pb-32">
	<!-- Hero Section -->
	<section
		class="relative flex min-h-[320px] items-center overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 p-8 shadow-2xl md:p-16"
	>
		<div
			class="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"
		></div>

		<!-- Decorative background elements -->
		<div
			class="from-primary/20 absolute top-0 right-0 h-full w-2/3 translate-x-1/4 -translate-y-1/4 rounded-full bg-gradient-to-br via-indigo-500/10 to-transparent blur-3xl"
		></div>

		<div class="relative z-20 max-w-2xl space-y-8">
			<div class="space-y-4">
				<h1 class="text-5xl leading-[1.1] font-bold tracking-tight text-white md:text-6xl">
					Explore the <span
						class="from-primary bg-gradient-to-r to-indigo-400 bg-clip-text text-transparent"
						>multiverse</span
					> of stories.
				</h1>
				<p class="max-w-lg text-lg font-medium text-zinc-400 md:text-xl">
					Discover hand-crafted adventures, evolving lore, and stories that roll with the dice.
				</p>
			</div>

			<div class="group relative max-w-md">
				<div
					class="from-primary/30 absolute -inset-1 rounded-2xl bg-gradient-to-r to-indigo-500/30 opacity-0 blur transition duration-500 group-focus-within:opacity-100"
				></div>
				<div class="relative flex items-center">
					<Search class="absolute left-4 h-5 w-5 text-zinc-500" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search for serials..."
						class="focus:border-primary/50 w-full rounded-2xl border border-white/10 bg-zinc-900/80 py-4 pr-4 pl-12 text-white backdrop-blur-xl transition-all placeholder:text-zinc-500 focus:outline-none"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Categories & Filters -->
	<div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
		<nav class="scrollbar-none flex max-w-full gap-2 overflow-x-auto pb-2">
			{#each filters as filter}
				<button
					onclick={() => (activeFilter = filter)}
					class="flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-bold whitespace-nowrap capitalize transition-all
            {activeFilter === filter
						? 'border-white bg-white text-zinc-950'
						: 'border-white/5 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
				>
					{#if filter === 'pilot'}
						<Rocket class="h-3.5 w-3.5" />
					{/if}
					{filter}
				</button>
			{/each}
		</nav>
		<div class="text-sm font-medium text-zinc-500">
			Showing {filteredSerials.length} results
		</div>
	</div>

	<!-- Library Grid -->
	{#if filteredSerials.length > 0}
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredSerials as serial}
				<a href="/library/{serial.id}" class="group block space-y-4">
					<div
						class="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 shadow-lg transition-all duration-300 group-hover:border-white/20"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br {serial.color_theme} opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
						></div>
						<div class="absolute inset-0 bg-black/20"></div>
						<div class="absolute top-4 right-4">
							{#if serial.status === 'pilot'}
								<span
									class="bg-primary text-primary-foreground shadow-primary/40 flex animate-pulse items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase shadow-lg"
								>
									<Rocket class="h-3 w-3" />
									Pilot Phase
								</span>
							{:else}
								<span
									class="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md"
								>
									{serial.status}
								</span>
							{/if}
						</div>
					</div>
					<div class="space-y-1">
						<h3 class="group-hover:text-primary text-xl leading-tight font-bold transition-colors">
							{serial.title}
						</h3>
						<div class="flex items-center gap-4 text-sm text-zinc-500">
							<span class="flex items-center gap-1">
								<BookOpen class="h-4 w-4" />
								{serial.scenesCount} scenes
							</span>
							<span class="flex items-center gap-1">
								<Users class="h-4 w-4" />
								{serial.readersCount}
							</span>
							{#if serial.updated_at}
								<span class="flex items-center gap-1">
									<Clock class="h-4 w-4" />
									{timeAgo(serial.updated_at)}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div
			class="space-y-6 rounded-[2.5rem] border border-dashed border-white/10 bg-zinc-900/30 p-24 text-center"
		>
			<div
				class="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-zinc-900 text-zinc-700"
			>
				<Compass class="h-10 w-10" />
			</div>
			<div class="space-y-2">
				<h3 class="text-2xl font-bold text-zinc-300">No stories found</h3>
				<p class="mx-auto max-w-sm text-zinc-500">
					Try adjusting your search or filters to find what you're looking for.
				</p>
			</div>
			<button
				onclick={() => {
					searchQuery = '';
					activeFilter = 'All';
				}}
				class="rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-bold text-white transition-all hover:bg-white/10"
			>
				Clear all filters
			</button>
		</div>
	{/if}
</div>

<style>
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>

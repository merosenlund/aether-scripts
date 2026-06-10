<script lang="ts">
	import { BookOpen, ArrowRight, Clock, Users, PenTool } from '@lucide/svelte';
	let { data } = $props<{ data: any }>();

	function timeAgo(date: string) {
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

<div class="min-h-screen bg-zinc-950 pb-20 text-zinc-100">
	<!-- Hero Section / Continue Reading -->
	<div class="relative overflow-hidden px-8 pt-20 pb-32">
		<!-- Ambient Background -->
		<div
			class="from-primary/10 absolute top-0 left-1/2 -z-10 h-full w-full max-w-6xl -translate-x-1/2 bg-gradient-to-b to-transparent blur-[120px]"
		></div>

		<div class="mx-auto max-w-6xl space-y-12">
			{#if data.continueReading}
				<div class="space-y-6">
					<div
						class="text-primary flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
					>
						<Clock class="h-4 w-4" />
						Pick up where you left off
					</div>

					<div class="group relative max-w-4xl">
						<div
							class="absolute -inset-1 bg-gradient-to-r {data.continueReading.serial
								.color_theme} rounded-3xl opacity-25 blur transition duration-1000 group-hover:opacity-40"
						></div>
						<div
							class="relative flex flex-col items-center gap-8 rounded-3xl border border-white/5 bg-zinc-900/80 p-8 backdrop-blur-xl md:flex-row md:p-12"
						>
							<div class="flex-1 space-y-4">
								<h1 class="text-4xl font-bold tracking-tight text-white md:text-5xl">
									{data.continueReading.serial.title}
								</h1>
								<p class="text-xl text-zinc-400">
									{data.continueReading.scene?.display_title ||
										data.continueReading.scene?.author_title ||
										'Start Reading'}
								</p>
								<div class="flex gap-4 pt-4">
									<a
										href="/library/{data.continueReading.serial.id}"
										class="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-zinc-950 transition-all hover:bg-zinc-200"
									>
										Continue Reading
										<ArrowRight class="h-4 w-4" />
									</a>
									<a
										href="/library"
										class="rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-bold text-white transition-all hover:bg-white/10"
									>
										Browse Library
									</a>
								</div>
							</div>
							<div
								class="aspect-[3/4] w-full rounded-2xl bg-gradient-to-br md:w-64 {data
									.continueReading.serial
									.color_theme} relative overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105"
							>
								<div class="absolute inset-0 bg-black/20"></div>
								<div class="absolute inset-0 flex items-center justify-center p-6 text-center">
									<span class="text-2xl font-bold text-white drop-shadow-lg"
										>{data.continueReading.serial.title}</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="max-w-3xl space-y-8">
					<h1 class="text-4xl sm:text-5xl md:text-6xl leading-[1.1] font-bold tracking-tighter text-white">
						Immerse yourself in <span
							class="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent"
							>Actual Play</span
						> fiction.
					</h1>
					<p class="text-xl leading-relaxed font-medium text-zinc-400">
						Discover a digital-first ecosystem for interactive storytelling. Explore multiverses
						where lore evolves as you read and the mechanics behind the story are just a toggle
						away.
					</p>
					<div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
						<a
							href="/library"
							class="bg-primary text-primary-foreground shadow-primary/20 flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-bold shadow-xl transition-all hover:opacity-90 w-full sm:w-auto text-center"
						>
							Start Reading
							<ArrowRight class="h-5 w-5" />
						</a>
						{#if data.userRole === 'author'}
							<a
								href="/write"
								class="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 w-full sm:w-auto text-center"
							>
								<PenTool class="h-5 w-5" />
								Author Workspace
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Features Grid -->
	<div class="mx-auto mb-24 grid max-w-6xl grid-cols-1 gap-8 px-8 md:grid-cols-3">
		<div class="space-y-3 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"
			>
				<BookOpen class="h-6 w-6" />
			</div>
			<h3 class="text-lg font-bold">Progressive Wiki</h3>
			<p class="text-sm leading-relaxed text-zinc-500">
				Lore that evolves as you read. Discover facts, characters, and locations only after they've
				been revealed in the story.
			</p>
		</div>
		<div class="space-y-3 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
			>
				<Users class="h-6 w-6" />
			</div>
			<h3 class="text-lg font-bold">Author's Cut</h3>
			<p class="text-sm leading-relaxed text-zinc-500">
				Toggle the "Mechanical Mode" to see the dice rolls, stat blocks, and GM notes that shaped
				the narrative behind the scenes.
			</p>
		</div>
		<div class="space-y-3 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
			>
				<Clock class="h-6 w-6" />
			</div>
			<h3 class="text-lg font-bold">Live Updates</h3>
			<p class="text-sm leading-relaxed text-zinc-500">
				Follow your favorite serials in real-time. Get notified as new scenes are published and
				watch the multiverse expand.
			</p>
		</div>
	</div>

	<!-- Recently Updated -->
	<div class="mx-auto max-w-6xl space-y-12 border-t border-white/5 px-8 py-12">
		<div class="flex items-end justify-between">
			<div class="space-y-1">
				<h2 class="text-3xl font-bold tracking-tight">Recently Updated</h2>
				<p class="text-zinc-500">The latest adventures from across the multiverse.</p>
			</div>
			{#if data.recentlyUpdated.length > 0}
				<a
					href="/library"
					class="text-primary flex items-center gap-1 font-semibold hover:underline"
				>
					View all <ArrowRight class="h-4 w-4" />
				</a>
			{/if}
		</div>

		{#if data.recentlyUpdated.length > 0}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.recentlyUpdated as serial}
					<a href="/library/{serial.id}" class="group block">
						<div
							class="relative mb-4 aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900"
						>
							<div
								class="absolute inset-0 bg-gradient-to-br {serial.color_theme} opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-80"
							></div>
							<div class="absolute inset-0 bg-black/20"></div>
							<div class="absolute bottom-4 left-4">
								<span
									class="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md"
								>
									{serial.status}
								</span>
							</div>
						</div>
						<h3 class="group-hover:text-primary text-xl font-bold transition-colors">
							{serial.title}
						</h3>
						<div class="mt-2 flex items-center gap-4 text-sm text-zinc-500">
							<span class="flex items-center gap-1">
								<BookOpen class="h-4 w-4" />
								{serial.scenesCount} scenes
							</span>
							{#if serial.updated_at}
								<span class="flex items-center gap-1">
									<Clock class="h-4 w-4" />
									{timeAgo(serial.updated_at)}
								</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div
				class="space-y-4 rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 p-20 text-center"
			>
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-zinc-600"
				>
					<BookOpen class="h-8 w-8" />
				</div>
				<div class="space-y-1">
					<h3 class="text-xl font-bold text-zinc-300">The multiverse is quiet... for now.</h3>
					<p class="mx-auto max-w-sm text-zinc-500">
						New stories and scenes are being journaled as we speak. Check back soon for the latest
						updates.
					</p>
				</div>
				<a
					href="/library"
					class="text-primary inline-flex items-center gap-2 font-bold hover:underline"
				>
					Explore the Archives
					<ArrowRight class="h-4 w-4" />
				</a>
			</div>
		{/if}
	</div>

	<!-- Community Curations / Reading Playlists -->
	<div class="mx-auto max-w-6xl space-y-12 border-t border-white/5 px-8 py-12">
		<div class="flex items-end justify-between">
			<div class="space-y-1">
				<h2 class="text-3xl font-bold tracking-tight">Community Playlists</h2>
				<p class="text-zinc-500">
					Custom narrative paths, alternate cuts, and filler-free curations by readers.
				</p>
			</div>
			{#if data.featuredLists.length > 0}
				<a href="/lists" class="text-primary flex items-center gap-1 font-semibold hover:underline">
					Explore Playlists <ArrowRight class="h-4 w-4" />
				</a>
			{/if}
		</div>

		{#if data.featuredLists.length > 0}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.featuredLists as list}
					<a
						href="/lists/{list.id}"
						class="group relative block flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/40 p-8 shadow-lg transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60"
					>
						<!-- Top Gradient bar matching serial theme -->
						<div
							class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r {list.serial?.color_theme ||
								'from-violet-600 to-indigo-600'} opacity-80 transition-opacity group-hover:opacity-100"
						></div>

						<div class="space-y-4">
							<span
								class="block truncate font-mono text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
							>
								{list.serial?.title}
							</span>
							<h3
								class="group-hover:text-primary line-clamp-2 font-serif text-xl leading-tight font-bold text-white transition-colors"
							>
								{list.title}
							</h3>
						</div>

						<div class="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
							<span class="text-xs font-semibold text-zinc-400">
								{list.items?.length || 0}
								{list.items?.length === 1 ? 'chapter' : 'chapters'}
							</span>

							<div
								class="group-hover:bg-primary group-hover:border-primary flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-all duration-300 group-hover:text-white"
							>
								<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div
				class="space-y-4 rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 p-20 text-center"
			>
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-zinc-600"
				>
					<BookOpen class="h-8 w-8" />
				</div>
				<div class="space-y-1">
					<h3 class="text-xl font-bold text-zinc-300">No public cuts yet.</h3>
					<p class="mx-auto max-w-sm text-zinc-500">
						Be the first to create an alternate reading order, GM analysis, or skip-filler edition!
					</p>
				</div>
				<a
					href="/lists"
					class="text-primary inline-flex items-center gap-2 font-bold hover:underline"
				>
					Go to Playlists
					<ArrowRight class="h-4 w-4" />
				</a>
			</div>
		{/if}
	</div>
</div>

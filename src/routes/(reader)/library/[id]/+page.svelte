<script lang="ts">
	import Reader from '$lib/components/Reader.svelte';
	import { authorPresence } from '$lib/stores/authorPresence.svelte';
	import {
		BookOpen,
		Compass,
		ChevronRight,
		Activity,
		Calendar,
		Award,
		AlertCircle,
		FileText
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';

	let { data } = $props<{ data: any }>();

	// State
	let activeSceneIndex = $state(0);
	let showMechanics = $state(false);
	let containerElement = $state<HTMLElement | null>(null);

	// Smoothly scroll the content viewport to the targeted scene
	function scrollToScene(sceneId: string, index: number) {
		activeSceneIndex = index;
		const element = document.getElementById(`scene-${sceneId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	// Formatting date
	function formatDate(dateStr: string | null) {
		if (!dateStr) return 'Recently';
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Subscribe to author presence
	$effect(() => {
		if (data.serial?.author_id) {
			authorPresence.subscribeToAuthor(data.serial.author_id);
		}
		return () => {
			authorPresence.cleanup();
		};
	});

	// Svelte 5 effect to spy on the user's scroll position and auto-highlight Table of Contents
	$effect(() => {
		if (!containerElement) return;

		const sections = containerElement.querySelectorAll('.scene-section');
		const observerOptions = {
			root: containerElement,
			rootMargin: '-20% 0px -60% 0px', // Focus the active threshold triggers in the upper center of viewport
			threshold: 0
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const indexAttr = entry.target.getAttribute('data-index');
					if (indexAttr !== null) {
						activeSceneIndex = parseInt(indexAttr, 10);
					}
				}
			});
		}, observerOptions);

		sections.forEach((section) => observer.observe(section));

		return () => {
			observer.disconnect();
		};
	});
</script>

<div class="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100">
	<!-- Table of Contents Sidebar -->
	<aside
		class="flex w-80 shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-2xl"
	>
		<div class="border-b border-white/5 bg-white/[0.01] p-6">
			<a
				href="/library"
				class="mb-4 flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-white"
			>
				<Compass class="h-3.5 w-3.5" />
				Back to Library
			</a>

			<h2 class="font-serif text-xl leading-tight font-bold tracking-tight text-white">
				{data.serial.title}
			</h2>
			<span
				class="mt-2 inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
			>
				{data.serial.status || 'Active'}
			</span>
		</div>

		<!-- Scenes List -->
		<div class="flex-1 space-y-2 overflow-y-auto p-4">
			<h3 class="mb-3 px-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
				Table of Contents
			</h3>

			{#if data.scenes.length === 0}
				<div
					class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"
				>
					<p class="text-xs text-zinc-600 italic">No scenes are available yet.</p>
				</div>
			{:else}
				{#each data.scenes as scene, index (scene.id)}
					<button
						onclick={() => scrollToScene(scene.id, index)}
						class="group flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all
              {activeSceneIndex === index
							? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]'
							: 'border-white/5 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'}"
					>
						<div class="space-y-1">
							<span
								class="block font-serif text-xs font-bold transition-colors group-hover:text-white"
							>
								{scene.display_title || scene.author_title || `Scene ${index + 1}`}
							</span>
							<span class="block text-[9px] font-medium text-zinc-600">
								{formatDate(scene.published_at)}
							</span>
						</div>
						<ChevronRight
							class="group-hover:text-primary h-4 w-4 text-zinc-600 transition-colors"
						/>
					</button>
				{/each}
			{/if}
		</div>
	</aside>

	<!-- Main Scene Reading Canvas -->
	<div class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950">
		<!-- Top Bar Controls -->
		<header
			class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/10 px-8 backdrop-blur-xl"
		>
			<div class="flex items-center gap-3">
				<BookOpen class="text-primary h-5 w-5" />
				<span class="text-sm font-bold text-zinc-300">
					{#if data.scenes[activeSceneIndex]}
						{data.scenes[activeSceneIndex].display_title ||
							data.scenes[activeSceneIndex].author_title ||
							`Scene ${activeSceneIndex + 1}`}
					{:else}
						Story Overview
					{/if}
				</span>
			</div>

			<!-- Mechanics Mode Toggle -->
			<button
				onclick={() => (showMechanics = !showMechanics)}
				class="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all
          {showMechanics
					? 'bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.1)]'
					: 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white'}"
			>
				<Activity class="h-3.5 w-3.5" />
				Mechanical Cut
			</button>
		</header>

		<!-- Content Scroller -->
		<div
			bind:this={containerElement}
			class="relative flex-1 overflow-y-auto scroll-smooth p-8 md:p-12 {showMechanics
				? 'mechanics-active'
				: ''}"
		>
			<div class="mx-auto max-w-3xl space-y-24 pb-48">
				{#if data.scenes.length === 0}
					<!-- Empty State -->
					<div class="space-y-4 py-24 text-center">
						<BookOpen class="mx-auto h-12 w-12 text-zinc-700" />
						<h3 class="text-lg font-bold text-zinc-300">No Published Chapters</h3>
						<p class="mx-auto max-w-sm text-sm text-zinc-500">
							There are no published scenes available to read for this serial yet.
						</p>
					</div>
				{:else}
					<!-- Continuous Scroll Stream of Scenes -->
					{#each data.scenes as scene, index (scene.id)}
						<section
							id="scene-{scene.id}"
							class="scene-section border-b border-white/5 pb-20 last:border-b-0 last:pb-0"
							data-index={index}
						>
							<!-- Scene Header Header -->
							<div class="mb-10 flex items-center gap-3 select-none">
								<span class="h-[1px] w-6 bg-zinc-800"></span>
								<h4
									class="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase"
								>
									{scene.display_title || scene.author_title || `Scene ${index + 1}`}
								</h4>
								<span class="h-[1px] flex-1 bg-zinc-800/40"></span>
								<span class="font-mono text-[9px] font-bold text-zinc-600 uppercase"
									>{formatDate(scene.published_at)}</span
								>
							</div>

							<!-- Scene Text Canvas -->
							<article class="prose-wrapper">
								<Reader content={scene.content || ''} onVisibleBlocksChange={() => {}} />
							</article>
						</section>
					{/each}

					<!-- Ambient Bottom Progress Teaser (End of Scroll Reward) -->
					{#if data.serial.teaser_target_scene_id}
						{@const targetSceneStatus = data.serial.teaser_target_scene?.status || 'Playing'}
						{@const nextSceneNum = data.scenes.length + 1}
						<div
							transition:fade
							class="relative space-y-6 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 p-6 backdrop-blur-md md:p-8"
						>
							<!-- Ambient Glow inside teaser -->
							<div
								class="bg-primary/10 absolute top-0 right-0 -z-10 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]"
							></div>

							<div
								class="flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center"
							>
								<div
									class="text-primary flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase"
								>
									<Activity class="h-4 w-4" />
									Scene {nextSceneNum} Status
								</div>

								<div class="flex items-center gap-2">
									<span class="text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
										>Current Stage:</span
									>
									{#if targetSceneStatus === 'Playing'}
										<span
											class="flex animate-pulse items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-400 uppercase"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
											Drafting (Play Phase)
										</span>
									{:else}
										<span
											class="flex animate-pulse items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
											Revision (Edit Phase)
										</span>
									{/if}
								</div>
							</div>

							<!-- Two Phase Layout (Play vs Edit) -->
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<!-- Drafting (Play Phase) Column -->
								<div class="space-y-4 rounded-2xl border border-white/5 bg-white/[0.01] p-5">
									<div
										class="flex items-center justify-between text-xs font-bold tracking-wider text-indigo-400 uppercase"
									>
										<span class="flex items-center gap-1.5">
											<FileText class="h-3.5 w-3.5" />
											1. Drafting
										</span>
										<span class="font-mono text-zinc-300">{data.autoPlayPercent}%</span>
									</div>

									<div
										class="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner"
									>
										<div
											class="h-full rounded-full bg-indigo-500 transition-all duration-500"
											style="width: {data.autoPlayPercent}%"
										></div>
									</div>

									<div class="grid grid-cols-3 gap-2 pt-2 text-center">
										<div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2">
											<span
												class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase"
												>Word Count</span
											>
											<span class="block font-mono text-xs font-bold text-zinc-200"
												>{data.serial.teaser_target_scene?.word_count || 0} / 1000</span
											>
										</div>
										<div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2">
											<span
												class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase"
												>Play Effort</span
											>
											<span class="block font-mono text-xs font-bold text-zinc-200"
												>{data.teaserMetrics.playKeystrokes || 0} Keys</span
											>
										</div>
										<div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2">
											<span
												class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase"
												>Play Time</span
											>
											<span class="block font-mono text-xs font-bold text-zinc-200"
												>{Math.round(data.teaserMetrics.playTimeSeconds / 60)} Mins</span
											>
										</div>
									</div>
								</div>

								<!-- Revision (Edit Phase) Column -->
								<div class="space-y-4 rounded-2xl border border-white/5 bg-white/[0.01] p-5">
									<div
										class="flex items-center justify-between text-xs font-bold tracking-wider text-emerald-400 uppercase"
									>
										<span class="flex items-center gap-1.5">
											<Compass class="h-3.5 w-3.5" />
											2. Revision
										</span>
										<span class="font-mono text-zinc-300">{data.manualEditPercent}%</span>
									</div>

									<div
										class="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner"
									>
										<div
											class="h-full rounded-full bg-emerald-500 transition-all duration-500"
											style="width: {data.manualEditPercent}%"
										></div>
									</div>

									<div class="grid grid-cols-2 gap-2 pt-2 text-center">
										<div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2">
											<span
												class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase"
												>Edit Effort</span
											>
											<span class="block font-mono text-xs font-bold text-zinc-200"
												>{data.teaserMetrics.editKeystrokes || 0} Keys</span
											>
										</div>
										<div class="space-y-0.5 rounded-xl border border-white/5 bg-white/[0.01] p-2">
											<span
												class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase"
												>Edit Time</span
											>
											<span class="block font-mono text-xs font-bold text-zinc-200"
												>{Math.round(data.teaserMetrics.editTimeSeconds / 60)} Mins</span
											>
										</div>
									</div>
								</div>
							</div>

							{#if data.serial.next_scene_update_note}
								<div
									class="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.01] p-4"
								>
									<AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
									<p class="text-xs leading-relaxed text-zinc-400 italic">
										"{data.serial.next_scene_update_note}"
									</p>
								</div>
							{/if}

							<!-- Live Presence Sync indicator -->
							{#if authorPresence.authorStatus.isOnline}
								<div
									class="animate-fade-in flex items-center justify-between rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4 shadow-sm"
									transition:slide
								>
									<div class="flex items-center gap-3">
										<div class="relative flex h-2.5 w-2.5">
											{#if authorPresence.authorStatus.isTyping}
												<span
													class="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"
												></span>
												<span
													class="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-purple-500"
												></span>
											{:else}
												<span
													class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
												></span>
												<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"
												></span>
											{/if}
										</div>

										<div class="space-y-0.5">
											<span
												class="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
												>Author Activity</span
											>
											{#if authorPresence.authorStatus.isTyping}
												<span class="block text-xs font-bold text-purple-400">Typing live...</span>
											{:else}
												<span class="block text-xs font-semibold text-emerald-400"
													>Active online</span
												>
											{/if}
										</div>
									</div>

									{#if authorPresence.authorStatus.currentSerialTitle}
										<div class="hidden text-right sm:block">
											<span
												class="block font-mono text-[9px] font-bold tracking-wider text-zinc-600 uppercase"
												>Working On</span
											>
											<span
												class="block max-w-[200px] truncate font-serif text-xs text-zinc-300 italic"
											>
												"{authorPresence.authorStatus.currentSerialTitle}"
											</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Mechanical cut CSS overrides */
	:global(.mechanics-active .reader-view [data-visibility='journal']) {
		display: block !important;
	}
</style>

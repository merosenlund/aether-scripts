<script lang="ts">
	import Reader from '$lib/components/Reader.svelte';
	import {
		Compass,
		BookOpen,
		ChevronRight,
		Layers,
		Eye,
		FileText,
		ArrowLeft,
		Globe,
		Lock,
		Play,
		Edit,
		RotateCcw,
		AlertTriangle
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';

	let { data } = $props<{ data: any }>();

	// State
	let activeItemIndex = $state(0);
	let containerElement = $state<HTMLElement | null>(null);

	// Local bypass state to allow readers to force-reveal skipped or summarized prose
	let forcedProseList = $state<Record<string, boolean>>({});

	// Group items by their list_arc_id
	const itemsByArc = $derived.by(() => {
		const unassigned: any[] = [];
		const grouped: Record<string, any[]> = {};

		// Initialize groupings
		data.arcs.forEach((arc: any) => {
			grouped[arc.id] = [];
		});

		data.items.forEach((item: any) => {
			if (item.list_arc_id && grouped[item.list_arc_id]) {
				grouped[item.list_arc_id].push(item);
			} else {
				unassigned.push(item);
			}
		});

		return {
			unassigned,
			grouped
		};
	});

	// Flat helper list of active items for indexing and scrolling
	const flatActiveItems = $derived(data.items.filter((item: any) => item.scene !== null));

	// Scroll to selected scene in the reading canvas
	function scrollToItem(itemId: string, index: number) {
		activeItemIndex = index;
		const element = document.getElementById(`curation-item-${itemId}`);
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

	// Scroll spy effect to keep the table of contents active item in sync
	$effect(() => {
		if (!containerElement) return;

		const sections = containerElement.querySelectorAll('.curation-section');
		const observerOptions = {
			root: containerElement,
			rootMargin: '-20% 0px -60% 0px',
			threshold: 0
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const indexAttr = entry.target.getAttribute('data-index');
					if (indexAttr !== null) {
						activeItemIndex = parseInt(indexAttr, 10);
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
	<!-- Left Side Curation Table of Contents -->
	<aside
		class="flex w-80 shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-2xl"
	>
		<div class="border-b border-white/5 bg-white/[0.01] p-6">
			<a
				href="/lists"
				class="mb-4 flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-white"
			>
				<ArrowLeft class="h-3.5 w-3.5" />
				Back to Playlists
			</a>

			<h2 class="line-clamp-2 font-serif text-xl leading-tight font-bold tracking-tight text-white">
				{data.list.title}
			</h2>
			<div class="mt-3 flex flex-wrap items-center gap-2 select-none">
				<span
					class="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase"
				>
					{data.list.serial?.title}
				</span>
				{#if data.list.is_public}
					<span
						class="flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 uppercase"
					>
						<Globe class="h-2.5 w-2.5" /> Public
					</span>
				{:else}
					<span
						class="flex items-center gap-1 rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-indigo-400 uppercase"
					>
						<Lock class="h-2.5 w-2.5" /> Private
					</span>
				{/if}
			</div>
		</div>

		<!-- Active Curation TOC Items -->
		<div class="flex-1 space-y-6 overflow-y-auto p-4">
			<!-- Unassigned items -->
			{#if itemsByArc.unassigned.length > 0}
				<div class="space-y-2">
					<h3 class="mb-2 px-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
						Introductory Chapters
					</h3>

					{#each itemsByArc.unassigned as item, uIdx}
						{@const flatIndex = flatActiveItems.findIndex((f: any) => f.id === item.id)}
						<button
							onclick={() => scrollToItem(item.id, flatIndex)}
							class="group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all
                {activeItemIndex === flatIndex
								? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]'
								: 'border-white/5 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'}"
						>
							<div class="space-y-1 truncate pr-1">
								<span
									class="block truncate font-serif text-xs font-bold transition-colors group-hover:text-white"
								>
									{item.scene?.display_title ||
										item.scene?.author_title ||
										`Sequence ${item.order_index}`}
								</span>

								<div class="flex items-center gap-1.5">
									<span class="block text-[8px] font-medium text-zinc-600">
										Chapter {item.scene?.order_index}
									</span>
									<span
										class="origin-left scale-[0.9] rounded border border-white/10 bg-white/5 px-1 text-[8px] font-bold tracking-wider uppercase
                    {item.reading_mode === 'prose' ? 'text-primary' : ''}
                    {item.reading_mode === 'summary' ? 'text-indigo-400' : ''}
                    {item.reading_mode === 'description' ? 'text-amber-400' : ''}
                    {item.reading_mode === 'skip' ? 'text-rose-400' : ''}
                  "
									>
										{item.reading_mode}
									</span>
								</div>
							</div>
							<ChevronRight
								class="group-hover:text-primary h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors"
							/>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Custom grouped Arcs -->
			{#each data.arcs as arc}
				{@const arcItems = itemsByArc.grouped[arc.id] || []}
				{#if arcItems.length > 0}
					<div class="space-y-2">
						<h3
							class="text-primary mb-2 px-2 font-serif text-[10px] font-bold tracking-widest uppercase"
						>
							{arc.title}
						</h3>

						{#each arcItems as item}
							{@const flatIndex = flatActiveItems.findIndex((f: any) => f.id === item.id)}
							<button
								onclick={() => scrollToItem(item.id, flatIndex)}
								class="group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all
                  {activeItemIndex === flatIndex
									? 'bg-primary/10 border-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.03)]'
									: 'border-white/5 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'}"
							>
								<div class="space-y-1 truncate pr-1">
									<span
										class="block truncate font-serif text-xs font-bold transition-colors group-hover:text-white"
									>
										{item.scene?.display_title ||
											item.scene?.author_title ||
											`Sequence ${item.order_index}`}
									</span>

									<div class="flex items-center gap-1.5">
										<span class="block text-[8px] font-medium text-zinc-600">
											Chapter {item.scene?.order_index}
										</span>
										<span
											class="origin-left scale-[0.9] rounded border border-white/10 bg-white/5 px-1 text-[8px] font-bold tracking-wider uppercase
                      {item.reading_mode === 'prose' ? 'text-primary' : ''}
                      {item.reading_mode === 'summary' ? 'text-indigo-400' : ''}
                      {item.reading_mode === 'description' ? 'text-amber-400' : ''}
                      {item.reading_mode === 'skip' ? 'text-rose-400' : ''}
                    "
										>
											{item.reading_mode}
										</span>
									</div>
								</div>
								<ChevronRight
									class="group-hover:text-primary h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors"
								/>
							</button>
						{/each}
					</div>
				{/if}
			{/each}

			{#if data.items.length === 0}
				<div
					class="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"
				>
					<p class="text-xs text-zinc-600 italic">This playlist contains no curation items.</p>
				</div>
			{/if}
		</div>

		<!-- Edit dashboard quick link if owns list -->
		{#if data.session && data.list.user_id === data.session.user.id}
			<div class="shrink-0 border-t border-white/5 bg-white/[0.01] p-4">
				<a
					href="/lists/{data.list.id}/edit"
					class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/10"
				>
					<Edit class="h-4 w-4 text-zinc-400" />
					Edit Curation Layout
				</a>
			</div>
		{/if}
	</aside>

	<!-- Reading Canvas Area -->
	<div class="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950">
		<!-- Header -->
		<header
			class="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/10 px-8 backdrop-blur-xl"
		>
			<div class="flex items-center gap-3">
				<Layers class="text-primary h-5 w-5 animate-pulse" />
				<span class="font-serif text-sm font-bold text-zinc-300">
					{#if flatActiveItems[activeItemIndex]}
						Curation Chapter: {flatActiveItems[activeItemIndex].scene?.display_title ||
							flatActiveItems[activeItemIndex].scene?.author_title}
					{:else}
						Story Overview
					{/if}
				</span>
			</div>

			<div class="text-[10px] font-bold text-zinc-500">Curated Narrative Mode Active</div>
		</header>

		<!-- Reading Stream Content viewport -->
		<div
			bind:this={containerElement}
			class="relative flex-1 overflow-y-auto scroll-smooth p-8 md:p-12"
		>
			<div class="mx-auto max-w-3xl space-y-24 pb-48">
				{#if flatActiveItems.length === 0}
					<div class="space-y-4 py-24 text-center">
						<BookOpen class="mx-auto h-12 w-12 text-zinc-700" />
						<h3 class="font-serif text-lg font-bold text-zinc-300">Empty Curation Playlist</h3>
						<p class="mx-auto max-w-sm text-sm text-zinc-500">
							There are no published curated scenes added to this reading list yet.
						</p>
					</div>
				{:else}
					{#each flatActiveItems as item, index (item.id)}
						{@const scene = item.scene}
						{@const mode = forcedProseList[item.id] ? 'prose' : item.reading_mode}

						<section
							id="curation-item-{item.id}"
							class="curation-section border-b border-white/5 pb-20 last:border-b-0 last:pb-0"
							data-index={index}
						>
							<!-- Arc Title Reveal Header if first item of that arc -->
							{#if item.list_arc_id}
								{@const matchedArc = data.arcs.find((a: any) => a.id === item.list_arc_id)}
								{@const isFirstOfArc =
									flatActiveItems.findIndex((f: any) => f.list_arc_id === item.list_arc_id) ===
									index}

								{#if matchedArc && isFirstOfArc}
									<div
										transition:slide
										class="bg-primary/5 border-primary/10 mt-4 mb-12 rounded-[1.5rem] border p-6 text-center shadow-md select-none"
									>
										<span
											class="text-primary mb-1 block text-[8px] font-bold tracking-widest uppercase"
											>Entering Narrative Arc</span
										>
										<h3 class="font-serif text-lg font-bold text-white md:text-xl">
											{matchedArc.title}
										</h3>
									</div>
								{/if}
							{/if}

							<!-- Scene Header Header -->
							<div class="mb-8 flex items-center gap-3 select-none">
								<span class="h-[1px] w-6 bg-zinc-800"></span>
								<h4
									class="max-w-xs truncate font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase"
								>
									{scene?.display_title || scene?.author_title || `Scene ${index + 1}`}
								</h4>

								<!-- If the reading mode was altered (e.g. Summarized/Bypassed), show indicator -->
								{#if item.reading_mode !== 'prose'}
									<span
										class="rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[8px] font-bold tracking-wider text-indigo-400 uppercase"
									>
										{item.reading_mode} cut
									</span>
								{/if}

								{#if forcedProseList[item.id]}
									<span
										class="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold tracking-wider text-emerald-400 uppercase"
									>
										Forced Prose Reveal
									</span>
								{/if}

								<span class="h-[1px] flex-1 bg-zinc-800/40"></span>
								<span class="shrink-0 font-mono text-[9px] font-bold text-zinc-600 uppercase"
									>{formatDate(scene?.published_at)}</span
								>
							</div>

							<!-- Rendering modes selection rendering -->
							{#if mode === 'prose'}
								<article class="prose-wrapper">
									<Reader content={scene?.content || ''} onVisibleBlocksChange={() => {}} />
								</article>

								{#if item.reading_mode !== 'prose' && forcedProseList[item.id]}
									<div class="mt-8 flex justify-end select-none">
										<button
											onclick={() => (forcedProseList[item.id] = false)}
											class="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-900 px-4 py-2 text-[10px] font-bold tracking-wide text-zinc-400 uppercase transition-all hover:bg-zinc-800 hover:text-white"
										>
											<RotateCcw class="h-3.5 w-3.5" />
											Restore Curated Cut
										</button>
									</div>
								{/if}
							{:else}
								<!-- Alternate modes (Summary / Description / Skipped) -->
								<div
									class="relative space-y-6 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/30 p-8"
								>
									{#if mode === 'summary'}
										<div class="space-y-4">
											<div
												class="flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-400 uppercase"
											>
												<FileText class="h-4 w-4" />
												Summarized Version
											</div>
											<p
												class="border-l-2 border-indigo-500/30 pl-4 font-serif text-base leading-relaxed text-zinc-300 italic"
											>
												"{scene?.summary || 'No summary was provided by the author.'}"
											</p>
										</div>
									{:else if mode === 'description'}
										<div class="space-y-4">
											<div
												class="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-400 uppercase"
											>
												<Compass class="h-4 w-4" />
												Narrative Log / Description
											</div>
											<p
												class="border-l-2 border-amber-500/30 pl-4 text-base leading-relaxed text-zinc-300"
											>
												{scene?.description || 'No description log was provided.'}
											</p>
										</div>
									{:else if mode === 'skip'}
										<div class="space-y-2 py-4">
											<div
												class="flex items-center gap-2 text-xs font-bold tracking-wider text-rose-400 uppercase"
											>
												<AlertTriangle class="h-4 w-4" />
												Chapter Bypassed
											</div>
											<p class="text-sm text-zinc-500">
												This chapter contains filler scenes, setup sideplots, or lore not critical
												to this custom reading arc curation.
											</p>
										</div>
									{/if}

									<!-- Reveal actions at bottom of summaries/skipped cards -->
									<div class="flex justify-end border-t border-white/5 pt-4">
										<button
											onclick={() => (forcedProseList[item.id] = true)}
											class="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-wider text-zinc-300 uppercase transition-all hover:bg-white/10 hover:text-white"
										>
											<Play class="text-primary fill-primary h-3 w-3" />
											Read Original Full Prose anyway
										</button>
									</div>
								</div>
							{/if}
						</section>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { page } from '$app/state';
	import { PenTool, Dices, History, Share2, ChevronLeft } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let { children, data } = $props<{ children: any; data: any }>();
	let activeTab = $derived(page.url.pathname.split('/').pop() || 'play');
	let serialId = $derived(page.params.id);
	let sceneId = $derived(page.params.sceneId);

	const tabs = [
		{ id: 'play', name: 'Play', icon: Dices, path: 'play' },
		{ id: 'edit', name: 'Edit', icon: PenTool, path: 'edit' },
		{ id: 'history', name: 'History', icon: History, path: 'history' },
		{ id: 'share', name: 'Share & Publish', icon: Share2, path: 'share' }
	];
</script>

<div class="relative flex h-screen flex-col overflow-hidden bg-stone-950 font-sans text-stone-100">
	<!-- Top Navigation Header -->
	<header
		class="z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-stone-900/40 px-6 shadow-md backdrop-blur-xl"
	>
		<div class="flex items-center gap-4">
			<a
				data-component="back-link"
				href="/serials/{serialId}"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stone-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
				title="Back to Serial"
			>
				<ChevronLeft class="h-4 w-4" />
			</a>
			<div class="h-4 w-px bg-white/10"></div>
			<div>
				<h2 class="mb-1 text-xs leading-none font-bold tracking-widest text-stone-500 uppercase">
					{data.scene.serials?.title || 'Serial'}
				</h2>
				<h1 class="max-w-xs truncate text-sm leading-none font-bold text-white/95 sm:max-w-md">
					{data.scene.author_title || `Scene ${data.scene.order_index}`}
				</h1>
			</div>
		</div>

		<!-- Mode Selector Tabs -->
		<nav class="flex rounded-xl border border-white/5 bg-black/40 p-1 backdrop-blur-md">
			{#each tabs as tab}
				{@const Icon = tab.icon}
				<a
					data-component="nav-tab"
					href="/serials/{serialId}/scenes/{sceneId}/{tab.path}"
					class="relative flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all {activeTab ===
					tab.id
						? 'text-white'
						: 'text-stone-400 hover:text-white'}"
				>
					{#if activeTab === tab.id}
						<div
							class="bg-primary/20 border-primary/30 absolute inset-0 -z-10 rounded-lg border shadow-[0_0_12px_rgba(var(--primary),0.15)]"
							transition:fade={{ duration: 150 }}
						></div>
					{/if}
					<Icon class="h-3.5 w-3.5" />
					<span>{tab.name}</span>
				</a>
			{/each}
		</nav>

		<!-- Right Side Status Badge -->
		<div class="flex items-center gap-3">
			<span
				class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-emerald-400 uppercase shadow-[0_0_8px_rgba(16,185,129,0.05)]"
			>
				{data.scene.status || 'Playing'}
			</span>
			{#if data.scene.semantic_version}
				<span
					class="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-500"
				>
					v{data.scene.semantic_version}
				</span>
			{/if}
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="relative z-10 min-h-0 flex-1">
		{@render children()}
	</main>

	<!-- Ambient Glow -->
	<div
		class="bg-primary/5 absolute top-0 left-1/4 -z-10 h-[600px] w-[600px] -translate-y-1/2 rounded-full blur-[140px]"
	></div>
</div>

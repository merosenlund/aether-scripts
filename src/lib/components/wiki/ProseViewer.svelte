<script lang="ts">
	import { Link } from '@lucide/svelte';

	/**
	 * ProseViewer — Read-only Tiptap content renderer with block-level click targets.
	 *
	 * Renders Tiptap JSON as styled paragraphs matching the editor's typography.
	 * Each top-level block gets a data-block-id wrapper that supports:
	 *   - Anchor indicators (left border accent) for blocks connected to events
	 *   - Hover effects in re-anchor mode
	 *   - Click-to-select for re-anchoring
	 */

	interface TiptapNode {
		type: string;
		attrs?: Record<string, unknown>;
		content?: TiptapNode[];
		text?: string;
		marks?: { type: string; attrs?: Record<string, unknown> }[];
	}

	interface LoadedScene {
		id: string;
		title: string;
		order_index: number;
		content_blocks: { type: string; content?: TiptapNode[] } | null;
	}

	let {
		scenes = [],
		anchoredBlockIds = new Set<string>(),
		highlightedBlockId = null,
		reanchorMode = false,
		onBlockClick = (_blockId: string, _sceneId: string) => {},
		onRequestPreviousScene = () => {},
		onRequestNextScene = () => {}
	} = $props<{
		scenes: LoadedScene[];
		anchoredBlockIds: Set<string>;
		highlightedBlockId: string | null;
		reanchorMode: boolean;
		onBlockClick: (blockId: string, sceneId: string) => void;
		onRequestPreviousScene: () => void;
		onRequestNextScene: () => void;
	}>();

	let scrollContainer: HTMLElement | undefined = $state();
	let topSentinel: HTMLElement | undefined = $state();
	let bottomSentinel: HTMLElement | undefined = $state();

	// IntersectionObserver for lazy loading scenes on scroll
	$effect(() => {
		if (!scrollContainer) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const dir = (entry.target as HTMLElement).dataset.sentinel;
					if (dir === 'top') onRequestPreviousScene();
					else if (dir === 'bottom') onRequestNextScene();
				}
			},
			{ root: scrollContainer, rootMargin: '200px', threshold: 0 }
		);

		if (topSentinel) observer.observe(topSentinel);
		if (bottomSentinel) observer.observe(bottomSentinel);

		return () => observer.disconnect();
	});

	// Render inline content (text with marks)
	function renderInline(nodes: TiptapNode[] | undefined): string {
		if (!nodes) return '';
		return nodes
			.map((node) => {
				if (node.type === 'text') {
					let text = escapeHtml(node.text || '');
					if (node.marks) {
						for (const mark of node.marks) {
							switch (mark.type) {
								case 'bold':
									text = `<strong>${text}</strong>`;
									break;
								case 'italic':
									text = `<em>${text}</em>`;
									break;
								case 'code':
									text = `<code>${text}</code>`;
									break;
								case 'strike':
									text = `<s>${text}</s>`;
									break;
							}
						}
					}
					return text;
				}
				if (node.type === 'hardBreak') return '<br>';
				return '';
			})
			.join('');
	}

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	// Extract text content for block preview
	function getBlockText(node: TiptapNode): string {
		if (node.text) return node.text;
		if (!node.content) return '';
		return node.content.map(getBlockText).join('');
	}

	// Get blocks from a scene's content
	function getSceneBlocks(scene: LoadedScene): { id: string; node: TiptapNode }[] {
		if (!scene.content_blocks?.content) return [];
		return scene.content_blocks.content
			.filter((node) => node.attrs?.id)
			.map((node) => ({
				id: node.attrs!.id as string,
				node
			}));
	}

	// Scroll to a specific block
	export function scrollToBlock(blockId: string) {
		if (!scrollContainer) return;
		const target = scrollContainer.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
		if (!target) return;

		target.scrollIntoView({ behavior: 'smooth', block: 'center' });

		// Flash highlight animation
		target.setAttribute('data-flash', 'true');
		setTimeout(() => target.removeAttribute('data-flash'), 1500);
	}
</script>

<div
	data-component="prose-viewer"
	class="prose-viewer scroll-container h-full overflow-y-auto"
	bind:this={scrollContainer}
>
	<!-- Scroll-up sentinel for lazy loading previous scenes -->
	<div
		data-component="sentinel-top"
		data-sentinel="top"
		class="h-1"
		bind:this={topSentinel}
	></div>

	{#each scenes as scene, sceneIdx (scene.id)}
		<!-- Scene Divider -->
		{#if sceneIdx > 0}
			<div data-component="scene-divider" class="my-8 flex items-center gap-4 px-8">
				<div class="h-px flex-1 bg-white/5"></div>
				<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">
					Scene {scene.order_index}: {scene.title}
				</span>
				<div class="h-px flex-1 bg-white/5"></div>
			</div>
		{:else}
			<div data-component="scene-header" class="px-8 pt-2 pb-4">
				<span class="text-[9px] font-bold tracking-widest text-stone-600 uppercase">
					Scene {scene.order_index}: {scene.title}
				</span>
			</div>
		{/if}

		<!-- Scene Content Blocks -->
		{@const blocks = getSceneBlocks(scene)}
		{#if blocks.length === 0}
			<div data-component="empty-scene" class="px-8 py-4 text-xs italic text-stone-700">
				No content in this scene
			</div>
		{:else}
			{#each blocks as block, blockIdx (block.id + '-' + blockIdx)}
				{@const isAnchored = anchoredBlockIds.has(block.id)}
				{@const isHighlighted = highlightedBlockId === block.id}
				{@const blockText = getBlockText(block.node)}

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					data-component="prose-block"
					data-block-id={block.id}
					class="prose-block group relative px-8 py-1 transition-all
						{isAnchored ? 'border-l-2 border-primary/40' : 'border-l-2 border-transparent'}
						{isHighlighted ? 'bg-primary/10 border-primary' : ''}
						{reanchorMode ? 'cursor-pointer hover:bg-white/5' : ''}"
					onclick={() => {
						if (reanchorMode) {
							onBlockClick(block.id, scene.id);
						}
					}}
				>
					<!-- Anchor indicator -->
					{#if isAnchored}
						<div
							data-component="anchor-indicator"
							class="text-primary/40 absolute top-1/2 left-2 -translate-y-1/2"
						>
							<Link size={10} />
						</div>
					{/if}

					<!-- Block content rendered as HTML -->
					{#if block.node.type === 'heading'}
						{@const level = (block.node.attrs?.level as number) || 2}
						{#if level === 1}
							<h1 class="font-serif text-2xl leading-relaxed font-bold text-stone-200">
								{@html renderInline(block.node.content)}
							</h1>
						{:else if level === 2}
							<h2 class="font-serif text-xl leading-relaxed font-bold text-stone-200">
								{@html renderInline(block.node.content)}
							</h2>
						{:else}
							<h3 class="font-serif text-lg leading-relaxed font-bold text-stone-300">
								{@html renderInline(block.node.content)}
							</h3>
						{/if}
					{:else if block.node.type === 'gmNote' || block.node.attrs?.visibility === 'journal'}
						<div class="rounded-lg border-l-2 border-stone-600/30 bg-stone-800/20 py-1 pr-4 pl-4 italic text-stone-500">
							{@html renderInline(block.node.content)}
						</div>
					{:else if block.node.type === 'clockBlock' || block.node.type === 'trackBlock' || block.node.type === 'diceRoller' || block.node.type === 'oracleBlock' || block.node.type === 'statBlock'}
						<div class="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs text-stone-500">
							<span class="font-bold uppercase tracking-wider">{block.node.type.replace(/([A-Z])/g, ' $1').trim()}</span>
							{#if block.node.attrs?.name}
								: {block.node.attrs.name}
							{/if}
						</div>
					{:else}
						<p class="font-serif text-lg leading-relaxed text-stone-300">
							{@html renderInline(block.node.content) || '&nbsp;'}
						</p>
					{/if}
				</div>
			{/each}
		{/if}
	{/each}

	<!-- Scroll-down sentinel for lazy loading next scenes -->
	<div
		data-component="sentinel-bottom"
		data-sentinel="bottom"
		class="h-1"
		bind:this={bottomSentinel}
	></div>
</div>

<style>
	@keyframes flashHighlight {
		0% {
			background: rgba(245, 158, 11, 0.15);
			border-left-color: var(--color-primary, #f59e0b);
		}
		100% {
			background: transparent;
		}
	}

	:global([data-flash='true']) {
		animation: flashHighlight 1.2s ease-out forwards;
		border-left: 2px solid var(--color-primary, #f59e0b) !important;
	}
</style>

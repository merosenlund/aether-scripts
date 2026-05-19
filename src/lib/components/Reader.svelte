<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	let { content, onVisibleBlocksChange } = $props<{
		content: string; // HTML for now, but in production we'd use JSON
		onVisibleBlocksChange: (ids: string[]) => void;
	}>();

	let container: HTMLElement;
	let visibleIds = new Set<string>();
	let observer: IntersectionObserver;

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const id = entry.target.getAttribute('data-id');
					if (!id) return;

					if (entry.isIntersecting) {
						visibleIds.add(id);
					} else {
						visibleIds.delete(id);
					}
				});
				onVisibleBlocksChange(Array.from(visibleIds));
			},
			{
				threshold: 0.1,
				rootMargin: '-10% 0px -10% 0px'
			}
		);

		// Initial setup
		const updateObserver = () => {
			container.querySelectorAll('[data-id]').forEach((el) => {
				observer.observe(el);
			});
		};

		// We need to wait for content to render
		setTimeout(updateObserver, 100);
	});

	onDestroy(() => {
		if (observer) observer.disconnect();
	});
</script>

<div
	bind:this={container}
	class="prose prose-stone dark:prose-invert reader-view max-w-none text-lg leading-relaxed text-stone-300"
>
	{@html content}
</div>

<style>
	/* Hide journal blocks in reader mode */
	:global(.reader-view [data-visibility='journal']) {
		display: none !important;
	}
</style>

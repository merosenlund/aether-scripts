<script lang="ts">
	import { Plus, Book, Users, Star, Clock } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { openPrompt } from '$lib/stores/prompt.svelte';

	let { data } = $props();

	let titleInput = $state('');
	let formRef: HTMLFormElement | undefined = $state(undefined);

	async function handleCreateSerial() {
		const title = await openPrompt(
			'Create New Serial',
			'Enter a title for your new actual-play interactive story:',
			'My New Serial'
		);
		if (title && title.trim()) {
			titleInput = title.trim();
			setTimeout(() => {
				if (formRef) {
					formRef.submit();
				}
			}, 0);
		}
	}

	function timeAgo(date: string | Date) {
		const now = new Date();
		const then = new Date(date);
		const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return then.toLocaleDateString();
	}
</script>

<div class="mx-auto max-w-7xl space-y-10 p-8">
	<!-- Header -->
	<header class="flex items-end justify-between">
		<div class="space-y-1">
			<h1 class="text-4xl font-bold tracking-tight">Your Serials</h1>
			<p class="text-stone-400">Manage your stories, worlds, and reader community.</p>
		</div>
		<button
			onclick={handleCreateSerial}
			class="bg-primary text-primary-foreground shadow-primary/20 flex items-center rounded-lg px-4 py-2 font-semibold shadow-lg transition-all hover:opacity-90"
		>
			<Plus class="mr-2 h-5 w-5" />
			New Serial
		</button>
	</header>

	<!-- Serials Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each data.serials as serial}
			<a
				href="/serials/{serial.id}"
				class="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-stone-900/50 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50"
			>
				<!-- Card Header / Cover Art Placeholder -->
				<div class="h-32 bg-gradient-to-br {serial.color_theme} relative overflow-hidden">
					<div class="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0"></div>
					<div class="absolute top-4 right-4">
						{#if serial.status === 'pilot'}
							<span
								class="bg-primary text-primary-foreground shadow-primary/20 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase shadow-lg"
							>
								Pilot Phase
							</span>
						{:else}
							<span
								class="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md"
							>
								{serial.status}
							</span>
						{/if}
					</div>
				</div>

				<!-- Content -->
				<div class="flex flex-1 flex-col p-5">
					<h2 class="group-hover:text-primary mb-4 text-xl font-bold transition-colors">
						{serial.title}
					</h2>

					<div class="mt-auto grid grid-cols-2 gap-4">
						<div class="flex items-center text-sm text-stone-400">
							<Book class="mr-2 h-4 w-4 text-stone-500" />
							{serial.scenesCount} Scenes
						</div>
						<div class="flex items-center text-sm text-stone-400">
							<Users class="mr-2 h-4 w-4 text-stone-500" />
							{serial.readersCount} Readers
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div
					class="flex items-center justify-between border-t border-white/5 bg-stone-950/30 px-5 py-3 text-xs text-stone-500"
				>
					<div class="flex items-center">
						<Clock class="mr-1 h-3 w-3" />
						Edited {timeAgo(serial.lastEdit)}
					</div>
					<Star class="h-4 w-4 cursor-pointer transition-colors hover:text-yellow-500" />
				</div>
			</a>
		{/each}

		<!-- Empty/Create Card -->
		<button
			onclick={handleCreateSerial}
			class="group hover:border-primary/50 hover:bg-primary/5 hover:text-primary flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/5 p-8 text-stone-500 transition-all duration-300"
		>
			<div
				class="group-hover:bg-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 transition-colors"
			>
				<Plus class="h-6 w-6" />
			</div>
			<span class="font-semibold">Start a new journey</span>
		</button>
	</div>
</div>

<!-- Hidden Form to trigger SvelteKit creation action -->
<form bind:this={formRef} method="POST" action="?/create" class="hidden">
	<input type="hidden" name="title" value={titleInput} />
</form>

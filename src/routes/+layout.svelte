<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import PromptModal from '$lib/components/PromptModal.svelte';
	import GlobalLoader from '$lib/components/layout/GlobalLoader.svelte';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);
	let showSidebar = $derived(page.url.pathname !== '/login' && !page.url.pathname.startsWith('/auth'));

	onMount(() => {
		const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => authListener.subscription.unsubscribe();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen w-full overflow-hidden bg-stone-950 font-sans">
	<GlobalLoader />
	{#if showSidebar}
		<Sidebar />
	{/if}
	<main class="relative flex flex-1 flex-col overflow-y-auto {showSidebar && !page.url.pathname.includes('/scenes/') ? 'pt-16 md:pt-0' : ''}">
		<!-- Ambient Background Glows -->
		<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
			<div
				class="bg-primary/10 absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
			></div>
			<div
				class="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]"
			></div>
		</div>

		<div class="relative z-0 flex flex-1 flex-col">
			{@render children()}
		</div>
	</main>
	<Toaster />
	<PromptModal />
</div>

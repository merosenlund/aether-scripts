<script lang="ts">
	import {
		LayoutDashboard,
		BookOpen,
		Library,
		Settings,
		User,
		ChevronLeft,
		ChevronRight,
		PenTool,
		LogIn,
		BarChart2
	} from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { page } from '$app/state';

	let collapsed = $state(false);

	let navItems = $derived([
		{ name: 'Home', icon: LayoutDashboard, href: '/' },
		...(page.data.userRole === 'author'
			? [{ name: 'Writing', icon: PenTool, href: '/write' }]
			: []),
		{ name: 'Library', icon: Library, href: '/library' },
		{ name: 'Reading Lists', icon: BookOpen, href: '/lists' },
		{ name: 'Writing Analytics', icon: BarChart2, href: '/analytics' }
	]);

	let bottomItems = $derived(
		page.data.session
			? [
					{ name: 'Settings', icon: Settings, href: '/settings' },
					{ name: 'Profile', icon: User, href: '/account' }
				]
			: [{ name: 'Log In', icon: LogIn, href: '/login' }]
	);
</script>

<aside
	class="relative z-10 flex h-full flex-col border-r border-white/5 bg-stone-950/50 backdrop-blur-xl transition-all duration-300 ease-in-out {collapsed
		? 'w-20'
		: 'w-64'}"
>
	<!-- Logo -->
	<div class="mb-4 flex h-16 items-center px-6">
		<div class="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
			<Logo class="text-primary-foreground h-5 w-5" />
		</div>
		{#if !collapsed}
			<span class="text-foreground/90 ml-3 text-lg font-bold tracking-tight transition-opacity"
				>Aether Scripts</span
			>
		{/if}
	</div>

	<!-- Nav Items -->
	<nav class="flex-1 space-y-1 px-3">
		{#each navItems as item}
			<a
				href={item.href}
				class="group flex items-center rounded-lg px-3 py-2.5 transition-all duration-200
          {page.url.pathname === item.href
					? 'bg-primary/10 text-primary'
					: 'text-stone-400 hover:bg-white/5 hover:text-white'}"
			>
				<item.icon class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
				{#if !collapsed}
					<span class="ml-3 text-sm font-medium transition-opacity">{item.name}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Bottom Items -->
	<div class="space-y-1 px-3 pb-6">
		{#each bottomItems as item}
			<a
				href={item.href}
				class="group flex items-center rounded-lg px-3 py-2.5 text-stone-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
			>
				<item.icon class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
				{#if !collapsed}
					<span class="ml-3 text-sm font-medium transition-opacity">{item.name}</span>
				{/if}
			</a>
		{/each}
	</div>

	<!-- Collapse Toggle -->
	<button
		onclick={() => (collapsed = !collapsed)}
		class="absolute -right-3 bottom-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-stone-900 text-stone-400 shadow-lg transition-colors hover:bg-stone-800 hover:text-white"
		title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
	>
		{#if collapsed}
			<ChevronRight class="h-4 w-4" />
		{:else}
			<ChevronLeft class="h-4 w-4" />
		{/if}
	</button>
</aside>

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
		BarChart2,
		Menu,
		X
	} from '@lucide/svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { page } from '$app/state';

	let collapsed = $state(false);
	let mobileOpen = $state(false);

	let isEditorRoute = $derived(page.url.pathname.includes('/scenes/'));

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

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<!-- Desktop Sidebar (Hidden on mobile) -->
<aside
	class="relative z-10 hidden h-full flex-col border-r border-white/5 bg-stone-950/50 backdrop-blur-xl transition-all duration-300 ease-in-out md:flex {collapsed
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

<!-- Mobile Sidebar Elements (Floating trigger & Drawer Overlay) -->
{#if !isEditorRoute}
	<!-- Floating Hamburger -->
	<button
		type="button"
		onclick={() => (mobileOpen = !mobileOpen)}
		class="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-stone-900/80 text-stone-300 shadow-lg backdrop-blur-md transition-all hover:bg-stone-800 hover:text-white md:hidden"
		aria-label="Toggle Menu"
	>
		{#if mobileOpen}
			<X class="h-5 w-5" />
		{:else}
			<Menu class="h-5 w-5" />
		{/if}
	</button>

	{#if mobileOpen}
		<!-- Backdrop overlay -->
		<div
			onclick={closeMobile}
			keydown={(e) => e.key === 'Escape' && closeMobile()}
			role="button"
			tabindex="0"
			class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
		></div>

		<!-- Drawer Panel -->
		<aside
			class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/5 bg-stone-950 p-4 transition-transform duration-300 ease-in-out md:hidden animate-in slide-in-from-left duration-200"
		>
			<!-- Logo -->
			<div class="mb-6 flex h-16 items-center px-4 pt-4">
				<div class="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
					<Logo class="text-primary-foreground h-5 w-5" />
				</div>
				<span class="text-foreground/90 ml-3 text-lg font-bold tracking-tight">Aether Scripts</span>
			</div>

			<!-- Nav Items -->
			<nav class="flex-1 space-y-1 px-1">
				{#each navItems as item}
					<a
						href={item.href}
						onclick={closeMobile}
						class="group flex items-center rounded-lg px-3 py-3 transition-all duration-200
							{page.url.pathname === item.href
								? 'bg-primary/10 text-primary'
								: 'text-stone-400 hover:bg-white/5 hover:text-white'}"
					>
						<item.icon class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
						<span class="ml-3 text-base font-medium">{item.name}</span>
					</a>
				{/each}
			</nav>

			<!-- Bottom Items -->
			<div class="space-y-1 px-1 pb-6">
				{#each bottomItems as item}
					<a
						href={item.href}
						onclick={closeMobile}
						class="group flex items-center rounded-lg px-3 py-3 text-stone-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
					>
						<item.icon class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
						<span class="ml-3 text-base font-medium">{item.name}</span>
					</a>
				{/each}
			</div>
		</aside>
	{/if}
{/if}

<script lang="ts">
  import { 
    LayoutDashboard, 
    BookOpen, 
    Library, 
    Settings, 
    User,
    ChevronLeft,
    ChevronRight,
    PenTool
  } from '@lucide/svelte';
  import { page } from '$app/state';

  let collapsed = $state(false);

  const navItems = [
    { name: 'Home', icon: LayoutDashboard, href: '/' },
    { name: 'Writing', icon: PenTool, href: '/dashboard' },
    { name: 'Library', icon: Library, href: '/library' },
    { name: 'Reading Lists', icon: BookOpen, href: '/lists' },
  ];

  const bottomItems = [
    { name: 'Settings', icon: Settings, href: '/settings' },
    { name: 'Profile', icon: User, href: '/account/profile' },
  ];
</script>

<aside 
  class="relative z-10 h-full flex flex-col bg-stone-950/50 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out {collapsed ? 'w-20' : 'w-64'}"
>
  <!-- Logo -->
  <div class="h-16 flex items-center px-6 mb-4">
    <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
      <span class="text-primary-foreground font-bold text-xl">A</span>
    </div>
    {#if !collapsed}
      <span class="ml-3 font-bold text-lg tracking-tight text-foreground/90 transition-opacity">Aether Scripts</span>
    {/if}
  </div>

  <!-- Nav Items -->
  <nav class="flex-1 px-3 space-y-1">
    {#each navItems as item}
      <a 
        href={item.href}
        class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group
          {page.url.pathname === item.href 
            ? 'bg-primary/10 text-primary' 
            : 'text-stone-400 hover:bg-white/5 hover:text-white'}"
      >
        <item.icon class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
        {#if !collapsed}
          <span class="ml-3 font-medium text-sm transition-opacity">{item.name}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <!-- Bottom Items -->
  <div class="px-3 pb-6 space-y-1">
    {#each bottomItems as item}
      <a 
        href={item.href}
        class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group text-stone-400 hover:bg-white/5 hover:text-white"
      >
        <item.icon class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
        {#if !collapsed}
          <span class="ml-3 font-medium text-sm transition-opacity">{item.name}</span>
        {/if}
      </a>
    {/each}
  </div>

  <!-- Collapse Toggle -->
  <button 
    onclick={() => collapsed = !collapsed}
    class="absolute -right-3 top-20 w-6 h-6 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors z-20 shadow-lg"
  >
    {#if collapsed}
      <ChevronRight class="w-4 h-4" />
    {:else}
      <ChevronLeft class="w-4 h-4" />
    {/if}
  </button>
</aside>

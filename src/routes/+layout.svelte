<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  import PromptModal from '$lib/components/PromptModal.svelte';

  let { data, children } = $props();
  let { supabase, session } = $derived(data);

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

<div class="flex h-screen w-full bg-stone-950 overflow-hidden font-sans">
  <Sidebar />
  <main class="flex-1 overflow-hidden relative flex flex-col">
    <!-- Ambient Background Glows -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
    </div>
    
    <div class="flex-1 flex flex-col relative z-0">
      {@render children()}
    </div>
  </main>
  <Toaster />
  <PromptModal />
</div>

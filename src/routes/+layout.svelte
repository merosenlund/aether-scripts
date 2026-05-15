<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

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

{@render children()}

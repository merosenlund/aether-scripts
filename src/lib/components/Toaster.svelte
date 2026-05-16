<script lang="ts">
  import { notifications } from '$lib/stores/notifications';
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { CheckCircle2, AlertCircle, Info, X } from '@lucide/svelte';
</script>

<div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
  {#each $notifications as notification (notification.id)}
    <div
      animate:flip={{ duration: 300 }}
      transition:fly={{ x: 50, duration: 300 }}
      class="pointer-events-auto group relative flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-stone-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/5"
    >
      <div class="flex-shrink-0 mt-0.5">
        {#if notification.type === 'success'}
          <CheckCircle2 class="w-5 h-5 text-emerald-400" />
        {:else if notification.type === 'error'}
          <AlertCircle class="w-5 h-5 text-rose-400" />
        {:else}
          <Info class="w-5 h-5 text-blue-400" />
        {/if}
      </div>
      
      <div class="flex-1 text-sm font-medium text-stone-200">
        {notification.message}
      </div>

      <button
        onclick={() => notifications.remove(notification.id)}
        class="flex-shrink-0 text-stone-500 hover:text-white transition-colors"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Progress bar -->
      {#if notification.duration && notification.duration > 0}
        <div class="absolute bottom-0 left-0 h-1 bg-white/5 rounded-full overflow-hidden w-full">
          <div 
            class="h-full {notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}"
            style="animation: progress {notification.duration}ms linear forwards"
          ></div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
</style>

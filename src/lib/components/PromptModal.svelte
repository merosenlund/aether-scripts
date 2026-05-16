<script lang="ts">
  import { promptState, closePrompt } from '$lib/stores/prompt.svelte';
  import { fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';

  let inputRef: HTMLInputElement | undefined = $state(undefined);
  let inputValue = $state('');

  $effect(() => {
    if (promptState.isOpen) {
      inputValue = promptState.defaultValue;
      // Focus input when modal opens
      setTimeout(() => {
        if (inputRef) {
          inputRef.focus();
          inputRef.select();
        }
      }, 50);
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    closePrompt(inputValue);
  }

  function handleCancel() {
    closePrompt(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && promptState.isOpen) {
      handleCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if promptState.isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    onclick={handleCancel}
  >
    <!-- Modal -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="w-full max-w-md p-6 bg-stone-900 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden"
      transition:scale={{ duration: 200, start: 0.95 }}
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Ambient Glow -->
      <div class="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>

      <h3 class="text-xl font-bold text-white mb-2">{promptState.title}</h3>
      {#if promptState.description}
        <p class="text-sm text-stone-400 mb-6">{promptState.description}</p>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-6 relative z-10">
        <div>
          <input 
            bind:this={inputRef}
            bind:value={inputValue}
            type="text" 
            class="w-full bg-stone-950/50 border border-white/10 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            placeholder="Type here..."
          />
        </div>

        <div class="flex justify-end gap-3">
          <button 
            type="button"
            onclick={handleCancel}
            class="px-4 py-2 rounded-xl text-sm font-bold text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-6 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

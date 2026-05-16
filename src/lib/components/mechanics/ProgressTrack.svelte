<script lang="ts">
  let { max = 10, current = 0, name = '' } = $props<{
    max?: number;
    current?: number;
    name?: string;
  }>();
</script>

<div class="flex flex-col gap-1 w-full group">
  <div class="flex gap-1 w-full h-4">
    {#each Array(max) as _, i}
      <div 
        class="flex-1 rounded-sm border border-stone-700 transition-colors duration-300 {i < current ? 'bg-primary border-primary' : 'bg-stone-900'}"
      ></div>
    {/each}
  </div>
  {#if name}
    <span class="text-[10px] font-bold uppercase tracking-widest text-stone-500">{name}</span>
  {/if}
</div>

<script lang="ts">
  let { segments = 4, filled = 0, name = '', action = 'create' } = $props<{
    segments?: number;
    filled?: number;
    name?: string;
    action?: 'create' | 'increment' | 'decrement';
  }>();

  // Validate segments (must be an even number between 4 and 12 for standard clocks)
  const validSegments = [4, 6, 8, 10, 12].includes(segments) ? segments : 4;
  
  // Calculate SVG paths for segments
  function getSegmentPath(index: number, total: number) {
    const center = 50;
    const radius = 45; // Leave some margin
    const startAngle = (index * 360) / total - 90;
    const endAngle = ((index + 1) * 360) / total - 90;

    const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  }
</script>

<div class="flex flex-col items-center gap-2 group relative p-1">
  {#if action === 'increment'}
    <div class="absolute top-0 right-0 bg-emerald-500 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-emerald-400 animate-pulse select-none z-10 font-sans">+1</div>
  {:else if action === 'decrement'}
    <div class="absolute top-0 right-0 bg-rose-500 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-rose-400 animate-pulse select-none z-10 font-sans">-1</div>
  {/if}
  
  <svg viewBox="0 0 100 100" class="w-16 h-16 transform transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]">
    <circle cx="50" cy="50" r="45" class="fill-stone-950 stroke-stone-800 stroke-[1.5]" />
    
    {#each Array(validSegments) as _, i}
      <path
        d={getSegmentPath(i, validSegments)}
        class="stroke-stone-950 stroke-[1.5] transition-all duration-500 {i < filled ? 'fill-primary drop-shadow-[0_0_4px_var(--color-primary)]' : 'fill-stone-900/60'}"
      />
    {/each}
  </svg>
  {#if name}
    <div class="flex flex-col items-center">
      <span class="text-xs font-bold text-stone-300 text-center leading-tight group-hover:text-white transition-colors">{name}</span>
      <span class="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">
        {#if action === 'create'}
          Start ({filled}/{validSegments})
        {:else}
          {action}d ({filled}/{validSegments})
        {/if}
      </span>
    </div>
  {/if}
</div>

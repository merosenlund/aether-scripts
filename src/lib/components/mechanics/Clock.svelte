<script lang="ts">
  let { segments = 4, filled = 0, name = '' } = $props<{
    segments?: number;
    filled?: number;
    name?: string;
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

<div class="flex flex-col items-center gap-2 group">
  <svg viewBox="0 0 100 100" class="w-16 h-16 transform transition-transform group-hover:scale-105">
    <circle cx="50" cy="50" r="45" class="fill-stone-900 stroke-stone-700 stroke-2" />
    
    {#each Array(validSegments) as _, i}
      <path
        d={getSegmentPath(i, validSegments)}
        class="stroke-stone-700 stroke-1 transition-colors duration-300 {i < filled ? 'fill-primary' : 'fill-transparent'}"
      />
    {/each}
  </svg>
  {#if name}
    <span class="text-xs font-bold text-stone-400 text-center leading-tight">{name}</span>
  {/if}
</div>

<script lang="ts">
	import type { HeatmapDay } from '$lib/analytics/streaks';

	let { days = [] as HeatmapDay[] } = $props<{
		days: HeatmapDay[];
	}>();

	const CELL = 11;
	const GAP = 2;
	const STEP = CELL + GAP;
	const TOP = 20;
	const LEFT = 24;

	function heatColor(words: number): string {
		if (words === 0) return '#1c1917';
		if (words < 250) return '#14532d';
		if (words < 500) return '#166534';
		if (words < 1000) return '#15803d';
		return '#4ade80';
	}

	interface Cell {
		day: HeatmapDay;
		col: number;
		row: number;
	}

	let grid = $derived.by((): Cell[] => {
		if (!days.length) return [];
		const firstDow = (new Date(days[0].date + 'T12:00:00').getDay() + 6) % 7;
		return days.map((day, i) => {
			const abs = i + firstDow;
			return { day, col: Math.floor(abs / 7), row: abs % 7 };
		});
	});

	let numCols = $derived(grid.length ? grid[grid.length - 1].col + 1 : 52);

	let monthLabels = $derived.by(() => {
		const labels: { label: string; col: number }[] = [];
		let lastMonth = -1;
		for (const cell of grid) {
			const d = new Date(cell.day.date + 'T12:00:00');
			const m = d.getMonth();
			if (m !== lastMonth) {
				labels.push({
					label: d.toLocaleDateString(undefined, { month: 'short' }),
					col: cell.col
				});
				lastMonth = m;
			}
		}
		return labels;
	});

	const DOW = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

	let svgW = $derived(LEFT + numCols * STEP);
	const svgH = TOP + 7 * STEP;

	// Tooltip state
	let hovered = $state<HeatmapDay | null>(null);
	let tipX = $state(0);
	let tipY = $state(0);

	function onEnter(e: MouseEvent, day: HeatmapDay) {
		hovered = day;
		tipX = e.clientX;
		tipY = e.clientY;
	}
	function onMove(e: MouseEvent) {
		tipX = e.clientX;
		tipY = e.clientY;
	}
	function onLeave() {
		hovered = null;
	}

	let tipLabel = $derived.by(() => {
		if (!hovered) return '';
		const d = new Date(hovered.date + 'T12:00:00').toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		if (hovered.wordCount === 0) return `${d}\nNo writing`;
		return `${d}\n${hovered.wordCount.toLocaleString()} words · ${hovered.sessionCount} session${hovered.sessionCount !== 1 ? 's' : ''}`;
	});

	let [tipDate, tipStats] = $derived(tipLabel.split('\n'));
</script>

<!-- Tooltip rendered at fixed viewport position so it's never clipped by overflow-x-auto -->
{#if hovered}
	<div
		class="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-stone-900 px-3 py-2 shadow-xl"
		style="left: {tipX + 14}px; top: {tipY - 36}px"
	>
		<p class="text-[10px] font-bold text-stone-400">{tipDate}</p>
		<p class="mt-0.5 font-mono text-xs font-bold text-white">{tipStats}</p>
	</div>
{/if}

<div class="overflow-x-auto pb-1">
	<svg
		viewBox="0 0 {svgW} {svgH}"
		style="height: {svgH}px; min-width: {svgW}px"
		role="img"
		aria-label="52-week writing activity heatmap"
	>
		{#each monthLabels as ml}
			<text x={LEFT + ml.col * STEP} y={TOP - 6} font-size="9" fill="#78716c">{ml.label}</text>
		{/each}

		{#each DOW as dl, i}
			{#if dl}
				<text
					x={LEFT - 3}
					y={TOP + i * STEP + CELL - 1}
					text-anchor="end"
					font-size="9"
					fill="#78716c">{dl}</text
				>
			{/if}
		{/each}

		{#each grid as cell}
			<rect
				x={LEFT + cell.col * STEP}
				y={TOP + cell.row * STEP}
				width={CELL}
				height={CELL}
				rx="2"
				fill={heatColor(cell.day.wordCount)}
				style="cursor: default"
				onmouseenter={(e) => onEnter(e, cell.day)}
				onmousemove={onMove}
				onmouseleave={onLeave}
			/>
		{/each}
	</svg>
</div>

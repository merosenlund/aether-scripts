<script lang="ts">
	let {
		data = [],
		color = 'emerald' as 'emerald' | 'cyan' | 'indigo' | 'rose',
		height = 120,
		label = '',
		formatValue = (v: number) => String(Math.round(v))
	} = $props<{
		data: { date: string; value: number }[];
		color?: 'emerald' | 'cyan' | 'indigo' | 'rose';
		height?: number;
		label?: string;
		formatValue?: (v: number) => string;
	}>();

	const W = 600;
	const PAD = { t: 10, r: 8, b: 24, l: 38 };
	const COLORS = {
		emerald: { stroke: '#34d399', area: '#34d39918', dot: '#34d399' },
		cyan: { stroke: '#22d3ee', area: '#22d3ee18', dot: '#22d3ee' },
		indigo: { stroke: '#818cf8', area: '#818cf818', dot: '#818cf8' },
		rose: { stroke: '#fb7185', area: '#fb718518', dot: '#fb7185' }
	} as const;

	let c = $derived(COLORS[color]);

	let pts = $derived.by(() => {
		const valid = data.filter((d) => d.value > 0);
		if (valid.length < 2) return [] as { x: number; y: number; d: (typeof valid)[0] }[];
		const minV = Math.min(...valid.map((d) => d.value));
		const maxV = Math.max(...valid.map((d) => d.value));
		const rng = Math.max(1, maxV - minV);
		const iW = W - PAD.l - PAD.r;
		const iH = height - PAD.t - PAD.b;
		return valid.map((d, i) => ({
			x: PAD.l + (i / (valid.length - 1)) * iW,
			y: PAD.t + (1 - (d.value - minV) / rng) * iH,
			d
		}));
	});

	let minV = $derived(pts.length ? Math.min(...pts.map((p) => p.d.value)) : 0);
	let maxV = $derived(pts.length ? Math.max(...pts.map((p) => p.d.value)) : 0);

	let linePath = $derived(
		pts.length >= 2
			? 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
			: ''
	);

	let areaPath = $derived(
		linePath
			? linePath +
					` L ${pts.at(-1)!.x.toFixed(1)},${(height - PAD.b).toFixed(1)} L ${PAD.l.toFixed(1)},${(height - PAD.b).toFixed(1)} Z`
			: ''
	);

	let yTicks = $derived(
		pts.length >= 2
			? [minV, (minV + maxV) / 2, maxV].map((v) => ({
					v,
					y: PAD.t + (1 - (v - minV) / Math.max(1, maxV - minV)) * (height - PAD.t - PAD.b)
				}))
			: []
	);

	function fmtDate(iso: string) {
		return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

{#if pts.length < 2}
	<div
		class="flex items-center justify-center font-mono text-[10px] text-stone-600"
		style="height: {height}px"
	>
		Not enough data yet
	</div>
{:else}
	<svg
		viewBox="0 0 {W} {height}"
		class="w-full overflow-visible"
		style="height: {height}px"
		role="img"
		aria-label={label}
	>
		{#each yTicks as t}
			<line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y} stroke="#292524" stroke-width="1" />
			<text
				x={PAD.l - 4}
				y={t.y + 3.5}
				text-anchor="end"
				font-size="9"
				fill="#78716c"
				font-family="monospace">{formatValue(t.v)}</text
			>
		{/each}

		<path d={areaPath} fill={c.area} />
		<path
			d={linePath}
			fill="none"
			stroke={c.stroke}
			stroke-width="1.5"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		{#if pts.length <= 16}
			{#each pts as p}
				<circle cx={p.x} cy={p.y} r="2.5" fill={c.dot} />
			{/each}
		{/if}

		<text x={PAD.l} y={height - 5} text-anchor="start" font-size="9" fill="#78716c"
			>{fmtDate(pts[0].d.date)}</text
		>
		<text x={W - PAD.r} y={height - 5} text-anchor="end" font-size="9" fill="#78716c"
			>{fmtDate(pts.at(-1)!.d.date)}</text
		>
	</svg>
{/if}

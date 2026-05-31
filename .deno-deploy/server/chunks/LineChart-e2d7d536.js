import { f as attr_style, b as attr, s as stringify, e as ensure_array_like, c as escape_html, l as derived } from './dev-db1ab9cf.js';

//#region src/lib/components/analytics/LineChart.svelte
function LineChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [], color = "emerald", height = 120, label = "", formatValue = (v) => String(Math.round(v)) } = $$props;
		const W = 600;
		const PAD = {
			t: 10,
			r: 8,
			b: 24,
			l: 38
		};
		const COLORS = {
			emerald: {
				stroke: "#34d399",
				area: "#34d39918",
				dot: "#34d399"
			},
			cyan: {
				stroke: "#22d3ee",
				area: "#22d3ee18",
				dot: "#22d3ee"
			},
			indigo: {
				stroke: "#818cf8",
				area: "#818cf818",
				dot: "#818cf8"
			},
			rose: {
				stroke: "#fb7185",
				area: "#fb718518",
				dot: "#fb7185"
			}
		};
		let c = derived(() => COLORS[color]);
		let pts = derived(() => {
			const valid = data.filter((d) => d.value > 0);
			if (valid.length < 2) return [];
			const minV = Math.min(...valid.map((d) => d.value));
			const maxV = Math.max(...valid.map((d) => d.value));
			const rng = Math.max(1, maxV - minV);
			const iW = W - PAD.l - PAD.r;
			const iH = height - PAD.t - PAD.b;
			return valid.map((d, i) => ({
				x: PAD.l + i / (valid.length - 1) * iW,
				y: PAD.t + (1 - (d.value - minV) / rng) * iH,
				d
			}));
		});
		let minV = derived(() => pts().length ? Math.min(...pts().map((p) => p.d.value)) : 0);
		let maxV = derived(() => pts().length ? Math.max(...pts().map((p) => p.d.value)) : 0);
		let linePath = derived(() => pts().length >= 2 ? "M " + pts().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ") : "");
		let areaPath = derived(() => linePath() ? linePath() + ` L ${pts().at(-1).x.toFixed(1)},${(height - PAD.b).toFixed(1)} L ${PAD.l.toFixed(1)},${(height - PAD.b).toFixed(1)} Z` : "");
		let yTicks = derived(() => pts().length >= 2 ? [
			minV(),
			(minV() + maxV()) / 2,
			maxV()
		].map((v) => ({
			v,
			y: PAD.t + (1 - (v - minV()) / Math.max(1, maxV() - minV())) * (height - PAD.t - PAD.b)
		})) : []);
		function fmtDate(iso) {
			return (/* @__PURE__ */ new Date(iso + "T12:00:00")).toLocaleDateString(void 0, {
				month: "short",
				day: "numeric"
			});
		}
		if (pts().length < 2) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center justify-center font-mono text-[10px] text-stone-600"${attr_style(`height: ${stringify(height)}px`)}>Not enough data yet</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<svg${attr("viewBox", `0 0 ${stringify(W)} ${stringify(height)}`)} class="w-full overflow-visible"${attr_style(`height: ${stringify(height)}px`)} role="img"${attr("aria-label", label)}><!--[-->`);
			const each_array = ensure_array_like(yTicks());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let t = each_array[$$index];
				$$renderer.push(`<line${attr("x1", PAD.l)}${attr("y1", t.y)}${attr("x2", W - PAD.r)}${attr("y2", t.y)} stroke="#292524" stroke-width="1"></line><text${attr("x", PAD.l - 4)}${attr("y", t.y + 3.5)} text-anchor="end" font-size="9" fill="#78716c" font-family="monospace">${escape_html(formatValue(t.v))}</text>`);
			}
			$$renderer.push(`<!--]--><path${attr("d", areaPath())}${attr("fill", c().area)}></path><path${attr("d", linePath())} fill="none"${attr("stroke", c().stroke)} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"></path>`);
			if (pts().length <= 16) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(pts());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let p = each_array_1[$$index_1];
					$$renderer.push(`<circle${attr("cx", p.x)}${attr("cy", p.y)} r="2.5"${attr("fill", c().dot)}></circle>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--><text${attr("x", PAD.l)}${attr("y", height - 5)} text-anchor="start" font-size="9" fill="#78716c">${escape_html(fmtDate(pts()[0].d.date))}</text><text${attr("x", W - PAD.r)}${attr("y", height - 5)} text-anchor="end" font-size="9" fill="#78716c">${escape_html(fmtDate(pts().at(-1).d.date))}</text></svg>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}

export { LineChart as L };
//# sourceMappingURL=LineChart-e2d7d536.js.map

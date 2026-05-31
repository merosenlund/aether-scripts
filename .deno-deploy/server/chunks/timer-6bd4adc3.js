import { i as spread_props } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/timer.svelte
function Timer($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "timer" },
		props,
		{ iconNode: [
			["line", {
				"x1": "10",
				"x2": "14",
				"y1": "2",
				"y2": "2"
			}],
			["line", {
				"x1": "12",
				"x2": "15",
				"y1": "14",
				"y2": "11"
			}],
			["circle", {
				"cx": "12",
				"cy": "14",
				"r": "8"
			}]
		] }
	]));
}

export { Timer as T };
//# sourceMappingURL=timer-6bd4adc3.js.map

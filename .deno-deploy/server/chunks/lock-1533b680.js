import { i as spread_props } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/globe.svelte
function Globe($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "globe" },
		props,
		{ iconNode: [
			["circle", {
				"cx": "12",
				"cy": "12",
				"r": "10"
			}],
			["path", { "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
			["path", { "d": "M2 12h20" }]
		] }
	]));
}
//#endregion
//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/lock.svelte
function Lock($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "lock" },
		props,
		{ iconNode: [["rect", {
			"width": "18",
			"height": "11",
			"x": "3",
			"y": "11",
			"rx": "2",
			"ry": "2"
		}], ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]] }
	]));
}

export { Globe as G, Lock as L };
//# sourceMappingURL=lock-1533b680.js.map

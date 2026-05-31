import { i as spread_props } from './dev-db1ab9cf.js';
import { I as Icon } from './Icon-f47d171f.js';

//#region node_modules/.deno/@lucide+svelte@1.16.0/node_modules/@lucide/svelte/dist/icons/dices.svelte
function Dices($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([
		{ name: "dices" },
		props,
		{ iconNode: [
			["rect", {
				"width": "12",
				"height": "12",
				"x": "2",
				"y": "10",
				"rx": "2",
				"ry": "2"
			}],
			["path", { "d": "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" }],
			["path", { "d": "M6 18h.01" }],
			["path", { "d": "M10 14h.01" }],
			["path", { "d": "M15 6h.01" }],
			["path", { "d": "M18 9h.01" }]
		] }
	]));
}

export { Dices as D };
//# sourceMappingURL=dices-8db7386d.js.map

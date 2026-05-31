import { o as onDestroy } from './index-server-db57e4a7.js';
import { a6 as html } from './dev-db1ab9cf.js';

//#region src/lib/components/Reader.svelte
function Reader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { content, onVisibleBlocksChange } = $$props;
		onDestroy(() => {});
		$$renderer.push(`<div class="prose prose-stone dark:prose-invert reader-view max-w-none text-lg leading-relaxed text-stone-300">${html(content)}</div>`);
	});
}

export { Reader as R };
//# sourceMappingURL=Reader-d480f7c6.js.map

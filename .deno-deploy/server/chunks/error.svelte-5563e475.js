import { c as escape_html } from './dev-db1ab9cf.js';
import { p as page } from './state-0ced0af7.js';
import './client-ffaaeca1.js';
import './internal-8a8e9ef7.js';
import './index-21b402be.js';

//#region node_modules/.deno/@sveltejs+kit@2.59.1/node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte
function Error($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
	});
}

export { Error as default };
//# sourceMappingURL=error.svelte-5563e475.js.map

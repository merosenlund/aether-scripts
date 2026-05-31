import { c as escape_html, l as derived } from './dev-db1ab9cf.js';
import { B as Book_open } from './book-open-8545439b.js';
import './Icon-f47d171f.js';

//#region src/routes/(author)/serials/[id]/wiki/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		const totalEntities = derived(() => data.entities?.length || 0);
		const totalEvents = derived(() => data.events?.length || 0);
		$$renderer.push(`<div data-component="wiki-welcome" class="flex flex-1 flex-col items-center justify-center gap-6 p-12"><div data-component="welcome-icon" class="bg-primary/10 text-primary rounded-3xl border border-white/5 p-6">`);
		Book_open($$renderer, { size: 32 });
		$$renderer.push(`<!----></div> <div data-component="welcome-text" class="space-y-2 text-center"><h2 data-component="welcome-title" class="text-xl font-bold tracking-tight text-white">World Lore Ledger</h2> <p data-component="welcome-desc" class="max-w-md text-sm leading-relaxed text-stone-500">Select an entity from the sidebar to view its details and timeline, or create a new one to
			begin building your world.</p></div> <div data-component="overview-grid" class="mt-4 flex gap-6"><div data-component="stat-card-entities" class="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-5"><span data-component="stat-value" class="text-primary text-3xl font-black tabular-nums tracking-tight">${escape_html(totalEntities())}</span> <span data-component="stat-label" class="mt-1 text-[10px] font-bold tracking-widest text-stone-600 uppercase">Entities</span></div> <div data-component="stat-card-events" class="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-5"><span data-component="stat-value" class="text-primary text-3xl font-black tabular-nums tracking-tight">${escape_html(totalEvents())}</span> <span data-component="stat-label" class="mt-1 text-[10px] font-bold tracking-widest text-stone-600 uppercase">Events Logged</span></div></div></div>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-4cd198b5.js.map

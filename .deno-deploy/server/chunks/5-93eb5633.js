import { r as redirect } from './index-2b74a932.js';
import './index-21b402be.js';

//#region src/routes/account/+page.server.ts
var actions = { logout: async ({ locals: { supabase } }) => {
	await supabase.auth.signOut();
	throw redirect(303, "/login");
} };

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions
});

const index = 5;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-38a5cd37.js')).default;
const server_id = "src/routes/account/+page.server.ts";
const imports = ["_app/immutable/nodes/5.B57wvuh2.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/CGc_j63V.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=5-93eb5633.js.map

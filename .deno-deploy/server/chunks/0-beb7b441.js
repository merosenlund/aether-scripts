import { i as isBrowser, P as PUBLIC_SUPABASE_ANON_KEY, a as PUBLIC_SUPABASE_URL } from './warnDeprecatedPackage-103e47c7.js';
import { c as createBrowserClient } from './createBrowserClient-0790f5fc.js';
import { c as createServerClient } from './createServerClient-03f5eddc.js';

//#region src/routes/+layout.ts
var load$1 = async ({ fetch, data, depends }) => {
	depends("supabase:auth");
	const supabase = isBrowser() ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { global: { fetch } }) : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
		cookies: { getAll() {
			return data.cookies;
		} }
	});
	const { data: { session } } = await supabase.auth.getSession();
	return {
		...data,
		supabase,
		session
	};
};

var _layout_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load$1
});

//#region src/routes/+layout.server.ts
var load = async ({ locals: { supabase, getSession }, cookies }) => {
	const session = await getSession();
	let userRole = null;
	if (session) {
		const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
		userRole = roleData?.role || null;
	}
	return {
		session,
		userRole,
		cookies: cookies.getAll()
	};
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-be0bb304.js')).default;
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.CqmfHv4r.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/chunks/DGrBo_4K.js","_app/immutable/chunks/DBB1msrd.js","_app/immutable/chunks/CCi4sbZS.js","_app/immutable/chunks/BuT8oGdW.js","_app/immutable/chunks/BTbCBNK5.js","_app/immutable/chunks/CCWPcr1F.js","_app/immutable/chunks/Dvas3itb.js","_app/immutable/chunks/DROKvFWg.js","_app/immutable/chunks/CwsWBMpG2.js","_app/immutable/chunks/B9o4YKQx2.js","_app/immutable/chunks/Meje3KEn.js","_app/immutable/chunks/CGc_j63V.js","_app/immutable/chunks/6FrWQ2fR.js","_app/immutable/chunks/8HtxlkHQ.js","_app/immutable/chunks/BTvH1qg5.js","_app/immutable/chunks/D16lTyjm.js","_app/immutable/chunks/DxPyOFsU.js","_app/immutable/chunks/DmqSfy6J.js"];
const stylesheets = ["_app/immutable/assets/0.hhBbFQ3b.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=0-beb7b441.js.map

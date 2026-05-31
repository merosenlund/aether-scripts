import { o as lifecycle_function_unavailable, p as ssr_context } from './dev-db1ab9cf.js';

var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
/** @param {() => void} fn */
function onDestroy(fn) {
	/** @type {Renderer} */ ssr_context.r.on_destroy(fn);
}
function mount() {
	lifecycle_function_unavailable("mount");
}
function unmount() {
	lifecycle_function_unavailable("unmount");
}

export { __commonJSMin as _, mount as m, onDestroy as o, unmount as u };
//# sourceMappingURL=index-server-db57e4a7.js.map

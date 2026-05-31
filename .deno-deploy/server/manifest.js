const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.C_vLHL98.js",app:"_app/immutable/entry/app.Z1ejK0wj.js",imports:["_app/immutable/entry/start.C_vLHL98.js","_app/immutable/chunks/Ds28ePDG.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/JpPbfvlw.js","_app/immutable/entry/app.Z1ejK0wj.js","_app/immutable/chunks/BR3fw8zY.js","_app/immutable/chunks/9OMuMABi.js","_app/immutable/chunks/CCi4sbZS.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-beb7b441.js')),
			__memo(() => import('./chunks/1-7c9d3be1.js')),
			__memo(() => import('./chunks/2-ed92d230.js')),
			__memo(() => import('./chunks/3-7120a16f.js')),
			__memo(() => import('./chunks/4-97a0d08b.js')),
			__memo(() => import('./chunks/5-93eb5633.js')),
			__memo(() => import('./chunks/6-b93a4c10.js')),
			__memo(() => import('./chunks/7-795680ae.js')),
			__memo(() => import('./chunks/8-4755fdca.js')),
			__memo(() => import('./chunks/9-f53828c5.js')),
			__memo(() => import('./chunks/10-3d66d06d.js')),
			__memo(() => import('./chunks/11-15d7d506.js')),
			__memo(() => import('./chunks/12-e22ed88c.js')),
			__memo(() => import('./chunks/13-2379baae.js')),
			__memo(() => import('./chunks/14-d8dedb9e.js')),
			__memo(() => import('./chunks/15-6e529871.js')),
			__memo(() => import('./chunks/16-d5aa9dac.js')),
			__memo(() => import('./chunks/17-40bd059a.js')),
			__memo(() => import('./chunks/18-e8732529.js')),
			__memo(() => import('./chunks/19-541899d4.js')),
			__memo(() => import('./chunks/20-1eed7877.js')),
			__memo(() => import('./chunks/21-2c7feba7.js')),
			__memo(() => import('./chunks/22-b29de4fa.js')),
			__memo(() => import('./chunks/23-536802b7.js')),
			__memo(() => import('./chunks/24-0c8d9880.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/account",
				pattern: /^\/account\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/(author)/analytics",
				pattern: /^\/analytics\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(author)/analytics/serials/[id]",
				pattern: /^\/analytics\/serials\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(author)/analytics/serials/[id]/scenes/[sceneId]",
				pattern: /^\/analytics\/serials\/([^/]+?)\/scenes\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"sceneId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(reader)/library",
				pattern: /^\/library\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(reader)/library/[id]",
				pattern: /^\/library\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(reader)/lists",
				pattern: /^\/lists\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/(reader)/lists/[id]",
				pattern: /^\/lists\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(reader)/lists/[id]/edit",
				pattern: /^\/lists\/([^/]+?)\/edit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]",
				pattern: /^\/serials\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/scenes/[sceneId]/edit",
				pattern: /^\/serials\/([^/]+?)\/scenes\/([^/]+?)\/edit\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"sceneId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,3,], errors: [1,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/scenes/[sceneId]/history",
				pattern: /^\/serials\/([^/]+?)\/scenes\/([^/]+?)\/history\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"sceneId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,3,], errors: [1,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/scenes/[sceneId]/play",
				pattern: /^\/serials\/([^/]+?)\/scenes\/([^/]+?)\/play\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"sceneId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,3,], errors: [1,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/scenes/[sceneId]/share",
				pattern: /^\/serials\/([^/]+?)\/scenes\/([^/]+?)\/share\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"sceneId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,3,], errors: [1,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/wiki",
				pattern: /^\/serials\/([^/]+?)\/wiki\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/wiki/[entityId]/events",
				pattern: /^\/serials\/([^/]+?)\/wiki\/([^/]+?)\/events\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"entityId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/(author)/serials/[id]/wiki/[entityId]/overview",
				pattern: /^\/serials\/([^/]+?)\/wiki\/([^/]+?)\/overview\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false},{"name":"entityId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(author)/write",
				pattern: /^\/write\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export { manifest };
//# sourceMappingURL=manifest.js.map

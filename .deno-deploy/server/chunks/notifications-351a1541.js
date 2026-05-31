import { w as writable } from './dev-db1ab9cf.js';

//#region src/lib/stores/notifications.ts
function createNotificationStore() {
	const { subscribe, update } = writable([]);
	function send(message, type = "info", duration = 3e3) {
		const id = crypto.randomUUID();
		update((n) => [...n, {
			id,
			message,
			type,
			duration
		}]);
		if (duration > 0) setTimeout(() => {
			remove(id);
		}, duration);
	}
	function remove(id) {
		update((n) => n.filter((i) => i.id !== id));
	}
	return {
		subscribe,
		success: (msg, dur) => send(msg, "success", dur),
		error: (msg, dur) => send(msg, "error", dur),
		info: (msg, dur) => send(msg, "info", dur),
		remove
	};
}
var notifications = createNotificationStore();

export { notifications as n };
//# sourceMappingURL=notifications-351a1541.js.map

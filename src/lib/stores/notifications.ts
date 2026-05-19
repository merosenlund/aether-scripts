import { writable } from 'svelte/store';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
	id: string;
	message: string;
	type: NotificationType;
	duration?: number;
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);

	function send(message: string, type: NotificationType = 'info', duration: number = 3000) {
		const id = crypto.randomUUID();
		update((n) => [...n, { id, message, type, duration }]);

		if (duration > 0) {
			setTimeout(() => {
				remove(id);
			}, duration);
		}
	}

	function remove(id: string) {
		update((n) => n.filter((i) => i.id !== id));
	}

	return {
		subscribe,
		success: (msg: string, dur?: number) => send(msg, 'success', dur),
		error: (msg: string, dur?: number) => send(msg, 'error', dur),
		info: (msg: string, dur?: number) => send(msg, 'info', dur),
		remove
	};
}

export const notifications = createNotificationStore();

import { supabase } from '$lib/supabaseClient';

export interface PresenceData {
	isOnline: boolean;
	isTyping: boolean;
	currentSerialId?: string;
	currentSerialTitle?: string;
	currentSceneId?: string;
}

class AuthorPresenceManager {
	private channel: any = null;
	private currentAuthorId: string = '';

	// Svelte 5 reactive state for readers
	private status = $state<PresenceData>({ isOnline: false, isTyping: false });

	get authorStatus() {
		return this.status;
	}

	/**
	 * For Readers: Subscribe to an author's presence channel to see if they are active/typing
	 */
	subscribeToAuthor(authorId: string) {
		if (this.channel && this.currentAuthorId === authorId) return;

		this.cleanup();
		this.currentAuthorId = authorId;
		this.status = { isOnline: false, isTyping: false };

		this.channel = supabase.channel(`author-presence:${authorId}`);

		this.channel
			.on('presence', { event: 'sync' }, () => {
				const presenceState = this.channel.presenceState();
				const keys = Object.keys(presenceState);

				if (keys.length > 0) {
					// There should only be one tracking entity (the author) in this channel
					const authorPresences = presenceState[keys[0]] as any[];
					if (authorPresences && authorPresences.length > 0) {
						const activePresence = authorPresences[0];
						this.status = {
							isOnline: true,
							isTyping: activePresence.isTyping || false,
							currentSerialId: activePresence.currentSerialId,
							currentSerialTitle: activePresence.currentSerialTitle,
							currentSceneId: activePresence.currentSceneId
						};
						return;
					}
				}

				this.status = { isOnline: false, isTyping: false };
			})
			.subscribe();
	}

	/**
	 * For Authors: Broadcast status (online, typing, current serial)
	 */
	async startBroadcasting(authorId: string, data: Omit<PresenceData, 'isOnline'>) {
		if (this.channel && this.currentAuthorId === authorId) {
			await this.updateBroadcast(data);
			return;
		}

		this.cleanup();
		this.currentAuthorId = authorId;

		this.channel = supabase.channel(`author-presence:${authorId}`);

		this.channel.subscribe(async (status: string) => {
			if (status === 'SUBSCRIBED') {
				await this.channel.track({
					isTyping: data.isTyping,
					currentSerialId: data.currentSerialId,
					currentSerialTitle: data.currentSerialTitle,
					currentSceneId: data.currentSceneId,
					online_at: new Date().toISOString()
				});
			}
		});
	}

	async updateBroadcast(data: Omit<PresenceData, 'isOnline'>) {
		if (this.channel) {
			await this.channel.track({
				isTyping: data.isTyping,
				currentSerialId: data.currentSerialId,
				currentSerialTitle: data.currentSerialTitle,
				currentSceneId: data.currentSceneId,
				online_at: new Date().toISOString()
			});
		}
	}

	cleanup() {
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		this.status = { isOnline: false, isTyping: false };
	}
}

export const authorPresence = new AuthorPresenceManager();

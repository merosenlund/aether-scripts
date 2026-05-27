import * as Y from 'yjs';
import { supabase } from '$lib/supabaseClient';

export class SupabaseYjsProvider {
	private doc: Y.Doc;
	private sceneId: string;
	private saving: boolean = false;
	// Updates that arrive while a save is in-flight are merged here and
	// flushed as a single insert once the current save completes.
	private pendingUpdate: Uint8Array | null = null;

	private onSaveStatus?: (status: 'saving' | 'synced' | 'error') => void;

	constructor(
		doc: Y.Doc,
		sceneId: string,
		onLoaded?: (hasData: boolean) => void,
		onSaveStatus?: (status: 'saving' | 'synced' | 'error') => void
	) {
		this.doc = doc;
		this.sceneId = sceneId;
		this.onSaveStatus = onSaveStatus;

		// Register the update listener only after initial state has loaded so
		// the load transaction itself never triggers a save.
		this.loadState().then((hasData) => {
			if (onLoaded) onLoaded(hasData);

			this.doc.on('update', (update: Uint8Array, origin: unknown) => {
				if (origin !== 'load') {
					this.saveUpdate(update);
				}
			});
		});
	}

	private async loadState(): Promise<boolean> {
		const allData: { update_data: unknown }[] = [];
		let page = 0;
		const pageSize = 1000;
		let hasMore = true;

		while (hasMore) {
			const { data, error } = await supabase
				.from('scene_updates')
				.select('update_data')
				.eq('scene_id', this.sceneId)
				.order('created_at', { ascending: true })
				.range(page * pageSize, (page + 1) * pageSize - 1);

			if (error) {
				console.error('Error loading Yjs state batch:', error);
				return false;
			}

			if (data && data.length > 0) {
				allData.push(...data);
				hasMore = data.length === pageSize;
				page++;
			} else {
				hasMore = false;
			}
		}

		if (allData.length > 0) {
			Y.transact(
				this.doc,
				() => {
					allData.forEach((row) => {
						try {
							let update: Uint8Array;
							if (typeof row.update_data === 'string') {
								if (row.update_data.startsWith('\\x')) {
									// Hex format from Postgres
									const hex = row.update_data.slice(2);
									const bytes = [];
									for (let i = 0; i < hex.length; i += 2) {
										bytes.push(parseInt(hex.slice(i, i + 2), 16));
									}
									update = new Uint8Array(bytes);
								} else {
									// Assume base64
									const binaryString = atob(row.update_data);
									update = new Uint8Array(binaryString.length);
									for (let i = 0; i < binaryString.length; i++) {
										update[i] = binaryString.charCodeAt(i);
									}
								}
							} else {
								update = new Uint8Array(row.update_data as ArrayLike<number>);
							}

							if (update.length > 0) {
								Y.applyUpdate(this.doc, update);
							}
						} catch (e) {
							console.error('Failed to apply Yjs update:', e, row.update_data);
						}
					});
				},
				'load'
			);
			return true;
		}

		return false;
	}

	private async saveUpdate(update: Uint8Array) {
		if (this.saving) {
			// Merge into the pending slot so no delta is lost. When the
			// current save finishes it will flush the merged update.
			this.pendingUpdate = this.pendingUpdate
				? Y.mergeUpdates([this.pendingUpdate, update])
				: update;
			return;
		}

		this.saving = true;
		if (this.onSaveStatus) this.onSaveStatus('saving');

		const hexString = Array.from(update)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		try {
			const { error } = await supabase.from('scene_updates').insert({
				scene_id: this.sceneId,
				update_data: `\\x${hexString}`
			});

			if (error) {
				console.error('Error saving Yjs update:', error);
				if (this.onSaveStatus) this.onSaveStatus('error');
			} else {
				if (this.onSaveStatus) this.onSaveStatus('synced');
			}
		} finally {
			this.saving = false;
			if (this.pendingUpdate) {
				const pending = this.pendingUpdate;
				this.pendingUpdate = null;
				this.saveUpdate(pending);
			}
		}
	}
}

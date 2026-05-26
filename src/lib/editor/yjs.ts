import * as Y from 'yjs';
import { supabase } from '$lib/supabaseClient';

export class SupabaseYjsProvider {
	private doc: Y.Doc;
	private sceneId: string;
	private saving: boolean = false;

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

		// Load initial state
		this.loadState().then((hasData) => {
			if (onLoaded) onLoaded(hasData);

			console.log('[SupabaseYjsProvider] loadState completed. Registering update listener...');
			// Listen for updates and save them only after initial load completes
			this.doc.on('update', (update, origin) => {
				console.log('[SupabaseYjsProvider] document update event fired! Origin:', origin, 'Length:', update.length);
				if (origin !== 'load') {
					console.log('[SupabaseYjsProvider] Origin is not load. Saving update to Supabase...');
					this.saveUpdate(update);
				} else {
					console.log('[SupabaseYjsProvider] Origin is load. Ignoring update.');
				}
			});
		});
	}

	private async loadState(): Promise<boolean> {
		let allData: any[] = [];
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
				allData = [...allData, ...data];
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
								// Should be Uint8Array or Array of numbers
								update = new Uint8Array(row.update_data);
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
		if (this.saving) return;

		if (this.onSaveStatus) this.onSaveStatus('saving');

		// Convert Uint8Array to hex string for reliable storage in BYTEA
		const hexString = Array.from(update)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

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
	}
}

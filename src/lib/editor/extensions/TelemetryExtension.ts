import { Extension } from '@tiptap/core';
import { telemetryStore } from '../../stores/telemetry.svelte';

export const TelemetryExtension = Extension.create({
	name: 'telemetry',

	onTransaction({ transaction }) {
		if (transaction.docChanged) {
			const text = this.editor.state.doc.textContent;
			const words = text.trim() ? text.trim().split(/\s+/).length : 0;
			const chars = text.length;

			if (!telemetryStore.isActive) {
				telemetryStore.setInitialCounts(words, chars, text);
			} else {
				telemetryStore.recordActivity(words, chars, text);
			}
		}
	}
});

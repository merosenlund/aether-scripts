import { browser } from '$app/environment';

class EditorSettings {
	typewriterMode = $state(true);
	spellcheck = $state(false);

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('aether:editorSettings');
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					this.typewriterMode = parsed.typewriterMode ?? true;
					this.spellcheck = parsed.spellcheck ?? false;
				} catch (e) {
					console.error('Failed to parse settings', e);
				}
			}
		}
	}

	save() {
		if (browser) {
			localStorage.setItem(
				'aether:editorSettings',
				JSON.stringify({
					typewriterMode: this.typewriterMode,
					spellcheck: this.spellcheck
				})
			);
		}
	}

	setTypewriterMode(val: boolean) {
		this.typewriterMode = val;
		this.save();
	}

	setSpellcheck(val: boolean) {
		this.spellcheck = val;
		this.save();
	}
}

export const editorSettings = new EditorSettings();

export const promptState = $state({
	isOpen: false,
	isConfirm: false,
	title: '',
	description: '',
	defaultValue: '',
	resolve: null as ((value: string | null) => void) | null
});

export function openPrompt(
	title: string,
	description: string = '',
	defaultValue: string = ''
): Promise<string | null> {
	return new Promise((resolve) => {
		promptState.title = title;
		promptState.description = description;
		promptState.defaultValue = defaultValue;
		promptState.isConfirm = false;
		promptState.resolve = resolve;
		promptState.isOpen = true;
	});
}

/**
 * Open a simple confirm dialog with Cancel/Confirm buttons (no text input).
 * Returns true if confirmed, false if cancelled.
 */
export function openConfirm(
	title: string,
	description: string = ''
): Promise<boolean> {
	return new Promise((resolve) => {
		promptState.title = title;
		promptState.description = description;
		promptState.defaultValue = '';
		promptState.isConfirm = true;
		promptState.resolve = (value) => resolve(value !== null);
		promptState.isOpen = true;
	});
}

export function closePrompt(value: string | null) {
	if (promptState.resolve) {
		promptState.resolve(value);
	}
	promptState.isOpen = false;
	promptState.resolve = null;
}

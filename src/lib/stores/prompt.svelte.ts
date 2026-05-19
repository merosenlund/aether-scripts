export const promptState = $state({
	isOpen: false,
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
		promptState.resolve = resolve;
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

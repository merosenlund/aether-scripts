import { mount, unmount } from 'svelte';
import tippy from 'tippy.js';
import CommandsList from '../components/CommandsList.svelte';
import { getSuggestionItems } from './Commands';

export default {
	items: getSuggestionItems,

	render: () => {
		let component: any;
		let popup: any;
		let editorRef: any = null;
		let currentRange: any = null;

		// Create a reactive state object for the props
		let state = $state({
			items: [] as any[],
			command: (item: any) => {}
		});

		return {
			onStart: (props: any) => {
				editorRef = props.editor;
				currentRange = props.range;
				state.items = props.items;
				state.command = props.command;

				const container = document.createElement('div');

				component = mount(CommandsList, {
					target: container,
					props: state
				});

				if (!props.clientRect) {
					return;
				}

				popup = tippy('body', {
					getReferenceClientRect: props.clientRect,
					appendTo: () => document.body,
					content: container,
					showOnCreate: true,
					interactive: true,
					trigger: 'manual',
					placement: 'bottom-start'
				});
			},

			onUpdate(props: any) {
				editorRef = props.editor;
				currentRange = props.range;
				state.items = props.items;
				state.command = props.command;

				if (!props.clientRect) {
					return;
				}

				popup[0].setProps({
					getReferenceClientRect: props.clientRect
				});
			},

			onKeyDown(props: any) {
				if (props.event.key === 'Escape') {
					popup[0].hide();
					return true;
				}

				// Tab: autocomplete the active select param in hint mode
				// (replaces partial text like 'ya' with 'Yap Time'), then
				// advance to the next parameter. In browsing mode, Tab
				// autocompletes the command name.
				if (props.event.key === 'Tab' && editorRef) {
					const inHintMode =
						state.items.length === 1 &&
						state.items[0].hintState != null;

					if (inHintMode && currentRange) {
						props.event.preventDefault();
						const hs = state.items[0].hintState;
						const activeParam = hs.command.params[hs.activeParamIndex];
						const partialText = hs.paramSegments[hs.activeParamIndex]?.trim() || '';

						// If active param is select and we have a fuzzy match,
						// replace the partial with the full label
						if (activeParam?.type === 'select' && partialText && hs.selectOptions.length > 0) {
							// Pick the first (best) matching option
							const bestMatch = hs.selectOptions[0];
							if (bestMatch && bestMatch.label.toLowerCase() !== partialText.toLowerCase()) {
								// Reconstruct the full query text with the completed label
								const segments = [...hs.paramSegments];
								segments[hs.activeParamIndex] = bestMatch.label;
								const newQuery = hs.command.name + ' ' + segments.join('\t');
								const tr = editorRef.state.tr.insertText(
									newQuery + '\t',
									currentRange.from + 1,
									currentRange.to
								);
								editorRef.view.dispatch(tr);
								return true;
							}
						}

						// Default: just insert tab to advance to next param
						const { state: edState, dispatch } = editorRef.view;
						dispatch(edState.tr.insertText('\t'));
						return true;
					}

					// Browsing mode: autocomplete selected suggestion
					const inBrowsingMode =
						state.items.length > 0 &&
						!state.items[0]?.hintState;

					if (inBrowsingMode && currentRange) {
						const selected = component.getSelectedItem?.();

						if (selected?.commandDef) {
							props.event.preventDefault();
							const cmdName = selected.commandDef.name;
							const tr = editorRef.state.tr.insertText(
								cmdName + ' ',
								currentRange.from + 1,
								currentRange.to
							);
							editorRef.view.dispatch(tr);
							return true;
						}
					}
				}

				// Enter: autocomplete for browsing items with params.
				// Instead of executing, replace the query text with the
				// full command name + space. The suggestion plugin stays
				// open and transitions to hint mode.
				if (props.event.key === 'Enter' && editorRef && currentRange) {
					const inBrowsingMode =
						state.items.length > 0 &&
						!state.items[0]?.hintState;

					if (inBrowsingMode) {
						const selected = component.getSelectedItem?.();

						if (selected?.commandDef && selected.commandDef.params.length > 0) {
							props.event.preventDefault();
							const cmdName = selected.commandDef.name;
							// Replace text after the `/` trigger with the command name + space.
							// range.from is the position of `/`, so from+1 is after it.
							// This keeps the suggestion plugin active (we never call command()).
							const tr = editorRef.state.tr.insertText(
								cmdName + ' ',
								currentRange.from + 1,
								currentRange.to
							);
							editorRef.view.dispatch(tr);
							return true;
						}
					}
				}

				// Delegate all other keys to the component
				return component.onKeyDown?.(props);
			},

			onExit() {
				if (popup) popup[0].destroy();
				if (component) unmount(component);
			}
		};
	}
};

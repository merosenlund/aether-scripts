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

				// Tab: insert a tab character into the editor to advance
				// to the next parameter. Only when we're in hint mode
				// (a command has been matched and has params).
				if (props.event.key === 'Tab' && editorRef) {
					const inHintMode =
						state.items.length === 1 &&
						state.items[0].hintState != null;

					if (inHintMode) {
						props.event.preventDefault();
						const { state: edState, dispatch } = editorRef.view;
						dispatch(edState.tr.insertText('\t'));
						return true;
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

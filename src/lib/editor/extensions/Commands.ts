import { Extension, type Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import {
	resolveCommandSuggestions,
	type CustomEditor,
	type SuggestionItem
} from './CommandRegistry';

export type { CustomEditor } from './CommandRegistry';

export interface CommandArgs {
	editor: CustomEditor;
	range: Range;
}

export const Commands = Extension.create({
	name: 'slashCommands',

	addOptions() {
		return {
			suggestion: {
				char: '/',
				allowSpaces: true,
				command: ({
					editor,
					range,
					props
				}: {
					editor: CustomEditor;
					range: Range;
					props: { command: (args: CommandArgs) => void };
				}) => {
					props.command({ editor, range });
				}
			}
		};
	},

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion
			})
		];
	}
});

export const getSuggestionItems = ({
	query,
	editor
}: {
	query: string;
	editor: CustomEditor;
}): SuggestionItem[] => {
	return resolveCommandSuggestions(query, editor);
};

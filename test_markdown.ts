import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { OracleBlock } from './src/lib/editor/extensions/OracleBlock.ts';

const editor = new Editor({
    extensions: [
        StarterKit,
        OracleBlock,
        Markdown
    ],
    content: {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello world' }]
            },
            {
                type: 'oracleBlock',
                attrs: { type: 'fate', question: 'Will it rain?', result: 'Yes' }
            }
        ]
    }
});

console.log('MARKDOWN:', editor.storage.markdown.getMarkdown());
console.log('TEXT:', editor.getText());
editor.destroy();

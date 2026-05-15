import { Node, mergeAttributes } from '@tiptap/core';

export const GMNote = Node.create({
  name: 'gmNote',
  group: 'block',
  content: 'inline*',
  
  parseHTML() {
    return [{ tag: 'div[data-type="gm-note"]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'gm-note', 
        class: 'bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 my-4 rounded shadow-sm text-sm font-mono text-yellow-900 dark:text-yellow-100' 
      }), 
      0
    ];
  },
});

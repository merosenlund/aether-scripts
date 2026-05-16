import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import ClockComponent from '../../components/mechanics/Clock.svelte';

export const ClockBlock = Node.create({
  name: 'clockBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      entityId: { default: null },
      name: { default: '' },
      segments: { default: 4 },
      filled: { default: 0 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="clockBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'clockBlock' })];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.classList.add('inline-flex', 'justify-center', 'my-4', 'p-4', 'bg-stone-900/50', 'rounded-2xl', 'border', 'border-white/10', 'shadow-inner');

      const component = mount(ClockComponent, {
        target: dom,
        props: {
          segments: node.attrs.segments,
          filled: node.attrs.filled,
          name: node.attrs.name,
        },
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          // Return false to let Tiptap recreate the node view on update
          // which naturally handles prop changes without needing reactive stores
          return false;
        },
        destroy: () => {
          unmount(component);
        },
      };
    };
  },
});

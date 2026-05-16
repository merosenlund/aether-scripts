import { Node, mergeAttributes } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import ProgressTrackComponent from '../../components/mechanics/ProgressTrack.svelte';

export const TrackBlock = Node.create({
  name: 'trackBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      entityId: { default: null },
      name: { default: '' },
      max: { default: 10 },
      current: { default: 0 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="trackBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'trackBlock' })];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.classList.add('flex', 'w-full', 'my-4', 'p-4', 'bg-stone-900/50', 'rounded-xl', 'border', 'border-white/10', 'shadow-inner');

      const component = mount(ProgressTrackComponent, {
        target: dom,
        props: {
          max: node.attrs.max,
          current: node.attrs.current,
          name: node.attrs.name,
        },
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          return false;
        },
        destroy: () => {
          unmount(component);
        },
      };
    };
  },
});

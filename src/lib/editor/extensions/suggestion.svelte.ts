import { mount, unmount } from 'svelte';
import tippy from 'tippy.js';
import CommandsList from '../components/CommandsList.svelte';
import { getSuggestionItems } from './Commands';

export default {
  items: getSuggestionItems,

  render: () => {
    let component: any;
    let popup: any;
    // Create a reactive state object for the props
    let state = $state({
      items: [] as any[],
      command: (item: any) => {},
    });

    return {
      onStart: (props: any) => {
        state.items = props.items;
        state.command = props.command;

        const container = document.createElement('div');
        
        component = mount(CommandsList, {
          target: container,
          props: state, // Pass the reactive state object
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
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        state.items = props.items;
        state.command = props.command;

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        // Call the method on the component instance
        return component.onKeyDown?.(props);
      },

      onExit() {
        if (popup) popup[0].destroy();
        if (component) unmount(component);
      },
    };
  },
};

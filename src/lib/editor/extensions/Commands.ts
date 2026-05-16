import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { openPrompt } from '$lib/stores/prompt.svelte';

export const Commands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const getSuggestionItems = ({ query }: { query: string }) => {
  const items = [
    {
      title: 'Roll Dice',
      description: 'Roll a custom dice formula (e.g. /roll 1d100)',
      icon: 'dice',
      command: ({ editor, range }: any) => {
        // If query is like "d20" or "2d6", use that
        const formula = query.match(/^\d*d\d+$/i) ? query : '1d100';
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ 
            type: 'diceRoller', 
            attrs: { 
              formula, 
              result: Math.floor(Math.random() * 100) + 1 // Simplified for now
            } 
          })
          .run();
      },
    },
    {
      title: 'Mythic Odds',
      description: 'Roll against odds (e.g. /odds 50)',
      icon: 'dice',
      command: ({ editor, range }: any) => {
        const target = parseInt(query) || 50;
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'oddsCheck',
            attrs: {
              target,
              roll: Math.floor(Math.random() * 100) + 1
            }
          })
          .run();
      },
    },
    {
      title: 'GM Note',
      description: 'Create a private GM note block',
      icon: 'pen',
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode('gmNote', 'paragraph')
          .run();
      },
    },
    {
      title: 'Scene Setup',
      description: 'Define scene expectations and goals',
      icon: 'pen',
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent('<h2>Scene Setup</h2><p>Expectations: </p>')
          .run();
      },
    },
    {
      title: 'Clock (4 Segment)',
      description: 'Insert a 4-segment progress clock',
      icon: 'clock',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'clockBlock', attrs: { segments: 4, filled: 0, name: 'New Clock' } }).run();
      },
    },
    {
      title: 'Track',
      description: 'Insert a 10-step progress track',
      icon: 'activity',
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'trackBlock', attrs: { max: 10, current: 0, name: 'New Track' } }).run();
      },
    },
    {
      title: 'Oracle: Fate Check',
      description: 'Ask a Yes/No question',
      icon: 'help-circle',
      command: async ({ editor, range }: any) => {
        const question = await openPrompt('Oracle: Fate Check', 'What is your Fate question?') || '';
        const rand = Math.random() * 100;
        let result = 'Yes';
        if (rand < 10) result = 'Exceptional Yes';
        else if (rand > 90) result = 'Exceptional No';
        else if (rand > 50) result = 'No';
        
        editor.chain().focus().deleteRange(range).insertContent({ type: 'oracleBlock', attrs: { type: 'fate', question, result } }).run();
      },
    },
    {
      title: 'Oracle: Theme',
      description: 'Roll for a random theme/action',
      icon: 'sparkles',
      command: ({ editor, range }: any) => {
        const actions = ['Seek', 'Oppose', 'Communicate', 'Move', 'Transform', 'Deceive', 'Reveal', 'Discover', 'Fight', 'Aid'];
        const themes = ['Danger', 'Hope', 'Power', 'Wealth', 'Knowledge', 'Love', 'Death', 'Nature', 'Magic', 'Technology'];
        const result = `${actions[Math.floor(Math.random() * actions.length)]} ${themes[Math.floor(Math.random() * themes.length)]}`;
        
        editor.chain().focus().deleteRange(range).insertContent({ type: 'oracleBlock', attrs: { type: 'theme', question: '', result } }).run();
      },
    },
  ];

  // If query is a pure number, prioritize the odds check
  if (/^\d+$/.test(query)) {
    const target = parseInt(query);
    return [
      {
        title: `Roll vs ${target}%`,
        description: `Check odds with target ${target}`,
        icon: 'dice',
        command: ({ editor, range }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'oddsCheck',
              attrs: {
                target,
                roll: Math.floor(Math.random() * 100) + 1
              }
            })
            .run();
        },
      },
      ...items
    ];
  }

  return items.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );
};

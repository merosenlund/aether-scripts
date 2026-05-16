import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

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

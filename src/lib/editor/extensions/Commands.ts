import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { openPrompt } from '$lib/stores/prompt.svelte';
import { supabase } from '$lib/supabaseClient';

export const Commands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: true,
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

export const getSuggestionItems = ({ query, editor }: { query: string; editor: any }) => {
  const items = [
    {
      title: 'Roll Dice',
      description: 'Roll a custom dice formula (e.g. /roll 1d100)',
      icon: 'dice',
      command: ({ editor, range }: any) => {
        const formula = query.match(/^\d*d\d+$/i) ? query : '1d100';
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ 
            type: 'diceRoller', 
            attrs: { 
              formula, 
              result: Math.floor(Math.random() * 100) + 1 
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
      title: 'Journal Entry',
      description: 'Mark this block as a private journal entry',
      icon: 'book',
      command: ({ editor, range }: any) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .updateAttributes(editor.state.selection.$from.parent.type.name, { visibility: 'journal' })
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
      title: 'Clock (Custom)',
      description: 'Insert a progress clock with custom segments and name',
      icon: 'clock',
      command: async ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        
        const name = await openPrompt('Create Clock', 'Enter a name for the clock:') || '';
        if (!name) return;
        
        const segmentsStr = await openPrompt('Create Clock', 'Enter number of segments (4, 6, 8, etc.):') || '4';
        const segments = parseInt(segmentsStr) || 4;
        
        const serialId = editor.serialId;
        const sceneId = editor.sceneId;
        const entityId = crypto.randomUUID();
        
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'clockBlock',
            attrs: {
              entityId,
              name,
              segments,
              filled: 0,
              action: 'create'
            }
          })
          .run();

        if (serialId && sceneId) {
          await supabase.from('wiki_entities').insert({ id: entityId, serial_id: serialId, name, category: 'Clock' });
          await supabase.from('wiki_facts').insert({ entity_id: entityId, valid_from_scene_id: sceneId, content: JSON.stringify({ filled: 0, segments }) });
        }
      },
    },
    {
      title: 'Increment Clock',
      description: 'Increment an existing clock',
      icon: 'clock',
      command: async ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        
        const name = await openPrompt('Increment Clock', 'Enter clock name to increment:') || '';
        if (!name) return;
        
        const serialId = editor.serialId;
        const sceneId = editor.sceneId;
        let entityId = '';
        
        if (serialId) {
          const { data } = await supabase
            .from('wiki_entities')
            .select('id')
            .eq('serial_id', serialId)
            .ilike('name', name)
            .eq('category', 'Clock')
            .maybeSingle();
          if (data) entityId = data.id;
        }
        
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'clockBlock',
            attrs: {
              entityId,
              name,
              action: 'increment'
            }
          })
          .run();
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

  // 1. Check for dynamic /clock <segments> <name> or /clock inc <name>
  if (query.toLowerCase().startsWith('clock ')) {
    const argsStr = query.slice(6).trim();

    // Match /clock inc <name> or /clock + <name>
    const incMatch = argsStr.match(/^(?:inc|increment|\+)\s+(.+)$/i);
    if (incMatch) {
      const name = incMatch[1];
      return [{
        title: `Increment Clock: "${name}"`,
        description: `Tally up 1 segment on the "${name}" clock`,
        icon: 'clock',
        command: async ({ editor, range }: any) => {
          const serialId = editor.serialId;
          let entityId = '';
          
          if (serialId) {
            const { data } = await supabase
              .from('wiki_entities')
              .select('id')
              .eq('serial_id', serialId)
              .ilike('name', name)
              .eq('category', 'Clock')
              .maybeSingle();
            if (data) entityId = data.id;
          }

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'clockBlock',
              attrs: {
                entityId,
                name,
                action: 'increment'
              }
            })
            .run();
        }
      }];
    }

    // Match /clock dec <name> or /clock - <name>
    const decMatch = argsStr.match(/^(?:dec|decrement|-)\s+(.+)$/i);
    if (decMatch) {
      const name = decMatch[1];
      return [{
        title: `Decrement Clock: "${name}"`,
        description: `Remove 1 segment from the "${name}" clock`,
        icon: 'clock',
        command: async ({ editor, range }: any) => {
          const serialId = editor.serialId;
          let entityId = '';
          
          if (serialId) {
            const { data } = await supabase
              .from('wiki_entities')
              .select('id')
              .eq('serial_id', serialId)
              .ilike('name', name)
              .eq('category', 'Clock')
              .maybeSingle();
            if (data) entityId = data.id;
          }

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'clockBlock',
              attrs: {
                entityId,
                name,
                action: 'decrement'
              }
            })
            .run();
        }
      }];
    }

    // Match /clock <segments> <name>
    const createMatch = argsStr.match(/^(\d+)?\s*(.*)$/);
    if (createMatch) {
      const segments = parseInt(createMatch[1]) || 4;
      const name = createMatch[2].trim() || 'New Clock';
      return [{
        title: `Create ${segments}-Segment Clock: "${name}"`,
        description: `Insert a new ${segments}-segment progress clock`,
        icon: 'clock',
        command: async ({ editor, range }: any) => {
          const serialId = editor.serialId;
          const sceneId = editor.sceneId;
          const entityId = crypto.randomUUID();

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'clockBlock',
              attrs: {
                entityId,
                name,
                segments,
                filled: 0,
                action: 'create'
              }
            })
            .run();

          if (serialId && sceneId) {
            await supabase.from('wiki_entities').insert({ id: entityId, serial_id: serialId, name, category: 'Clock' });
            await supabase.from('wiki_facts').insert({ entity_id: entityId, valid_from_scene_id: sceneId, content: JSON.stringify({ filled: 0, segments }) });
          }
        }
      }];
    }
  }

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

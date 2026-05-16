<script lang="ts">
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import { onDestroy, onMount } from 'svelte';
  
  import { GMNote } from './extensions/GMNote';
  import { DiceRoller } from './extensions/DiceRoller';
  import { StatBlock } from './extensions/StatBlock';
  import { OddsCheck } from './extensions/OddsCheck';
  import { Commands } from './extensions/Commands';
  import suggestion from './extensions/suggestion.svelte.ts';
  
  import Collaboration from '@tiptap/extension-collaboration';
  import * as Y from 'yjs';
  import { SupabaseYjsProvider } from './yjs';
  import { createSnapshot, type SceneStage } from '../api/versions';
  import { notifications } from '$lib/stores/notifications';
  import { Sparkles } from '@lucide/svelte';

  let { 
    content = '', 
    sceneId = '',
    stage = 'Draft' as SceneStage,
    onUpdate = (html: string) => {},
    placeholder = 'Write your story...' 
  } = $props<{
    content?: string;
    sceneId?: string;
    stage?: SceneStage;
    onUpdate?: (html: string) => void;
    placeholder?: string;
  }>();

  let element: HTMLElement;
  let editor = $state<Editor | undefined>(undefined);
  let ydoc: Y.Doc;
  let provider: SupabaseYjsProvider;
  let isSaving = $state(false);

  onMount(() => {
    ydoc = new Y.Doc();
    if (sceneId) {
      provider = new SupabaseYjsProvider(ydoc, sceneId);
    }

    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          // History is handled by Collaboration
          history: false,
        }),
        Placeholder.configure({ placeholder }),
        Collaboration.configure({
          document: ydoc,
        }),
        GMNote,
        DiceRoller,
        StatBlock,
        OddsCheck,
        Commands.configure({
          suggestion,
        }),
      ],
      // When using collaboration, content is loaded from the Y.Doc
      // but we can provide initial content if needed
      content: content || undefined,
      onUpdate: ({ editor: e }) => {
        onUpdate(e.getHTML());
      },
      onTransaction: () => {
        editor = editor;
      }
    });
  });

  async function handleSnapshot() {
    if (!editor || !sceneId) return;
    isSaving = true;
    try {
      await createSnapshot(sceneId, 'Edit', editor.getJSON());
      notifications.success('Snapshot created! You are now in Editing mode.');
    } catch (e) {
      console.error(e);
      notifications.error('Failed to create snapshot.');
    } finally {
      isSaving = false;
    }
  }

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="border border-white/10 rounded-2xl flex flex-col bg-stone-900/50 backdrop-blur-md overflow-hidden shadow-xl">
  {#if editor}
    <div class="border-b border-white/5 p-3 flex gap-2 flex-wrap bg-white/5">
      <button 
        class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button 
        class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button 
        class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <div class="w-px h-6 bg-white/10 mx-2 self-center"></div>
      <button 
        class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('gmNote') ? 'bg-rose-500/20 text-rose-400' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleNode('gmNote', 'paragraph').run()}
      >
        GM Note
      </button>
      <button 
        class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('statBlock') ? 'bg-indigo-500/20 text-indigo-400' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleNode('statBlock', 'paragraph').run()}
      >
        Stat Block
      </button>
      <button 
        class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors text-stone-400" 
        onclick={() => editor?.chain().focus().insertContent({ type: 'diceRoller', attrs: { formula: '1d20', result: Math.floor(Math.random() * 20) + 1 } }).run()}
      >
        Insert Roll
      </button>

      <div class="flex-1"></div>

      <button 
        class="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 {isSaving ? 'bg-stone-800 text-stone-500' : 'bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20'}"
        disabled={isSaving}
        onclick={handleSnapshot}
      >
        <Sparkles size={14} class={isSaving ? 'animate-pulse' : ''} />
        {isSaving ? 'Saving...' : 'Create Snapshot'}
      </button>
    </div>
  {/if}
  
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="p-8 min-h-[500px] prose prose-stone dark:prose-invert max-w-none focus:outline-none tiptap-container text-lg leading-relaxed text-stone-300 cursor-text" 
    bind:this={element}
    onclick={(e) => {
      if (e.target === element) {
        editor?.commands.focus('end');
      }
    }}
  ></div>
</div>

<style>
  :global(.tiptap p.is-editor-empty:first-child::before) {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  :global(.tiptap-container .tiptap:focus) {
    outline: none;
  }
</style>

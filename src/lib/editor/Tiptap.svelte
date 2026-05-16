<script lang="ts">
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import { onDestroy, onMount } from 'svelte';
  
  import { GMNote } from './extensions/GMNote';
  import { DiceRoller } from './extensions/DiceRoller';
  import { StatBlock } from './extensions/StatBlock';

  let { 
    content = '', 
    onUpdate = (html: string) => {},
    placeholder = 'Write your story...' 
  } = $props<{
    content?: string;
    onUpdate?: (html: string) => void;
    placeholder?: string;
  }>();

  let element: HTMLElement;
  let editor = $state<Editor | undefined>(undefined);

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder }),
        GMNote,
        DiceRoller,
        StatBlock,
      ],
      content,
      onUpdate: ({ editor: e }) => {
        onUpdate(e.getHTML());
      },
      onTransaction: () => {
        // Force state update so Svelte reacts to editor state changes (like isActive)
        editor = editor;
      }
    });
  });

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
    </div>
  {/if}
  
  <div class="p-8 min-h-[500px] prose prose-stone dark:prose-invert max-w-none focus:outline-none tiptap-container text-lg leading-relaxed text-stone-300" bind:this={element}></div>
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

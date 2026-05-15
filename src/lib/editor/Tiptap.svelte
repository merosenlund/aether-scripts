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

{#if editor}
  <div class="border rounded-md flex flex-col bg-white dark:bg-stone-950">
    <div class="border-b p-2 flex gap-2 flex-wrap">
      <button 
        class="px-2 py-1 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800 {editor.isActive('bold') ? 'bg-stone-200 dark:bg-stone-700' : ''}" 
        onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button 
        class="px-2 py-1 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800 {editor.isActive('italic') ? 'bg-stone-200 dark:bg-stone-700' : ''}" 
        onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button 
        class="px-2 py-1 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800 {editor.isActive('heading', { level: 2 }) ? 'bg-stone-200 dark:bg-stone-700' : ''}" 
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <div class="w-px h-6 bg-stone-300 dark:bg-stone-700 mx-1"></div>
      <button 
        class="px-2 py-1 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800 {editor.isActive('gmNote') ? 'bg-stone-200 dark:bg-stone-700' : ''}" 
        onclick={() => editor?.chain().focus().toggleNode('gmNote', 'paragraph').run()}
      >
        GM Note
      </button>
      <button 
        class="px-2 py-1 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800 {editor.isActive('statBlock') ? 'bg-stone-200 dark:bg-stone-700' : ''}" 
        onclick={() => editor?.chain().focus().toggleNode('statBlock', 'paragraph').run()}
      >
        Stat Block
      </button>
      <button 
        class="px-2 py-1 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-800" 
        onclick={() => editor?.chain().focus().insertContent({ type: 'diceRoller', attrs: { formula: '1d20', result: Math.floor(Math.random() * 20) + 1 } }).run()}
      >
        Insert Roll
      </button>
    </div>
    <div class="p-4 min-h-[400px] prose dark:prose-invert max-w-none focus:outline-none tiptap-container" bind:this={element}></div>
  </div>
{:else}
  <div class="p-4 min-h-[400px] border rounded-md" bind:this={element}>Loading editor...</div>
{/if}

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

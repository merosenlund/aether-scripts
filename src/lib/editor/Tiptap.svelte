<script lang="ts">
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import BubbleMenu from '@tiptap/extension-bubble-menu';
  import { onDestroy, onMount } from 'svelte';
  
  import { GMNote } from './extensions/GMNote';
  import { DiceRoller } from './extensions/DiceRoller';
  import { StatBlock } from './extensions/StatBlock';
  import { OddsCheck } from './extensions/OddsCheck';
  import { Commands } from './extensions/Commands';
  import { BlockMetadata } from './extensions/BlockMetadata';
  import { ClockBlock } from './extensions/ClockBlock';
  import { TrackBlock } from './extensions/TrackBlock';
  import { OracleBlock } from './extensions/OracleBlock';
  import { TelemetryExtension } from './extensions/TelemetryExtension';
  import suggestion from './extensions/suggestion.svelte.ts';
  
  import Collaboration from '@tiptap/extension-collaboration';
  import * as Y from 'yjs';
  import { SupabaseYjsProvider } from './yjs';
  import { createSnapshot, type SceneStage } from '../api/versions';
  import { notifications } from '$lib/stores/notifications';


  let { 
    content = $bindable(''), 
    initialContent = null,
    sceneId = '',
    stage = 'Draft' as SceneStage,
    onUpdate = (html: string) => {},
    placeholder = 'Write your story...',
    activeBlockId = $bindable(''),
    editable = true
  } = $props<{
    content?: any;
    initialContent?: any;
    sceneId?: string;
    stage?: SceneStage;
    onUpdate?: (html: string) => void;
    placeholder?: string;
    activeBlockId?: string;
    editable?: boolean;
  }>();

  let element: HTMLElement;
  let bubbleMenuElement = $state<HTMLElement>();
  let isBubbleMenuVisible = $state(false);
  let editor = $state<Editor | undefined>(undefined);
  let ydoc: Y.Doc;
  let provider: SupabaseYjsProvider;
  let isSaving = $state(false);

  import { supabase } from '$lib/supabaseClient';

  let saveTimeout: any;

  function queueAutosave() {
    if (!sceneId || !editable || !editor) return;
    
    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
      if (!editor) return;
      const json = editor.getJSON();
      
      const { error } = await supabase
        .from('scenes')
        .update({ content_blocks: json })
        .eq('id', sceneId);
        
      if (error) {
        console.error('Error autosaving content_blocks:', error);
      }
    }, 1500);
  }

  import { telemetryStore } from '$lib/stores/telemetry.svelte';

  let yjsLoaded = $state(false);
  let hasYjsData = $state(true);

  onMount(() => {
    ydoc = new Y.Doc();
    if (sceneId && editable) {
      provider = new SupabaseYjsProvider(ydoc, sceneId, (hasData) => {
        hasYjsData = hasData;
        yjsLoaded = true;
      });
    }

    editor = new Editor({
      element,
      editable,
      extensions: [
        StarterKit.configure({
          // History is handled by Collaboration when editing, but can be enabled for non-collaborative
          history: !editable,
        } as any),
        BlockMetadata,
        Placeholder.configure({ placeholder }),
        ...(editable ? [BubbleMenu.configure({
          element: bubbleMenuElement,
          shouldShow: ({ state, from, to }) => {
            // Only show if there's a selection and it's not empty
            const show = !state.selection.empty && from !== to;
            isBubbleMenuVisible = show;
            return show;
          },
        })] : []),
        ...(editable && sceneId ? [Collaboration.configure({
          document: ydoc,
        })] : []),
        ...(editable ? [TelemetryExtension] : []),
        GMNote,
        DiceRoller,
        StatBlock,
        OddsCheck,
        ClockBlock,
        TrackBlock,
        OracleBlock,
        Commands.configure({
          suggestion,
        } as any),
      ],
      editorProps: {
        attributes: {
          class: 'prose prose-stone dark:prose-invert max-w-none focus:outline-none text-lg leading-relaxed text-stone-300 pl-24 pr-8 py-8 pb-64 min-h-full cursor-text',
        },
        handleDOMEvents: {
          beforeinput: () => {
            telemetryStore.activateSession();
          },
          keydown: () => {
            telemetryStore.activateSession();
          }
        }
      },
      // When using collaboration, content is loaded from the Y.Doc
      // but we can provide initial content if needed
      content: content || undefined,
      onUpdate: ({ editor: e }) => {
        onUpdate(e.getHTML());
        queueAutosave();
      },
      onTransaction: () => {
        editor = editor;
        if (editor && editable) {
          const { selection } = editor.state;
          const node = selection.$from.parent;
          activeBlockId = node.attrs.id || '';
        }
      }
    });
  });

  $effect(() => {
    // Determine the source of truth for the initial injection
    const sourceContent = initialContent || content;
    
    if (editor && sourceContent) {
      // If not editable, we always set content. 
      // If editable, we only set it if Yjs has finished loading and told us it was empty.
      if (!editable || (yjsLoaded && !hasYjsData)) {
        let parsedContent = sourceContent;
        if (typeof sourceContent === 'string' && sourceContent.trim().startsWith('{')) {
          try {
            parsedContent = JSON.parse(sourceContent);
          } catch (e) {
            console.error('Error parsing content JSON inside Tiptap:', e);
          }
        }
        
        console.log('[Tiptap] Injecting fallback content into Yjs document:', parsedContent);
        
        // Extract inner content if it's a full document
        let nodesToInsert = parsedContent;
        if (parsedContent.type === 'doc' && parsedContent.content) {
          nodesToInsert = parsedContent.content;
        }
        
        // Ensure we only set it once for editable docs
        // Use clearContent and insertContent instead of setContent to avoid replacing the root doc node, which Collaboration hates.
        editor.chain().clearContent().insertContent(nodesToInsert).run();
        
        if (editable) {
          hasYjsData = true; // Prevent re-triggering
        }
        console.log('[Tiptap] Fallback content injected.');
      }
    }
  });

  export const getIsSaving = () => isSaving;

  export async function save() {
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

<div class="h-full border border-white/10 rounded-2xl flex flex-col bg-stone-900/50 backdrop-blur-md shadow-xl relative">

  
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="flex-1 overflow-y-auto tiptap-container scroll-container relative" 
    bind:this={element}
    onclick={(e) => {
      if (e.target === element) {
        editor?.commands.focus('end');
      }
    }}
  ></div>

  <div 
    bind:this={bubbleMenuElement} 
    class="absolute flex items-center gap-1 p-1 bg-stone-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 transition-all duration-200 {isBubbleMenuVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}"
  >
    {#if editor}
      <button 
        class="p-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleBold().run()}
        title="Bold (Cmd+B)"
      >
        B
      </button>
      <button 
        class="p-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleItalic().run()}
        title="Italic (Cmd+I)"
      >
        I
      </button>
      <button 
        class="p-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors {editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'text-stone-400'}" 
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </button>
    {/if}
  </div>
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
  :global([data-visibility="journal"]) {
    background: rgba(120, 113, 108, 0.05);
    border-left: 3px solid rgba(120, 113, 108, 0.3);
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: italic;
    color: rgba(214, 211, 209, 0.8);
    position: relative;
  }

  /* Block Type Tooltips */
  :global([data-type="gm-note"], [data-visibility="journal"], [data-type="stat-block"]) {
    position: relative;
  }

  :global([data-type="gm-note"]:hover::after, [data-visibility="journal"]:hover::after, [data-type="stat-block"]:hover::after) {
    position: absolute;
    top: -10px;
    right: 12px;
    padding: 4px 8px;
    background: #1c1917;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #d6d3d1;
    opacity: 0;
    animation: fadeInLabel 0.2s forwards;
    animation-delay: 1.2s; /* The "moment or two" delay */
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  :global([data-type="gm-note"]:hover::after) { content: 'GM Note'; }
  :global([data-visibility="journal"]:hover::after) { content: 'Journal Entry'; }
  :global([data-type="stat-block"]:hover::after) { content: 'Stat Block'; }

  @keyframes fadeInLabel {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>

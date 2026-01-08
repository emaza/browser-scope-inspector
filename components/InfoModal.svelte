<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: Snippet;
  }

  let { isOpen, onClose, title, children }: Props = $props();
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onclick={onClose}>
    <div 
      class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
        <h3 class="text-lg font-semibold text-white">{title}</h3>
        <button 
          onclick={onClose}
          class="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>
      <div class="p-5 text-slate-300 text-sm leading-relaxed space-y-4 max-h-[80vh] overflow-y-auto">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

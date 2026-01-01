<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string | Snippet;
    value: string | number | Snippet;
    highlight?: boolean;
  }

  let { label, value, highlight = false }: Props = $props();
</script>

<div class="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 px-2 rounded transition-colors">
  <span class="text-slate-400 font-medium flex-1">
    {#if typeof label === 'function'}
       {@render label()}
    {:else}
       {label}
    {/if}
  </span>
  <span class="font-mono text-right {highlight ? 'text-sky-400 font-bold' : 'text-slate-200'}">
    {#if typeof value === 'function'}
       {@render value()}
    {:else}
       {value}
    {/if}
  </span>
</div>

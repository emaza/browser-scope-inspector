<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    title: string;
    description: string;
    icon?: Snippet;
    children: Snippet;
    class?: string;
  }

  let { title, description, icon, children, class: className = '' }: Props = $props();
</script>

<div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg transition-all hover:border-slate-600 {className}">
  <div class="p-4 border-b border-slate-700/50 bg-slate-800/80 flex items-center gap-3">
    <div class="text-sky-400 p-2 bg-sky-400/10 rounded-lg">
      {@render icon?.()}
    </div>
    <div>
      <h2 class="text-lg font-semibold text-white tracking-tight">{title}</h2>
      <p class="text-xs text-slate-400">{description}</p>
    </div>
  </div>
  <div class="p-4 text-sm text-slate-300">
    {@render children()}
  </div>
</div>

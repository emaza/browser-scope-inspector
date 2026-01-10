<script lang="ts">
	import type { ComponentType, SvelteComponent } from 'svelte';

	export let icon: ComponentType<SvelteComponent>;
	export let text: string;
	export let disabled = false;
	export let variant: 'default' | 'pending' = 'default';
	export let iconClass = '';

	const baseClasses = "flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded transition-colors border";
	const variantClasses = {
		default: "bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed",
		pending: "bg-sky-500/20 border-sky-500/50 text-sky-400 cursor-wait"
	};
</script>

<button
	{...$$restProps}
	on:click
	disabled={disabled}
	class="{baseClasses} {variantClasses[variant]} {$$props.class}"
>
	<svelte:component this={icon} size={14} class={iconClass} />
	{text}
</button>

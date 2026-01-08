<script lang="ts">
  import { onMount } from 'svelte';
  import { ClipboardCopy, AlertTriangle, FileText, Lock, EyeOff } from 'lucide-svelte';
  import Card from './Card.svelte';

  let content = $state<string | null>(null);
  let permState = $state<string>('unknown');
  let error = $state<string | null>(null);
  let loading = $state(false);

  onMount(() => {
    if (navigator.permissions && navigator.permissions.query) {
      // @ts-ignore
      navigator.permissions.query({ name: 'clipboard-read' })
        .then(result => {
          permState = result.state;
          result.onchange = () => permState = result.state;
        })
        .catch(() => permState = 'unknown');
    }
  });

  const handleReadClipboard = async () => {
    loading = true;
    error = null;
    content = null;

    try {
      const text = await navigator.clipboard.readText();
      
      if (!text) {
        error = "El portapapeles está vacío o contiene datos no textuales (imágenes/archivos).";
      } else {
        content = text;
        permState = 'granted';
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        error = "Permiso denegado. El usuario bloqueó el acceso.";
        permState = 'denied';
      } else {
        error = "No se pudo acceder. Requiere contexto seguro (HTTPS) y la pestaña activa.";
      }
    } finally {
      loading = false;
    }
  };
</script>

<Card 
  title="Portapapeles (Clipboard)" 
  description="Acceso al contenido copiado (Ctrl+C)."
>
  {#snippet icon()}
    <ClipboardCopy size={20} />
  {/snippet}

  <div class="space-y-4">
    <div class="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
      <span class="text-slate-400">Estado del Permiso:</span>
      <span class="font-mono uppercase font-bold {permState === 'granted' ? 'text-green-400' : permState === 'denied' ? 'text-red-400' : 'text-yellow-400'}">
        {permState === 'granted' ? 'CONCEDIDO' : permState === 'denied' ? 'BLOQUEADO' : 'PREGUNTAR'}
      </span>
    </div>

    {#if !content}
      <div class="bg-amber-500/10 border border-amber-500/20 rounded p-3">
         <div class="flex gap-2 items-start mb-2">
            <AlertTriangle size={16} class="text-amber-400 shrink-0 mt-0.5" />
            <h3 class="text-sm font-semibold text-amber-200">Riesgo de Privacidad</h3>
         </div>
         <p class="text-xs text-amber-100/80 leading-relaxed mb-3">
           Si concedes este permiso, este sitio podrá leer <strong>contraseñas, tarjetas de crédito o mensajes privados</strong> que hayas copiado en otras aplicaciones.
         </p>
         <button 
           onclick={handleReadClipboard}
           disabled={loading}
           class="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
         >
           {loading ? 'Solicitando...' : 'Intentar Leer Portapapeles'}
           {#if !loading}
                <FileText size={14} />
           {/if}
         </button>
      </div>
    {:else}
      <div class="animate-in fade-in zoom-in duration-300">
         <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-green-400 font-bold flex items-center gap-1">
                <Lock size={12} /> Datos Capturados Exitosamente
            </span>
            <button 
                onclick={() => content = null} 
                class="text-xs text-slate-500 hover:text-slate-300"
            >
                Limpiar
            </button>
         </div>
         <div class="relative group">
            <pre class="bg-slate-950 text-slate-300 p-3 rounded border border-slate-700 text-xs font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto shadow-inner">{content}</pre>
            <div class="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded">
                <span class="text-xs text-red-400 font-bold flex items-center gap-2">
                    <EyeOff size={14} /> Información Expuesta
                </span>
            </div>
         </div>
         <p class="mt-2 text-[10px] text-slate-500 text-center">
             Un sitio malicioso podría haber enviado este texto a un servidor remoto en segundo plano.
         </p>
      </div>
    {/if}

    {#if error}
        <div class="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20 text-center">
            {error}
        </div>
    {/if}
  </div>
</Card>

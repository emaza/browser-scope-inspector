<script lang="ts">
  import { onMount } from 'svelte';
  import { Monitor, Eye } from 'lucide-svelte';
  import Card from './Card.svelte';
  import DataRow from './DataRow.svelte';

  let dims = $state({
    screenW: window.screen.width,
    screenH: window.screen.height,
    windowW: window.innerWidth,
    windowH: window.innerHeight,
    availW: window.screen.availWidth,
    availH: window.screen.availHeight,
    depth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio
  });

  let hasFocus = $state(document.hasFocus());
  let orientation = $state({
    type: screen.orientation.type,
    angle: screen.orientation.angle
  });

  onMount(() => {
    const handleResize = () => {
      dims = {
        screenW: window.screen.width,
        screenH: window.screen.height,
        windowW: window.innerWidth,
        windowH: window.innerHeight,
        availW: window.screen.availWidth,
        availH: window.screen.availHeight,
        depth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      };
    };

    const onFocus = () => hasFocus = true;
    const onBlur = () => hasFocus = false;
    const handleOrientationChange = () => {
      orientation.type = screen.orientation.type;
      orientation.angle = screen.orientation.angle;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    screen.orientation.addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      screen.orientation.removeEventListener('change', handleOrientationChange);
    };
  });

  const isMultiMonitor = (window.screen as any).isExtended || (window.screen.availWidth > window.screen.width);
</script>

<Card 
  title="Pantalla y Entorno" 
  description="Dimensiones y configuración gráfica."
>
  {#snippet icon()}
    <Monitor size={20} />
  {/snippet}

  <DataRow 
    label="Resolución de Pantalla" 
    value={`${dims.screenW} x ${dims.screenH}`} 
  />
  <DataRow 
    label="Viewport (Ventana)" 
    value={`${dims.windowW} x ${dims.windowH}`} 
    highlight
  />
  <DataRow 
    label="Area Disponible" 
    value={`${dims.availW} x ${dims.availH}`} 
  />
  <DataRow 
    label="Profundidad de Color" 
    value={`${dims.depth}-bit`} 
  />
  <DataRow 
    label="Densidad de Píxeles (DPR)" 
    value={`${dims.pixelRatio}x`} 
  />
  <DataRow 
    label="Posible Multi-Monitor" 
    value={isMultiMonitor ? 'Sí (Detectado)' : 'No / Desconocido'} 
  />
  
  <div class="mt-3 p-2 rounded border flex items-center justify-between transition-colors {hasFocus ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700 border-dashed'}">
     <span class="text-xs text-slate-400 flex items-center gap-2">
        <Eye size={14} /> Pestaña:
     </span>
     <span class="text-xs font-bold font-mono uppercase {hasFocus ? 'text-emerald-400' : 'text-slate-500'}">
        {hasFocus ? 'ACTIVA (FOCUS)' : 'INACTIVA (BLUR)'}
     </span>
  </div>

  <DataRow
    label="Orientación (Tipo)"
    value={orientation.type}
  />
  <DataRow
    label="Orientación (Ángulo)"
    value={`${orientation.angle}°`}
  />
</Card>

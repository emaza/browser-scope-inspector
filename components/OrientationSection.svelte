<script lang="ts">
  import { Zap, AlertTriangle } from 'lucide-svelte';
  import Card from './Card.svelte';
  import DataRow from './DataRow.svelte';

  let motionData = $state<DeviceMotionEvent | null>(null);
  let error = $state<string | null>(null);
  let listening = $state(false);

  const handleMotionEvent = (event: DeviceMotionEvent) => {
    motionData = event;
  };

  const requestAccess = async () => {
    error = null;

    if (window.location.protocol !== 'https:') {
        error = "Esta API solo funciona en un contexto seguro (HTTPS).";
        return;
    }

    // iOS 13+ requires explicit permission
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', handleMotionEvent);
          listening = true;
        } else {
          error = "Permiso denegado para acceder a los sensores.";
        }
      } catch (err) {
        console.error(err);
        error = "No se pudo solicitar el permiso.";
      }
    } else {
      // Other browsers
      window.addEventListener('devicemotion', handleMotionEvent);
      listening = true;

      // Check if data is actually coming through after a short delay
      setTimeout(() => {
        if (!motionData?.acceleration && !motionData?.rotationRate) {
            error = "No se detectaron sensores de movimiento.";
            window.removeEventListener('devicemotion', handleMotionEvent);
            listening = false;
        }
      }, 1000);
    }
  };

  $effect(() => {
    return () => {
      if (listening) {
        window.removeEventListener('devicemotion', handleMotionEvent);
      }
    };
  });
</script>

<Card
  title="Eventos de orientación"
  description="Datos del acelerómetro y giroscopio del dispositivo."
>
  {#snippet icon()}
    <Zap size={20} />
  {/snippet}

  {#if !listening && !error}
    <div class="flex flex-col items-center justify-center py-6 px-4 gap-4">
      <p class="text-xs text-slate-400 text-center leading-relaxed">
        Esta API expone los datos de los sensores de movimiento de tu dispositivo, como el acelerómetro y el giroscopio.
      </p>
      <button
        onclick={requestAccess}
        class="group flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-bold py-2.5 px-5 rounded-lg border border-sky-500/20 transition-all"
      >
        Activar Sensores
      </button>
    </div>
  {/if}

  {#if error}
    <div class="flex flex-col items-center justify-center py-6 px-4 gap-2 text-red-400/90 text-center">
      <AlertTriangle size={24} class="mb-1" />
      <span class="text-sm font-semibold">{error}</span>
    </div>
  {/if}

  {#if motionData}
    {@const format = (v: number | null | undefined) => v?.toFixed(2) ?? '-'}

    {#if motionData.acceleration}
        <div class="space-y-1.5 pt-1">
            <p class="text-xs text-slate-400 font-semibold pb-1 border-b border-slate-700/50">Aceleración</p>
            <DataRow label="Eje X" value={`${format(motionData.acceleration.x)} m/s²`} />
            <DataRow label="Eje Y" value={`${format(motionData.acceleration.y)} m/s²`} />
            <DataRow label="Eje Z" value={`${format(motionData.acceleration.z)} m/s²`} />
        </div>
    {/if}

    {#if motionData.accelerationIncludingGravity}
        <div class="space-y-1.5 pt-3">
            <p class="text-xs text-slate-400 font-semibold pb-1 border-b border-slate-700/50">Aceleración (con gravedad)</p>
            <DataRow label="Eje X" value={`${format(motionData.accelerationIncludingGravity.x)} m/s²`} />
            <DataRow label="Eje Y" value={`${format(motionData.accelerationIncludingGravity.y)} m/s²`} />
            <DataRow label="Eje Z" value={`${format(motionData.accelerationIncludingGravity.z)} m/s²`} />
        </div>
    {/if}

    {#if motionData.rotationRate}
        <div class="space-y-1.5 pt-3">
            <p class="text-xs text-slate-400 font-semibold pb-1 border-b border-slate-700/50">Velocidad de Rotación</p>
            <DataRow label="Alpha (Z)" value={`${format(motionData.rotationRate.alpha)} °/s`} />
            <DataRow label="Beta (X)" value={`${format(motionData.rotationRate.beta)} °/s`} />
            <DataRow label="Gamma (Y)" value={`${format(motionData.rotationRate.gamma)} °/s`} />
        </div>
    {/if}

     <div class="pt-3">
         <DataRow label="Intervalo" value={`${motionData.interval.toFixed(2)} ms`} />
     </div>
  {/if}
</Card>

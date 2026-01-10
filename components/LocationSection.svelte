<script lang="ts">
  import { MapPin, Navigation, AlertTriangle, RefreshCw } from 'lucide-svelte';
  import Card from './Card.svelte';
  import DataRow from './DataRow.svelte';
  import InfoModal from './InfoModal.svelte';
  import Button from './Button.svelte';

  let location = $state<{lat: number, lon: number, acc: number} | null>(null);
  let fullPosition = $state<GeolocationPosition | null>(null);
  let isModalOpen = $state(false);
  let error = $state<string | null>(null);
  let loading = $state(false);
  let retryMode = $state(false);

  const requestLocation = () => {
    loading = true;
    error = null;
    retryMode = false;

    if (!navigator.geolocation) {
      error = "API no soportada";
      loading = false;
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      fullPosition = pos;
      location = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      };
      loading = false;
      retryMode = false;
    };

    const handleError = (err: GeolocationPositionError, isHighAccuracyAttempt: boolean) => {
      if (isHighAccuracyAttempt && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
        retryMode = true;
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (finalErr) => handleError(finalErr, false),
          { 
            enableHighAccuracy: false, 
            timeout: 15000, 
            maximumAge: 60000 
          }
        );
        return;
      }

      let msg = "Error desconocido";
      switch(err.code) {
        case err.PERMISSION_DENIED: msg = "Permiso denegado por el usuario."; break;
        case err.POSITION_UNAVAILABLE: msg = "No se pudo determinar la ubicación."; break;
        case err.TIMEOUT: msg = "El tiempo de espera se agotó (incluso en baja precisión)."; break;
        default: msg = err.message;
      }
      error = msg;
      loading = false;
      retryMode = false;
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => handleError(err, true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
</script>

<Card 
  title="Geolocalización" 
  description="Coordenadas GPS aproximadas (requiere permiso)."
>
  {#snippet icon()}
    <MapPin size={20} />
  {/snippet}

  {#if !location && !error}
    <div class="flex flex-col items-center justify-center py-6 px-4 gap-4">
        <p class="text-xs text-slate-400 text-center leading-relaxed">
        Esta API revela tu posición física real. El navegador solicitará tu confirmación antes de compartirla.
        </p>
        <Button
          on:click={requestLocation}
          disabled={loading}
          text={loading ? (retryMode ? 'Reintentando...' : 'Solicitando...') : 'Activar GPS'}
          icon={retryMode ? RefreshCw : Navigation}
        />
    </div>
  {/if}

  {#if error}
     <div class="flex flex-col items-center justify-center py-6 px-4 gap-2 text-red-400/90 text-center">
       <AlertTriangle size={24} class="mb-1" />
       <span class="text-sm font-semibold">{error}</span>
       <button onclick={requestLocation} class="text-xs underline text-slate-500 mt-2 hover:text-slate-300 cursor-pointer">Reintentar</button>
     </div>
  {/if}

  {#if location}
    <DataRow label="Latitud" value={location.lat.toFixed(6)} highlight />
    <DataRow label="Longitud" value={location.lon.toFixed(6)} highlight />
    <DataRow label="Precisión" value={`±${location.acc.toFixed(0)} m`} />
    <div class="mt-4 pt-3 border-t border-slate-700/50 space-y-2">
        <button
            onclick={() => isModalOpen = true}
            class="flex items-center justify-center gap-2 w-full text-center bg-slate-800 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs py-2 rounded transition-colors"
        >
            Más datos
        </button>
        <a 
            href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`}
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 w-full text-center bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded transition-colors"
        >
            <MapPin size={12} /> Ver en Mapa
        </a>
    </div>
  {/if}
</Card>

<InfoModal
  isOpen={isModalOpen}
  onClose={() => isModalOpen = false}
  title="Datos de Geolocalización"
>
  {#if fullPosition}
    <div class="space-y-1.5">
      <DataRow
        label="Timestamp"
        value={new Date(fullPosition.timestamp).toLocaleString()}
      />
      <div class="pt-3"></div>
      <DataRow label="Latitud" value={fullPosition.coords.latitude.toFixed(6)} />
      <DataRow label="Longitud" value={fullPosition.coords.longitude.toFixed(6)} />
      <DataRow label="Precisión" value={`±${fullPosition.coords.accuracy.toFixed(0)} m`} />
      <DataRow
        label="Altitud"
        value={fullPosition.coords.altitude !== null ? `${fullPosition.coords.altitude.toFixed(0)} m` : 'No disponible'}
      />
      <DataRow
        label="Precisión de Altitud"
        value={fullPosition.coords.altitudeAccuracy !== null ? `±${fullPosition.coords.altitudeAccuracy.toFixed(0)} m` : 'No disponible'}
      />
      <DataRow
        label="Rumbo"
        value={fullPosition.coords.heading !== null ? `${fullPosition.coords.heading.toFixed(0)}°` : 'No disponible'}
      />
      <DataRow
        label="Velocidad"
        value={fullPosition.coords.speed !== null ? `${fullPosition.coords.speed.toFixed(2)} m/s` : 'No disponible'}
      />
    </div>
  {:else}
    <p>No hay datos de posición disponibles.</p>
  {/if}
</InfoModal>

<script lang="ts">
  import { onMount } from 'svelte';
  import { Settings, Lock } from 'lucide-svelte';
  import Card from './Card.svelte';
  import DataRow from './DataRow.svelte';

  let permissions = $state<Record<string, string>>({});
  let storageEstimates = $state<string>('Desconocido');

  const nav = navigator;

  onMount(() => {
    const checkPermissions = async () => {
      const permsToCheck = ['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read'] as const;
      const results: Record<string, string> = {};

      for (const p of permsToCheck) {
        try {
          // @ts-ignore
          const status = await nav.permissions.query({ name: p });
          results[p] = status.state;
        } catch (e) {
          results[p] = 'no-soportado';
        }
      }
      permissions = results;
    };

    checkPermissions();

    if (nav.storage && nav.storage.estimate) {
        nav.storage.estimate().then(estimate => {
            if(estimate.quota) {
                const gb = (estimate.quota / (1024 * 1024 * 1024)).toFixed(1);
                storageEstimates = `${gb} GB disponibles`;
            }
        });
    }
  });

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languages = nav.languages ? nav.languages.join(', ') : nav.language;
  const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const cookiesEnabled = nav.cookieEnabled;
</script>

<Card 
  title="Preferencias y Permisos" 
  description="Configuración regional y estado de seguridad."
>
  {#snippet icon()}
    <Settings size={20} />
  {/snippet}

  <DataRow 
    label="Idiomas Preferidos" 
    value={languages} 
  />
  <DataRow 
    label="Zona Horaria" 
    value={timeZone} 
  />
  <DataRow 
    label="Modo Oscuro" 
    value={darkMode ? 'Sí (Sistema)' : 'No'} 
  />
  <DataRow 
    label="Cookies Habilitadas" 
    value={cookiesEnabled ? 'Sí' : 'No'} 
  />
  <DataRow 
    label="Almacenamiento Local (Quota)" 
    value={storageEstimates} 
  />
  
  <div class="mt-4 pt-3 border-t border-slate-700/50">
    <h4 class="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
        <Lock size={12} /> Estado de Permisos
    </h4>
    <div class="grid grid-cols-2 gap-2 text-xs">
        {#each Object.entries(permissions) as [key, val]}
            <div class="flex justify-between p-1.5 bg-slate-900/40 rounded border border-slate-800">
                <span class="capitalize text-slate-400">{key}</span>
                <span class="font-mono {val === 'granted' ? 'text-green-400' : val === 'denied' ? 'text-red-400' : 'text-yellow-500'}">
                    {val === 'prompt' ? 'preguntar' : val === 'granted' ? 'concedido' : 'denegado'}
                </span>
            </div>
        {/each}
    </div>
  </div>
</Card>

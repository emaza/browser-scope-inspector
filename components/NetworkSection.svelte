<script lang="ts">
  import { onMount } from 'svelte';
  import { Wifi, HelpCircle } from 'lucide-svelte';
  import Card from './Card.svelte';
  import DataRow from './DataRow.svelte';
  import InfoModal from './InfoModal.svelte';
  import type { ExtendedNavigator } from '../types';

  let ips = $state<string[]>([]);
  let ipStatus = $state<string>('Analizando...');
  let connection = $state<any>(null);
  let rtt = $state<number | null>(null);
  let showModal = $state(false);
  let isOnline = $state(navigator.onLine);

  onMount(() => {
    // Online/Offline Status listeners
    const handleStatusChange = () => isOnline = navigator.onLine;

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const nav = navigator as ExtendedNavigator;
    if (nav.connection) {
      const updateConn = () => {
        connection = {
            type: nav.connection?.effectiveType,
            downlink: nav.connection?.downlink,
            saveData: nav.connection?.saveData
        };
        rtt = nav.connection?.rtt || null;
      };
      // Initial set
      updateConn();

      nav.connection.addEventListener('change', updateConn);
      
      return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
        nav.connection?.removeEventListener('change', updateConn);
      };
    }

    // WebRTC Local IP Detection Logic
    const encontrarIPLocal = () => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel(""); // Necesario para disparar el proceso ICE
        
        const foundIps = new Set<string>();

        pc.onicecandidate = (e) => {
          if (!e.candidate) return;
          
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
          const match = ipRegex.exec(e.candidate.candidate);
          
          if (match) {
            const ip = match[1];
            
            // Avoid duplicates
            if (foundIps.has(ip)) return;
            foundIps.add(ip);

            // Classification logic from prompt
            let displayIp = ip;
            if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)) {
                // Private IP
                displayIp = `🏠 ${ip}`;
            } else {
                // Public or other
                displayIp = `🌐 ${ip}`;
            }
            
            ips = Array.from(new Set([...ips, displayIp]));
            ipStatus = ''; // Clear status if we found something
          } else if (e.candidate.candidate.includes('.local')) {
             if (!foundIps.has('mDNS')) {
                foundIps.add('mDNS');
                ips = [...ips, '🔒 Oculta (mDNS)'];
                ipStatus = '';
             }
          }
        };

        pc.createOffer().then(sdp => pc.setLocalDescription(sdp));
        
        // Timeout check
        setTimeout(() => {
             if (ips.length === 0) ipStatus = 'No detectada (Bloqueada)';
             pc.close();
        }, 3000);

      } catch (err) {
        ipStatus = 'Error WebRTC';
      }
    };

    encontrarIPLocal();

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  });
</script>

<Card 
  title="Red y Conectividad" 
  description="Información de conexión visible desde el cliente."
>
  {#snippet icon()}
    <Wifi size={20} />
  {/snippet}

  <DataRow label="Estado de Red">
    {#snippet value()}
      <div class="flex items-center justify-end gap-2 font-bold {isOnline ? 'text-emerald-400' : 'text-red-400'}">
          <span class="w-2 h-2 rounded-full {isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400'}"></span>
          {isOnline ? 'CONECTADO' : 'OFFLINE'}
      </div>
    {/snippet}
  </DataRow>

  <DataRow highlight>
    {#snippet label()}
      <div class="flex items-center gap-2">
        <span>IPs Detectadas</span>
        <button 
          onclick={() => showModal = true} 
          class="text-slate-500 hover:text-sky-400 transition-colors focus:outline-none"
          title="¿Qué significa esto?"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    {/snippet}

    {#snippet value()}
      {#if ips.length > 0}
        <div class="flex flex-col items-end gap-1">
          {#each ips as ip}
            <span class="text-xs bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
              {ip}
            </span>
          {/each}
        </div>
      {:else}
        <span class="text-xs text-slate-500">{ipStatus}</span>
      {/if}
    {/snippet}
  </DataRow>

  <DataRow 
    label="Tipo de Conexión" 
    value={connection ? connection.type?.toUpperCase() : 'Desconocido'} 
  />
  <DataRow 
    label="Ancho de Banda (Est.)" 
    value={connection?.downlink ? `~${connection.downlink} Mbps` : 'N/A'} 
  />
  <DataRow 
    label="Latencia (RTT)" 
    value={rtt ? `${rtt} ms` : 'N/A'} 
  />
  <DataRow 
    label="Ahorro de Datos" 
    value={connection?.saveData ? 'Activado' : 'Desactivado'} 
  />
</Card>

<InfoModal 
  isOpen={showModal} 
  onClose={() => showModal = false} 
  title="¿Qué significan los resultados?"
>
  <div class="space-y-4">
    <div>
      <h4 class="font-semibold text-sky-400 mb-1">Si ves una IP que empieza por 192.168.x.x o 10.x.x.x:</h4>
      <p class="text-slate-400">
        Tu navegador está informando de tu dirección de red interna. Cualquier sitio web que visites podría saber cómo está organizada tu red doméstica.
      </p>
    </div>
    
    <div>
      <h4 class="font-semibold text-sky-400 mb-1">Si ves una cadena larga de letras y números (IPv6):</h4>
      <p class="text-slate-400">
        Es tu dirección de nueva generación. Muchas veces estas son temporales, pero siguen siendo identificadores únicos.
      </p>
    </div>

    <div>
      <h4 class="font-semibold text-green-400 mb-1">Si no aparece nada o da error:</h4>
      <p class="text-slate-400">
        ¡Felicidades! Tu navegador o tu VPN están bloqueando con éxito las fugas de WebRTC.
      </p>
    </div>
  </div>
</InfoModal>

<script lang="ts">
  import { onMount } from 'svelte';
  import { Fingerprint, Database, Check, X } from 'lucide-svelte';
  import Card from './Card.svelte';
  import DataRow from './DataRow.svelte';

  let canvasHash = $state('Calculando...');
  let audioHash = $state('Calculando...');
  let fonts = $state<string[]>([]);
  let capabilities = $state<Record<string, boolean>>({});

  // Simple hashing function for demo
  const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };

  onMount(() => {
    // 1. Canvas Fingerprinting
    const generateCanvasHash = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            canvas.width = 200;
            canvas.height = 50;
            
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125,1,62,20);
            ctx.fillStyle = "#069";
            ctx.fillText("BrowserScope ID", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("BrowserScope ID", 4, 17);
            
            const dataURI = canvas.toDataURL();
            const hash = cyrb53(dataURI);
            canvasHash = hash.toString(16);
        } catch (e) {
            canvasHash = 'Error';
        }
    };

    // 2. Font Detection (Simplified)
    const detectFonts = async () => {
        const fontList = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', 'Roboto', 'Lato', 'Open Sans', 'Fira Code', 'Comic Sans MS', 'Impact'];
        const detected: string[] = [];
        
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testString = "mmmmmmmmmmlli";
        
        const span = document.createElement("span");
        span.style.fontSize = "72px";
        span.style.position = "absolute";
        span.style.left = "-9999px";
        span.innerHTML = testString;
        document.body.appendChild(span);
        
        const getWidth = (fontFamily: string) => {
            span.style.fontFamily = fontFamily;
            return span.offsetWidth;
        };

        const baseWidths: Record<string, number> = {};
        for (const base of baseFonts) {
            baseWidths[base] = getWidth(base);
        }

        for (const font of fontList) {
            let present = false;
            for (const base of baseFonts) {
                 span.style.fontFamily = `'${font}', ${base}`;
                 if (span.offsetWidth !== baseWidths[base]) {
                     present = true;
                     break;
                 }
            }
            if (present) detected.push(font);
        }
        document.body.removeChild(span);
        fonts = detected;
    };

    // 3. Audio Fingerprinting
    const generateAudioHash = async () => {
        try {
            // @ts-ignore
            const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioContext) {
                audioHash = "No Soportado";
                return;
            }
            
            const context = new AudioContext(1, 44100, 44100);
            const oscillator = context.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.value = 1000;
            
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;
            
            oscillator.connect(compressor);
            compressor.connect(context.destination);
            oscillator.start(0);
            
            const buffer = await context.startRendering();
            const data = buffer.getChannelData(0);
            let hash = 0;
            for (let i = 0; i < data.length; i+=100) {
                hash += Math.abs(data[i]);
            }
            audioHash = cyrb53(hash.toString()).toString(16);
            
        } catch (e) {
            audioHash = "Error";
        }
    };

    // 4. Storage & API Capabilities Detection
    const checkCapabilities = () => {
        capabilities = {
            'Cookies': navigator.cookieEnabled,
            'LocalStorage': !!window.localStorage,
            'IndexedDB': !!window.indexedDB,
            'CacheStorage': 'caches' in window,
            'ServiceWorkers': 'serviceWorker' in navigator,
            'WebSQL': 'openDatabase' in window,
            'AppCache': 'applicationCache' in window, 
            'FileSystem': 'webkitRequestFileSystem' in window || 'requestFileSystem' in window,
            'Downloads': 'download' in document.createElement('a'),
            'History API': !!window.history,
            'FormData': 'FormData' in window,
            'Passwords API': 'PasswordCredential' in window || 'CredentialsContainer' in window
        };
    };

    generateCanvasHash();
    detectFonts();
    generateAudioHash();
    checkCapabilities();
  });
</script>

<Card 
  title="Huella Digital (Fingerprinting)" 
  description="Técnicas de identificación pasiva sin cookies."
>
  {#snippet icon()}
    <Fingerprint size={20} />
  {/snippet}

  <DataRow label="Canvas Hash">
    {#snippet value()}
        <span class="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-500">{canvasHash}</span>
    {/snippet}
  </DataRow>

  <DataRow label="Audio Context Hash">
    {#snippet value()}
        <span class="text-xs font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-500">{audioHash}</span>
    {/snippet}
  </DataRow>
  
  <!-- Fonts Section -->
  <div class="mt-3">
    <span class="text-slate-400 font-medium text-sm">Fuentes Detectadas (Muestra):</span>
    <div class="flex flex-wrap gap-1 mt-2 mb-4">
        {#each fonts as f}
            <span class="px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-full border border-slate-600">
                {f}
            </span>
        {/each}
        {#if fonts.length === 0}
            <span class="text-xs text-slate-500">Analizando...</span>
        {/if}
    </div>
  </div>

  <!-- Capabilities Section -->
  <div class="mt-4 pt-3 border-t border-slate-700/50">
      <h4 class="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
         <Database size={12} /> APIs y Almacenamiento
      </h4>
      <div class="grid grid-cols-2 gap-2">
          {#each Object.entries(capabilities) as [key, supported]}
              <div class="flex items-center justify-between bg-slate-900/40 px-2 py-1.5 rounded border border-slate-800">
                  <span class="text-xs text-slate-300">{key}</span>
                  {#if supported}
                      <div class="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase">
                          <Check size={10} strokeWidth={4} /> Sí
                      </div>
                  {:else}
                      <div class="flex items-center gap-1 text-[10px] text-slate-600 font-bold uppercase">
                          <X size={10} strokeWidth={4} /> No
                      </div>
                  {/if}
              </div>
          {/each}
      </div>
  </div>
</Card>

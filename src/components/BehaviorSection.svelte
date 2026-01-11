<script lang="ts">
  import { onMount } from "svelte";
  import { MousePointer2, Keyboard, Activity } from "lucide-svelte";
  import Card from "./Card.svelte";

  let mousePos = $state({ x: 0, y: 0 });
  let scrollPos = $state({ x: window.scrollX, y: window.scrollY });
  let clicks = $state(0);
  let keystrokes = $state<number[]>([]);
  let text = $state("");

  // Refs
  let distance = 0;
  let lastPos = { x: 0, y: 0 };
  let totalDistance = $state(0);

  onMount(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos = { x: e.clientX, y: e.clientY };

      // Calculate distance
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        distance += dist;
        // Update display total less frequently
        if (Math.random() > 0.8) totalDistance = Math.round(distance);
      }

      lastPos = { x: e.clientX, y: e.clientY };
    };

    const handleClick = () => {
      clicks += 1;
    };

    const handleScroll = () => {
      scrollPos = { x: window.scrollX, y: window.scrollY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  });

  const handleTyping = (e: Event) => {
    const input = e.target as HTMLInputElement;
    text = input.value;
    const now = performance.now();
    keystrokes = [...keystrokes, now].slice(-10);
  };

  // Derived state or function
  const getTypingCadence = () => {
    if (keystrokes.length < 2) return 0;
    let totalDiff = 0;
    for (let i = 1; i < keystrokes.length; i++) {
      totalDiff += keystrokes[i] - keystrokes[i - 1];
    }
    return Math.round(totalDiff / (keystrokes.length - 1));
  };
</script>

<Card
  title="Biometría del Comportamiento"
  description="Cómo interactúas con la página (Mouse, Scroll, Teclado, y Movimiento)."
  class="col-span-1 md:col-span-2 lg:col-span-3"
>
  {#snippet icon()}
    <Activity size={20} />
  {/snippet}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Mouse & Scroll Tracking -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <MousePointer2 size={16} /> Navegación y Cursor
      </h3>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="bg-slate-900 p-3 rounded border border-slate-700">
          <span class="block text-slate-500 mb-1">Cursor (Viewport)</span>
          <span class="font-mono text-sky-400"
            >X: {mousePos.x}, Y: {mousePos.y}</span
          >
        </div>
        <div class="bg-slate-900 p-3 rounded border border-slate-700">
          <span class="block text-slate-500 mb-1">Scroll (Desplazamiento)</span>
          <span class="font-mono text-emerald-400"
            >X: {scrollPos.x.toFixed(0)}, Y: {scrollPos.y.toFixed(0)}</span
          >
        </div>
        <div class="bg-slate-900 p-3 rounded border border-slate-700">
          <span class="block text-slate-500 mb-1">Distancia Cursor</span>
          <span class="font-mono text-sky-400">{totalDistance} px</span>
        </div>
        <div class="bg-slate-900 p-3 rounded border border-slate-700">
          <span class="block text-slate-500 mb-1">Total Clics</span>
          <span class="font-mono text-sky-400">{clicks}</span>
        </div>
      </div>
      <p class="text-xs text-slate-500 italic mt-2">
        * Tu navegador reporta cada micro-movimiento del mouse y cada píxel de
        desplazamiento (scroll), permitiendo crear un perfil de comportamiento
        único.
      </p>
    </div>

    <!-- Typing Biometrics -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Keyboard size={16} /> Dinámica de Teclado
      </h3>
      <div class="relative">
        <input
          type="text"
          value={text}
          oninput={handleTyping}
          placeholder="Escribe aquí para analizar tu ritmo..."
          class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
        />
        <div class="absolute right-3 top-3">
          <span
            class="w-2 h-2 rounded-full inline-block {keystrokes.length > 0 &&
            performance.now() - keystrokes[keystrokes.length - 1] < 200
              ? 'bg-green-500 animate-pulse'
              : 'bg-slate-700'}"
          ></span>
        </div>
      </div>

      <div class="flex gap-4 items-center">
        <div class="bg-slate-900 p-3 rounded border border-slate-700 flex-1">
          <span class="block text-slate-500 text-xs mb-1"
            >Latencia Media entre Teclas</span
          >
          <span class="font-mono text-xl text-sky-400">
            {getTypingCadence() > 0 ? `${getTypingCadence()} ms` : "--"}
          </span>
        </div>
        <div class="flex-1 text-xs text-slate-500">
          La "huella de tecleo" mide el tiempo de vuelo entre teclas. Es única
          para cada persona y puede usarse para autenticación continua.
        </div>
      </div>
    </div>
  </div>
</Card>

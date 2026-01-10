<script lang="ts">
  import { onMount } from "svelte";
  import { MousePointer2, Keyboard, Activity, RefreshCw } from "lucide-svelte";
  import Card from "./Card.svelte";
  import p5 from "p5";

  let mousePos = $state({ x: 0, y: 0 });
  let scrollPos = $state({ x: window.scrollX, y: window.scrollY });
  let clicks = $state(0);
  let keystrokes = $state<number[]>([]);
  let text = $state("");

  // Refs
  let distance = 0;
  let lastPos = { x: 0, y: 0 };
  let totalDistance = $state(0);
  let p5Container: HTMLElement;
  let p5Instance: any;
  let permissionGranted = $state(false);
  let isIOS = $state(false);

  onMount(() => {
    isIOS = typeof (DeviceMotionEvent as any)?.requestPermission === "function";
    // If not iOS (or older iOS), we assume permission is granted or not needed explicitly via API
    if (!isIOS) {
      permissionGranted = true;
    }

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

    // Initialize p5
    initP5();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      if (p5Instance) {
        p5Instance.remove();
      }
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

  // --- p5.js Sketch Logic ---

  const requestSensorPermission = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === "granted") {
          permissionGranted = true;
        } else {
          alert("Permiso denegado para acceder a los sensores.");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const initP5 = () => {
    const sketch = (p: any) => {
      let ball: any;
      let labelBottom = 0;
      let compassHeading: any = null;

      class Ball {
        radius = 15;
        pos: any;
        vel: any;
        angle = 0;
        rotationSpeed = 1;

        constructor() {
          this.pos = p.createVector(p.width / 2, p.height / 2);
          this.vel = p.createVector();
        }

        accelerate(acc: any) {
          this.vel.add(acc);
        }

        update() {
          const { pos, vel, radius } = this;
          const margin = 1 / 2;

          // update the ball position
          vel.mult(0.9);
          pos.add(vel);

          // bounce the ball off the sides
          const topLeft = p5.Vector.sub(
            pos,
            p.createVector(radius + margin, radius + margin),
          );
          const botRight = p5.Vector.add(
            pos,
            p.createVector(radius + margin, radius + margin),
          );

          if (
            (topLeft.x < 0 || p.width <= botRight.x) &&
            topLeft.x * vel.x > 0
          ) {
            pos.x = vel.x < 0 ? radius + margin : p.width - radius - margin;
            this.rotationSpeed = vel.y / radius;
            if (topLeft.x > 0) {
              this.rotationSpeed *= -1;
            }
          }
          if (
            (topLeft.y < 0 || p.height <= botRight.y) &&
            topLeft.y * vel.y > 0
          ) {
            pos.y = vel.y < 0 ? radius + margin : p.height - radius - margin;
            this.rotationSpeed = vel.x / radius;
            if (topLeft.y < 0) {
              this.rotationSpeed *= -1;
            }
          }
          this.angle += this.rotationSpeed;
          this.rotationSpeed *= 0.99;
        }

        draw() {
          const { pos, radius } = this;
          const dotRadius = 6;
          const dotPos = p5.Vector.add(
            pos,
            p5.Vector.fromAngle(this.angle, radius - dotRadius),
          );

          p.fill(255);
          p.noStroke();
          p.circle(pos.x, pos.y, 2 * radius);
          p.fill(0);
          p.circle(dotPos.x, dotPos.y, 2 * dotRadius);
        }
      }

      p.setup = () => {
        const h = 300;
        // Check container width, default to window width if causing issues, but better to be responsive
        const w = p5Container ? p5Container.offsetWidth : p.windowWidth;
        p.createCanvas(w, h);
        p.angleMode(p.DEGREES);

        ball = new Ball();

        // Listeners integration adapted for p5 instance mode + permission check outside
        if (typeof window !== "undefined") {
          // Fallback/Simulated motion if no sensors (e.g. desktop)
          if (!window.DeviceMotionEvent || !("ontouchstart" in window)) {
            // Determine if we should simulate noise or just static
            // For demo purposes, we can add a bit of noise so it's not dead on desktop
            setInterval(() => {
              const accelerationIncludingGravity = {
                x: 8 * p.noise(p.frameCount / 100, 0) - 4,
                y: 8 * p.noise(p.frameCount / 150, 1) - 4,
              };
              // Handle motion simulation
              const g = accelerationIncludingGravity;
              const a = p.createVector(g.x, -g.y).mult(0.5);
              ball.accelerate(a);

              // Simulate heading
              const webkitCompassHeading = 360 * p.noise(p.frameCount / 350, 2);
              compassHeading = { heading: webkitCompassHeading, accuracy: 20 };
            }, 1000 / 60);
          }
        }
      };

      p.windowResized = () => {
        if (p5Container) {
          p.resizeCanvas(p5Container.offsetWidth, 300);
        }
      };

      p.draw = () => {
        p.clear();
        // p.background(15, 23, 42); // Match bg-slate-900 roughly if needed, or keep transparent
        p.stroke(255);
        p.noFill();

        if (compassHeading) {
          drawCompass();
        }

        if (ball) {
          ball.update();
          ball.draw();
        }
      };

      // We manually attach event listeners for the real device events if permission granted
      // But p5 might handle this automatically if we use its events.
      // The original demo used raw window listeners.
      // Let's attach window listeners that feed into this instance.

      window.addEventListener(
        "devicemotion",
        (e: DeviceMotionEvent) => {
          if (!e.accelerationIncludingGravity) return;
          const g = e.accelerationIncludingGravity;
          // Adapt layout: x is usually left-right, y is up-down (relative to screen)
          // We might need to handle gravity properly.
          const a = p.createVector(g.x || 0, -(g.y || 0)).mult(0.5);
          if (ball) ball.accelerate(a);
        },
        true,
      );

      window.addEventListener(
        "deviceorientation",
        (e: DeviceOrientationEvent) => {
          // handle orientation
          const heading =
            (e as any).webkitCompassHeading || 360 - (e.alpha || 0); // basic fallback
          const accuracy = (e as any).webkitCompassAccuracy || 0;
          compassHeading = { heading, accuracy };
        },
        true,
      );

      const drawCompass = () => {
        const { heading, accuracy } = compassHeading;
        const northHeading = -90 - heading;

        p.push();
        p.translate(p.width / 2, p.height / 2); // Center compass
        p.angleMode(p.DEGREES);

        // accuracy arc
        p.noStroke();
        p.fill(p.color(255, 255, 255, 30)); // Semi-transparent
        for (let da = accuracy; da > 0; da -= 1) {
          // Just draw one big arc for performance instead of loop if possible, but keeping demo logic
          p.arc(0, 0, 200, 200, northHeading - da, northHeading + da, p.PIE);
        }
        // Simplified arc
        p.fill(p.color(64, 200, 255, 50));
        p.arc(
          0,
          0,
          200,
          200,
          northHeading - accuracy,
          northHeading + accuracy,
          p.PIE,
        );

        // crosshairs
        {
          const h = p.abs((heading % 90) - 45) - 45;
          const len = p.map(p.abs(h), 0, 45, 30, 60, true);
          p.stroke(160);
          p.line(-len, 0, len, 0);
          p.line(0, -len, 0, len);
          p.strokeWeight(3);
          p.line(0, -80 - 3 / 2, 0, -115);
        }

        // indicators
        p.noFill();
        p.stroke(255);
        p.strokeWeight(1);
        for (let deg = 0; deg < 360; deg += 15) {
          // Optimized step from 5 to 15
          const rad = p.radians(deg - heading);
          const sw = deg % 30 ? 1 : 3;
          const p0 = p5.Vector.fromAngle(rad, 80 + sw / 2);
          const p1 = p5.Vector.fromAngle(rad, 100 - sw / 2);
          p.line(p0.x, p0.y, p1.x, p1.y);
        }

        // North label
        p.fill(255);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        // p.text('N', ...north position...); // could add later

        p.pop();
      };
    };

    p5Instance = new p5(sketch, p5Container);
  };
</script>

<Card
  title="Biometría del Comportamiento"
  description="Cómo interactúas con la página (Mouse, Scroll, Teclado, y Movimiento)."
  class="col-span-1 md:col-span-2 lg:col-span-4"
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

    <!-- Motion & Orientation (p5.js) -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <RefreshCw size={16} /> Movimiento y Orientación
      </h3>

      <div
        class="bg-slate-900 border border-slate-700 rounded overflow-hidden relative"
        style="height: 300px;"
      >
        <!-- Canvas Container -->
        <div bind:this={p5Container} class="w-full h-full"></div>

        {#if isIOS && !permissionGranted}
          <div
            class="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10"
          >
            <button
              onclick={requestSensorPermission}
              class="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded text-xs font-semibold"
            >
              Habilitar Sensores
            </button>
          </div>
        {/if}
      </div>

      <p class="text-xs text-slate-500 italic mt-2">
        * Visualización en tiempo real del acelerómetro y giroscopio (si está
        disponible). Mueve tu dispositivo.
      </p>
    </div>
  </div>
</Card>

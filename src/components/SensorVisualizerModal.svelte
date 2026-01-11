<script lang="ts">
    import { onDestroy } from "svelte";
    import { X } from "lucide-svelte";
    import p5 from "p5";

    let {
        isOpen,
        onClose,
        acceleration,
        heading,
    }: {
        isOpen: boolean;
        onClose: () => void;
        acceleration: { x: number; y: number; z: number };
        heading: { heading: number; accuracy: number } | null;
    } = $props();

    let p5Container = $state<HTMLElement>();
    let p5Instance: any;

    // --- P5 Logic (Ball Class) ---
    class Ball {
        p: any;
        radius = 15;
        pos: any;
        vel: any;
        angle = 0;
        rotationSpeed = 1;

        constructor(p: any) {
            this.p = p;
            this.pos = p.createVector(p.width / 2, p.height / 2);
            this.vel = p.createVector(0, 0);
        }

        accelerate(acc: any) {
            // acceleration is passed in props.
            // We accumulate velocity.
            if (acc) this.vel.add(acc);
        }

        update() {
            const { pos, vel, radius, p } = this;
            const margin = 1 / 2;

            vel.mult(0.9);
            pos.add(vel);

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
                if (topLeft.x > 0) this.rotationSpeed *= -1;
            }
            if (
                (topLeft.y < 0 || p.height <= botRight.y) &&
                topLeft.y * vel.y > 0
            ) {
                pos.y =
                    vel.y < 0 ? radius + margin : p.height - radius - margin;
                this.rotationSpeed = vel.x / radius;
                if (topLeft.y < 0) this.rotationSpeed *= -1;
            }
            this.angle += this.rotationSpeed;
            this.rotationSpeed *= 0.99;
        }

        draw() {
            const { pos, radius, p } = this;
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

    const initP5 = () => {
        if (!p5Container) return;

        const sketch = (p: any) => {
            let ball: Ball;

            p.setup = () => {
                p.createCanvas(300, 300);
                p.angleMode(p.DEGREES);
                ball = new Ball(p);
            };

            p.draw = () => {
                p.clear();
                p.noFill();

                // --- 1. Physics Update ---
                // React to acceleration prop
                if (ball && acceleration) {
                    // p5 axes: x right, y down.
                    // Device axes: x right, y up (screen).
                    const a = p
                        .createVector(
                            acceleration.x || 0,
                            -(acceleration.y || 0),
                        )
                        .mult(0.5);
                    ball.accelerate(a);
                    ball.update();
                    ball.draw();
                }

                // --- 2. Compass Update ---
                // React to heading prop
                if (heading) {
                    drawCompass(p, heading);
                }
            };
        };

        p5Instance = new p5(sketch, p5Container);
    };

    const drawCompass = (p: any, headingData: any) => {
        const { heading, accuracy } = headingData;
        const northHeading = -90 - heading;

        p.push();
        p.translate(p.width / 2, p.height / 2);
        // Draw logic same as before...

        // accuracy arc
        p.noStroke();
        p.fill(p.color(255, 255, 255, 30));
        for (let da = accuracy; da > 0; da -= 1) {
            p.arc(0, 0, 200, 200, northHeading - da, northHeading + da, p.PIE);
        }

        // Needle
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

        // Crosshairs
        const h = p.abs((heading % 90) - 45) - 45;
        const len = p.map(p.abs(h), 0, 45, 30, 60, true);
        p.stroke(160);
        p.line(-len, 0, len, 0);
        p.line(0, -len, 0, len);
        p.strokeWeight(3);
        p.line(0, -80 - 3 / 2, 0, -115);

        // Ticks
        p.noFill();
        p.stroke(255);
        p.strokeWeight(1);
        for (let deg = 0; deg < 360; deg += 15) {
            const rad = p.radians(deg - heading);
            const sw = deg % 30 ? 1 : 3;
            const p0 = p5.Vector.fromAngle(rad, 80 + sw / 2);
            const p1 = p5.Vector.fromAngle(rad, 100 - sw / 2);
            p.line(p0.x, p0.y, p1.x, p1.y);
        }
        p.pop();
    };

    $effect(() => {
        if (isOpen) {
            // Init logic needs to wait for DOM.
            // Using action or timeout. Timeout is simple.
            setTimeout(() => {
                if (!p5Instance) initP5();
            }, 50);
        } else {
            if (p5Instance) {
                p5Instance.remove();
                p5Instance = null;
            }
        }
    });

    onDestroy(() => {
        if (p5Instance) {
            p5Instance.remove();
        }
    });
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
        onclick={onClose}
    >
        <div
            class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header / Close -->
            <div
                class="w-full flex justify-end p-2 absolute top-0 right-0 z-10"
            >
                <button
                    onclick={onClose}
                    class="p-2 text-slate-400 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <!-- Canvas Container -->
            <div class="p-8 pb-4 pt-12 flex flex-col items-center">
                <div
                    class="relative rounded-full overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(14,165,233,0.15)] bg-slate-950"
                >
                    <div
                        bind:this={p5Container}
                        class="w-[300px] h-[300px]"
                    ></div>
                </div>

                <div class="mt-6 text-center space-y-1">
                    <h3 class="text-lg font-medium text-white">
                        Visualización de Sensores
                    </h3>
                    <p class="text-sm text-slate-400">
                        Datos en tiempo real (Aceleración + Orientación)
                    </p>
                </div>
            </div>
        </div>
    </div>
{/if}

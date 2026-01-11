<script lang="ts">
    import { Compass } from "lucide-svelte";
    import Card from "./Card.svelte";
    import SensorVisualizerModal from "./SensorVisualizerModal.svelte";
    import Button from "./Button.svelte";

    let permissionGranted = $state(false);
    let isSupported = $state(true); // Default to true, verify on mount
    let errorMessage = $state("");

    // Sensor Data State
    let acceleration = $state({ x: 0, y: 0, z: 0 });
    let accelerationIG = $state({ x: 0, y: 0, z: 0 });
    let rotationRate = $state({ alpha: 0, beta: 0, gamma: 0 });
    let interval = $state(0);
    let activo = $state(false);
    // Helper for heading state (used by p5 if modal is open)
    let compassHeading = $state<{ heading: number; accuracy: number } | null>(
        null,
    );

    // Modal State
    let showVisualDemo = $state(false);

    function toggleSensorPermission() {
        activo = !activo;
    }

    $effect(() => {
        const requestSensorPermissions = async () => {
            errorMessage = ""; // Clear previous errors
            if (
                typeof (DeviceMotionEvent as any).requestPermission ===
                "function"
            ) {
                try {
                    const response = await (
                        DeviceMotionEvent as any
                    ).requestPermission();
                    if (response === "granted") {
                        permissionGranted = true;
                        startSensors();
                    } else {
                        errorMessage =
                            "Permiso denegado para acceder a los sensores.";
                    }
                } catch (e: any) {
                    console.error(e);
                    errorMessage =
                        "Error al solicitar permisos: " + (e.message || e);
                }
            } else {
                // Non-iOS or older devices
                permissionGranted = true;
                startSensors();
            }
        };

        const startSensors = () => {
            window.addEventListener("devicemotion", handleMotion, true);
            window.addEventListener(
                "deviceorientation",
                handleOrientation,
                true,
            );
        };

        const stopSensors = () => {
            window.removeEventListener("devicemotion", handleMotion, true);
            window.removeEventListener(
                "deviceorientation",
                handleOrientation,
                true,
            );
        };

        const handleMotion = (event: DeviceMotionEvent) => {
            if (event.acceleration) {
                acceleration = {
                    x: event.acceleration.x || 0,
                    y: event.acceleration.y || 0,
                    z: event.acceleration.z || 0,
                };
            }
            if (event.accelerationIncludingGravity) {
                accelerationIG = {
                    x: event.accelerationIncludingGravity.x || 0,
                    y: event.accelerationIncludingGravity.y || 0,
                    z: event.accelerationIncludingGravity.z || 0,
                };
            }
            if (event.rotationRate) {
                rotationRate = {
                    alpha: event.rotationRate.alpha || 0,
                    beta: event.rotationRate.beta || 0,
                    gamma: event.rotationRate.gamma || 0,
                };
            }
            interval = event.interval || 0;
        };

        const handleOrientation = (event: DeviceOrientationEvent) => {
            // Update compass heading state for p5 visualization
            const heading =
                (event as any).webkitCompassHeading || 360 - (event.alpha || 0);
            const accuracy = (event as any).webkitCompassAccuracy || 0;
            compassHeading = { heading, accuracy };
        };

        if (activo) {
            requestSensorPermissions();
        } else {
            stopSensors();
        }

        return () => {
            stopSensors();
        };
    });

    const openModal = () => {
        showVisualDemo = true;
    };

    const closeModal = () => {
        showVisualDemo = false;
    };
</script>

<Card
    title="Eventos de orientación"
    description="Datos del acelerómetro y giroscopio del dispositivo."
    class="col-span-1 md:col-span-2 lg:col-span-3"
>
    {#snippet icon()}
        <Compass size={20} />
    {/snippet}

    {#if !permissionGranted}
        <div
            class="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-900/50 rounded-lg border border-slate-800/50"
        >
            <p class="text-slate-400 max-w-sm">
                Esta API permite el uso de los datos de los sensores de
                movimiento de tu dispositivo, como el acelerómetro y el
                giroscopio.
            </p>

            {#if !isSupported}
                <div
                    class="text-amber-500 font-medium bg-amber-500/10 px-4 py-2 rounded"
                >
                    No se ha podido acceder o este dispositivo no tiene esta
                    función
                </div>
            {:else}
                {#if errorMessage}
                    <div
                        class="text-red-400 text-xs bg-red-900/20 px-3 py-2 rounded border border-red-900/50"
                    >
                        {errorMessage}
                    </div>
                {/if}
                <Button
                    text="Activar Sensores"
                    icon={Compass}
                    on:click={toggleSensorPermission}
                />
            {/if}
        </div>
    {:else}
        <!-- Sensor Data View -->
        <div class="space-y-6">
            <!-- Acceleration -->
            <div class="space-y-2">
                <h4
                    class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    Aceleración
                </h4>
                <div class="grid grid-cols-3 gap-2">
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Eje X</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-sky-400"
                                >{acceleration.x.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">m/s²</span>
                        </div>
                    </div>
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Eje Y</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-sky-400"
                                >{acceleration.y.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">m/s²</span>
                        </div>
                    </div>
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Eje Z</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-sky-400"
                                >{acceleration.z.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">m/s²</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Acceleration with Gravity -->
            <div class="space-y-2">
                <h4
                    class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    Aceleración (con gravedad)
                </h4>
                <div class="grid grid-cols-3 gap-2">
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Eje X</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-indigo-400"
                                >{accelerationIG.x.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">m/s²</span>
                        </div>
                    </div>
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Eje Y</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-indigo-400"
                                >{accelerationIG.y.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">m/s²</span>
                        </div>
                    </div>
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Eje Z</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-indigo-400"
                                >{accelerationIG.z.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">m/s²</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Rotation Rate -->
            <div class="space-y-2">
                <h4
                    class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    Velocidad de Rotación
                </h4>
                <div class="grid grid-cols-3 gap-2">
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Alpha (Z)</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-emerald-400"
                                >{rotationRate.alpha.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">°/s</span>
                        </div>
                    </div>
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Beta (X)</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-emerald-400"
                                >{rotationRate.beta.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">°/s</span>
                        </div>
                    </div>
                    <div
                        class="bg-slate-900 p-3 rounded border border-slate-700"
                    >
                        <span class="block text-xs text-slate-500 mb-1"
                            >Gamma (Y)</span
                        >
                        <div class="flex items-baseline gap-1">
                            <span class="font-mono text-emerald-400"
                                >{rotationRate.gamma.toFixed(2)}</span
                            >
                            <span class="text-[10px] text-slate-600">°/s</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Interval & Visual Button -->
            <div
                class="flex items-center justify-between pt-2 border-t border-slate-800"
            >
                <div class="flex items-center gap-2">
                    <span
                        class="text-xs text-slate-500 font-semibold uppercase tracking-wider"
                        >Intervalo</span
                    >
                    <span class="font-mono text-sm text-slate-300"
                        >{interval.toFixed(2)} ms</span
                    >
                </div>

                <Button
                    text="Ver demostración visual"
                    icon={Compass}
                    on:click={openModal}
                />
            </div>
        </div>
    {/if}
</Card>

<SensorVisualizerModal
    isOpen={showVisualDemo}
    onClose={closeModal}
    acceleration={accelerationIG}
    heading={compassHeading}
/>

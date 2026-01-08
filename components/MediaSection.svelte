<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {
        Camera,
        Mic,
        Video,
        AlertCircle,
        Volume2,
        Square,
        Play,
        Eye,
        MessageSquare,
        Trash2,
    } from "lucide-svelte";
    import Card from "./Card.svelte";

    type PermissionStatusState =
        | "granted"
        | "denied"
        | "prompt"
        | "unknown"
        | "unsupported";

    let camStatus = $state<PermissionStatusState>("unknown");
    let micStatus = $state<PermissionStatusState>("unknown");
    let devices = $state<MediaDeviceInfo[]>([]);
    let error = $state<string | null>(null);

    // Microphone Visualizer State
    let isListening = $state(false);
    let volume = $state(0);
    let audioContextRef: AudioContext | null = null; // Refs in Svelte can be just vars
    let analyserRef: AnalyserNode | null = null;
    let sourceRef: MediaStreamAudioSourceNode | null = null;
    let rafRef: number | null = null;
    let streamRef: MediaStream | null = null;

    // Speech Recognition State
    let isTranscribing = $state(false);
    let transcript = $state("");
    let recognitionRef: any = null;

    // Camera Preview State
    let isCameraActive = $state(false);
    let videoRef = $state<HTMLVideoElement | null>(null);
    let cameraStreamRef: MediaStream | null = null;

    const checkPermission = async (
        name: "camera" | "microphone",
        setStatus: (s: PermissionStatusState) => void,
    ) => {
        try {
            // @ts-ignore
            const result = await navigator.permissions.query({ name: name });
            setStatus(result.state as PermissionStatusState);

            result.onchange = () => {
                setStatus(result.state as PermissionStatusState);
                if (result.state === "granted") enumerateDevices();
            };
        } catch (e) {
            console.warn(`Permission query for ${name} failed`, e);
            setStatus("unsupported");
        }
    };

    const enumerateDevices = async () => {
        try {
            const devs = await navigator.mediaDevices.enumerateDevices();
            devices = devs.filter(
                (d) => d.kind === "videoinput" || d.kind === "audioinput",
            );
        } catch (e) {
            console.error("Error enumerating devices", e);
        }
    };

    onMount(() => {
        checkPermission("camera", (s) => (camStatus = s));
        checkPermission("microphone", (s) => (micStatus = s));
        enumerateDevices();

        navigator.mediaDevices.addEventListener(
            "devicechange",
            enumerateDevices,
        );
    });

    onDestroy(() => {
        navigator.mediaDevices.removeEventListener(
            "devicechange",
            enumerateDevices,
        );
        stopMicrophone();
        stopCamera();
        if (recognitionRef) {
            recognitionRef.stop();
        }
    });

    $effect(() => {
        if (isCameraActive && videoRef && cameraStreamRef) {
            videoRef.srcObject = cameraStreamRef;
            videoRef
                .play()
                .catch((e) => console.error("Error playing video:", e));
        }
    });

    const requestMedia = async (type: "video" | "audio") => {
        error = null;
        try {
            const constraints =
                type === "video" ? { video: true } : { audio: true };
            const stream =
                await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach((track) => track.stop());

            if (type === "video")
                checkPermission("camera", (s) => (camStatus = s));
            else checkPermission("microphone", (s) => (micStatus = s));
            enumerateDevices();
        } catch (err: any) {
            console.error("Error requesting media", err);
            // Fixed: accessing err.name is safer
            error = `Error al solicitar ${type === "video" ? "cámara" : "micrófono"}: ${err.name || err.message}`;
            if (type === "video")
                checkPermission("camera", (s) => (camStatus = s));
            else checkPermission("microphone", (s) => (micStatus = s));
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            cameraStreamRef = stream;
            isCameraActive = true;
            error = null;
        } catch (err: any) {
            error = "No se pudo acceder a la cámara para la prueba.";
            isCameraActive = false;
        }
    };

    const stopCamera = () => {
        if (cameraStreamRef) {
            cameraStreamRef.getTracks().forEach((track) => track.stop());
            cameraStreamRef = null;
        }
        if (videoRef) {
            videoRef.srcObject = null;
        }
        isCameraActive = false;
    };

    const handleCameraToggle = () => {
        if (isCameraActive) stopCamera();
        else startCamera();
    };

    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            streamRef = stream;

            // @ts-ignore
            const AudioContext =
                window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);

            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef = audioCtx;
            analyserRef = analyser;
            sourceRef = source;
            isListening = true;
            error = null;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                volume = Math.min(100, Math.round((average / 128) * 100));
                rafRef = requestAnimationFrame(updateVolume);
            };

            updateVolume();
        } catch (err: any) {
            error = "No se pudo acceder al micrófono para la prueba.";
            isListening = false;
        }
    };

    const stopMicrophone = () => {
        if (rafRef) cancelAnimationFrame(rafRef);
        if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
        if (audioContextRef) audioContextRef.close();

        isListening = false;
        volume = 0;
        streamRef = null;
        audioContextRef = null;
    };

    const handleMicToggle = () => {
        if (isListening) stopMicrophone();
        else startMicrophone();
    };

    const toggleTranscription = () => {
        if (isTranscribing) {
            if (recognitionRef) recognitionRef.stop();
            isTranscribing = false;
            return;
        }

        // @ts-ignore
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            error =
                "Tu navegador no soporta la API de SpeechRecognition (Prueba Chrome/Edge).";
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "es-ES";
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => (isTranscribing = true);
            recognition.onend = () => (isTranscribing = false);
            recognition.onerror = (event: any) => {
                console.error("Speech error", event.error);
                error = `Error de reconocimiento: ${event.error}`;
                isTranscribing = false;
            };

            recognition.onresult = (event: any) => {
                let finalTrans = "";
                let interimTrans = "";
                const resultsArray = Array.from(event.results).map((r) =>
                    Array.from(r).map((alternative) => ({
                        transcript: alternative.transcript,
                        confidence: alternative.confidence,
                        isFinal: r.isFinal,
                    })),
                );

                console.log(event);
                console.log(JSON.stringify(resultsArray, null, 2));
                resultsArray.forEach((results) => {
                    console.log(results);
                    for (let i = 0; i < results.length; i++) {
                        const text = results[i].transcript;
                        if (results[i].isFinal && results[i].confidence > 0) {
                            finalTrans += text;
                            interimTrans = ""
                        } else {
                            interimTrans += text;
                        }
                    }
                });
                transcript =
                    finalTrans + (interimTrans ? ` [${interimTrans}]` : "");
            };

            recognitionRef = recognition;
            recognition.start();
            error = null;
        } catch (e: any) {
            error = "No se pudo iniciar el reconocimiento de voz.";
        }
    };

    const getStatusColor = (status: PermissionStatusState) => {
        switch (status) {
            case "granted":
                return "text-green-400";
            case "denied":
                return "text-red-400";
            case "prompt":
                return "text-yellow-400";
            default:
                return "text-slate-500";
        }
    };

    const getStatusLabel = (status: PermissionStatusState) => {
        switch (status) {
            case "granted":
                return "Concedido";
            case "denied":
                return "Bloqueado";
            case "prompt":
                return "Preguntar";
            case "unsupported":
                return "API No Soportada";
            default:
                return "Desconocido";
        }
    };
</script>

<Card
    title="Multimedia (A/V)"
    description="Estado de permisos y dispositivos detectados."
>
    {#snippet icon()}
        <Video size={20} />
    {/snippet}

    <div class="space-y-4">
        <!-- Camera Status -->
        <div class="p-3 bg-slate-900/40 rounded border border-slate-800">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Camera size={18} class="text-slate-400" />
                    <div>
                        <div class="text-sm font-medium text-slate-200">
                            Cámara
                        </div>
                        <div
                            class="text-xs {getStatusColor(
                                camStatus,
                            )} font-mono uppercase"
                        >
                            {getStatusLabel(camStatus)}
                        </div>
                    </div>
                </div>
                {#if camStatus !== "granted"}
                    <button
                        onclick={() => requestMedia("video")}
                        class="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                    >
                        Solicitar Acceso
                    </button>
                {/if}
            </div>

            <!-- Camera Preview UI -->
            {#if camStatus === "granted"}
                <div class="mt-3 pt-3 border-t border-slate-700/50">
                    <div class="flex items-center justify-between mb-2">
                        <div
                            class="flex items-center gap-2 text-xs text-slate-400"
                        >
                            <Eye size={14} />
                            <span>Prueba de Video</span>
                        </div>
                        <button
                            onclick={handleCameraToggle}
                            class="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors {isCameraActive
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'}"
                        >
                            {#if isCameraActive}
                                <Square size={10} fill="currentColor" /> Detener
                            {:else}
                                <Play size={10} fill="currentColor" /> Ver Cámara
                            {/if}
                        </button>
                    </div>

                    {#if isCameraActive}
                        <div
                            class="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-inner"
                        >
                            <!-- svelte-ignore a11y_media_has_caption -->
                            <video
                                bind:this={videoRef}
                                autoplay
                                playsinline
                                muted
                                class="w-full h-full object-cover -scale-x-100"
                            ></video>
                            <div
                                class="absolute top-2 right-2 flex items-center gap-1 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse"
                            >
                                <span class="w-1.5 h-1.5 rounded-full bg-white"
                                ></span> REC
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Mic Status -->
        <div class="p-3 bg-slate-900/40 rounded border border-slate-800">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Mic size={18} class="text-slate-400" />
                    <div>
                        <div class="text-sm font-medium text-slate-200">
                            Micrófono
                        </div>
                        <div
                            class="text-xs {getStatusColor(
                                micStatus,
                            )} font-mono uppercase"
                        >
                            {getStatusLabel(micStatus)}
                        </div>
                    </div>
                </div>
                {#if micStatus !== "granted"}
                    <button
                        onclick={() => requestMedia("audio")}
                        class="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                    >
                        Solicitar Acceso
                    </button>
                {/if}
            </div>

            {#if micStatus === "granted"}
                <div class="space-y-4">
                    <!-- Visualizer UI -->
                    <div class="mt-3 pt-3 border-t border-slate-700/50">
                        <div class="flex items-center justify-between mb-2">
                            <div
                                class="flex items-center gap-2 text-xs text-slate-400"
                            >
                                <Volume2 size={14} />
                                <span>Prueba de Entrada</span>
                            </div>
                            <button
                                onclick={handleMicToggle}
                                class="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors {isListening
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}"
                            >
                                {#if isListening}
                                    <Square size={10} fill="currentColor" />
                                    Detener
                                {:else}
                                    <Play size={10} fill="currentColor" /> Escuchar
                                {/if}
                            </button>
                        </div>

                        <!-- Volume Bar -->
                        <div
                            class="h-2 bg-slate-800 rounded-full overflow-hidden flex items-center"
                        >
                            <div
                                class="h-full transition-all duration-75 ease-out rounded-full {volume >
                                80
                                    ? 'bg-red-500'
                                    : volume > 50
                                      ? 'bg-yellow-400'
                                      : 'bg-emerald-500'}"
                                style="width: {Math.max(
                                    2,
                                    volume,
                                )}%; opacity: {isListening ? 1 : 0.3}"
                            ></div>
                        </div>
                    </div>

                    <!-- Speech Recognition UI -->
                    <div class="pt-3 border-t border-slate-700/50">
                        <div class="flex items-center justify-between mb-2">
                            <div
                                class="flex items-center gap-2 text-xs text-slate-400"
                            >
                                <MessageSquare size={14} />
                                <span>Transcripción (Speech-to-Text)</span>
                            </div>
                            <button
                                onclick={toggleTranscription}
                                class="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors {isTranscribing
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}"
                            >
                                {#if isTranscribing}
                                    <Square size={10} fill="currentColor" />
                                    Detener Rec.
                                {:else}
                                    <Mic size={10} fill="currentColor" /> Iniciar
                                    Rec.
                                {/if}
                            </button>
                        </div>

                        <div class="relative">
                            <textarea
                                value={transcript}
                                readonly
                                placeholder={isTranscribing
                                    ? "Escuchando... (habla ahora)"
                                    : "El texto transcrito aparecerá aquí..."}
                                class="w-full h-24 bg-black/30 border {isTranscribing
                                    ? 'border-indigo-500/50'
                                    : 'border-slate-700'} rounded p-2 text-xs text-slate-300 font-mono resize-none focus:outline-none transition-colors"
                            ></textarea>
                            {#if transcript}
                                <button
                                    onclick={() => (transcript = "")}
                                    class="absolute bottom-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 transition-colors"
                                    title="Borrar texto"
                                >
                                    <Trash2 size={12} />
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        {#if error}
            <div
                class="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20 flex items-center gap-2"
            >
                <AlertCircle size={14} />
                {error}
            </div>
        {/if}

        {#if camStatus === "granted" || micStatus === "granted"}
            <div class="mt-4 pt-3 border-t border-slate-700/50">
                <h4
                    class="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider"
                >
                    Dispositivos Detectados
                </h4>
                {#if devices.length > 0}
                    <ul class="space-y-1.5">
                        {#each devices as device, idx}
                            <li
                                class="text-xs text-slate-300 flex items-center gap-2 truncate"
                            >
                                {#if device.kind === "videoinput"}
                                    <Video size={12} class="shrink-0" />
                                {:else}
                                    <Mic size={12} class="shrink-0" />
                                {/if}
                                <span class="truncate"
                                    >{device.label ||
                                        "Dispositivo desconocido (etiqueta oculta)"}</span
                                >
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-xs text-slate-500 italic">
                        No se detectaron dispositivos.
                    </p>
                {/if}
            </div>
        {/if}
    </div></Card
>

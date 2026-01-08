<script lang="ts">
    import { ShieldCheck, Eye, Info, Github } from "lucide-svelte";
    import HardwareSection from "./components/HardwareSection.svelte";
    import DisplaySection from "./components/DisplaySection.svelte";
    import FingerprintSection from "./components/FingerprintSection.svelte";
    import NetworkSection from "./components/NetworkSection.svelte";
    import PreferencesSection from "./components/PreferencesSection.svelte";
    import BehaviorSection from "./components/BehaviorSection.svelte";
    import LocationSection from "./components/LocationSection.svelte";
    import MediaSection from "./components/MediaSection.svelte";
    import ClipboardSection from "./components/ClipboardSection.svelte";
    import NotificationSection from "./components/NotificationSection.svelte";
</script>

<div
    class="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans selection:bg-sky-500/30"
>
    <div class="max-w-7xl mx-auto space-y-8">
        <!-- Header -->
        <header
            class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4"
        >
            <div class="flex items-center gap-4">
                <div
                    class="bg-sky-500 p-3 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                >
                    <Eye class="text-white" size={32} />
                </div>
                <div>
                    <h1
                        class="text-3xl md:text-4xl font-bold text-white tracking-tight"
                    >
                        Browser<span class="text-sky-400">Scope</span>
                    </h1>
                    <p class="text-slate-400 text-sm mt-1">
                        Herramienta de introspección del navegador (Client-Side
                        Intelligence)
                    </p>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                <a
                    href="https://github.com/emaza/browser-scope-inspector"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50 p-2 rounded-lg transition-all group"
                    title="Ver código fuente en GitHub"
                >
                    <Github
                        size={22}
                        class="group-hover:scale-110 transition-transform"
                    />
                    <span class="md:hidden text-sm font-medium"
                        >Ver en GitHub</span
                    >
                </a>

                <div
                    class="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800"
                >
                    <ShieldCheck size={14} class="text-green-500 shrink-0" />
                    <span
                        >Datos generados localmente. Nada sale de tu
                        dispositivo.</span
                    >
                </div>
            </div>
        </header>

        <!-- Info Banner -->
        <div
            class="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 flex gap-3 text-sm text-indigo-200"
        >
            <Info size={20} class="shrink-0 text-indigo-400" />
            <p>
                Esta demostración utiliza <strong>JavaScript estándar</strong> para
                recopilar datos expuestos por tu navegador. Los sitios web pueden
                usar estos datos para análisis, publicidad dirigida o creación de
                huellas digitales (fingerprinting).
            </p>
        </div>

        <!-- Dashboard Grid -->
        <main class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <HardwareSection />
            <DisplaySection />
            <NetworkSection />
            <LocationSection />
            <MediaSection />
            <ClipboardSection />
            <NotificationSection />
            <FingerprintSection />
            <PreferencesSection />
            <BehaviorSection />
        </main>

        <!-- Footer -->
        <footer class="pt-12 text-center text-slate-600 text-xs">
            <p class="mb-2">Svelte + TypeScript + Tailwind</p>
            <p>
                &copy; {new Date().getFullYear()} Browser Scope Demo. Only for educational
                purposes.
            </p>
        </footer>
    </div>
</div>

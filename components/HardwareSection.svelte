<script lang="ts">
  import { Cpu, Battery, BatteryCharging } from "lucide-svelte";
  import Card from "./Card.svelte";
  import DataRow from "./DataRow.svelte";
  import type { ExtendedNavigator, BatteryManager } from "../types";

  let battery = $state<{ level: number; charging: boolean } | null>(null);
  let gpu = $state("Desconocida");

  const nav = navigator as ExtendedNavigator;

  $effect(() => {
    let batteryManager: BatteryManager | null = null;
    let isMounted = true;

    try {
      nav.getBattery().then((batt: BatteryManager) => {
        if (!isMounted) return;
        batteryManager = batt;
        updateBattery();

        batt.addEventListener("levelchange", updateBattery);
        batt.addEventListener("chargingchange", updateBattery);
      });
    } catch (error) {
      console.error("Battery API not supported", error);
    }

    const updateBattery = () => {
      if (batteryManager) {
        battery = {
          level: batteryManager.level,
          charging: batteryManager.charging,
        };
      }
    };

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const ctx = gl as WebGLRenderingContext;
        const debugInfo = ctx.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpu = ctx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      console.error("WebGL GPU detection failed", e);
    }

    return () => {
      isMounted = false;
      if (batteryManager) {
        batteryManager.removeEventListener("levelchange", updateBattery);
        batteryManager.removeEventListener("chargingchange", updateBattery);
      }
    };
  });
</script>

<Card
  title="Hardware (Capa Física)"
  description="Especificaciones técnicas expuestas por el navegador."
>
  {#snippet icon()}
    <Cpu size={20} />
  {/snippet}

  <DataRow
    label="Núcleos de CPU"
    value={nav.hardwareConcurrency
      ? `${nav.hardwareConcurrency} Hilos Lógicos`
      : "No disponible"}
  />
  <DataRow
    label="Memoria RAM (Aprox.)"
    value={nav.deviceMemory ? `~${nav.deviceMemory} GB` : "No disponible"}
    highlight
  />
  <DataRow label="GPU / Renderizador" value={gpu} />

  <DataRow label="Batería">
    {#snippet value()}
      {#if battery}
        <div class="flex items-center gap-2 justify-end">
          <span>{(battery.level * 100).toFixed(0)}%</span>
          {#if battery.charging}
            <BatteryCharging size={16} class="text-green-400" />
          {:else}
            <Battery size={16} class="text-yellow-400" />
          {/if}
        </div>
      {:else}
        API no soportada / Bloqueada
      {/if}
    {/snippet}
  </DataRow>

  <DataRow label="Plataforma" value={nav.platform} />
</Card>

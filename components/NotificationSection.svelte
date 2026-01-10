<script lang="ts">
  import { onMount } from "svelte";
  import { Bell, Megaphone, MegaphoneOff, RefreshCw } from "lucide-svelte";
  import Card from "./Card.svelte";
  import Button from "./Button.svelte";

  let permission = $state<NotificationPermission>("default");
  let isDelayed = $state(false);
  let loading = $state(false);

  onMount(() => {
    if ("Notification" in window) {
      permission = Notification.permission;
    }
  });

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }
    loading = true;
    const result = await Notification.requestPermission();
    permission = result;
    loading = false;
  };

  const sendNotification = (delayed = false) => {
    if (permission !== "granted") {
      requestPermission();
      return;
    }

    const trigger = () => {
      const notif = new Notification(
        delayed ? "🔔 Notificación Diferida" : "👋 Hola Mundo",
        {
          body: delayed
            ? "¡Esto apareció mientras estabas en otra pestaña (o esperando)!"
            : "Esta es una notificación local generada por JavaScript.",
          icon: "https://cdn-icons-png.flaticon.com/512/1827/1827347.png", // Generic bell icon
          tag: "browser-scope-demo",
          silent: false,
          // @ts-ignore
          vibrate: [200, 100, 200],
        },
      );

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      isDelayed = false;
    };

    if (delayed) {
      isDelayed = true;
      setTimeout(trigger, 5000);
    } else {
      trigger();
    }
  };
</script>

<Card
  title="Notificaciones (Local API)"
  description="Alertas del sistema sin necesidad de servidor."
>
  {#snippet icon()}
    <Bell size={20} />
  {/snippet}

  <div class="space-y-4">
    <!-- Status Bar -->
    <div
      class="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded border border-slate-800"
    >
      <span class="text-slate-400">Estado del Permiso:</span>
      <span
        class="font-mono uppercase font-bold {permission === 'granted'
          ? 'text-green-400'
          : permission === 'denied'
            ? 'text-red-400'
            : 'text-yellow-400'}"
      >
        {permission === "granted"
          ? "CONCEDIDO"
          : permission === "denied"
            ? "BLOQUEADO"
            : "PREGUNTAR"}
      </span>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-1 gap-3">
      {#if permission === "default"}
        <Button
          on:click={requestPermission}
          class="w-full"
          disabled={loading}
          text={loading ? "Solicitando..." : "Activar notificaciones"}
          icon={loading ? RefreshCw : Megaphone}
        />
      {/if}

      {#if permission === "granted"}
        <Button
          text="Enviar Ahora"
          icon={Megaphone}
          on:click={() => sendNotification(false)}
          class="w-full"
        />

        <Button
          text={isDelayed ? "Esperando 5 segundos..." : "Enviar en 5 segundos"}
          icon={Megaphone}
          on:click={() => sendNotification(true)}
          disabled={isDelayed}
          class="w-full"
          variant={isDelayed ? "pending" : "default"}
          iconClass={isDelayed ? "animate-spin" : ""}
        />
        <p class="text-[10px] text-center text-slate-500">
          Prueba el botón de "5 segundos" y cambia rápidamente a otra pestaña o
          minimiza el navegador.
        </p>
      {/if}

      {#if permission === "denied"}
        <div
          class="p-3 bg-red-900/20 border border-red-500/20 rounded text-center"
        >
          <div class="flex justify-center mb-1 text-red-400">
            <MegaphoneOff size={20} />
          </div>
          <p class="text-xs text-red-300">
            Has bloqueado las notificaciones. Debes habilitarlas manualmente en
            la configuración del navegador (icono del candado en la URL).
          </p>
        </div>
      {/if}
    </div>

    <!-- Educational Info -->
    <div
      class="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400 space-y-2"
    >
      <h4 class="font-semibold text-slate-300">¿Local vs Push?</h4>
      <ul class="list-disc pl-4 space-y-1">
        <li>
          <strong class="text-sky-400">Local (Esta demo):</strong> Generada por JavaScript
          en la pestaña abierta. Muere si cierras la web.
        </li>
        <li>
          <strong class="text-indigo-400">Push (Servidor):</strong> Usa un
          <em>Service Worker</em>. El servidor despierta al navegador incluso si
          la web está cerrada (como WhatsApp Web).
        </li>
      </ul>
    </div>
  </div>
</Card>

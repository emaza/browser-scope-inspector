/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Clock, Zap } from 'lucide-react';
import { Card } from './Card';

const NotificationSection: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("Tu navegador no soporta notificaciones.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const sendNotification = (delayed = false) => {
    if (permission !== 'granted') {
      requestPermission();
      return;
    }

    const trigger = () => {
      const notif = new Notification(delayed ? "🔔 Notificación Diferida" : "👋 Hola Mundo", {
        body: delayed 
          ? "¡Esto apareció mientras estabas en otra pestaña (o esperando)!" 
          : "Esta es una notificación local generada por JavaScript.",
        icon: "https://cdn-icons-png.flaticon.com/512/1827/1827347.png", // Generic bell icon
        tag: "browser-scope-demo", // Prevent stacking
        silent: false,
        // @ts-ignore
        vibrate: [200, 100, 200] // Vibration pattern for mobile
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      
      setIsDelayed(false);
    };

    if (delayed) {
      setIsDelayed(true);
      setTimeout(trigger, 5000);
    } else {
      trigger();
    }
  };

  return (
    <Card 
      title="Notificaciones (Local API)" 
      description="Alertas del sistema sin necesidad de servidor."
      icon={<Bell size={20} />}
    >
      <div className="space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
          <span className="text-slate-400">Estado del Permiso:</span>
          <span className={`font-mono uppercase font-bold ${
            permission === 'granted' ? 'text-green-400' : 
            permission === 'denied' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {permission === 'granted' ? 'CONCEDIDO' : 
             permission === 'denied' ? 'BLOQUEADO' : 'PREGUNTAR'}
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3">
          {permission === 'default' && (
            <button 
              onClick={requestPermission}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
            >
              <BellRing size={14} /> Solicitar Permiso
            </button>
          )}

          {permission === 'granted' && (
            <>
              <button 
                onClick={() => sendNotification(false)}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all"
              >
                <Zap size={14} className="text-yellow-400" /> Enviar Ahora
              </button>

              <button 
                onClick={() => sendNotification(true)}
                disabled={isDelayed}
                className={`w-full py-2.5 border text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${
                  isDelayed 
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 cursor-wait' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <Clock size={14} className={isDelayed ? "animate-spin" : ""} />
                {isDelayed ? "Esperando 5 segundos..." : "Enviar en 5 segundos (Cambia de tab)"}
              </button>
              <p className="text-[10px] text-center text-slate-500">
                Prueba el botón de "5 segundos" y cambia rápidamente a otra pestaña o minimiza el navegador.
              </p>
            </>
          )}

          {permission === 'denied' && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded text-center">
              <div className="flex justify-center mb-1 text-red-400"><BellOff size={20} /></div>
              <p className="text-xs text-red-300">
                Has bloqueado las notificaciones. Debes habilitarlas manualmente en la configuración del navegador (icono del candado en la URL).
              </p>
            </div>
          )}
        </div>

        {/* Educational Info */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-300">¿Local vs Push?</h4>
            <ul className="list-disc pl-4 space-y-1">
                <li>
                    <strong className="text-sky-400">Local (Esta demo):</strong> Generada por JavaScript en la pestaña abierta. Muere si cierras la web.
                </li>
                <li>
                    <strong className="text-indigo-400">Push (Servidor):</strong> Usa un <em>Service Worker</em>. El servidor despierta al navegador incluso si la web está cerrada (como WhatsApp Web).
                </li>
            </ul>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSection;
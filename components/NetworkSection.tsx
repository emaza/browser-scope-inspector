/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState } from 'react';
import { Wifi, HelpCircle, Activity } from 'lucide-react';
import { Card, DataRow } from './Card';
import { ExtendedNavigator } from '../types';
import { InfoModal } from './InfoModal';

const NetworkSection: React.FC = () => {
  const [ips, setIps] = useState<string[]>([]);
  const [ipStatus, setIpStatus] = useState<string>('Analizando...');
  const [connection, setConnection] = useState<any>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Online/Offline Status listeners
    const handleStatusChange = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const nav = navigator as ExtendedNavigator;
    if (nav.connection) {
      setConnection({
        type: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        saveData: nav.connection.saveData
      });
      setRtt(nav.connection.rtt || null);

      const updateConn = () => {
        setConnection({
            type: nav.connection?.effectiveType,
            downlink: nav.connection?.downlink,
            saveData: nav.connection?.saveData
        });
        setRtt(nav.connection?.rtt || null);
      };
      nav.connection.addEventListener('change', updateConn);
      
      return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
        nav.connection?.removeEventListener('change', updateConn);
      };
    }

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    // WebRTC Local IP Detection Logic
    const encontrarIPLocal = () => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel(""); // Necesario para disparar el proceso ICE
        
        const foundIps = new Set<string>();

        pc.onicecandidate = (e) => {
          if (!e.candidate) return;
          
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
          const match = ipRegex.exec(e.candidate.candidate);
          
          if (match) {
            const ip = match[1];
            
            // Avoid duplicates
            if (foundIps.has(ip)) return;
            foundIps.add(ip);

            // Classification logic from prompt
            let displayIp = ip;
            if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)) {
                // Private IP
                displayIp = `🏠 ${ip}`;
            } else {
                // Public or other
                displayIp = `🌐 ${ip}`;
            }
            
            setIps(prev => {
                const newSet = new Set([...prev, displayIp]);
                return Array.from(newSet);
            });
            setIpStatus(''); // Clear status if we found something
          } else if (e.candidate.candidate.includes('.local')) {
             if (!foundIps.has('mDNS')) {
                foundIps.add('mDNS');
                setIps(prev => [...prev, '🔒 Oculta (mDNS)']);
                setIpStatus('');
             }
          }
        };

        pc.createOffer().then(sdp => pc.setLocalDescription(sdp));
        
        // Timeout check
        setTimeout(() => {
            setIps(current => {
                if (current.length === 0) setIpStatus('No detectada (Bloqueada)');
                return current;
            });
            pc.close();
        }, 3000);

      } catch (err) {
        setIpStatus('Error WebRTC');
      }
    };

    encontrarIPLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Card 
        title="Red y Conectividad" 
        description="Información de conexión visible desde el cliente."
        icon={<Wifi size={20} />}
      >
        <DataRow 
          label="Estado de Red" 
          value={
            <div className={`flex items-center justify-end gap-2 font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400'}`}></span>
                {isOnline ? 'CONECTADO' : 'OFFLINE'}
            </div>
          } 
        />
        <DataRow 
          label={
            <div className="flex items-center gap-2">
              <span>IPs Detectadas</span>
              <button 
                onClick={() => setShowModal(true)} 
                className="text-slate-500 hover:text-sky-400 transition-colors focus:outline-none"
                title="¿Qué significa esto?"
              >
                <HelpCircle size={15} />
              </button>
            </div>
          } 
          value={
            ips.length > 0 ? (
              <div className="flex flex-col items-end gap-1">
                {ips.map((ip, i) => (
                  <span key={i} className="text-xs bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
                    {ip}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">{ipStatus}</span>
            )
          } 
          highlight
        />
        <DataRow 
          label="Tipo de Conexión" 
          value={connection ? connection.type?.toUpperCase() : 'Desconocido'} 
        />
        <DataRow 
          label="Ancho de Banda (Est.)" 
          value={connection?.downlink ? `~${connection.downlink} Mbps` : 'N/A'} 
        />
        <DataRow 
          label="Latencia (RTT)" 
          value={rtt ? `${rtt} ms` : 'N/A'} 
        />
        <DataRow 
          label="Ahorro de Datos" 
          value={connection?.saveData ? 'Activado' : 'Desactivado'} 
        />
      </Card>

      <InfoModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="¿Qué significan los resultados?"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sky-400 mb-1">Si ves una IP que empieza por 192.168.x.x o 10.x.x.x:</h4>
            <p className="text-slate-400">
              Tu navegador está informando de tu dirección de red interna. Cualquier sitio web que visites podría saber cómo está organizada tu red doméstica.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sky-400 mb-1">Si ves una cadena larga de letras y números (IPv6):</h4>
            <p className="text-slate-400">
              Es tu dirección de nueva generación. Muchas veces estas son temporales, pero siguen siendo identificadores únicos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-400 mb-1">Si no aparece nada o da error:</h4>
            <p className="text-slate-400">
              ¡Felicidades! Tu navegador o tu VPN están bloqueando con éxito las fugas de WebRTC.
            </p>
          </div>
        </div>
      </InfoModal>
    </>
  );
};

export default NetworkSection;
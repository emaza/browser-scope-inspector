/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState } from 'react';
import { Wifi, Globe, Activity } from 'lucide-react';
import { Card, DataRow } from './Card';
import { ExtendedNavigator } from '../types';

const NetworkSection: React.FC = () => {
  const [ip, setIp] = useState<string>('Analizando...');
  const [connection, setConnection] = useState<any>(null);
  const [rtt, setRtt] = useState<number | null>(null);

  useEffect(() => {
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
      return () => nav.connection?.removeEventListener('change', updateConn);
    }
  }, []);

  useEffect(() => {
    // WebRTC Local IP Detection Logic
    const getLocalIP = async () => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        
        pc.onicecandidate = (e) => {
          if (!e.candidate) return;
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
          const match = ipRegex.exec(e.candidate.candidate);
          if (match) {
            setIp(match[1]);
            pc.close();
          } else {
             // Modern browsers obfuscate this to mDNS strings
             if (e.candidate.candidate.includes('.local')) {
                 setIp("Oculta (mDNS detectado)");
             }
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        // Timeout
        setTimeout(() => {
            if(pc.signalingState !== 'closed') {
                if(ip === 'Analizando...') setIp('No disponible (Bloqueado por navegador)');
                pc.close();
            }
        }, 3000);

      } catch (err) {
        setIp('Bloqueado / Error WebRTC');
      }
    };

    getLocalIP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card 
      title="Red y Conectividad" 
      description="Información de conexión visible desde el cliente."
      icon={<Wifi size={20} />}
    >
      <DataRow 
        label="IP Local (WebRTC)" 
        value={ip} 
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
  );
};

export default NetworkSection;
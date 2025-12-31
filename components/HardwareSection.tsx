/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState } from 'react';
import { Cpu, Battery, BatteryCharging, CircuitBoard } from 'lucide-react';
import { Card, DataRow } from './Card';
import { ExtendedNavigator, BatteryManager } from '../types';

const HardwareSection: React.FC = () => {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [gpu, setGpu] = useState<string>('Desconocida');

  const nav = navigator as ExtendedNavigator;

  useEffect(() => {
    // Battery API
    if (nav.getBattery) {
      nav.getBattery().then((batt: BatteryManager) => {
        const updateBattery = () => {
          setBattery({
            level: batt.level,
            charging: batt.charging
          });
        };
        updateBattery();
        batt.addEventListener('levelchange', updateBattery);
        batt.addEventListener('chargingchange', updateBattery);
      });
    }

    // GPU Info via WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        // Explicitly cast gl to WebGLRenderingContext to access getExtension
        const ctx = gl as WebGLRenderingContext;
        const debugInfo = ctx.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = ctx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          setGpu(renderer);
        }
      }
    } catch (e) {
      console.error("WebGL GPU detection failed", e);
    }
  }, [nav]);

  return (
    <Card 
      title="Hardware (Capa Física)" 
      description="Especificaciones técnicas expuestas por el navegador."
      icon={<Cpu size={20} />}
    >
      <DataRow 
        label="Núcleos de CPU" 
        value={nav.hardwareConcurrency ? `${nav.hardwareConcurrency} Hilos Lógicos` : 'No disponible'} 
      />
      <DataRow 
        label="Memoria RAM (Aprox.)" 
        value={nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'No disponible'} 
        highlight
      />
      <DataRow 
        label="GPU / Renderizador" 
        value={<span className="text-xs break-all">{gpu}</span>} 
      />
      <DataRow 
        label="Batería" 
        value={
          battery ? (
            <div className="flex items-center gap-2 justify-end">
              <span>{(battery.level * 100).toFixed(0)}%</span>
              {battery.charging ? <BatteryCharging size={16} className="text-green-400" /> : <Battery size={16} className="text-yellow-400" />}
            </div>
          ) : 'API no soportada / Bloqueada'
        } 
      />
      <DataRow 
        label="Plataforma" 
        value={nav.platform} 
      />
    </Card>
  );
};

export default HardwareSection;
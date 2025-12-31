/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Monitor, Maximize } from 'lucide-react';
import { Card, DataRow } from './Card';

const DisplaySection: React.FC = () => {
  const [dims, setDims] = useState({
    screenW: window.screen.width,
    screenH: window.screen.height,
    windowW: window.innerWidth,
    windowH: window.innerHeight,
    availW: window.screen.availWidth,
    availH: window.screen.availHeight,
    depth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio
  });

  useEffect(() => {
    const handleResize = () => {
      setDims({
        screenW: window.screen.width,
        screenH: window.screen.height,
        windowW: window.innerWidth,
        windowH: window.innerHeight,
        availW: window.screen.availWidth,
        availH: window.screen.availHeight,
        depth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMultiMonitor = (window.screen as any).isExtended || (window.screen.availWidth > window.screen.width);

  return (
    <Card 
      title="Pantalla y Entorno" 
      description="Dimensiones y configuración gráfica."
      icon={<Monitor size={20} />}
    >
      <DataRow 
        label="Resolución de Pantalla" 
        value={`${dims.screenW} x ${dims.screenH}`} 
      />
      <DataRow 
        label="Viewport (Ventana)" 
        value={`${dims.windowW} x ${dims.windowH}`} 
        highlight
      />
      <DataRow 
        label="Area Disponible" 
        value={`${dims.availW} x ${dims.availH}`} 
      />
      <DataRow 
        label="Profundidad de Color" 
        value={`${dims.depth}-bit`} 
      />
      <DataRow 
        label="Densidad de Píxeles (DPR)" 
        value={`${dims.pixelRatio}x`} 
      />
      <DataRow 
        label="Posible Multi-Monitor" 
        value={isMultiMonitor ? 'Sí (Detectado)' : 'No / Desconocido'} 
      />
      <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-center border border-dashed border-slate-700">
        Orientación: {screen.orientation ? screen.orientation.type : 'Desconocida'}
      </div>
    </Card>
  );
};

export default DisplaySection;
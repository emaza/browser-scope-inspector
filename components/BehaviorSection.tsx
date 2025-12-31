/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState, useRef } from 'react';
import { MousePointer2, Keyboard, Activity } from 'lucide-react';
import { Card } from './Card';

const BehaviorSection: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clicks, setClicks] = useState(0);
  const [keystrokes, setKeystrokes] = useState<number[]>([]);
  const [text, setText] = useState('');
  
  // Track total distance moved
  const distanceRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Calculate distance
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Only add meaningful movements to avoid jitter
      if (dist > 2) {
        distanceRef.current += dist;
        // Update state less frequently for performance
        if (Math.random() > 0.8) setTotalDistance(Math.round(distanceRef.current));
      }
      
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = () => {
      setClicks(prev => prev + 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    const now = performance.now();
    setKeystrokes(prev => {
        const newHistory = [...prev, now];
        // Keep only last 10 keystrokes for calculation to keep it "current"
        return newHistory.slice(-10);
    });
  };

  // Calculate generic typing "cadence" (avg time between keys)
  const getTypingCadence = () => {
    if (keystrokes.length < 2) return 0;
    let totalDiff = 0;
    for (let i = 1; i < keystrokes.length; i++) {
        totalDiff += (keystrokes[i] - keystrokes[i-1]);
    }
    return Math.round(totalDiff / (keystrokes.length - 1));
  };

  return (
    <Card 
      title="Biometría del Comportamiento" 
      description="Cómo interactúas con la página (Mouse y Teclado)."
      icon={<Activity size={20} />}
      className="col-span-1 md:col-span-2 lg:col-span-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mouse Tracking */}
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <MousePointer2 size={16} /> Rastreo del Cursor
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <span className="block text-slate-500 mb-1">Posición Actual</span>
                    <span className="font-mono text-sky-400">X: {mousePos.x}, Y: {mousePos.y}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <span className="block text-slate-500 mb-1">Distancia Recorrida</span>
                    <span className="font-mono text-sky-400">{totalDistance} px</span>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-700 col-span-2">
                    <span className="block text-slate-500 mb-1">Total Clics (Sesión)</span>
                    <span className="font-mono text-sky-400">{clicks}</span>
                </div>
            </div>
            <p className="text-xs text-slate-500 italic mt-2">
                * Tu navegador reporta cada micro-movimiento, lo cual puede usarse para generar un mapa de calor o validar si eres humano (reCAPTCHA v3).
            </p>
        </div>

        {/* Typing Biometrics */}
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Keyboard size={16} /> Dinámica de Teclado
            </h3>
            <div className="relative">
                <input 
                    type="text" 
                    value={text}
                    onChange={handleTyping}
                    placeholder="Escribe aquí para analizar tu ritmo..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <div className="absolute right-3 top-3">
                    <span className={`w-2 h-2 rounded-full inline-block ${keystrokes.length > 0 && performance.now() - keystrokes[keystrokes.length-1] < 200 ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></span>
                </div>
            </div>
            
            <div className="flex gap-4 items-center">
                 <div className="bg-slate-900 p-3 rounded border border-slate-700 flex-1">
                    <span className="block text-slate-500 text-xs mb-1">Latencia Media entre Teclas</span>
                    <span className="font-mono text-xl text-sky-400">
                        {getTypingCadence() > 0 ? `${getTypingCadence()} ms` : '--'}
                    </span>
                </div>
                 <div className="flex-1 text-xs text-slate-500">
                    La "huella de tecleo" mide el tiempo de vuelo entre teclas. Es única para cada persona y puede usarse para autenticación continua.
                 </div>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default BehaviorSection;
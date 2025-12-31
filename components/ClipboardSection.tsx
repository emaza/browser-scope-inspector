/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { ClipboardCopy, AlertTriangle, FileText, Lock, EyeOff } from 'lucide-react';
import { Card } from './Card';

const ClipboardSection: React.FC = () => {
  const [content, setContent] = useState<string | null>(null);
  const [permState, setPermState] = useState<string>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check initial permission state (Chrome/Edge mostly)
    if (navigator.permissions && navigator.permissions.query) {
      // @ts-ignore
      navigator.permissions.query({ name: 'clipboard-read' })
        .then(result => {
          setPermState(result.state);
          result.onchange = () => setPermState(result.state);
        })
        .catch(() => setPermState('unknown')); // Firefox doesn't support querying this easily
    }
  }, []);

  const handleReadClipboard = async () => {
    setLoading(true);
    setError(null);
    setContent(null);

    try {
      // This is the critical line that triggers the prompt or reads data
      const text = await navigator.clipboard.readText();
      
      if (!text) {
        setError("El portapapeles está vacío o contiene datos no textuales (imágenes/archivos).");
      } else {
        setContent(text);
        setPermState('granted');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permiso denegado. El usuario bloqueó el acceso.");
        setPermState('denied');
      } else {
        setError("No se pudo acceder. Requiere contexto seguro (HTTPS) y la pestaña activa.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Portapapeles (Clipboard)" 
      description="Acceso al contenido copiado (Ctrl+C)."
      icon={<ClipboardCopy size={20} />}
    >
      <div className="space-y-4">
        {/* Permission Status Bar */}
        <div className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
          <span className="text-slate-400">Estado del Permiso:</span>
          <span className={`font-mono uppercase font-bold ${
            permState === 'granted' ? 'text-green-400' : 
            permState === 'denied' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {permState === 'granted' ? 'CONCEDIDO' : 
             permState === 'denied' ? 'BLOQUEADO' : 'PREGUNTAR'}
          </span>
        </div>

        {!content ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
             <div className="flex gap-2 items-start mb-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <h3 className="text-sm font-semibold text-amber-200">Riesgo de Privacidad</h3>
             </div>
             <p className="text-xs text-amber-100/80 leading-relaxed mb-3">
               Si concedes este permiso, este sitio podrá leer <strong>contraseñas, tarjetas de crédito o mensajes privados</strong> que hayas copiado en otras aplicaciones.
             </p>
             <button 
               onClick={handleReadClipboard}
               disabled={loading}
               className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded transition-colors shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
             >
               {loading ? 'Solicitando...' : 'Intentar Leer Portapapeles'}
               {!loading && <FileText size={14} />}
             </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                    <Lock size={12} /> Datos Capturados Exitosamente
                </span>
                <button 
                    onClick={() => setContent(null)} 
                    className="text-xs text-slate-500 hover:text-slate-300"
                >
                    Limpiar
                </button>
             </div>
             <div className="relative group">
                <pre className="bg-slate-950 text-slate-300 p-3 rounded border border-slate-700 text-xs font-mono break-all whitespace-pre-wrap max-h-32 overflow-y-auto shadow-inner">
                    {content}
                </pre>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <span className="text-xs text-red-400 font-bold flex items-center gap-2">
                        <EyeOff size={14} /> Información Expuesta
                    </span>
                </div>
             </div>
             <p className="mt-2 text-[10px] text-slate-500 text-center">
                 Un sitio malicioso podría haber enviado este texto a un servidor remoto en segundo plano.
             </p>
          </div>
        )}

        {error && (
            <div className="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20 text-center">
                {error}
            </div>
        )}
      </div>
    </Card>
  );
};

export default ClipboardSection;
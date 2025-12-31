/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { Camera, Mic, Video, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Card } from './Card';

type PermissionStatusState = 'granted' | 'denied' | 'prompt' | 'unknown' | 'unsupported';

const MediaSection: React.FC = () => {
  const [camStatus, setCamStatus] = useState<PermissionStatusState>('unknown');
  const [micStatus, setMicStatus] = useState<PermissionStatusState>('unknown');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = async (name: 'camera' | 'microphone', setStatus: (s: PermissionStatusState) => void) => {
    try {
      // @ts-ignore: TS definition for permissions might vary
      const result = await navigator.permissions.query({ name: name });
      setStatus(result.state as PermissionStatusState);
      
      result.onchange = () => {
        setStatus(result.state as PermissionStatusState);
        if (result.state === 'granted') enumerateDevices();
      };
    } catch (e) {
      console.warn(`Permission query for ${name} failed`, e);
      setStatus('unsupported');
    }
  };

  const enumerateDevices = async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices(devs.filter(d => d.kind === 'videoinput' || d.kind === 'audioinput'));
    } catch (e) {
      console.error("Error enumerating devices", e);
    }
  };

  useEffect(() => {
    checkPermission('camera', setCamStatus);
    checkPermission('microphone', setMicStatus);
    
    // Check devices initially (labels will be empty if not granted)
    enumerateDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
  }, []);

  const requestMedia = async (type: 'video' | 'audio') => {
    setError(null);
    try {
      const constraints = type === 'video' ? { video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop tracks immediately as we only want to trigger the permission prompt
      stream.getTracks().forEach(track => track.stop());
      
      // Re-check permissions and devices
      if (type === 'video') checkPermission('camera', setCamStatus);
      else checkPermission('microphone', setMicStatus);
      enumerateDevices();
      
    } catch (err: any) {
      console.error("Error requesting media", err);
      setError(`Error al solicitar ${type === 'video' ? 'cámara' : 'micrófono'}: ${err.name || err.message}`);
      if (type === 'video') checkPermission('camera', setCamStatus);
      else checkPermission('microphone', setMicStatus);
    }
  };

  const getStatusColor = (status: PermissionStatusState) => {
    switch (status) {
      case 'granted': return 'text-green-400';
      case 'denied': return 'text-red-400';
      case 'prompt': return 'text-yellow-400';
      default: return 'text-slate-500';
    }
  };

  const getStatusLabel = (status: PermissionStatusState) => {
    switch (status) {
      case 'granted': return 'Concedido';
      case 'denied': return 'Bloqueado';
      case 'prompt': return 'Preguntar';
      case 'unsupported': return 'API No Soportada';
      default: return 'Desconocido';
    }
  };

  return (
    <Card 
      title="Multimedia (A/V)" 
      description="Estado de permisos y dispositivos detectados."
      icon={<Video size={20} />}
    >
      <div className="space-y-4">
        {/* Camera Status */}
        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded border border-slate-800">
          <div className="flex items-center gap-3">
            <Camera size={18} className="text-slate-400" />
            <div>
              <div className="text-sm font-medium text-slate-200">Cámara</div>
              <div className={`text-xs ${getStatusColor(camStatus)} font-mono uppercase`}>
                {getStatusLabel(camStatus)}
              </div>
            </div>
          </div>
          {camStatus === 'prompt' && (
            <button 
              onClick={() => requestMedia('video')}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
            >
              Solicitar
            </button>
          )}
        </div>

        {/* Mic Status */}
        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded border border-slate-800">
          <div className="flex items-center gap-3">
            <Mic size={18} className="text-slate-400" />
            <div>
              <div className="text-sm font-medium text-slate-200">Micrófono</div>
              <div className={`text-xs ${getStatusColor(micStatus)} font-mono uppercase`}>
                {getStatusLabel(micStatus)}
              </div>
            </div>
          </div>
          {micStatus === 'prompt' && (
            <button 
              onClick={() => requestMedia('audio')}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
            >
              Solicitar
            </button>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Device List */}
        {(camStatus === 'granted' || micStatus === 'granted') && (
            <div className="mt-4 pt-3 border-t border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Dispositivos Detectados</h4>
                {devices.length > 0 ? (
                    <ul className="space-y-1.5">
                        {devices.map((device, idx) => (
                            <li key={`${device.deviceId}-${idx}`} className="text-xs text-slate-300 flex items-center gap-2 truncate">
                                {device.kind === 'videoinput' ? <Video size={12} className="shrink-0" /> : <Mic size={12} className="shrink-0" />}
                                <span className="truncate">{device.label || 'Dispositivo desconocido (etiqueta oculta)'}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-slate-500 italic">No se detectaron dispositivos.</p>
                )}
            </div>
        )}
      </div>
    </Card>
  );
};

export default MediaSection;
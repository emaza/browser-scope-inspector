/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Video, AlertCircle, Volume2, Square, Play, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { Card } from './Card';

type PermissionStatusState = 'granted' | 'denied' | 'prompt' | 'unknown' | 'unsupported';

const MediaSection: React.FC = () => {
  const [camStatus, setCamStatus] = useState<PermissionStatusState>('unknown');
  const [micStatus, setMicStatus] = useState<PermissionStatusState>('unknown');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Microphone Visualizer State
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech Recognition State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Camera Preview State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

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
    
    // Check devices initially
    enumerateDevices();
    
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    
    // Cleanup on unmount
    return () => {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
        stopMicrophone();
        stopCamera();
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

  // Effect to attach video stream when component mounts or becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        // Ensure playback starts
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [isCameraActive]);

  const requestMedia = async (type: 'video' | 'audio') => {
    setError(null);
    try {
      const constraints = type === 'video' ? { video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop tracks immediately as we only want to trigger the permission prompt
      // unless we are specifically starting the test, but this function is for the "Request" button
      stream.getTracks().forEach(track => track.stop());
      
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

  // --- Camera Logic ---
  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        
        // Only toggle state here, let useEffect handle srcObject assignment
        setIsCameraActive(true);
        setError(null);
    } catch (err: any) {
        setError("No se pudo acceder a la cámara para la prueba.");
        setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCameraToggle = () => {
    if (isCameraActive) stopCamera();
    else startCamera();
  };

  // --- Microphone Logic ---
  const startMicrophone = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // @ts-ignore - Webkit handling
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);

        source.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;
        setIsListening(true);
        setError(null);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Normalize somewhat to 0-100 (255 is max but realistic speech is lower)
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            
            setVolume(normalized);
            rafRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();

    } catch (err: any) {
        setError("No se pudo acceder al micrófono para la prueba.");
        setIsListening(false);
    }
  };

  const stopMicrophone = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsListening(false);
    setVolume(0);
    streamRef.current = null;
    audioContextRef.current = null;
  };

  const handleMicToggle = () => {
    if (isListening) stopMicrophone();
    else startMicrophone();
  };

  // --- Speech Recognition Logic ---
  const toggleTranscription = () => {
    if (isTranscribing) {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsTranscribing(false);
        return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        setError("Tu navegador no soporta la API de SpeechRecognition (Prueba Chrome/Edge).");
        return;
    }

    try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsTranscribing(true);
        recognition.onend = () => setIsTranscribing(false);
        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            setError(`Error de reconocimiento: ${event.error}`);
            setIsTranscribing(false);
        };

        recognition.onresult = (event: any) => {
            let finalTrans = '';
            let interimTrans = '';

            // This API returns a list of results, we need to reconstruct the full string
            // or just append. Because we use continuous=true, we iterate all.
            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTrans += text;
                } else {
                    interimTrans += text;
                }
            }
            // A simplified way to display continuous history + current interim
            // Note: In a production app you might manage history differently to avoid reprocessing everything.
            setTranscript(finalTrans + (interimTrans ? ` [${interimTrans}]` : ''));
        };

        recognitionRef.current = recognition;
        recognition.start();
        setError(null);
    } catch (e: any) {
        setError("No se pudo iniciar el reconocimiento de voz.");
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
        <div className="p-3 bg-slate-900/40 rounded border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Camera size={18} className="text-slate-400" />
                <div>
                <div className="text-sm font-medium text-slate-200">Cámara</div>
                <div className={`text-xs ${getStatusColor(camStatus)} font-mono uppercase`}>
                    {getStatusLabel(camStatus)}
                </div>
                </div>
            </div>
            {camStatus !== 'granted' && (
                <button 
                onClick={() => requestMedia('video')}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                >
                Solicitar Acceso
                </button>
            )}
          </div>

          {/* Camera Preview UI */}
          {camStatus === 'granted' && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Eye size={14} />
                        <span>Prueba de Video</span>
                    </div>
                    <button 
                        onClick={handleCameraToggle}
                        className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${
                            isCameraActive 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                        }`}
                    >
                        {isCameraActive ? (
                            <><Square size={10} fill="currentColor" /> Detener</>
                        ) : (
                            <><Play size={10} fill="currentColor" /> Ver Cámara</>
                        )}
                    </button>
                </div>
                
                {isCameraActive && (
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover -scale-x-100" // Mirror effect
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span> REC
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Mic Status */}
        <div className="p-3 bg-slate-900/40 rounded border border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Mic size={18} className="text-slate-400" />
                    <div>
                    <div className="text-sm font-medium text-slate-200">Micrófono</div>
                    <div className={`text-xs ${getStatusColor(micStatus)} font-mono uppercase`}>
                        {getStatusLabel(micStatus)}
                    </div>
                    </div>
                </div>
                {micStatus !== 'granted' && (
                    <button 
                    onClick={() => requestMedia('audio')}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                    >
                    Solicitar Acceso
                    </button>
                )}
            </div>
            
            {/* Mic Tools Wrapper */}
            {micStatus === 'granted' && (
                <div className="space-y-4">
                    {/* Visualizer UI */}
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Volume2 size={14} />
                                <span>Prueba de Entrada</span>
                            </div>
                            <button 
                                onClick={handleMicToggle}
                                className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${
                                    isListening 
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                }`}
                            >
                                {isListening ? (
                                    <><Square size={10} fill="currentColor" /> Detener</>
                                ) : (
                                    <><Play size={10} fill="currentColor" /> Escuchar</>
                                )}
                            </button>
                        </div>
                        
                        {/* Volume Bar */}
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
                            <div 
                                className={`h-full transition-all duration-75 ease-out rounded-full ${
                                    volume > 80 ? 'bg-red-500' : volume > 50 ? 'bg-yellow-400' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(2, volume)}%`, opacity: isListening ? 1 : 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Speech Recognition UI */}
                    <div className="pt-3 border-t border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <MessageSquare size={14} />
                                <span>Transcripción (Speech-to-Text)</span>
                            </div>
                            <button 
                                onClick={toggleTranscription}
                                className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${
                                    isTranscribing 
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                                    : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                                }`}
                            >
                                {isTranscribing ? (
                                    <><Square size={10} fill="currentColor" /> Detener Rec.</>
                                ) : (
                                    <><Mic size={10} fill="currentColor" /> Iniciar Rec.</>
                                )}
                            </button>
                        </div>
                        
                        <div className="relative">
                            <textarea 
                                value={transcript}
                                readOnly
                                placeholder={isTranscribing ? "Escuchando... (habla ahora)" : "El texto transcrito aparecerá aquí..."}
                                className={`w-full h-24 bg-black/30 border ${isTranscribing ? 'border-indigo-500/50' : 'border-slate-700'} rounded p-2 text-xs text-slate-300 font-mono resize-none focus:outline-none transition-colors`}
                            />
                            {transcript && (
                                <button 
                                    onClick={() => setTranscript('')}
                                    className="absolute bottom-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 transition-colors"
                                    title="Borrar texto"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
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
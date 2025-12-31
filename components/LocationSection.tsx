/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, DataRow } from './Card';

const LocationSection: React.FC = () => {
  const [location, setLocation] = useState<{lat: number, lon: number, acc: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryMode, setRetryMode] = useState(false);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    setRetryMode(false);

    if (!navigator.geolocation) {
      setError("API no soportada");
      setLoading(false);
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      setLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      });
      setLoading(false);
      setRetryMode(false);
    };

    const handleError = (err: GeolocationPositionError, isHighAccuracyAttempt: boolean) => {
      // Si falló el intento de alta precisión por timeout o indisponibilidad,
      // intentamos automáticamente con baja precisión (WiFi/IP).
      if (isHighAccuracyAttempt && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
        setRetryMode(true); // Indicador visual de que estamos reintentando
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (finalErr) => handleError(finalErr, false),
          { 
            enableHighAccuracy: false, 
            timeout: 15000, 
            maximumAge: 60000 // Aceptamos una posición de hace 1 minuto si existe
          }
        );
        return;
      }

      // Si falla incluso en baja precisión o es un error de permisos
      let msg = "Error desconocido";
      switch(err.code) {
        case err.PERMISSION_DENIED: msg = "Permiso denegado por el usuario."; break;
        case err.POSITION_UNAVAILABLE: msg = "No se pudo determinar la ubicación."; break;
        case err.TIMEOUT: msg = "El tiempo de espera se agotó (incluso en baja precisión)."; break;
        default: msg = err.message;
      }
      setError(msg);
      setLoading(false);
      setRetryMode(false);
    };

    // Intento 1: Alta precisión (GPS), esperamos máximo 10s, queremos datos frescos
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => handleError(err, true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <Card 
      title="Geolocalización" 
      description="Coordenadas GPS aproximadas (requiere permiso)."
      icon={<MapPin size={20} />}
    >
      {!location && !error && (
        <div className="flex flex-col items-center justify-center py-6 px-4 gap-4">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Esta API revela tu posición física real. El navegador solicitará tu confirmación antes de compartirla.
          </p>
          <button 
            onClick={requestLocation}
            disabled={loading}
            className="group flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-bold py-2.5 px-5 rounded-lg border border-sky-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (retryMode ? 'Reintentando (Baja Precisión)...' : 'Solicitando...') : 'Activar GPS'}
            {!loading && <Navigation size={14} className="group-hover:translate-x-0.5 transition-transform" />}
            {retryMode && <RefreshCw size={14} className="animate-spin" />}
          </button>
        </div>
      )}

      {error && (
         <div className="flex flex-col items-center justify-center py-6 px-4 gap-2 text-red-400/90 text-center">
           <AlertTriangle size={24} className="mb-1" />
           <span className="text-sm font-semibold">{error}</span>
           <button onClick={requestLocation} className="text-xs underline text-slate-500 mt-2 hover:text-slate-300 cursor-pointer">Reintentar</button>
         </div>
      )}

      {location && (
        <>
          <DataRow label="Latitud" value={location.lat.toFixed(6)} highlight />
          <DataRow label="Longitud" value={location.lon.toFixed(6)} highlight />
          <DataRow label="Precisión" value={`±${location.acc.toFixed(0)} m`} />
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-center bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-2 rounded transition-colors"
            >
              <MapPin size={12} /> Ver en Mapa
            </a>
          </div>
        </>
      )}
    </Card>
  );
};

export default LocationSection;
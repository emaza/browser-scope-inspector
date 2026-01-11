export interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
  getBattery: () => Promise<BatteryManager>;
}

export interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: EventListener | null;
  onlevelchange: EventListener | null;
}

export interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  saveData?: boolean;
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
}

export interface FingerprintData {
  canvasHash: string;
  audioHash: string;
  fontsDetected: string[];
}

export interface BehaviorMetrics {
  mouseDistance: number;
  clicks: number;
  typingSpeed: number; // roughly wpm logic
  lastInputTime: number;
}

// SpeechRecognition básico
export interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart(): void;
  onend(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
}

// Extender el objeto global "window"
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    SpeechRecognition?: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): SpeechRecognition;
    };
  }
}

// Esto asegura que TypeScript trate este archivo como módulo
export { };


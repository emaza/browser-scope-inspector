import React from 'react';

// Extended Navigator interfaces for non-standard or newer APIs
export interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
  getBattery?: () => Promise<BatteryManager>;
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

export interface SectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
  className?: string;
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
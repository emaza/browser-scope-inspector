/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { SectionProps } from '../types';

export const Card: React.FC<SectionProps> = ({ title, icon, description, children, className = '' }) => {
  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg transition-all hover:border-slate-600 ${className}`}>
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 flex items-center gap-3">
        <div className="text-sky-400 p-2 bg-sky-400/10 rounded-lg">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-4 text-sm text-slate-300">
        {children}
      </div>
    </div>
  );
};

export const DataRow: React.FC<{ label: string; value: string | number | React.ReactNode; highlight?: boolean }> = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 px-2 rounded transition-colors">
    <span className="text-slate-400 font-medium">{label}</span>
    <span className={`font-mono text-right ${highlight ? 'text-sky-400 font-bold' : 'text-slate-200'}`}>
      {value}
    </span>
  </div>
);
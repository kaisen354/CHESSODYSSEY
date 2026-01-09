
import React from 'react';
import { VibeLevel } from '../types';

interface VibeMeterProps {
  score: number; // 0-100
  label: VibeLevel;
}

const VibeMeter: React.FC<VibeMeterProps> = ({ score, label }) => {
  const getColor = () => {
    switch (label) {
      case VibeLevel.Panic: return 'bg-red-600 shadow-red-600/50';
      case VibeLevel.Tension: return 'bg-orange-500 shadow-orange-500/50';
      case VibeLevel.Flow: return 'bg-amber-400 shadow-amber-400/50';
      case VibeLevel.Domination: return 'bg-emerald-500 shadow-emerald-500/50';
      default: return 'bg-slate-500';
    }
  };

  const colorClass = getColor();
  const widthPercentage = `${Math.max(5, score)}%`;

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex justify-between items-end">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold font-cinzel">Vibe Check</span>
        <span className={`cinematic-text text-sm font-bold ${label === VibeLevel.Domination ? 'text-amber-400' : 'text-slate-200'}`}>
          {label}
        </span>
      </div>
      
      <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/10 relative">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-r-full shadow-[0_0_10px] ${colorClass}`}
          style={{ width: widthPercentage }}
        />
      </div>
    </div>
  );
};

export default VibeMeter;

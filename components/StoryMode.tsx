
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface StoryModeProps {
  isVisionActive: boolean;
  onToggleVision: () => void;
  hasFen: boolean;
}

const StoryMode: React.FC<StoryModeProps> = ({ isVisionActive, onToggleVision, hasFen }) => {
  return (
    <button 
      onClick={onToggleVision}
      disabled={!hasFen}
      className={`w-full group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${
        isVisionActive 
          ? 'border-cyan-500/50 bg-cyan-950/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
          : 'border-amber-500/30 bg-amber-900/20 hover:border-amber-400/50 hover:shadow-amber-500/20 text-amber-100 hover:scale-[1.02] cursor-pointer'
      } ${!hasFen ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {!isVisionActive && (
         <div className="absolute inset-0 bg-transparent" />
      )}
      
      <div className="relative flex items-center justify-center gap-3">
        {isVisionActive ? (
            <>
                <EyeOff className="text-cyan-400 w-5 h-5" />
                <span className="cinematic-text text-cyan-200 tracking-wider font-bold">Deactivate Vision</span>
            </>
        ) : (
            <>
                <Eye className="text-amber-400 w-5 h-5 group-hover:text-amber-300 transition-colors" />
                <span className="cinematic-text text-amber-100 tracking-wider font-bold group-hover:text-amber-50">👁️ Activate Vision</span>
            </>
        )}
      </div>
    </button>
  );
};

export default StoryMode;

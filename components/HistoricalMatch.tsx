
import React from 'react';
import { Ghost, ExternalLink } from 'lucide-react';
import { HistoricalGame } from '../types';

interface HistoricalMatchProps {
  data: HistoricalGame | null;
  isLoading: boolean;
}

const HistoricalMatch: React.FC<HistoricalMatchProps> = ({ data, isLoading }) => {
  if (!data && !isLoading) return null;

  return (
    <div className="w-full mt-4 p-4 rounded-xl border border-white/5 bg-slate-900/40 relative overflow-hidden group">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="p-3 bg-slate-950/80 rounded-full border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <Ghost size={20} className={`text-purple-400 ${isLoading ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="flex-1">
          <h4 className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1 flex items-center gap-2">
            Historical Echo
            {isLoading && <span className="text-slate-500 font-normal normal-case tracking-normal">Searching archives...</span>}
          </h4>
          
          {data ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              <h3 className="text-white font-cinzel font-bold text-lg leading-tight mb-1">
                {data.players} <span className="text-slate-500 text-sm font-sans font-normal">({data.year})</span>
              </h3>
              <p className="text-slate-400 text-xs font-serif italic mb-2">
                Played in the <span className="text-slate-300">{data.opening}</span>
              </p>
              <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-purple-500/30 pl-3">
                "{data.description}"
              </p>
              
              {data.sourceUrl && (
                <a 
                  href={data.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-[10px] uppercase font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View Source <ExternalLink size={10} />
                </a>
              )}
            </div>
          ) : (
            isLoading && (
               <div className="space-y-2 mt-2">
                  <div className="h-4 bg-slate-800/50 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse"></div>
               </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalMatch;

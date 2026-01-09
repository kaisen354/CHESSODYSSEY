
import React from 'react';
import { Upload, ScanEye, RefreshCcw, Camera, Aperture } from 'lucide-react';
import ChessBoardOverlay from './ChessBoardOverlay';
import { PieceState, HeatmapData } from '../types';

interface ChessBoardInputProps {
  currentImage: string | null;
  onImageSelected: (base64: string) => void;
  isAnalyzing: boolean;
  hiddenSquares?: Set<string>;
  pieces?: Map<string, PieceState>;
  checkSquare?: string | null; 
  heatmapData?: HeatmapData | null;
}

const ChessBoardInput: React.FC<ChessBoardInputProps> = ({ 
  currentImage, 
  onImageSelected, 
  isAnalyzing, 
  hiddenSquares = new Set(),
  pieces = new Map(),
  checkSquare,
  heatmapData
}) => {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (currentImage) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-slate-950/30 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 group">
        
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50 pointer-events-none" />

        {/* THE SHRINK-WRAP CONTAINER */}
        <div className="relative inline-block shadow-2xl rounded-sm overflow-hidden z-10" style={{ width: 'max-content', maxWidth: '100%' }}>
            
            {/* THE HERO IMAGE */}
            <img 
              src={currentImage} 
              alt="Board State" 
              className={`block max-h-[50vh] w-auto object-contain transition-all duration-700 ${isAnalyzing ? 'opacity-40 blur-sm scale-95' : 'opacity-100 scale-100'}`} 
            />

            {/* GAME OVERLAY (Pieces, Patches, Heatmap) - Z-INDEX 10 */}
            <ChessBoardOverlay 
                hiddenSquares={hiddenSquares} 
                pieces={pieces} 
                checkSquare={checkSquare}
                heatmapData={heatmapData} // PASS HEATMAP DATA
            />

            {/* HEATMAP LEGEND - Only Visible when Vision is Active */}
            {heatmapData && !isAnalyzing && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-950/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-500 hover:bg-slate-900/90 transition-colors pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
                  <span className="text-[10px] uppercase font-bold text-amber-100 tracking-wider">Safe</span>
                </div>
                <div className="w-px h-3 bg-white/20"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                  <span className="text-[10px] uppercase font-bold text-red-100 tracking-wider">Danger</span>
                </div>
                <div className="w-px h-3 bg-white/20"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]"></div>
                  <span className="text-[10px] uppercase font-bold text-white tracking-wider">Battle</span>
                </div>
              </div>
            )}

            {/* Scanning Effect - Z-INDEX 50 to cover everything */}
            {isAnalyzing && (
               <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
                    <ScanEye className="w-20 h-20 text-cyan-400 animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-1">
                      <span className="text-cyan-400 font-mono text-sm tracking-[0.4em] uppercase animate-pulse font-bold bg-black/60 px-4 py-2 rounded-full border border-cyan-500/30 backdrop-blur-md">
                        Deciphering...
                      </span>
                      <div className="w-32 h-0.5 bg-cyan-900/50 mt-2 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 animate-[loading_1s_ease-in-out_infinite] w-1/2"></div>
                      </div>
                  </div>
               </div>
            )}
        </div>

        {/* Controls Overlay - ALWAYS VISIBLE NOW */}
        <div className="absolute top-6 right-6 z-30 transition-opacity">
            <label className="cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-xl text-white p-2.5 rounded-xl border border-white/10 flex items-center gap-3 transition-all hover:scale-105 shadow-xl group/btn">
              <RefreshCcw size={16} className="text-cyan-400 group-hover/btn:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-bold uppercase tracking-wider">New Position</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
            </label>
        </div>
        
        <style>{`
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
        `}</style>
      </div>
    );
  }

  // EMPTY STATE / UPLOAD ZONE ("THE HERO")
  return (
    <div className="relative w-full aspect-video md:aspect-square bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center group cursor-pointer overflow-hidden transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_0_50px_rgba(245,158,11,0.1)]">
       
       {/* Cinematic Background Effects */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,50,50,0.2)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)] transition-all duration-700" />
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
       
       {/* Animated Border Glow */}
       <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
           <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-purple-500/10" />
       </div>

       {/* The "Portal" Icon */}
       <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500 ease-out">
         <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
         <div className="w-24 h-24 rounded-2xl bg-slate-800/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/10 group-hover:border-amber-500/50 transition-colors duration-300 relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Aperture className="text-slate-400 group-hover:text-amber-400 transition-colors w-10 h-10 group-hover:rotate-90 duration-700 ease-in-out" />
         </div>
         {/* Orbiting Elements */}
         <div className="absolute -inset-4 border border-dashed border-white/5 rounded-full animate-[spin_10s_linear_infinite] group-hover:border-amber-500/20" />
         <div className="absolute -inset-8 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-50" />
       </div>
       
       <div className="text-center relative z-10 space-y-3">
         <h3 className="text-white text-3xl font-bold tracking-tight font-cinzel group-hover:text-amber-100 transition-colors drop-shadow-lg">
            Initialize Engine
         </h3>
         <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed group-hover:text-slate-300 transition-colors">
            Upload a chessboard screenshot to awaken the <span className="text-amber-400/80 font-serif italic">Grandmaster AI</span>
         </p>
       </div>
       
       {/* CTA Button Fake */}
       <div className="mt-8 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
          Click or Drag Image
       </div>

       <input 
        type="file" 
        accept="image/*" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ChessBoardInput;


import React from 'react';
import { Chess } from 'chess.js';
import { Brain, ShieldCheck, Rocket } from 'lucide-react';
import { MoveOption, PieceState } from '../types';
import ChessBoardOverlay from './ChessBoardOverlay';

interface MoveCardProps {
  moveData: MoveOption;
  fen: string;
  imageSrc: string | null;
  type: 'pragmatic' | 'artist';
  onExecute: (san: string, from: string, to: string) => void;
  disabled?: boolean;
  hiddenSquares?: Set<string>;
  pieces?: Map<string, PieceState>;
}

const MoveCard: React.FC<MoveCardProps> = ({ 
  moveData, 
  fen, 
  imageSrc, 
  type, 
  onExecute, 
  disabled = false,
  hiddenSquares = new Set(),
  pieces = new Map()
}) => {
  const isArtist = type === 'artist';
  
  // -- DYNAMIC ARROW LOGIC --
  // We prioritize explicit coordinates if provided by the dynamic engine.
  // If not, we fall back to chess.js calculation based on the current FEN.
  let from = moveData.from || '';
  let to = moveData.to || '';

  if ((!from || !to) && moveData.san && moveData.san !== "...") {
    const game = new Chess(fen);
    try {
      const move = game.move(moveData.san); 
      if (move) {
        from = move.from;
        to = move.to;
      }
    } catch (e) {
      // Suppress invalid move errors.
    }
  }

  // Helper to map Algebraic Notation (a1) to CSS Percentage (0-100%)
  const getCoordinates = (square: string) => {
    if (!square || square.length < 2) return { x: 0, y: 0 };
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    const fileIndex = files.indexOf(square[0]);
    const rankIndex = ranks.indexOf(square[1]);
    
    // Each square is 12.5% (100/8). Center is +6.25%.
    return { 
      x: fileIndex * 12.5 + 6.25, 
      y: rankIndex * 12.5 + 6.25 
    }; 
  };

  const fromCoord = from ? getCoordinates(from) : {x:0, y:0};
  const toCoord = to ? getCoordinates(to) : {x:0, y:0};

  // SHORTEN ARROW TIP LOGIC (Math)
  // We want the arrow to stop slightly before the center so the head is clear
  let adjustedTo = { x: toCoord.x, y: toCoord.y };
  
  if (from && to) {
      const dx = toCoord.x - fromCoord.x;
      const dy = toCoord.y - fromCoord.y;
      const length = Math.sqrt(dx*dx + dy*dy);
      
      // Shorten by ~4% if length is sufficient
      if (length > 10) {
          const reductionRatio = 4 / length; 
          adjustedTo.x = toCoord.x - (dx * reductionRatio);
          adjustedTo.y = toCoord.y - (dy * reductionRatio);
      }
  }


  const handleClickExecute = () => {
    if (disabled || !moveData.san || moveData.san === "...") return;
    
    // Pass the calculated or explicit coords back to parent
    if (from && to) {
      onExecute(moveData.san, from, to);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl transition-all duration-300 group flex flex-col h-full ${
      isArtist 
        ? 'bg-slate-900/80 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
        : 'bg-slate-900/80 border border-slate-500/30 shadow-lg'
    } ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
      {/* Colored Side Accent */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        isArtist ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-400'
      }`} />

      <div className="p-4 flex-1 flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-2 pl-2">
          <div>
            <h4 className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 flex items-center gap-2 ${
               isArtist ? 'text-amber-500' : 'text-slate-400'
            }`}>
               {isArtist ? 'The Artist' : 'The Pragmatist'}
            </h4>
            <div className={`text-2xl font-serif font-bold ${
              isArtist ? 'text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-100'
            }`}>
              {moveData.san}
            </div>
          </div>
          {isArtist ? (
             <Brain className="text-amber-500 w-5 h-5 animate-pulse" />
          ) : (
             <ShieldCheck className="text-slate-500 w-5 h-5" />
          )}
        </div>

        {/* COMPACT VISUALIZER (Real Image + Red Arrow) */}
        {/* FIX: Use flex center + inline-flex wrapper to shrink-wrap the image width */}
        <div className="w-full h-32 mb-3 shrink-0 flex items-center justify-center bg-slate-900 rounded-lg border border-white/10 shadow-inner overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
           {imageSrc ? (
             <div className="relative h-full inline-flex">
                 <img 
                    src={imageSrc} 
                    alt="Board" 
                    className="block h-full w-auto object-contain opacity-80" 
                 />

                 {/* OVERLAY: Render current game state (Ghost Pieces) on top of image */}
                 <ChessBoardOverlay hiddenSquares={hiddenSquares} pieces={pieces} variant="small" />
                 
                 {/* RED OVERLAY ARROW (Z-20 to sit on top of ghost pieces) */}
                 {from && to && (
                  <svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
                    <defs>
                      <marker id={`arrowhead-red-${type}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                        <polygon points="0 0, 4 2, 0 4" fill="#dc2626" />
                      </marker>
                    </defs>
                    <line 
                      x1={`${fromCoord.x}%`} 
                      y1={`${fromCoord.y}%`} 
                      x2={`${adjustedTo.x}%`} 
                      y2={`${adjustedTo.y}%`} 
                      stroke="#dc2626" 
                      strokeWidth="6" 
                      markerEnd={`url(#arrowhead-red-${type})`}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_3px_rgba(0,0,0,1)] animate-pulse"
                    />
                    <circle cx={`${fromCoord.x}%`} cy={`${fromCoord.y}%`} r="3.5" fill="#dc2626" className="drop-shadow-md" />
                  </svg>
                 )}
             </div>
           ) : (
             <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Image</div>
           )}
        </div>

        {/* RATIONALE SECTION */}
        <div className="pl-3 border-l-2 border-white/5 overflow-y-auto max-h-[60px] scrollbar-thin mb-3">
           <p className={`text-xs leading-relaxed font-serif ${
             isArtist ? 'text-amber-100/90' : 'text-slate-300'
           }`}>
             <span className="font-bold opacity-70 block mb-0.5">{moveData.translation}</span>
             {moveData.rationale}
           </p>
        </div>

        {/* EXECUTE BUTTON */}
        <button 
          onClick={handleClickExecute}
          disabled={disabled || !moveData.san || moveData.san === "..."}
          className={`w-full mt-auto py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isArtist 
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-900/20' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-slate-900/20'
          }`}
        >
          <Rocket size={14} />
          Execute Move
        </button>
      </div>
    </div>
  );
};

export default MoveCard;

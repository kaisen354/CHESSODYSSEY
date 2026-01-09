import React from 'react';
import { PieceState, HeatmapData } from '../types';

interface ChessBoardOverlayProps {
  hiddenSquares: Set<string>;
  pieces: Map<string, PieceState>;
  variant?: 'default' | 'small';
  checkSquare?: string | null; // NEW: The square where the King is in danger
  heatmapData?: HeatmapData | null;
}

export const getSquareColor = (square: string) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const fileIndex = files.indexOf(square[0]);
  const rankIndex = ranks.indexOf(square[1]);
  return (fileIndex + rankIndex) % 2 === 0 ? '#f0d9b5' : '#b58863';
};

// Kept for Snapshot generation fallback/legacy use
export const getPieceIcon = (symbol: string, color: 'w' | 'b') => {
  const icons: Record<string, string> = {
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  };
  return icons[symbol.toLowerCase()] || '?';
};

// Helper for Pro SVG URLs
const getPieceSvg = (symbol: string, color: 'w' | 'b') => {
  const s = symbol.toLowerCase();
  const c = color === 'w' ? 'l' : 'd'; // light or dark
  // Wikimedia Commons standard naming convention
  const map: Record<string, string> = {
    p: 'p', r: 'r', n: 'n', b: 'b', q: 'q', k: 'k'
  };
  const pieceCode = map[s];
  
  if (!pieceCode) return null;
  
  // Example: Chess_plt45.svg (Pawn Light)
  return `https://upload.wikimedia.org/wikipedia/commons/${
    c === 'l' 
      ? { p: '4/45/Chess_plt45.svg', r: '7/72/Chess_rlt45.svg', n: '7/70/Chess_nlt45.svg', b: 'b/b1/Chess_blt45.svg', q: '1/15/Chess_qlt45.svg', k: '4/42/Chess_klt45.svg' }[pieceCode]
      : { p: 'c/c7/Chess_pdt45.svg', r: 'f/ff/Chess_rdt45.svg', n: 'e/ef/Chess_ndt45.svg', b: '9/98/Chess_bdt45.svg', q: '4/47/Chess_qdt45.svg', k: 'f/f0/Chess_kdt45.svg' }[pieceCode]
  }`;
};

export const getCoordinates = (square: string) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    // Standard Chess Mapping:
    // Files: a -> left 0%
    // Ranks: 8 -> top 0%
    const fileIndex = files.indexOf(square[0]);
    const rankIndex = ranks.indexOf(square[1]);
    
    // Safety check
    if (fileIndex === -1 || rankIndex === -1) return { left: '0%', top: '0%' };

    return { 
      left: `${fileIndex * 12.5}%`, 
      top: `${rankIndex * 12.5}%` 
    };
};

const ChessBoardOverlay: React.FC<ChessBoardOverlayProps> = ({ hiddenSquares, pieces, variant = 'default', checkSquare, heatmapData }) => {
  
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      
      {/* LAYER 0: HEATMAP (Future Sight) */}
      {heatmapData && Array.from(heatmapData.entries()).map(([square, type]) => {
        const coords = getCoordinates(square);
        let color = '';
        let animation = '';

        // VISUALS:
        // White Control -> Gold Glow
        // Black Control -> Red Glow
        // Tension -> White Pulse
        if (type === 'white') color = 'rgba(251, 191, 36, 0.5)'; // Gold
        if (type === 'black') color = 'rgba(220, 38, 38, 0.5)'; // Red
        if (type === 'tension') {
            color = 'rgba(255, 255, 255, 0.4)';
            animation = 'animate-pulse';
        }

        return (
          <div 
            key={`heat-${square}`}
            className={`absolute w-[12.5%] h-[12.5%] z-0 transition-opacity duration-700 ${animation}`}
            style={{ 
              left: coords.left, 
              top: coords.top,
              backgroundColor: color,
              mixBlendMode: 'soft-light', // Blends nicely with the board
              boxShadow: type === 'tension' ? 'inset 0 0 15px rgba(255,255,255,0.8)' : 'none'
            }}
          />
        );
      })}

      {/* LAYER 1: CAPTURE MASK (The Eraser) */}
      {/* These patches hide the original image content at the source and destination squares */}
      {Array.from(hiddenSquares).map((square: string) => {
        const coords = getCoordinates(square);
        const color = getSquareColor(square);
        return (
          <div 
            key={`mask-${square}`}
            className="absolute w-[12.5%] h-[12.5%] z-0"
            style={{ 
              left: coords.left, 
              top: coords.top,
              backgroundColor: color,
              opacity: 1 // Full opacity to mask underlying image
            }}
          />
        );
      })}

      {/* LAYER 2: KING DANGER INDICATOR (Check/Mate Pulse) */}
      {checkSquare && (
        <div 
          className="absolute w-[12.5%] h-[12.5%] z-0"
          style={{
            left: getCoordinates(checkSquare).left,
            top: getCoordinates(checkSquare).top,
          }}
        >
          {/* Radial Gradient Red Pulse */}
          <div className="absolute inset-1 bg-red-600/50 rounded-full blur-md animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.9)] border-2 border-red-500" />
        </div>
      )}

      {/* LAYER 3: GHOST PIECES (The New State) */}
      {/* Pieces render ON TOP of the mask and the danger indicator */}
      {Array.from(pieces.entries()).map(([square, piece]) => {
        const coords = getCoordinates(square);
        const svgUrl = getPieceSvg(piece.symbol, piece.color);

        return (
          <div 
            key={`piece-${square}`}
            className={`absolute w-[12.5%] h-[12.5%] flex items-center justify-center animate-[scaleIn_0.3s_ease-out] z-10`}
            style={{ 
              left: coords.left, 
              top: coords.top,
            }}
          >
            {svgUrl ? (
                <img 
                    src={svgUrl} 
                    alt={`${piece.color}${piece.symbol}`} 
                    className="w-[90%] h-[90%] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]"
                />
            ) : (
                <span className={piece.color === 'w' ? 'text-white stroke-black drop-shadow-md text-4xl' : 'text-black drop-shadow-md text-4xl'}>
                {getPieceIcon(piece.symbol, piece.color)}
                </span>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChessBoardOverlay;
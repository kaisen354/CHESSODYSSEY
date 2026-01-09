
import React from 'react';
import { Chess } from 'chess.js';

interface MiniBoardProps {
  fen: string;
  moveSan: string; // SAN move e.g. "e4", "Nf3"
  isArtist: boolean; // True for gold style, false for silver/pragmatic
}

const MiniBoard: React.FC<MiniBoardProps> = ({ fen, moveSan, isArtist }) => {
  const game = new Chess(fen);
  let from = '';
  let to = '';

  try {
    const move = game.move(moveSan); // Validate and get coords
    if (move) {
      from = move.from;
      to = move.to;
    }
  } catch (e) {
    // If move invalid in current FEN, suppress error for UI robustness
  }

  // Board generation helpers
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  const getSquareColor = (fileIdx: number, rankIdx: number) => {
    return (fileIdx + rankIdx) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'; 
  };

  const getPiece = (file: string, rank: string) => {
    const piece = game.get(file as any + rank as any);
    if (!piece) return null;
    const symbols: Record<string, string> = {
      p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
      P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
    };
    const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
    return <span className={`text-2xl leading-none ${piece.color === 'w' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-black'}`}>{symbols[key]}</span>;
  };

  // Calculate Arrow Coordinates
  const getCoord = (square: string) => {
    const file = files.indexOf(square[0]);
    const rank = ranks.indexOf(square[1]);
    return { x: file * 12.5 + 6.25, y: rank * 12.5 + 6.25 }; // % based
  };

  const fromCoord = from ? getCoord(from) : {x:0, y:0};
  const toCoord = to ? getCoord(to) : {x:0, y:0};

  return (
    <div className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 ${isArtist ? 'border-amber-400' : 'border-slate-300'}`}>
      <div className="grid grid-cols-8 h-full w-full">
        {ranks.map((rank, rIdx) => (
          files.map((file, fIdx) => (
            <div 
              key={file+rank} 
              className={`flex items-center justify-center ${getSquareColor(fIdx, rIdx)}`}
            >
              {getPiece(file, rank)}
            </div>
          ))
        ))}
      </div>
      
      {/* Arrow Overlay */}
      {from && to && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
          <defs>
            <marker id={`arrowhead-${isArtist ? 'artist' : 'pragmatic'}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill={isArtist ? '#fbbf24' : '#cbd5e1'} />
            </marker>
          </defs>
          <line 
            x1={`${fromCoord.x}%`} 
            y1={`${fromCoord.y}%`} 
            x2={`${toCoord.x}%`} 
            y2={`${toCoord.y}%`} 
            stroke={isArtist ? '#fbbf24' : '#cbd5e1'} 
            strokeWidth="8" 
            markerEnd={`url(#arrowhead-${isArtist ? 'artist' : 'pragmatic'})`}
            opacity="0.9"
          />
        </svg>
      )}
    </div>
  );
};

export default MiniBoard;


import React from 'react';
import { X, Crown, Shield, GraduationCap, Scroll, BookOpen } from 'lucide-react';

interface BeginnerGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const BeginnerGuide: React.FC<BeginnerGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const getStartingPiece = (r: number, fIndex: number) => {
    // Black Pieces
    if (r === 8) {
        const p = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'][fIndex];
        return <span className="text-slate-900 drop-shadow-sm text-2xl filter brightness-0 opacity-80">{p}</span>;
    }
    if (r === 7) return <span className="text-slate-900 drop-shadow-sm text-2xl filter brightness-0 opacity-80">♟</span>;
    
    // White Pieces
    if (r === 2) return <span className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-2xl">♙</span>;
    if (r === 1) {
        const p = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'][fIndex];
        return <span className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-2xl">{p}</span>;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
                <BookOpen className="text-amber-400 w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-cinzel font-bold text-slate-100">Chess Beginner's Guide</h2>
                <p className="text-xs text-amber-500/60 uppercase tracking-widest font-bold">The Royal Rules of Engagement</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin space-y-10 text-slate-300 font-serif leading-relaxed">
          
          {/* 1. The Board */}
          <section>
            <h3 className="text-xl font-cinzel font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">I.</span> The Battlefield
            </h3>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <p>The chessboard has <strong className="text-white">8 columns</strong> (files a–h) and <strong className="text-white">8 rows</strong> (ranks 1–8).</p>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
                        <li>White pieces start at the bottom (Rows 1–2).</li>
                        <li>Black pieces start at the top (Rows 7–8).</li>
                        <li>Each square is identified by a coordinate (e.g., <strong>e4</strong>, <strong>h5</strong>).</li>
                    </ul>
                </div>
                
                {/* Visual Chess Grid */}
                <div className="p-4 bg-slate-950 rounded-xl border border-white/10 shadow-2xl inline-block mx-auto md:mx-0">
                    <div className="flex">
                        {/* Ranks Labels */}
                        <div className="flex flex-col w-6 mr-2 h-64 justify-between text-slate-500 font-mono text-xs font-bold py-3">
                            {ranks.map(r => <span key={r} className="flex items-center justify-center h-full">{r}</span>)}
                        </div>
                        
                        {/* The Board: Fixed Dimensions & Strict Grid */}
                        <div className="w-64 h-64 grid grid-cols-8 grid-rows-8 border-2 border-slate-700 shadow-inner">
                            {ranks.map((r, rIdx) => (
                                files.map((f, fIdx) => (
                                    <div 
                                        key={`${f}${r}`} 
                                        className={`w-full h-full flex items-center justify-center ${(rIdx + fIdx) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}`}
                                    >
                                        {getStartingPiece(r, fIdx)}
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>
                    {/* Files Labels */}
                    <div className="flex ml-8 mt-1 w-64">
                         <div className="grid grid-cols-8 w-full text-slate-500 font-mono text-xs font-bold">
                            {files.map(f => <span key={f} className="text-center">{f}</span>)}
                         </div>
                    </div>
                </div>
            </div>
          </section>

          {/* 2. Pieces */}
          <section>
            <h3 className="text-xl font-cinzel font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">II.</span> The Pieces
            </h3>
            <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-amber-500 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4">Piece</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Movement</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-900/50">
                        <tr>
                            <td className="p-4 text-3xl">♔ / ♚</td>
                            <td className="p-4 font-bold text-white">King</td>
                            <td className="p-4 text-slate-400">Moves <strong>1 square</strong> in any direction. The most important piece.</td>
                        </tr>
                        <tr>
                            <td className="p-4 text-3xl">♕ / ♛</td>
                            <td className="p-4 font-bold text-white">Queen</td>
                            <td className="p-4 text-slate-400">Moves any distance straight or diagonally. The most powerful piece.</td>
                        </tr>
                        <tr>
                            <td className="p-4 text-3xl">♖ / ♜</td>
                            <td className="p-4 font-bold text-white">Rook</td>
                            <td className="p-4 text-slate-400">Moves straight (horizontal/vertical). Can castle.</td>
                        </tr>
                        <tr>
                            <td className="p-4 text-3xl">♗ / ♝</td>
                            <td className="p-4 font-bold text-white">Bishop</td>
                            <td className="p-4 text-slate-400">Moves diagonally. Always stays on its starting color.</td>
                        </tr>
                        <tr>
                            <td className="p-4 text-3xl">♘ / ♞</td>
                            <td className="p-4 font-bold text-white">Knight</td>
                            <td className="p-4 text-slate-400">Moves in an <strong>L-shape</strong> (2+1). The only piece that can jump over others.</td>
                        </tr>
                        <tr>
                            <td className="p-4 text-3xl">♙ / ♟</td>
                            <td className="p-4 font-bold text-white">Pawn</td>
                            <td className="p-4 text-slate-400">Moves forward 1 square (or 2 on first move). Captures diagonally.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </section>

          {/* 3. Victory Conditions */}
          <section>
            <h3 className="text-xl font-cinzel font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">III.</span> Victory & Defeat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border-l-2 border-emerald-500">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2"><Crown size={16} className="text-emerald-500"/> Checkmate (Win)</h4>
                    <p className="text-sm text-slate-400">The enemy King is attacked (in check) and has <strong>no legal escape</strong>.</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border-l-2 border-slate-500">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2"><Shield size={16} className="text-slate-500"/> Stalemate (Draw)</h4>
                    <p className="text-sm text-slate-400">The enemy King is <strong>NOT</strong> in check, but has <strong>no legal moves</strong>.</p>
                </div>
            </div>
          </section>

          {/* 4. Special Moves */}
          <section>
             <h3 className="text-xl font-cinzel font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">IV.</span> Special Rules
            </h3>
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 rounded-xl border border-amber-500/20">
                    <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-2"><GraduationCap size={18}/> Pawn Promotion</h4>
                    <p className="text-sm">When a pawn reaches the opposite end of the board (Rank 8 for White, Rank 1 for Black), it <strong>must</strong> transform.</p>
                    <div className="mt-2 flex gap-4 text-xs font-mono text-slate-400">
                        <span className="px-2 py-1 bg-black/40 rounded border border-white/5">Queen (Most Common)</span>
                        <span className="px-2 py-1 bg-black/40 rounded border border-white/5">Rook</span>
                        <span className="px-2 py-1 bg-black/40 rounded border border-white/5">Bishop</span>
                        <span className="px-2 py-1 bg-black/40 rounded border border-white/5">Knight</span>
                    </div>
                </div>
            </div>
          </section>

          {/* 5. FIDE Rules */}
          <section>
            <h3 className="text-xl font-cinzel font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">V.</span> Official FIDE Ending Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-slate-950/50 rounded border border-white/5">
                    <strong className="block text-white mb-1">1. Checkmate</strong>
                    <span className="text-slate-500">King trapped. Game Over.</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded border border-white/5">
                    <strong className="block text-white mb-1">2. Stalemate</strong>
                    <span className="text-slate-500">No moves, no check. Draw.</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded border border-white/5">
                    <strong className="block text-white mb-1">3. Resignation</strong>
                    <span className="text-slate-500">Player quits. Opponent wins.</span>
                </div>
                 <div className="p-3 bg-slate-950/50 rounded border border-white/5">
                    <strong className="block text-white mb-1">4. Repetition</strong>
                    <span className="text-slate-500">Same position 3 times. Draw.</span>
                </div>
                 <div className="p-3 bg-slate-950/50 rounded border border-white/5">
                    <strong className="block text-white mb-1">5. 50-Move Rule</strong>
                    <span className="text-slate-500">50 moves without pawn move/capture. Draw.</span>
                </div>
                 <div className="p-3 bg-slate-950/50 rounded border border-white/5">
                    <strong className="block text-white mb-1">6. Insufficient Material</strong>
                    <span className="text-slate-500">Not enough pieces to mate (e.g. K vs K). Draw.</span>
                </div>
            </div>
          </section>

          {/* 6. Tips */}
          <section>
             <h3 className="text-xl font-cinzel font-bold text-amber-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">VI.</span> Beginner Tips
            </h3>
            <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                    <Scroll className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-white block">Control the Center</strong>
                        <span className="text-slate-400 text-sm">Squares e4, d4, e5, d5 are the most important. Occupy them with pawns and pieces.</span>
                    </div>
                </li>
                <li className="flex gap-3 items-start">
                    <Scroll className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-white block">King Safety First</strong>
                        <span className="text-slate-400 text-sm">Castle early to get your King out of the center and connect your Rooks.</span>
                    </div>
                </li>
                 <li className="flex gap-3 items-start">
                    <Scroll className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-white block">Don't Hang Pieces</strong>
                        <span className="text-slate-400 text-sm">Before every move, check: "Is my piece safe there?" and "What did my opponent just threaten?"</span>
                    </div>
                </li>
            </ul>
          </section>
          
          <div className="text-center pt-8 border-t border-white/10">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-amber-500 text-slate-900 font-bold uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-colors"
            >
                Return to Game
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BeginnerGuide;

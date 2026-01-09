
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, Target, Eye, DollarSign, BookOpen, ChevronDown, ChevronUp, Trophy, ShieldAlert, Loader2, Flag, RefreshCcw, ScrollText, Download, Play, Scale, HelpCircle, Sparkles, Skull } from 'lucide-react';
import { Chess, Move } from 'chess.js';
import ChessBoardInput from './ChessBoardInput';
import VibeMeter from './VibeMeter';
import SocraticChat from './SocraticChat';
import StoryMode from './StoryMode';
import MoveCard from './MoveCard';
import BeginnerGuide from './BeginnerGuide'; 
import HistoricalMatch from './HistoricalMatch'; // NEW IMPORT
import { geminiService } from '../services/geminiService';
import { AnalysisResult, ChatMessage, StoryState, VibeLevel, PieceState, MoveOption, StrategyGuide, HeatmapData, HistoricalGame } from '../types';
import { getSquareColor, getPieceIcon } from './ChessBoardOverlay';

const Dashboard: React.FC = () => {
  const [baseAnalysis, setBaseAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [boardImage, setBoardImage] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null); 
  
  const [isStrategyOpen, setIsStrategyOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false); 
  const [moneySaved, setMoneySaved] = useState(0);
  const [showSavingsAnimation, setShowSavingsAnimation] = useState(false);
  
  // DYNAMIC ENGINE STATE
  const [game, setGame] = useState<Chess>(new Chess());
  const [isComputerMoving, setIsComputerMoving] = useState(false);
  const [dynamicAnalysis, setDynamicAnalysis] = useState<AnalysisResult | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false); 
  
  // FINAL EVALUATION STATE
  const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
  const [isGeneratingVerdict, setIsGeneratingVerdict] = useState(false);
  
  // CAPTURE MASK STATE
  const [hiddenSquares, setHiddenSquares] = useState<Set<string>>(new Set());
  const [overlayPieces, setOverlayPieces] = useState<Map<string, PieceState>>(new Map());

  // HISTORICAL MATCH STATE
  const [historicalGame, setHistoricalGame] = useState<HistoricalGame | null>(null);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);

  const triggerSavings = (amount: number) => {
    setMoneySaved(prev => prev + amount);
    setShowSavingsAnimation(true);
    setTimeout(() => setShowSavingsAnimation(false), 2000);
  };

  const getKingSquare = (gameInstance: Chess): string | null => {
    if (!gameInstance.inCheck()) return null;
    const turn = gameInstance.turn();
    const board = gameInstance.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return piece.square;
        }
      }
    }
    return null;
  };

  const formatAnalysis = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-amber-400 font-bold not-italic">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getPieceValue = (p?: string) => {
      if (!p) return 0;
      const v: Record<string, number> = { p: 10, n: 32, b: 33, r: 50, q: 90, k: 2000 };
      return v[p.toLowerCase()] || 0;
  };

  const getFullPieceName = (char: string) => {
      const map: Record<string, string> = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
      return map[char.toLowerCase()] || 'Piece';
  };

  // --- DYNAMIC RATIONALE GENERATOR ---
  const generateRationale = (move: Move, type: 'pragmatic' | 'artist'): string => {
      if (move.san.includes('#')) return "Delivers Checkmate. The game is won immediately.";
      if (move.promotion) return "Promotes the Pawn to a Queen, creating a decisive material advantage.";
      
      if (type === 'artist') {
          if (move.san.includes('+')) return "Delivers a check, seizing the initiative and forcing the King to move.";
          if (move.captured) return `Captures the ${getFullPieceName(move.captured)} on ${move.to}, winning material aggressively.`;
          if (move.piece === 'q') return "Activates the Queen to create dangerous attacking threats.";
          return "Advances into enemy territory to create tactical complications.";
      } else {
          if (move.san.includes('O-O')) return "Castles to safety, connecting the Rooks and protecting the King.";
          if (move.captured) return `Safely captures the ${getFullPieceName(move.captured)}, simplifying the position.`;
          if (move.piece === 'p') return "Strengthens the pawn structure and controls critical center squares.";
          if (move.piece === 'k') return " moves the King to a safer square out of danger.";
          return "Develops the piece to a solid square, improving coordination.";
      }
  };

  // --- MINI-STOCKFISH 3.0: HEURISTIC SCORING ENGINE ---
  const evaluateStaticPosition = (gameInstance: Chess) => {
      // Evaluate static board state
      let score = 0;
      const board = gameInstance.board();
      const turn = gameInstance.turn(); 

      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              const piece = board[r][c];
              if (!piece) continue;
              
              const val = getPieceValue(piece.type);
              if (piece.color === 'w') score += val;
              else score -= val;
          }
      }
      return score;
  };

  const evaluateMove = (move: Move, gameInstance: Chess) => {
      let score = 0;
      
      // 1. CRITICAL: Checkmate & Promotion
      if (move.san.includes('#')) score += 100000; 
      if (move.promotion) score += 2000; 

      // 2. Material Gain (Value Difference)
      if (move.captured) {
          const victimValue = getPieceValue(move.captured);
          const attackerValue = getPieceValue(move.piece);
          score += (victimValue * 10);
          if (victimValue > attackerValue) score += 50; 
          if (attackerValue > victimValue && !move.san.includes('#')) score -= 5;
      }
      
      // 3. Checks (Tempo)
      if (move.san.includes('+')) score += 40;     

      // 4. Positional
      if (['e4', 'd4', 'e5', 'd5'].includes(move.to)) score += 25;
      
      // 5. King Safety (Castling)
      if (move.san.includes('O-O')) score += 70; 

      return score;
  };

  // --- LOOKAHEAD ENGINE (Minimax Lite) ---
  const getMoveScoreWithLookahead = (move: Move, gameInstance: Chess, depth: number = 1): number => {
      const gameClone = new Chess(gameInstance.fen());
      
      // 1. Make the move
      gameClone.move(move);

      // 2. Immediate Score (My Benefit)
      const immediateScore = evaluateMove(move, gameInstance);
      if (move.san.includes('#')) return 100000; // Instant win

      // 3. Opponent's Best Response (The Risk)
      const opponentMoves = gameClone.moves({ verbose: true });
      if (opponentMoves.length === 0) return immediateScore; 

      let maxOpponentScore = -Infinity;
      
      for (const oppMove of opponentMoves) {
          let oppScore = evaluateMove(oppMove, gameClone);
          
          if (oppMove.san.includes('#')) return -100000; 
          if (oppMove.captured === 'q') oppScore += 500;

          if (oppScore > maxOpponentScore) {
              maxOpponentScore = oppScore;
          }
      }

      return immediateScore - (maxOpponentScore * 0.8);
  };

  const generateHeuristicMoves = (chessInstance: Chess) => {
    let moves;
    try {
        moves = chessInstance.moves({ verbose: true });
    } catch (e) {
        return {
            pragmatic: { san: "...", translation: "Error", rationale: "Invalid Board State" },
            artist: { san: "...", translation: "Error", rationale: "Invalid Board State" }
        };
    }

    if (moves.length === 0) {
         return {
            pragmatic: { san: "...", translation: "No moves", rationale: "Game over." },
            artist: { san: "...", translation: "No moves", rationale: "Game over." }
        };
    }

    // USE LOOKAHEAD FOR USER (WHITE) MOVES
    const scoredMoves = moves.map(m => ({ 
        move: m, 
        score: getMoveScoreWithLookahead(m, chessInstance) 
    }));
    
    scoredMoves.sort((a, b) => b.score - a.score);

    // --- SELECTION LOGIC ---
    const artistCandidates = scoredMoves.filter(m => 
        m.move.san.includes('+') || 
        m.move.san.includes('#') || 
        m.move.san.includes('x') || 
        m.move.piece === 'q'
    );
    const artistMove = artistCandidates.length > 0 ? artistCandidates[0].move : scoredMoves[0].move;

    const pragmaticCandidates = scoredMoves.filter(m => 
        m.move.san.includes('O-O') || 
        !m.move.san.includes('x') || 
        m.score > 20
    );
    let pragmaticMove = pragmaticCandidates.length > 0 ? pragmaticCandidates[0].move : scoredMoves[0].move;

    if (artistMove.san === pragmaticMove.san && scoredMoves.length > 1) {
        if (!artistMove.san.includes('#')) {
             const alternative = scoredMoves.find(m => m.move.san !== artistMove.san);
             if (alternative) pragmaticMove = alternative.move;
        }
    }

    return {
        pragmatic: {
            san: pragmaticMove.san,
            from: pragmaticMove.from,
            to: pragmaticMove.to,
            translation: translateSan(pragmaticMove.san),
            rationale: generateRationale(pragmaticMove, 'pragmatic')
        },
        artist: {
            san: artistMove.san,
            from: artistMove.from,
            to: artistMove.to,
            translation: translateSan(artistMove.san),
            rationale: generateRationale(artistMove, 'artist')
        }
    };
  };

  const translateSan = (san: string) => {
      if (san.includes('=')) return "PROMOTION!";
      if (san.includes('O-O')) return "Castling";
      if (san.includes('#')) return "CHECKMATE";
      if (san.includes('x')) return "Capture";
      if (san.includes('+')) return "Check!";
      return "Positional Move";
  };

  // --- CONTEXT-AWARE STRATEGY ENGINE ---
  const generateDynamicStrategy = (chessInstance: Chess, moves: { pragmatic: MoveOption, artist: MoveOption }): StrategyGuide => {
    const isCheck = chessInstance.inCheck();
    const isMate = chessInstance.isCheckmate();
    const isStalemate = chessInstance.isStalemate();
    
    if (isMate) return { theme: "Checkmate", concept: "The game has ended decisively.", ruleOfThumb: "Game Over." };
    if (isStalemate) return { theme: "Stalemate", concept: "No legal moves available, but not in check.", ruleOfThumb: "Draw secured." };
    if (isCheck) return { theme: "King Under Siege", concept: "The King is in immediate danger. Defense is the priority.", ruleOfThumb: "When in check, consider: Capture, Block, or Run." };

    const artistSan = moves.artist.san;
    const materialDiff = evaluateStaticPosition(chessInstance); 

    if (materialDiff >= 30) {
        return { theme: "Domination & Simplification", concept: `You have a material advantage. Consolidate and trade pieces.`, ruleOfThumb: "When ahead, trade pieces but not pawns." };
    }
    if (artistSan.includes('x')) return { theme: "Material Advantage", concept: "Removing enemy pieces reduces their attacking potential.", ruleOfThumb: "Capture hanging pieces when safe." };
    if (artistSan.includes('O-O')) return { theme: "King Safety", concept: "Connecting Rooks and protecting the King is vital.", ruleOfThumb: "Castle early, castle often." };
    
    return { theme: "Positional Maneuver", concept: "Improve the position of your pieces to control key squares.", ruleOfThumb: "Knights on the rim are dim; control the center." };
  };

  const updateDynamicAnalysis = (chessInstance: Chess, explicitBase?: AnalysisResult) => {
      const base = explicitBase || baseAnalysis;
      if (!base) return;
      
      const { pragmatic, artist } = generateHeuristicMoves(chessInstance);
      const isCheck = chessInstance.inCheck();
      const isMate = chessInstance.isCheckmate();
      const isStalemate = chessInstance.isStalemate();
      
      const newStrategy = generateDynamicStrategy(chessInstance, { pragmatic, artist });

      const newAnalysis: AnalysisResult = {
          ...base,
          fen: chessInstance.fen(),
          turn: chessInstance.turn(),
          vibeLabel: isMate ? VibeLevel.Domination : isCheck ? VibeLevel.Panic : VibeLevel.Flow,
          vibeScore: isMate ? 100 : isCheck ? 30 : 75,
          summary: isMate ? "Checkmate! The game is yours." : isCheck ? "The King is under fire! precise defense required." : isStalemate ? "Stalemate. No legal moves." : "The position is fluid. Look for opportunities.",
          metrics: {
              ...base.metrics,
              pragmatism: pragmatic,
              artistry: artist
          },
          strategy: newStrategy 
      };
      setDynamicAnalysis(newAnalysis);
  };

  const calculateHeatmap = (gameInstance: Chess): HeatmapData => {
    const newHeatmap = new Map<string, 'white' | 'black' | 'tension'>();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    try {
        for (const r of ranks) {
            for (const f of files) {
                const square = (f + r) as any;
                const whiteControl = gameInstance.isAttacked(square, 'w');
                const blackControl = gameInstance.isAttacked(square, 'b');

                if (whiteControl && blackControl) {
                    newHeatmap.set(square, 'tension');
                } else if (whiteControl) {
                    newHeatmap.set(square, 'white');
                } else if (blackControl) {
                    newHeatmap.set(square, 'black');
                }
            }
        }
    } catch (e) {
        console.error("Heatmap calculation failed", e);
    }
    return newHeatmap;
  };

  useEffect(() => {
    if (heatmapData && game) {
        setHeatmapData(calculateHeatmap(game));
    }
  }, [game]); 


  const handleImageSelected = async (base64Full: string) => {
    setBoardImage(base64Full);
    setIsAnalyzing(true);
    setBaseAnalysis(null);
    setDynamicAnalysis(null);
    setHeatmapData(null); 
    setMessages([]); 
    setHiddenSquares(new Set());
    setOverlayPieces(new Map());
    setIsStrategyOpen(true);
    setIsComputerMoving(false);
    setTurnCount(0);
    setFinalVerdict(null);
    setIsGeneratingVerdict(false);
    setIsTerminated(false);
    setHistoricalGame(null); 
    
    const base64Data = base64Full.split(',')[1];

    try {
      const result = await geminiService.analyzeBoardImage(base64Data);
      setBaseAnalysis(result);
      
      let newGame: Chess;
      try {
        newGame = new Chess(result.fen);
      } catch (e) {
        console.warn("Gemini returned invalid FEN, falling back to start pos:", result.fen);
        newGame = new Chess();
      }

      setGame(newGame);
      updateDynamicAnalysis(newGame, result); 
      
      triggerSavings(20);
      
      const initialMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `The board is set. ${newGame.turn() === 'w' ? 'White' : 'Black'} to move. ${result.summary}`,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);

      if (result.openingName) {
          setIsSearchingHistory(true);
          geminiService.findHistoricalMatch(result.openingName).then(match => {
              setHistoricalGame(match);
              setIsSearchingHistory(false);
          });
      }

    } catch (error) {
      console.error("Critical Analysis Error:", error);
      
      const fallbackGame = new Chess();
      setGame(fallbackGame);
      
      const fallbackResult: AnalysisResult = {
          fen: fallbackGame.fen(),
          turn: 'w',
          vibeScore: 50,
          vibeLabel: VibeLevel.Tension,
          metrics: {
              efficiency: 50,
              roi: 50,
              pragmatism: { san: "e4", translation: "King's Pawn Opening", rationale: "Standard control." },
              artistry: { san: "Nf3", translation: "Knight Development", rationale: "Flexible setup." }
          },
          performanceState: { tunnelVision: 0, fear: 0, aggression: 50 },
          strategy: { theme: "Recovery Mode", concept: "The visual engine couldn't lock on.", ruleOfThumb: "Play standard chess principles." },
          summary: "Visual analysis failed. Loaded standard starting position."
      };

      setBaseAnalysis(fallbackResult);
      updateDynamicAnalysis(fallbackGame, fallbackResult);
      
      const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: "I couldn't quite see the board perfectly, so I set up a standard game. You can still play!",
          timestamp: Date.now()
      }
      setMessages([errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleReset = () => {
    setBoardImage(null);
    setBaseAnalysis(null);
    setDynamicAnalysis(null);
    setHeatmapData(null); 
    setMessages([]);
    setHiddenSquares(new Set());
    setOverlayPieces(new Map());
    setIsStrategyOpen(true);
    setIsComputerMoving(false);
    setTurnCount(0);
    setFinalVerdict(null);
    setIsGeneratingVerdict(false);
    setIsTerminated(false);
    setHistoricalGame(null); 
    setGame(new Chess());
    setMoneySaved(0);
  };

  const handleContinueAnalysis = () => {
    setTurnCount(0); 
    triggerSavings(10);
    setFinalVerdict(null);
  };

  const handleToggleVision = () => {
    if (heatmapData) {
        setHeatmapData(null);
    } else {
        if (!game) return;
        setHeatmapData(calculateHeatmap(game)); 
        triggerSavings(15);
    }
  };

  const generateFinalVerdict = async (finalFen: string) => {
    if (isGeneratingVerdict || finalVerdict) return;
    setIsGeneratingVerdict(true);
    const verdict = await geminiService.getGameStateEvaluation(finalFen);
    setFinalVerdict(verdict);
    setIsGeneratingVerdict(false);
  };

  const handleDownloadSnapshot = () => {
    if (!boardImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = boardImage;

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const squareWidth = img.width / 8;
        const squareHeight = img.height / 8;
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

        hiddenSquares.forEach(sq => {
           const f = files.indexOf(sq[0]);
           const r = ranks.indexOf(sq[1]);
           if (f === -1 || r === -1) return;
           
           ctx.fillStyle = getSquareColor(sq);
           ctx.fillRect(f * squareWidth, r * squareHeight, squareWidth, squareHeight);
        });

        overlayPieces.forEach((piece, sq) => {
           const f = files.indexOf(sq[0]);
           const r = ranks.indexOf(sq[1]);
           if (f === -1 || r === -1) return;

           const symbol = getPieceIcon(piece.symbol, piece.color);
           
           ctx.font = `${squareHeight * 0.8}px serif`;
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           
           const x = (f * squareWidth) + (squareWidth / 2);
           const y = (r * squareHeight) + (squareHeight / 2) + (squareHeight * 0.05); 

           if (piece.color === 'w') {
               ctx.fillStyle = '#ffffff';
               ctx.strokeStyle = '#000000';
               ctx.lineWidth = squareHeight * 0.05;
               ctx.strokeText(symbol, x, y);
               ctx.fillText(symbol, x, y);
           } else {
               ctx.fillStyle = '#000000';
               ctx.strokeStyle = '#ffffff'; 
               ctx.lineWidth = 2; 
               ctx.strokeText(symbol, x, y);
               ctx.fillText(symbol, x, y);
           }
        });

        const link = document.createElement('a');
        link.download = `ChessOdyssey_Snapshot_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        triggerSavings(2);
    };
  };

  const updateBoardState = (from: string, to: string, piece: string, color: 'w' | 'b') => {
    setHiddenSquares(prev => {
      const next = new Set(prev);
      next.add(from);
      next.add(to);
      return next;
    });

    setOverlayPieces(prev => {
      const next = new Map(prev);
      next.delete(from);
      next.set(to, { symbol: piece, color });
      return next;
    });
  };

  const handleExecuteMove = (moveSan: string, overrideFrom: string, overrideTo: string) => {
    if (isComputerMoving || game.isGameOver() || isTerminated) return;
    
    const gameClone = new Chess(game.fen());

    try {
      let moveResult = null;
      try {
        moveResult = gameClone.move(moveSan);
      } catch (e) {
          try {
             moveResult = gameClone.move({ from: overrideFrom, to: overrideTo });
          } catch (e2) {
             console.error("Invalid move:", moveSan);
          }
      }
      
      if (!moveResult) return;

      setGame(gameClone);

      let displayPiece = moveResult.piece;
      if (moveResult.promotion) {
          displayPiece = moveResult.promotion; 
          const promoMsg: ChatMessage = {
              id: Date.now().toString(),
              role: 'model',
              text: "Pawn Promoted to Queen! A decisive advantage.",
              timestamp: Date.now()
          };
          setMessages(prev => [...prev, promoMsg]);
      }

      updateBoardState(moveResult.from, moveResult.to, displayPiece, moveResult.color);
      
      if (moveResult.san === 'O-O') {
         const rank = moveResult.color === 'w' ? '1' : '8';
         updateBoardState(`h${rank}`, `f${rank}`, 'r', moveResult.color);
      }
      if (moveResult.san === 'O-O-O') {
         const rank = moveResult.color === 'w' ? '1' : '8';
         updateBoardState(`a${rank}`, `d${rank}`, 'r', moveResult.color);
      }

      if (moveResult.captured === 'k') {
          setIsTerminated(true);
          generateFinalVerdict(gameClone.fen());
          return;
      }

      if (gameClone.isGameOver()) {
         if (!gameClone.isCheckmate() && !gameClone.isDraw() && !gameClone.isStalemate() && !gameClone.isThreefoldRepetition() && !gameClone.isInsufficientMaterial()) {
             setIsTerminated(true); 
         }
         generateFinalVerdict(gameClone.fen());
         return; 
      }

      setIsComputerMoving(true);
      
      setTimeout(() => {
        const computerGame = new Chess(gameClone.fen());
        
        if (computerGame.isGameOver() || isTerminated) {
             setTimeout(() => {
                 setIsComputerMoving(false);
                 generateFinalVerdict(computerGame.fen());
             }, 500);
             return;
        }

        const possibleMoves = computerGame.moves({ verbose: true });
        if (possibleMoves.length > 0) {
            // NERFED OPPONENT: Human Error Introduction
            // The opponent does NOT calculate lookahead (depth 1), making them weaker than the User's suggestions (depth 2)
            const scoredOpponentMoves = possibleMoves.map(m => ({ move: m, score: evaluateMove(m, computerGame) }));
            scoredOpponentMoves.sort((a, b) => b.score - a.score);
            
            // LOGIC: 30% Chance to pick the 2nd best move, to simulate human error/missed tactics
            // This ensures White wins more often in sharp positions.
            let selectedIndex = 0;
            if (scoredOpponentMoves.length > 1 && Math.random() > 0.7) {
                 selectedIndex = 1;
            }
            
            const selectedMove = scoredOpponentMoves[selectedIndex].move; 
            
            if (selectedMove) {
                if (selectedMove.flags.includes('p')) { 
                    computerGame.move({ from: selectedMove.from, to: selectedMove.to, promotion: 'q' });
                } else {
                    computerGame.move(selectedMove.san);
                }
                
                setGame(computerGame); 
                
                let oppDisplayPiece = selectedMove.piece;
                if (selectedMove.flags.includes('p')) {
                     oppDisplayPiece = 'q';
                }

                updateBoardState(selectedMove.from, selectedMove.to, oppDisplayPiece, selectedMove.color);
                
                if (selectedMove.san === 'O-O') {
                    const rank = selectedMove.color === 'w' ? '1' : '8';
                    updateBoardState(`h${rank}`, `f${rank}`, 'r', selectedMove.color);
                }
                if (selectedMove.san === 'O-O-O') {
                    const rank = selectedMove.color === 'w' ? '1' : '8';
                    updateBoardState(`a${rank}`, `d${rank}`, 'r', selectedMove.color);
                }

                const botResponse: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'model',
                    text: `Opponent responded with ${selectedMove.san}.`,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, botResponse]);
                triggerSavings(5);

                if (selectedMove.captured === 'k') {
                    setIsTerminated(true);
                    setIsComputerMoving(false);
                    generateFinalVerdict(computerGame.fen());
                    return;
                }
            }
        }

        if (computerGame.isGameOver()) {
             setTimeout(() => {
                 setIsComputerMoving(false);
                 generateFinalVerdict(computerGame.fen());
             }, 500);
             return; 
        }

        if (isTerminated) return;

        setIsAnalyzing(true);
        
        // RE-EVALUATION DELAY
        setTimeout(() => {
            setIsAnalyzing(false);
            updateDynamicAnalysis(computerGame); // THIS RECALCULATES ARTIST/PRAGMATIC
            setIsComputerMoving(false);
            
            const newTurnCount = turnCount + 1;
            setTurnCount(newTurnCount);

            if (newTurnCount >= 10) {
                generateFinalVerdict(computerGame.fen());
            }

        }, 2000); 

      }, 1000); 

    } catch (e) {
      console.error("Move execution failed", e);
      setIsComputerMoving(false);
      setIsAnalyzing(false);
      if (baseAnalysis) updateDynamicAnalysis(game, baseAnalysis);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!dynamicAnalysis && !baseAnalysis) return;
    const currentFen = dynamicAnalysis?.fen || baseAnalysis?.fen || "";

    triggerSavings(3);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsChatting(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const responseText = await geminiService.sendChatMessage(history, currentFen, text);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatting(false);
    }
  };

  const currentAnalysis = dynamicAnalysis || baseAnalysis;
  const isGameOver = game.isGameOver() || turnCount >= 10;
  const isDecisive = game.isGameOver() || isTerminated; 

  const getResultContent = () => {
    if (isTerminated && !game.isCheckmate()) {
        return {
          title: "CRITICAL KING SAFETY FAILURE",
          message: finalVerdict || "Critical King Safety failure detected. The King has fallen or is in an illegal state. Back-rank mate is imminent.",
          icon: <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
        };
    }

    if (game.isCheckmate()) {
       // Logic: If it is currently Black's turn ('b'), it means White just moved and mated Black.
       // If it is currently White's turn ('w'), it means Black just moved and mated White.
       const isUserWinner = game.turn() === 'b'; 
       
       return {
         title: isUserWinner ? "VICTORY ACHIEVED" : "DEFEAT",
         message: finalVerdict || (isUserWinner 
            ? "Checkmate! You have crushed the opponent's defense. The King falls to your strategy."
            : "Checkmate. The opponent found a winning line. Your King has fallen."),
         icon: isUserWinner 
            ? <Trophy className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
            : <Skull className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
       };
    } 
    
    if (game.isStalemate()) {
        return {
          title: "Stalemate (Pat)",
          message: finalVerdict || "The King is safe but trapped. No legal moves available. It's a draw.",
          icon: <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
        };
    }

    if (game.isInsufficientMaterial()) {
        return {
          title: "Insufficient Material",
          message: finalVerdict || "Dead position. Neither side can force a checkmate.",
          icon: <Scale className="w-16 h-16 text-slate-400 mb-4" />
        };
    }

    if (game.isThreefoldRepetition()) {
        return {
          title: "Draw by Repetition",
          message: finalVerdict || "History repeats itself. The same position has occurred three times.",
          icon: <RefreshCcw className="w-16 h-16 text-slate-400 mb-4" />
        };
    }

    if (game.isDraw()) {
       return {
         title: "Draw by 50-Move Rule",
         message: finalVerdict || "The game has ended in a draw (50 moves without a capture or pawn move).",
         icon: <Scale className="w-16 h-16 text-slate-400 mb-4" />
       };
    }
    
    return {
         title: "Tactical Checkpoint",
         message: finalVerdict || "Grandmaster is evaluating the position...",
         icon: <Flag className="w-16 h-16 text-cyan-400 mb-4" />
    }
  };
  const result = getResultContent();


  return (
    <div className="h-screen bg-[#020617] text-slate-200 overflow-hidden flex flex-col font-sans selection:bg-amber-500/30 selection:text-white relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {/* BEGINNER GUIDE MODAL */}
      <BeginnerGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <header className="shrink-0 h-16 border-b border-white/10 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl z-50 relative">
        <div className="flex items-center gap-3">
           <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg shadow-lg shadow-amber-500/20">
             <LayoutDashboard className="text-white w-5 h-5" />
           </div>
           <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-400 font-cinzel drop-shadow-sm">ChessOdyssey</h1>
           <span className="hidden md:inline text-slate-500 text-xs font-serif italic border-l border-white/10 pl-3 tracking-wide">The Royal Intuition Engine</span>
        </div>
        
        <div className="flex items-center gap-4">
            {/* NEW GUIDE BUTTON */}
            <button 
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/20 transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                title="Chess Rules"
            >
                <BookOpen size={16} />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Rules</span>
            </button>

            {boardImage && (
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/10 transition-colors text-xs font-bold uppercase tracking-wider z-50 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                    <RefreshCcw size={14} />
                    <span className="hidden sm:inline">Reset Board</span>
                </button>
            )}

            <div className="flex items-center gap-3 bg-amber-900/20 px-4 py-1.5 rounded-full border border-white/10 relative backdrop-blur-md shadow-lg">
            <div className="bg-amber-900/30 p-1 rounded-full">
                <DollarSign className="w-3 h-3 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Coaching Value Saved</span>
                <span className="text-sm font-bold font-mono text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">${moneySaved}</span>
            </div>
            {showSavingsAnimation && (
                <div className="absolute -bottom-6 right-4 text-emerald-400 font-bold text-xs animate-[fadeUp_1s_ease-out_forwards]">+$15</div>
            )}
            </div>
        </div>
      </header>

      {(isGameOver || isTerminated || finalVerdict) && (
         <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-1000">
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-amber-500/30 shadow-[0_0_100px_rgba(245,158,11,0.2)] text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    {result.icon}
                    <h2 className="text-3xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-400 mb-2 drop-shadow-sm">{result.title}</h2>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
                    
                    {isGeneratingVerdict ? (
                        <div className="flex flex-col items-center mb-8">
                             <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                             <p className="text-amber-200/60 text-xs tracking-[0.2em] uppercase">Grandmaster Analyzing...</p>
                        </div>
                    ) : (
                        <p className="text-slate-300 font-serif leading-relaxed mb-8 text-sm max-h-[150px] overflow-y-auto scrollbar-thin pr-2 border-l-2 border-amber-500/30 pl-4 text-left bg-black/20 p-4 rounded-r-lg">
                            {formatAnalysis(result.message)}
                        </p>
                    )}
                    
                    <div className="flex flex-col gap-3 w-full">
                        {!isDecisive && !isGeneratingVerdict && !isTerminated && (
                            <button 
                                onClick={handleContinueAnalysis}
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all hover:scale-[1.02] border border-amber-400/20 flex items-center justify-center gap-2 uppercase tracking-wide text-xs group-hover:shadow-amber-500/20"
                            >
                                <Play size={16} fill="currentColor" />
                                Continue Analysis (+10 Turns)
                            </button>
                        )}
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={handleDownloadSnapshot}
                                disabled={isGeneratingVerdict}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                            >
                                <Download size={16} />
                                Snapshot
                            </button>

                            <button 
                                onClick={handleReset}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-white/5 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                            >
                                <RefreshCcw size={16} />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      )}

      <div className="flex-1 flex overflow-hidden relative z-10">
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin relative z-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="w-full h-[50vh] flex justify-center perspective-1000">
                <ChessBoardInput 
                  currentImage={boardImage} 
                  onImageSelected={handleImageSelected} 
                  isAnalyzing={isAnalyzing}
                  hiddenSquares={hiddenSquares}
                  pieces={overlayPieces}
                  checkSquare={getKingSquare(game)}
                  heatmapData={heatmapData} // NEW HEATMAP PROP
                />
              </div>

              {currentAnalysis && (
                <div className="space-y-4 max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-5 duration-700">
                   <div className="backdrop-blur-xl bg-slate-950/60 p-5 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <VibeMeter score={currentAnalysis.vibeScore} label={currentAnalysis.vibeLabel} />
                   </div>

                   <div className="backdrop-blur-md bg-slate-900/30 border border-white/10 rounded-2xl p-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-6 shadow-lg">
                     <div className="flex items-center gap-3 px-2 border-r border-white/5 last:border-0 flex-1 justify-center">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Eye size={18} className="text-purple-400 shrink-0"/>
                        </div>
                        <div className="flex flex-col w-full">
                          <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Tunnel Vision</span>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{width: `${currentAnalysis.performanceState.tunnelVision}%`}} />
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 px-2 border-r border-white/5 last:border-0 flex-1 justify-center">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <ShieldAlert size={18} className="text-red-400 shrink-0"/>
                        </div>
                        <div className="flex flex-col w-full">
                          <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Fear</span>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{width: `${currentAnalysis.performanceState.fear}%`}} />
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 px-2 last:border-0 flex-1 justify-center">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Target size={18} className="text-amber-400 shrink-0"/>
                        </div>
                        <div className="flex flex-col w-full">
                          <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Aggression</span>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" style={{width: `${currentAnalysis.performanceState.aggression}%`}} />
                          </div>
                        </div>
                     </div>
                  </div>
                  {/* INSERT HERE */}
                  <HistoricalMatch data={historicalGame} isLoading={isSearchingHistory} />
                </div>
              )}

              <div className="mt-6 border-t border-white/5 pt-4 text-center">
                <p className="text-[10px] text-slate-500 font-serif italic leading-relaxed max-w-lg mx-auto">
                   <Sparkles className="w-3 h-3 text-amber-500 inline mr-1" />
                   The hybrid neuro-symbolic concepts and advanced features of this engine were made possible by the <span className="text-slate-400 font-bold not-italic">advanced reasoning capabilities of Gemini 3 Pro</span>. 
                   Vibe-coded under human guidance, it bridges intuition and calculation through the incredible capabilities of the model.
                </p>
              </div>

            </div>

            <div className="lg:col-span-5 flex flex-col gap-5 pb-10">
               {currentAnalysis && (
                <>
                  <div className={`grid grid-cols-2 gap-4 relative animate-in slide-in-from-right-5 duration-700 delay-150`}>
                    {(isComputerMoving || isAnalyzing) && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm rounded-2xl transition-all duration-500 border border-amber-500/10">
                             <div className="relative">
                                <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
                                <Loader2 className="w-10 h-10 text-amber-500 animate-spin relative z-10" />
                             </div>
                             <span className="mt-4 text-amber-400 font-cinzel font-bold text-xs tracking-[0.2em] bg-black/60 px-4 py-1.5 rounded-full border border-amber-500/30">
                                {isAnalyzing ? 'RE-EVALUATING...' : 'OPPONENT THINKING...'}
                             </span>
                        </div>
                    )}
                    <MoveCard 
                      moveData={currentAnalysis.metrics.pragmatism} 
                      fen={currentAnalysis.fen} 
                      imageSrc={boardImage} 
                      type="pragmatic" 
                      onExecute={(san, from, to) => handleExecuteMove(san, from, to)}
                      disabled={isComputerMoving || isAnalyzing || isGameOver || isTerminated}
                      hiddenSquares={hiddenSquares}
                      pieces={overlayPieces}
                    />
                    <MoveCard 
                      moveData={currentAnalysis.metrics.artistry} 
                      fen={currentAnalysis.fen} 
                      imageSrc={boardImage} 
                      type="artist" 
                      onExecute={(san, from, to) => handleExecuteMove(san, from, to)}
                      disabled={isComputerMoving || isAnalyzing || isGameOver || isTerminated}
                      hiddenSquares={hiddenSquares}
                      pieces={overlayPieces}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/60 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <button 
                      onClick={() => setIsStrategyOpen(!isStrategyOpen)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500/10 rounded text-blue-400 group-hover:text-blue-300 transition-colors">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-cinzel text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Theme: <span className="text-amber-400">{currentAnalysis.strategy.theme}</span></span>
                      </div>
                      {isStrategyOpen ? <ChevronUp className="text-slate-400 w-4 h-4" /> : <ChevronDown className="text-slate-400 w-4 h-4" />}
                    </button>
                    
                    {isStrategyOpen && (
                      <div className="p-5 pt-0 border-t border-white/5 bg-black/20 text-sm">
                        <div className="mt-4 space-y-4">
                          <p className="text-slate-300 font-serif leading-relaxed text-sm border-l-2 border-slate-700 pl-3">{currentAnalysis.strategy.concept}</p>
                          <div className="bg-gradient-to-r from-amber-950/30 to-transparent border-l-2 border-amber-500 p-3 rounded-r-lg">
                            <h5 className="text-[10px] uppercase tracking-wider text-amber-500 font-bold mb-1 flex items-center gap-2">
                                <Target size={10} /> Golden Rule
                            </h5>
                            <p className="text-amber-100 italic font-serif text-sm">"{currentAnalysis.strategy.ruleOfThumb}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <StoryMode 
                    isVisionActive={!!heatmapData} 
                    onToggleVision={handleToggleVision} 
                    hasFen={!!currentAnalysis} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-[380px] shrink-0 border-l border-white/10 bg-slate-950/40 h-full hidden lg:block backdrop-blur-xl relative z-10 shadow-2xl">
          <SocraticChat 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isThinking={isChatting} 
          />
        </div>

      </div>
      
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 0; transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;


export enum VibeLevel {
  Panic = 'Panic',
  Tension = 'Tension',
  Flow = 'Flow',
  Domination = 'Domination'
}

export interface MoveOption {
  san: string;        // e.g. "Nf3"
  translation: string; // e.g. "Knight moves to f3"
  rationale: string;   // The "Why" explanation
  from?: string;       // Explicit start square (e.g. "f3")
  to?: string;         // Explicit end square (e.g. "g5")
}

export interface Metrics {
  efficiency: number; // 0-100
  roi: number; // 0-100
  pragmatism: MoveOption; 
  artistry: MoveOption; 
}

export interface PerformanceState {
  tunnelVision: number; // 0-100
  fear: number; // 0-100
  aggression: number; // 0-100
}

export interface StrategyGuide {
  theme: string;
  concept: string;
  ruleOfThumb: string;
}

export interface AnalysisResult {
  fen: string;
  turn: 'w' | 'b'; // 'w' for White, 'b' for Black
  openingName?: string; // e.g. "Sicilian Defense"
  vibeScore: number; // 0-100
  vibeLabel: VibeLevel;
  metrics: Metrics;
  performanceState: PerformanceState;
  strategy: StrategyGuide;
  summary: string;
}

export interface HistoricalGame {
  players: string; // "Kasparov vs Topalov"
  year: string;    // "1999"
  opening: string; // "Pirc Defense"
  description: string; // "Kasparov played a brilliant rook sacrifice..."
  sourceTitle?: string; // For grounding
  sourceUrl?: string;   // For grounding
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  moveValidity?: 'valid' | 'illegal';
}

export interface StoryState {
  isActive: boolean;
  content: string | null;
  imageUrl: string | null;
  isLoading: boolean;
}

export interface PieceState {
  symbol: string; // 'p', 'r', 'n' etc.
  color: 'w' | 'b';
}

export interface MoveExecution {
  id: string;
  from: string;
  to: string;
  pieceSymbol: string;
  color: 'w' | 'b';
}

export type HeatmapData = Map<string, 'white' | 'black' | 'tension'>;

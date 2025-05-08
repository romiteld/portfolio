// app/chess/types.ts

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
    type: PieceType;
    color: PieceColor;
    position?: string; // Optional position string
}

export type Square = ChessPiece | null;
export type Board = Square[][];

export interface Move {
    from: { row: number; col: number };
    to: { row: number; col: number };
    promotion?: PieceType;
    notation?: string;
    captured?: ChessPiece | null; // Use ChessPiece type
    check?: boolean;
    checkmate?: boolean;
    piece?: ChessPiece; // The piece that moved
}

export interface KingPosition {
    row: number;
    col: number;
}

export interface PlayerMetrics {
    openingPreparation: number;
    tacticalAwareness: number;
    captureRate: number;
    checkRate: number;
    accuracy: number;
    positionalUnderstanding: number;
    endgameSkill: number;
    aggressiveness: number;
    defensiveness: number;
}

export type GamePhase = 'opening' | 'middlegame' | 'endgame';
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
export type CastlingRights = { w: { kingside: boolean; queenside: boolean }; b: { kingside: boolean; queenside: boolean } };

// Define move history type using other defined types
export type MoveHistoryItem = {
  move: Move;
  piece: ChessPiece; // Corrected from Piece to ChessPiece
  captured?: ChessPiece | null; // Corrected from Piece to ChessPiece
  notation: string;
  check: boolean;
  checkmate: boolean;
}

// Define AI personality type
export type AIPersonality = {
  aggressiveness: number;
  defensiveness: number;
  mobility: number;
  positionality: number;
  riskTaking: number;
  opening: string;
  level?: number; // Optional level if passed within personality
}

// Define Chat Message Type (matching ChatBox)
export type ChatMessage = {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'user' | 'response';
  timestamp: Date;
  role?: 'user' | 'assistant';
}

// Define props for the ChessGame component itself
// *** This interface defines what the parent (page.tsx) passes TO ChessGame ***
export interface ChessGameProps {
  playerColor?: PieceColor;
  aiLevel?: number; // Passed down but likely unused if logic is in parent
  showControls?: boolean; // Passed down
  showPlayerAnalysis?: boolean; // Passed down
  onGameOver?: (result: string) => void; // Callback for game over
  className?: string;
  // *** CRITICAL FIX: Define the onMove signature expected BY ChessGame ***
  // ChessGame will CALL this function when a player makes a move.
  onMove: (move: Move) => void;
  // Props passed down FOR RENDERING purposes
  board: Board;
  legalMoves?: Move[];
  lastMove?: Move | null;
  isCheck?: boolean;
  checkPosition?: { row: number, col: number } | null;
  disabled?: boolean;
  orientation?: PieceColor;
  showCoordinates?: boolean; // Added missing property
  animationDuration?: number; // Added missing property
}
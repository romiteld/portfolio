"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ClientSideAI, { useAIModelStatus } from '@/app/chess/components/ClientSideAI';
import {
    Cpu, Brain, Code, ChevronRight, Star, Trophy, Zap,
    Github, Info, RotateCcw, Undo, AlertCircle, Layers,
    MessageCircle, Send, ChevronUp, ChevronDown, Check,
    X, Lightbulb, User, Shield, Crown, Settings, RefreshCw,
    Clock, Square as SquareIcon, Users, Flame, BarChart2, FileDown,
    HelpCircle, BookOpen, Award, ExternalLink, Loader2,
    Medal, TrendingUp, BrainCircuit
} from "lucide-react";
// Import types from the types file
import { 
    Board, Move, Square, PieceColor, PieceType, ChessPiece, CastlingRights, 
    MoveHistoryItem, GamePhase, GameStatus, PlayerMetrics, AIPersonality,
    ChatMessage as PageChatMessage // Use PageChatMessage alias
} from '@/app/chess/types'; // Adjusted path and removed duplicate Piece alias
import ChatBox, { ChatMessage as ChatBoxChatMessage } from "@/app/chess/components/ChatBox";
import * as chessAnalysis from '@/app/chess/utils/chessAnalysis'; // Ensure this path is correct


// --- Constants (Defined Outside Component) ---

const INITIAL_BOARD: Board = [
  [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
  [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
  [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
];

const DEFAULT_AI_PERSONALITY: AIPersonality = { // Use AIPersonality type
  aggressiveness: 0.7, defensiveness: 0.6, mobility: 0.8,
  positionality: 0.9, riskTaking: 0.5, opening: 'versatile'
};

const difficultyLevels = [
    { name: "Beginner", value: 1, description: "Perfect for learning the basics" },
    { name: "Casual", value: 3, description: "Relaxed play with moderate challenge" },
    { name: "Intermediate", value: 5, description: "Solid chess strategy and tactics" },
    { name: "Advanced", value: 7, description: "Strong opposition requiring careful play" },
    { name: "Grandmaster", value: 10, description: "Magnus Carlsen-like play at its finest" }
];

const gameStatusInfo: Record<GameStatus, { icon: React.ElementType, color: string, text: string }> = {
    'playing': { icon: Clock, color: 'text-blue-500 dark:text-blue-400', text: 'Game in progress' },
    'check': { icon: AlertCircle, color: 'text-orange-500 dark:text-orange-400', text: 'Check!' },
    'checkmate': { icon: Trophy, color: 'text-red-500 dark:text-red-400', text: 'Checkmate' },
    'stalemate': { icon: SquareIcon, color: 'text-purple-500 dark:text-purple-400', text: 'Stalemate' },
    'draw': { icon: Users, color: 'text-gray-500 dark:text-gray-400', text: 'Draw' }
};

// --- Core Chess Logic Functions (Defined Outside Component) ---

const isInBounds = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

const findKing = (board: Board, color: PieceColor): { row: number, col: number } | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'k' && board[r][c]?.color === color) {
        return { row: r, col: c }
      }
    }
  }
  return null
}

const getValidMovesForPiece = (board: Board, row: number, col: number, currentCastlingRights: CastlingRights, enPassantTarget: { row: number, col: number } | null): { row: number, col: number }[] => {
  const piece = board[row][col]
  if (!piece) return []
  const moves: { row: number, col: number }[] = []
  const { type, color } = piece

  if (type === 'p') {
    const direction = color === 'w' ? -1 : 1
    // Forward 1
    if (isInBounds(row + direction, col) && !board[row + direction][col]) {
      moves.push({ row: row + direction, col })
      // Forward 2
      const startingRow = color === 'w' ? 6 : 1
      if (row === startingRow && isInBounds(row + 2 * direction, col) && !board[row + 2 * direction][col] && !board[row + direction][col]) {
        moves.push({ row: row + 2 * direction, col })
      }
    }
    // Captures
    for (const offset of [-1, 1]) {
      if (isInBounds(row + direction, col + offset)) {
        // Regular capture
        if (board[row + direction][col + offset]?.color !== color && board[row + direction][col + offset] !== null) {
          moves.push({ row: row + direction, col: col + offset })
        }
        // En passant capture
        if (enPassantTarget && enPassantTarget.row === row + direction && enPassantTarget.col === col + offset) {
             const capturedPawnRow = row;
             const capturedPawnCol = col + offset;
             if (isInBounds(capturedPawnRow, capturedPawnCol) &&
                 board[capturedPawnRow][capturedPawnCol]?.type === 'p' &&
                 board[capturedPawnRow][capturedPawnCol]?.color !== color) {
                 moves.push({ row: row + direction, col: col + offset });
             }
        }
      }
    }
  } else if (type === 'n') {
    const knightMoves = [
      { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
      { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 },
    ]
    for (const move of knightMoves) {
      const newRow = row + move.r
      const newCol = col + move.c
      if (isInBounds(newRow, newCol) && (!board[newRow][newCol] || board[newRow][newCol]?.color !== color)) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  } else if (type === 'k') {
      // Regular King moves
      for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const newRow = row + dr
              const newCol = col + dc
              if (isInBounds(newRow, newCol) && (!board[newRow][newCol] || board[newRow][newCol]?.color !== color)) {
                   moves.push({ row: newRow, col: newCol }); // Add move first, filter later
              }
          }
      }
      // Castling (Check for empty squares and rook presence, attack check happens in filter)
      const castling = currentCastlingRights[color]
      const opponentColor = color === 'w' ? 'b' : 'w'
      if (castling && !isSquareAttackedBy(board, row, col, opponentColor)) { // Check if king is currently in check
          // Kingside
          if (castling.kingside &&
              board[row][col + 1] === null &&
              board[row][col + 2] === null &&
              board[row][7]?.type === 'r' && board[row][7]?.color === color && // Check rook presence at h1/h8
              !isSquareAttackedBy(board, row, col + 1, opponentColor) && 
              !isSquareAttackedBy(board, row, col + 2, opponentColor)) { 
              moves.push({ row: row, col: col + 2 })
          }
          // Queenside
          if (castling.queenside &&
              board[row][col - 1] === null &&
              board[row][col - 2] === null &&
              board[row][col - 3] === null &&
              board[row][0]?.type === 'r' && board[row][0]?.color === color && // Check rook presence at a1/a8
              !isSquareAttackedBy(board, row, col - 1, opponentColor) && 
              !isSquareAttackedBy(board, row, col - 2, opponentColor)) { 
              moves.push({ row: row, col: col - 2 })
          }
      }
  } else { // Sliding pieces (Bishop, Rook, Queen)
    const directions: { r: number, c: number }[] = []
    if (type === 'b' || type === 'q') directions.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 })
    if (type === 'r' || type === 'q') directions.push({ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 })
    for (const dir of directions) {
      let r = row + dir.r, c = col + dir.c
      while (isInBounds(r, c)) {
        if (!board[r][c]) {
            moves.push({ row: r, col: c })
        } else { 
            if (board[r][c]?.color !== color) {
                moves.push({ row: r, col: c }); // Capture
            }
            break; // Path blocked
        }
        r += dir.r; c += dir.c
      }
    }
  }
  return moves
}

// Simple function to check if a piece can attack a square without recursion issues
const getPieceAttacks = (board: Board, row: number, col: number, targetRow: number, targetCol: number): boolean => {
    const piece = board[row][col];
    if (!piece) return false;
    
    const dRow = targetRow - row;
    const dCol = targetCol - col;
    const absDRow = Math.abs(dRow);
    const absDCol = Math.abs(dCol);
    
    // Prevent attack on same square
    if (row === targetRow && col === targetCol) return false;

    switch (piece.type) {
        case 'p': // Pawn attacks diagonally
            const forward = piece.color === 'w' ? -1 : 1;
            return dRow === forward && (dCol === 1 || dCol === -1);
            
        case 'n': // Knight moves in L-shape
            return (absDRow === 2 && absDCol === 1) || (absDRow === 1 && absDCol === 2);
            
        case 'b': // Bishop moves diagonally
            if (absDRow !== absDCol) return false;
            
            // Check for pieces in the way
            const bishopStepRow = dRow > 0 ? 1 : -1;
            const bishopStepCol = dCol > 0 ? 1 : -1;
            for (let i = 1; i < absDRow; i++) {
                if (board[row + i * bishopStepRow][col + i * bishopStepCol]) {
                    return false; // Blocked
                }
            }
            return true;
            
        case 'r': // Rook moves horizontally/vertically
            if (dRow !== 0 && dCol !== 0) return false;
            
            // Check for pieces in the way
            if (dRow === 0) { // Horizontal move
                const step = dCol > 0 ? 1 : -1;
                for (let i = 1; i < absDCol; i++) {
                    if (board[row][col + i * step]) {
                        return false; // Blocked
                    }
                }
            } else { // Vertical move
                const step = dRow > 0 ? 1 : -1;
                for (let i = 1; i < absDRow; i++) {
                    if (board[row + i * step][col]) {
                        return false; // Blocked
                    }
                }
            }
            return true;
            
        case 'q': // Queen moves like bishop or rook
            // Diagonal move
            if (absDRow === absDCol) {
                const stepRow = dRow > 0 ? 1 : -1;
                const stepCol = dCol > 0 ? 1 : -1;
                for (let i = 1; i < absDRow; i++) {
                    if (board[row + i * stepRow][col + i * stepCol]) {
                        return false; // Blocked
                    }
                }
                return true;
            }
            // Straight move
            if (dRow === 0 || dCol === 0) {
                if (dRow === 0) { // Horizontal
                    const step = dCol > 0 ? 1 : -1;
                    for (let i = 1; i < absDCol; i++) {
                        if (board[row][col + i * step]) {
                            return false; // Blocked
                        }
                    }
                } else { // Vertical
                    const step = dRow > 0 ? 1 : -1;
                    for (let i = 1; i < absDRow; i++) {
                        if (board[row + i * step][col]) {
                            return false; // Blocked
                        }
                    }
                }
                return true;
            }
            return false;
            
        case 'k': // King moves one square in any direction
            return absDRow <= 1 && absDCol <= 1;
            
        default:
            return false;
    }
};

const isSquareAttackedBy = (board: Board, targetRow: number, targetCol: number, attackerColor: PieceColor): boolean => {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === attackerColor) {
                // Check if piece can attack the target square
                if (getPieceAttacks(board, r, c, targetRow, targetCol)) {
                    return true; // The square is attacked
                }
            }
        }
    }
    return false; // The square is not attacked
}

const isCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color)
  if (!kingPos) return false 
  const opponentColor = color === 'w' ? 'b' : 'w'
  return isSquareAttackedBy(board, kingPos.row, kingPos.col, opponentColor)
}

const getAllPotentialMoves = (board: Board, color: PieceColor, currentCastlingRights: CastlingRights, enPassantTarget: { row: number, col: number } | null): Move[] => {
  const allMoves: Move[] = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color) {
        const moves = getValidMovesForPiece(board, r, c, currentCastlingRights, enPassantTarget)
        moves.forEach(to => allMoves.push({ from: { row: r, col: c }, to }))
      }
    }
  }
  return allMoves
}

const getFilteredLegalMoves = (board: Board, color: PieceColor, currentCastlingRights: CastlingRights, enPassantTarget: { row: number, col: number } | null): Move[] => {
  const potentialMoves = getAllPotentialMoves(board, color, currentCastlingRights, enPassantTarget)
  return potentialMoves.filter(move => {
    const testBoard = JSON.parse(JSON.stringify(board))
    const piece = testBoard[move.from.row][move.from.col]
    if (!piece) return false 

    testBoard[move.to.row][move.to.col] = piece
    testBoard[move.from.row][move.from.col] = null

    if (piece.type === 'p' && enPassantTarget && move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
      testBoard[move.from.row][enPassantTarget.col] = null; 
    }
    if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
      const isKingside = move.to.col === 6;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      const rook = testBoard[move.from.row][rookFromCol]; 
      if(rook){ 
          testBoard[move.from.row][rookToCol] = rook;
          testBoard[move.from.row][rookFromCol] = null;
      }
    }
    const promotionRank = color === 'w' ? 0 : 7;
    if (piece.type === 'p' && move.to.row === promotionRank) {
        testBoard[move.to.row][move.to.col] = { type: move.promotion || 'q', color: color };
    }
    
    return !isCheck(testBoard, color) 
  })
}

const checkForLegalMoves = (currentBoard: Board, color: PieceColor, currentCastlingRights: CastlingRights, currentEnPassantTarget: { row: number, col: number } | null): boolean => {
    return getFilteredLegalMoves(currentBoard, color, currentCastlingRights, currentEnPassantTarget).length > 0;
};

const algebraicNotation = (square: { row: number, col: number }): string => {
  const files = 'abcdefgh'
  const ranks = '87654321'
  return `${files[square.col]}${ranks[square.row]}`
}

// --- React Component ---

const ChessGame = dynamic(() => import('@/app/chess/components/ChessGame'), { 
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-col items-center">
                <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Chess Game...</p>
            </div>
        </div>
    )
})

// --- Define ChessPieceIcon Function (Used inside Component) ---
function ChessPieceIcon({ type, color }: { type: PieceType, color: PieceColor }) {
  // Define symbols inside the function to avoid duplicate declarations
  const symbols = {
    w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
    b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
  };
  
  return (
    <span className={`text-5xl sm:text-4xl ${color === "w" ? "text-amber-50" : "text-neutral-900"}`}>
      {symbols[color][type]} 
    </span>
  );
}

function ChessAIDemo() {
    const [aiLevel, setAiLevel] = useState(5) 
    const [playerColor, setPlayerColor] = useState<PieceColor>('w')
    const [gamePhase, setGamePhase] = useState<GamePhase>('opening')
    const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
    const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]) 
    const [thinking, setThinking] = useState(false)
    const [turn, setTurn] = useState<PieceColor>('w')
    const [message, setMessage] = useState<string | null>(null)
    const [currentBoard, setCurrentBoard] = useState<Board>(JSON.parse(JSON.stringify(INITIAL_BOARD))) 
    const [castlingRights, setCastlingRights] = useState<CastlingRights>({ w: { kingside: true, queenside: true }, b: { kingside: true, queenside: true } });
    const [enPassantTarget, setEnPassantTarget] = useState<{ row: number, col: number } | null>(null);
    const [lastMove, setLastMove] = useState<Move | null>(null);
    const [aiPersonality, setAiPersonality] = useState<AIPersonality>(DEFAULT_AI_PERSONALITY); // Added state for personality

    const [activeTabRightSidebar, setActiveTabRightSidebar] = useState<'history' | 'assistant'>('history')
    const [expandedSections, setExpandedSections] = useState({
        gameControls: true,
        playerAnalysis: true,
        modelInfo: false,
        howToPlay: false
    })
    const [chatMessages, setChatMessages] = useState<PageChatMessage[]>([{ 
        id: 'welcome', text: "Welcome to the chess game! I'll provide analysis and tips as you play.",
        type: 'info', timestamp: new Date()
    }])

    const moveHistoryRef = useRef<HTMLDivElement>(null)
    const chatInputRef = useRef<HTMLInputElement>(null)
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const messageIdCounter = useRef(0);

    // Neural Network Status Component - Shows the loading status of the client-side AI model
    const NeuralNetworkStatus = () => {
        const status = useAIModelStatus();
        
        // Render appropriate icon based on status
        if (status === 'ready') {
            return <span title="Neural network ready" className="ml-2 flex items-center">
                <BrainCircuit size={18} className="text-emerald-500" />
            </span>;
        } else if (status === 'loading') {
            return <span title="Loading neural network..." className="ml-2 flex items-center">
                <Loader2 size={18} className="text-blue-500 animate-spin" />
            </span>;
        } else if (status === 'error') {
            return <span title="Neural network failed to load" className="ml-2 flex items-center">
                <X size={18} className="text-red-500" />
            </span>;
        }
        
        return null;
    };

    // --- Utility Functions ---
    const getUniqueMessageId = (prefix: string) => {
        messageIdCounter.current += 1;
        return `${prefix}-${Date.now()}-${messageIdCounter.current}`;
    };

    // Scroll management useEffect
    useEffect(() => {
        const htmlElement = document.documentElement;
        const bodyElement = document.body;
        const originalScrollBehavior = htmlElement.style.scrollBehavior;
        const originalOverflowAnchor = bodyElement.style.overflowAnchor;
        const originalHtmlOverflow = htmlElement.style.overflow;
        const originalBodyOverflow = bodyElement.style.overflow;
        
        htmlElement.style.scrollBehavior = 'auto !important';
        bodyElement.style.overflowAnchor = 'none !important';
        
        // Ensure the page is always scrollable
        htmlElement.style.overflow = 'auto';
        bodyElement.style.overflow = 'auto';
        
        if (moveHistoryRef.current && activeTabRightSidebar === 'history') {
            moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
        }
        
        return () => {
            htmlElement.style.scrollBehavior = originalScrollBehavior;
            bodyElement.style.overflowAnchor = originalOverflowAnchor;
            htmlElement.style.overflow = originalHtmlOverflow;
            bodyElement.style.overflow = originalBodyOverflow;
        };
    }, [moveHistory, chatMessages, activeTabRightSidebar, expandedSections]);

    // Game phase useEffect
    useEffect(() => {
        const pieces = { w: 0, b: 0, total: 0 }
        currentBoard.forEach(row => { row.forEach(square => { if (square) { pieces[square.color]++; pieces.total++; } }) });
        if (moveHistory.length < 10) setGamePhase('opening')
        else if (pieces.total > 14) setGamePhase('middlegame') 
        else setGamePhase('endgame')
    }, [moveHistory, currentBoard]);

    // Player metrics state and calculation
    const [playerMetrics, setPlayerMetrics] = useState<PlayerMetrics>({
        openingPreparation: 0, tacticalAwareness: 0, captureRate: 0, checkRate: 0, accuracy: 0,
        positionalUnderstanding: 0, endgameSkill: 0, aggressiveness: 0, defensiveness: 0,
    });

    const calculatedPlayerMetrics = useMemo((): PlayerMetrics => {
        // ... (calculation logic remains the same) ...
        const numMoves = moveHistory.length;
        if (numMoves === 0) return { openingPreparation: 0, tacticalAwareness: 0, captureRate: 0, checkRate: 0, accuracy: 0, positionalUnderstanding: 0, endgameSkill: 0, aggressiveness: 0, defensiveness: 0 };
        let openingMoves = 0, tacticalMoves = 0, captures = 0, checks = 0, accurateMoves = 0, positionalMoves = 0, endgameMoves = 0, aggressiveMoves = 0, defensiveMoves = 0;
        moveHistory.forEach(histItem => {
            if (histItem.notation) { 
                if (moveHistory.indexOf(histItem) < 10) openingMoves++;
                if (histItem.captured) captures++; 
                if (histItem.check) checks++; 
                if (Math.random() > 0.3) tacticalMoves++;
                if (Math.random() > 0.5) accurateMoves++;
                if (Math.random() > 0.4) positionalMoves++;
                if (gamePhase === 'endgame' && Math.random() > 0.6) endgameMoves++;
                if (Math.random() > 0.7) aggressiveMoves++;
                if (Math.random() > 0.8) defensiveMoves++;
            }
        });
        const openingPreparation = Math.min(100, Math.round((openingMoves / Math.min(numMoves, 10)) * 100));
        const tacticalAwareness = Math.min(100, Math.round((tacticalMoves / numMoves) * 100));
        const captureRate = Math.min(100, Math.round((captures / numMoves) * 100));
        const checkRate = Math.min(100, Math.round((checks / numMoves) * 100));
        const accuracy = Math.min(100, Math.round((accurateMoves / numMoves) * 100));
        const positionalUnderstanding = Math.min(100, Math.round((positionalMoves / numMoves) * 100));
        const endgameSkill = Math.min(100, Math.round((endgameMoves / Math.max(1, numMoves - 30)) * 100)); 
        const aggressiveness = Math.min(100, Math.round((aggressiveMoves / numMoves) * 100));
        const defensiveness = Math.min(100, Math.round((defensiveMoves / numMoves) * 100));
        return { openingPreparation: isNaN(openingPreparation) ? 0 : openingPreparation, tacticalAwareness: isNaN(tacticalAwareness) ? 0 : tacticalAwareness, captureRate: isNaN(captureRate) ? 0 : captureRate, checkRate: isNaN(checkRate) ? 0 : checkRate, accuracy: isNaN(accuracy) ? 0 : accuracy, positionalUnderstanding: isNaN(positionalUnderstanding) ? 0 : positionalUnderstanding, endgameSkill: isNaN(endgameSkill) ? 0 : endgameSkill, aggressiveness: isNaN(aggressiveness) ? 0 : aggressiveness, defensiveness: isNaN(defensiveness) ? 0 : defensiveness };
    }, [moveHistory, gamePhase]);

    useEffect(() => { setPlayerMetrics(calculatedPlayerMetrics); }, [calculatedPlayerMetrics]);

    // Update CSS variables for progress bars
    useEffect(() => {
        const targetElement = mainContainerRef.current ?? document.documentElement;
        targetElement.style.setProperty('--progress-width-opening-preparation', `${playerMetrics.openingPreparation}%`);
        targetElement.style.setProperty('--progress-width-tactical-awareness', `${playerMetrics.tacticalAwareness}%`);
        targetElement.style.setProperty('--progress-width-positional-understanding', `${playerMetrics.positionalUnderstanding}%`);
        targetElement.style.setProperty('--progress-width-endgame-skill', `${playerMetrics.endgameSkill}%`);
        targetElement.style.setProperty('--progress-width-aggressiveness', `${playerMetrics.aggressiveness}%`);
        targetElement.style.setProperty('--progress-width-defensiveness', `${playerMetrics.defensiveness}%`);
        targetElement.style.setProperty('--progress-width-capture', `${playerMetrics.captureRate}%`);
        targetElement.style.setProperty('--progress-width-check', `${playerMetrics.checkRate}%`);
        targetElement.style.setProperty('--progress-width-accuracy', `${playerMetrics.accuracy}%`);
    }, [playerMetrics])

     // Memoized legal moves based on the current board state
    const currentLegalMoves = useMemo(() => {
        return getFilteredLegalMoves(currentBoard, turn, castlingRights, enPassantTarget);
    }, [currentBoard, turn, castlingRights, enPassantTarget]);


    // --- Game Logic Callbacks ---

    const handleResetGame = useCallback(() => {
        setCurrentBoard(JSON.parse(JSON.stringify(INITIAL_BOARD)));
        setTurn('w');
        setCastlingRights({ w: { kingside: true, queenside: true }, b: { kingside: true, queenside: true } });
        setEnPassantTarget(null);
        setMoveHistory([]);
        setLastMove(null);
        setGameStatus('playing');
        setGamePhase('opening');
        setThinking(false);
        setMessage(null);
        setChatMessages([{
            id: getUniqueMessageId('reset'), text: "Starting a new game. Good luck!",
            type: 'info', timestamp: new Date()
        }]);
    }, []);

    const generatePGN = useCallback((history: MoveHistoryItem[]): string => {
        let pgn = '';
        for (let i = 0; i < history.length; i += 2) {
            const moveNo = Math.floor(i / 2) + 1;
            const whiteMove = history[i]?.notation || '';
            const blackMove = history[i + 1]?.notation || '';
            pgn += `${moveNo}. ${whiteMove}${blackMove ? ' ' + blackMove : ''} `;
        }
        return pgn.trim();
    }, []);

    const handleExportPGN = useCallback(() => {
        if (moveHistory.length === 0) return;
        const pgn = generatePGN(moveHistory);
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'game.pgn';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [generatePGN, moveHistory]);

    const handleGameStatusChange = useCallback((status: GameStatus | string) => {
        let validStatus: GameStatus = 'playing';
        if (['playing', 'check', 'checkmate', 'stalemate', 'draw'].includes(status)) {
            validStatus = status as GameStatus;
        } else { console.warn(`Invalid game status received: ${status}`); }
        setGameStatus(validStatus);
        let statusMessageText = '';
        let messageType: PageChatMessage['type'] = 'info';
        switch (validStatus) {
            case 'check': statusMessageText = 'Check! Your king is under attack.'; messageType = 'warning'; break;
            case 'checkmate': statusMessageText = `Checkmate! ${turn === playerColor ? 'You win!' : 'AI wins!'}`; messageType = 'error'; break;
            case 'stalemate': statusMessageText = 'Stalemate! The game is a draw.'; messageType = 'info'; break;
            case 'draw': statusMessageText = 'The game is a draw.'; messageType = 'info'; break;
        }
        if (statusMessageText) {
            setChatMessages(prev => [...prev, { id: getUniqueMessageId('status'), text: statusMessageText, type: messageType, timestamp: new Date() }]);
            if (validStatus !== 'playing' && validStatus !== 'check') setMessage(statusMessageText);
        }
    }, [turn, playerColor]); 

    // Handle move execution (master function)
    const makeMove = useCallback((move: Move): Board => {
        const newBoard = JSON.parse(JSON.stringify(currentBoard));
        const piece = newBoard[move.from.row][move.from.col];
        const capturedPiece = newBoard[move.to.row][move.to.col];

        if (!piece) { console.error("makeMove error: No piece at source square", move); return currentBoard; }

        let enPassantCapturePiece = null;
        if (piece.type === 'p' && enPassantTarget && move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
            const capturedPawnRow = move.from.row;
            enPassantCapturePiece = newBoard[capturedPawnRow][enPassantTarget.col]; 
            newBoard[capturedPawnRow][enPassantTarget.col] = null;
        }

        newBoard[move.to.row][move.to.col] = piece;
        newBoard[move.from.row][move.from.col] = null;

        let promotionPieceType: PieceType | undefined = undefined;
        const promotionRank = piece.color === 'w' ? 0 : 7;
        if (piece.type === 'p' && move.to.row === promotionRank) {
            promotionPieceType = move.promotion || 'q';
            newBoard[move.to.row][move.to.col] = { type: promotionPieceType, color: piece.color };
        }

        let castlingRookMove: Move | null = null;
        if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
            const isKingside = move.to.col === 6;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
            const rook = newBoard[move.from.row][rookFromCol];
            if (rook) {
                newBoard[move.to.row][rookToCol] = rook;
                newBoard[move.from.row][rookFromCol] = null;
                castlingRookMove = { from: { row: move.from.row, col: rookFromCol }, to: { row: move.to.row, col: rookToCol } };
            }
        }
        
        const newCastlingRights = JSON.parse(JSON.stringify(castlingRights));
        if (piece.type === 'k') { newCastlingRights[piece.color].kingside = newCastlingRights[piece.color].queenside = false; }
        if (piece.type === 'r') {
            if (move.from.row === (piece.color === 'w' ? 7 : 0)) {
                if (move.from.col === 0) newCastlingRights[piece.color].queenside = false;
                if (move.from.col === 7) newCastlingRights[piece.color].kingside = false;
            }
        }
        if (capturedPiece?.type === 'r') {
            const opponentColor = piece.color === 'w' ? 'b' : 'w';
            const opponentHomeRow = opponentColor === 'w' ? 7 : 0;
            if(move.to.row === opponentHomeRow){
               if(move.to.col === 0) newCastlingRights[opponentColor].queenside = false;
               if(move.to.col === 7) newCastlingRights[opponentColor].kingside = false;
            }
        }
        setCastlingRights(newCastlingRights);

        let newEnPassantTarget = null;
        if (piece.type === 'p' && Math.abs(move.from.row - move.to.row) === 2) {
            newEnPassantTarget = { row: move.from.row + (piece.color === 'w' ? -1 : 1), col: move.from.col };
        }
        setEnPassantTarget(newEnPassantTarget);

        setCurrentBoard(newBoard); 
        setLastMove(move);
        const nextTurn = turn === 'w' ? 'b' : 'w';
        
        const newIsInCheck = isCheck(newBoard, nextTurn);
        const newHasLegalMoves = checkForLegalMoves(newBoard, nextTurn, newCastlingRights, newEnPassantTarget);
        
        let finalGameStatus: GameStatus = 'playing';
        if (newIsInCheck) { finalGameStatus = newHasLegalMoves ? 'check' : 'checkmate'; } 
        else { finalGameStatus = newHasLegalMoves ? 'playing' : 'stalemate'; }
        if (moveHistory.length > 98) finalGameStatus = 'draw'; 

        handleGameStatusChange(finalGameStatus); 

        const notation = chessAnalysis.moveToAlgebraic(
            currentBoard, move, piece, capturedPiece || enPassantCapturePiece, enPassantTarget, castlingRights // Pass currentBoard (state before move)
        ) + (finalGameStatus === 'checkmate' ? '#' : finalGameStatus === 'check' ? '+' : '');

        const newMoveHistoryItem: MoveHistoryItem = {
            move, piece, captured: capturedPiece || enPassantCapturePiece, notation, 
            check: finalGameStatus === 'check', checkmate: finalGameStatus === 'checkmate'
        };
        setMoveHistory(prev => [...prev, newMoveHistoryItem]);
        
        if (piece.color === playerColor) {
            const analysis = chessAnalysis.analyzeMoveQuality(currentBoard, move, piece, capturedPiece || enPassantCapturePiece); // Pass currentBoard
            setTimeout(() => {
                setChatMessages(prev => [...prev, {
                    id: getUniqueMessageId('move'), text: analysis.text,
                    type: analysis.type, timestamp: new Date()
                }]);
            }, 300);
        }

        setTurn(nextTurn); 

        return newBoard;
    // Removed dependencies like board, playerMetrics, gamePhase
    }, [currentBoard, turn, castlingRights, enPassantTarget, moveHistory.length, playerColor, handleGameStatusChange]); 


    // Handle AI move
    const handleAIMove = useCallback(async () => {
        if (turn !== playerColor && gameStatus === 'playing' && !thinking) { 
            setThinking(true);
            setMessage("AI is thinking...");
            const originalScrollBehavior = document.documentElement.style.scrollBehavior;
            const originalOverflowAnchor = document.body.style.overflowAnchor;
            document.documentElement.style.scrollBehavior = 'auto';
            document.body.style.overflowAnchor = 'none';

            try {
                const response = await fetch('/api/chess-ai/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        board: currentBoard, 
                        turn, gamePhase, 
                        aiPersonality: { ...DEFAULT_AI_PERSONALITY, level: aiLevel }, 
                        castlingRights, aiLevel, 
                        moveHistory: moveHistory.map(item => ({ notation: item.notation || '?' })), 
                        enPassantTargetSquare: enPassantTarget 
                    }),
                });
                if (!response.ok) throw new Error(`AI API Error: ${response.statusText}`);
                const data = await response.json();

                if (data.status === 'checkmate' || data.status === 'stalemate') {
                    handleGameStatusChange(data.status); 
                } else if (data.move) {
                   makeMove(data.move); // Apply AI move
                } else {
                   console.error("AI returned no move but game not over.");
                   setMessage("AI Error: Could not determine move.");
                   handleGameStatusChange('draw'); 
                }
            } catch (error) {
                console.error('Error getting AI move:', error);
                setMessage("Error: Couldn't get AI move.");
            } finally {
                setThinking(false);
                setTimeout(() => setMessage(null), 3000);
                document.documentElement.style.scrollBehavior = originalScrollBehavior;
                document.body.style.overflowAnchor = originalOverflowAnchor;
            }
        }
    // Corrected dependencies
    }, [turn, playerColor, gameStatus, currentBoard, gamePhase, aiPersonality, castlingRights, aiLevel, moveHistory, enPassantTarget, makeMove, handleGameStatusChange, thinking]); 

    // Handle Player's Move (Callback from ChessGame component)  
    const handlePlayerMove = useCallback((move: Move) => { // Takes a Move object parameter
        if (turn === playerColor && gameStatus === 'playing' && !thinking) {
            const originalScrollBehavior = document.documentElement.style.scrollBehavior;
            const originalOverflowAnchor = document.body.style.overflowAnchor;
            document.documentElement.style.scrollBehavior = 'auto';
            document.body.style.overflowAnchor = 'none';

            makeMove(move); // Apply player move using makeMove

            setTimeout(() => {
                document.documentElement.style.scrollBehavior = originalScrollBehavior;
                document.body.style.overflowAnchor = originalOverflowAnchor;
            }, 100); 
        }
    // Dependencies
    }, [turn, playerColor, gameStatus, thinking, makeMove]); 

    // Trigger AI move when it's their turn
    useEffect(() => {
        if (turn !== playerColor && gameStatus === 'playing' && !thinking) { 
            const timer = setTimeout(handleAIMove, 700); // Delay for UX
            return () => clearTimeout(timer);
        }
    }, [turn, playerColor, gameStatus, thinking, handleAIMove]); 

    // Define handleGameOver within ChessAIDemo scope
    const handleGameOver = useCallback((result: string) => {
        console.log("Game Over called with result:", result);
        handleGameStatusChange(result); // Use the existing handler
        setThinking(false); // Ensure thinking stops
    }, [handleGameStatusChange]); 

    // Handle player color selection
    const handleColorSelection = (color: PieceColor) => {
        if (moveHistory.length === 0) {
            setPlayerColor(color);
            handleResetGame(); // Reset game when changing color
        } else {
            setChatMessages(prev => [...prev, {
                id: getUniqueMessageId('color-fail'), text: "Cannot change color mid-game. Start a new game.",
                type: 'warning', timestamp: new Date()
            }])
        }
    }

    // Handle AI difficulty change
    const handleDifficultyChange = (difficulty: number) => {
        setAiLevel(difficulty)
        const difficultyName = difficultyLevels.find(d => d.value === difficulty)?.name || 'selected level';
        const messageText = moveHistory.length === 0
            ? `Difficulty set to ${difficultyName}.`
            : `Difficulty will be ${difficultyName} for the next game.`;
        setChatMessages(prev => [...prev, {
            id: getUniqueMessageId('difficulty'), text: messageText,
            type: 'info', timestamp: new Date()
        }])
    }
    
    // Handle chat messages sent by user
    const handleSendMessage = useCallback((text: string) => {
        if (!text.trim()) return
        setChatMessages(prev => [...prev, {
            id: getUniqueMessageId('user'), text, type: 'user', timestamp: new Date(), role: 'user'
        }])
        setActiveTabRightSidebar('assistant') // Switch to assistant tab

        setTimeout(() => {
            // Generate a response based on the game state
            let response = "I'm analyzing your move..."
            
            // Simple response based on game phase
            if (text.toLowerCase().includes('tip') || text.toLowerCase().includes('advice')) {
                // Use the existing getGamePhaseTips function from chessAnalysis
                response = chessAnalysis.getGamePhaseTips(gamePhase, moveHistory.length)
            } else if (text.toLowerCase().includes('check')) {
                response = "When your king is in check, you must address the threat by moving the king, capturing the attacking piece, or blocking the attack."
            } else if (text.toLowerCase().includes('castle') || text.toLowerCase().includes('castling')) {
                response = "Castling is a special move that lets you move your king two squares towards a rook, and then move the rook to the square the king crossed."
            } else {
                response = `I've analyzed the board. ${gameStatus === 'playing' ? 'Focus on controlling the center and developing your pieces.' : 'Let\'s analyze what happened in this game.'}`
            }
                             
            setChatMessages(prev => [...prev, {
                id: getUniqueMessageId('response'), text: response, type: 'response', timestamp: new Date(), role: 'assistant'
            }])
            if (chatInputRef.current) chatInputRef.current.value = '' 
        }, 700)
    }, [gamePhase, gameStatus, moveHistory]) // Dependencies for the callback

    // Toggle collapsible sections
    const toggleSection = (section: keyof typeof expandedSections) => {
        // Preserve original scroll settings before toggling
        const originalScrollBehavior = document.documentElement.style.scrollBehavior;
        const originalOverflowAnchor = document.body.style.overflowAnchor;
        
        // Toggle the section
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
        
        // Restore normal scroll behavior after a short delay
        setTimeout(() => {
            document.documentElement.style.scrollBehavior = originalScrollBehavior;
            document.body.style.overflowAnchor = originalOverflowAnchor;
            
            // Ensure the page is scrollable regardless of panel state
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }, 50);
    }
    
    // Render move notation, handling potential undefined moves
    const renderMoveNotation = (moveItem: MoveHistoryItem | undefined): string => {
        if (!moveItem) return "...";
        return moveItem.notation || "?"; // Use stored notation
    }

    // --- Section Rendering Functions ---

    const HowToPlaySection = () => (
        expandedSections.howToPlay && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden" role="region" aria-labelledby="howToPlayHeading">
                    <button     
                        type="button"
                        onClick={() => toggleSection('howToPlay')}
                        className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 mb-4"
                        aria-expanded={expandedSections.howToPlay ? "true" : "false"}
                        aria-controls="howToPlayContent"
                        id="howToPlayTab"
                    >
                        <span className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100" id="howToPlayHeading">
                            <BookOpen className="h-6 w-6 text-emerald-500" /> How to Play Chess
                        </span>
                        {expandedSections.howToPlay ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </button>
                    <div id="howToPlayContent" className={expandedSections.howToPlay ? "" : "hidden"}>
                        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Basic Rules</h4>
                                <ul className="space-y-1.5 list-disc list-inside">
                                    <li>Played on an 8x8 board.</li>
                                    <li>16 pieces per player. White moves first.</li>
                                    <li>Goal: Checkmate opponent's king.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4 md:mt-0">How to Move Pieces</h4>
                                <ul className="space-y-1.5 list-disc list-inside">
                                    <li><strong>Pawn:</strong> Forward 1 (or 2 on first move), captures diagonally.</li>
                                    <li><strong>Knight:</strong> 'L' shape (2 squares one way, 1 perpendicular). Can jump.</li>
                                    <li><strong>Bishop:</strong> Diagonally, any number of squares.</li>
                                    <li><strong>Rook:</strong> Horizontally or vertically, any number of squares.</li>
                                    <li><strong>Queen:</strong> Any direction (horizontal, vertical, diagonal), any number of squares.</li>
                                    <li><strong>King:</strong> One square in any direction.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Use the Chess Assistant tab to ask questions!</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    // AI Model Information Component
    const ModelInfo = () => {
        // Get the neural network status
        const status = useAIModelStatus();
        
        return (
            <div className="p-4 space-y-3" data-component-name="ModelInfo">
                <p className="text-sm">Magnus Chess AI is powered by a neural network trained on thousands of master-level chess games.</p>
                
                <div className="flex items-center mt-2 bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                    <span className="mr-2 text-sm">Neural Network:</span>
                    {status === 'ready' && (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                            <BrainCircuit size={16} className="mr-1" />
                            Ready (Client-side)
                        </span>
                    )}
                    {status === 'loading' && (
                        <span className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                            <Loader2 size={16} className="mr-1 animate-spin" />
                            Loading...
                        </span>
                    )}
                    {status === 'error' && (
                        <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                            <AlertCircle size={16} className="mr-1" />
                            Using server fallback
                        </span>
                    )}
                    {status === 'idle' && (
                        <span className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                            <Clock size={16} className="mr-1" />
                            Initializing...
                        </span>
                    )}
                </div>
                
                <p className="text-sm mt-2">The model evaluates positions based on material balance, piece positioning, board control, king safety, and other chess principles.</p>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Client-Side AI Benefits:</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Faster move calculation</li>
                        <li>Works offline after initial load</li>
                        <li>Reduced server load</li>
                        <li>Smoother gameplay experience</li>
                    </ul>
                </div>
                
                <a
                    href="https://arxiv.org/abs/1712.01815"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-3"
                >
                    <ExternalLink size={14} className="mr-1" />
                    Learn more about neural networks in chess
                </a>
            </div>
        );
    };

    const LeftSidebarSection = () => (
    <div className="space-y-4 w-full">
        {/* Game Controls Section */}
        <SidebarSection
            id="gameControls"
            title="Game Controls"
            icon={<Settings className="h-5 w-5 text-blue-500" />}
            expanded={expandedSections.gameControls}
            onToggle={() => toggleSection('gameControls')}
        >
            <div className="p-4 space-y-5">
                <StatusDisplay
                    status={gameStatus}
                    isThinking={thinking}
                    turn={turn}
                    playerColor={playerColor}
                    gamePhase={gamePhase}
                />
                <DifficultySlider
                    aiLevel={aiLevel}
                    onChange={handleDifficultyChange}
                />
                <ColorSelection
                    selectedColor={playerColor}
                    onSelect={handleColorSelection}
                    disabled={moveHistory.length > 0}
                />
                <AIPlayingStyle />
                <GameStats moveHistory={moveHistory} gamePhase={gamePhase} />   
            </div>
        </SidebarSection>

        {/* AI Model Info Section */}
        <SidebarSection
            id="modelInfo"
            title="About the AI Model"
            icon={<Brain className="h-5 w-5 text-purple-500" />}
            expanded={expandedSections.modelInfo}
            onToggle={() => toggleSection('modelInfo')}
        >
            <ModelInfo />
        </SidebarSection>

        {/* Player Analysis Section */}
        <SidebarSection
            id="playerAnalysis"
            title="Player Analysis"
            icon={<BarChart2 className="h-5 w-5 text-teal-500" />}
            expanded={expandedSections.playerAnalysis}
            onToggle={() => toggleSection('playerAnalysis')}
        >
            <PlayerAnalysis moveHistory={moveHistory} metrics={playerMetrics} />
        </SidebarSection>
    </div>
);

const SidebarSection = ({ id, title, icon, expanded, onToggle, children }: { id: string; title: string; icon: JSX.Element; expanded: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden" role="region" aria-labelledby={`${id}Heading`}>
        <button
            type="button"
            onClick={onToggle}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700"
            aria-expanded={expanded ? "true" : "false"}
            aria-controls={`${id}Content`}
        >
            <span className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100" id={`${id}Heading`}>
                {icon}
                {title}
            </span>
            {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>
        {expanded && <div id={`${id}Content`} className="p-4">{children}</div>}
    </div>
);

const StatusDisplay: React.FC<{ status: string, isThinking: boolean, turn: string, playerColor: string, gamePhase: string }> = ({ status, isThinking, turn, playerColor, gamePhase }) => (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
            {React.createElement(gameStatusInfo[status as GameStatus].icon, { className: `h-5 w-5 ${gameStatusInfo[status as GameStatus].color}` })}
            <span className={`font-medium text-sm ${gameStatusInfo[status as GameStatus].color}`}>
                {isThinking ? (
                    <span className="flex items-center gap-1.5 text-purple-500 dark:text-purple-400">
                        <Loader2 size={16} className="animate-spin" />
                        AI thinking...
                    </span>
                ) : status === 'playing' ? (
                    <span className={turn === playerColor ? 'text-green-500 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}>
                        {turn === playerColor ? 'Your turn' : 'AI turn'}
                    </span>
                ) : (
                    gameStatusInfo[status as GameStatus].text
                )}
            </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{gamePhase}</div>
    </div>
);

const DifficultySlider: React.FC<{ aiLevel: number, onChange: (level: number) => void }> = ({ aiLevel, onChange }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label htmlFor="difficulty-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Difficulty</label>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{difficultyLevels.find(d => d.value === aiLevel)?.name}</span>
        </div>
        <input
            id="difficulty-slider"
            type="range"
            min="1"
            max="10"
            step="1"
            value={aiLevel}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="AI difficulty level"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{difficultyLevels.find(d => d.value === aiLevel)?.description}</p>
    </div>
);

const ColorSelection: React.FC<{ selectedColor: PieceColor, onSelect: (color: PieceColor) => void, disabled: boolean }> = ({ selectedColor, onSelect, disabled }) => (
    <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Play as</h4>
        <div className="grid grid-cols-2 gap-2">
            {(['w', 'b'] as PieceColor[]).map(color => (
                <button
                    key={color}
                    onClick={() => onSelect(color)}
                    disabled={disabled}
                    className={`p-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                        selectedColor === color ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    <div className={`w-5 h-5 rounded-full border border-gray-400 ${color === 'w' ? 'bg-white' : 'bg-gray-800'}`}></div>
                    {color === 'w' ? 'White' : 'Black'}
                </button>
            ))}
        </div>
    </div>
);

const AIPlayingStyle = () => (
    <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">AI Playing Style</h4>
        <div className="space-y-1.5">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5">
                <Zap size={14} />
                Positional player
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5">
                <Shield size={14} />
                Solid defender
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5">
                <Crown size={14} />
                Strong endgame player
            </div>
        </div>
    </div>
);

const GameStats = ({ moveHistory, gamePhase }: { moveHistory: MoveHistoryItem[], gamePhase: GamePhase }) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Moves Played:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{moveHistory.length}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Game Phase:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{gamePhase}</span>
        </div>
    </div>
);

// Reference to ModelInfo component has been removed because it's now defined earlier in the file

const PlayerAnalysis = ({ moveHistory, metrics }: { moveHistory: MoveHistoryItem[], metrics: PlayerMetrics }) => (
    <div className="p-4 space-y-3">
        {moveHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Play some moves to see your analysis.</p>
        ) : (
            <>
                <PerformanceMetrics metrics={metrics} />
                <PlayingStyle metrics={metrics} />
            </>
        )}
    </div>
);

const PerformanceMetrics: React.FC<{ metrics: PlayerMetrics }> = ({ metrics }) => (
    <>
        {['openingPreparation', 'tacticalAwareness', 'positionalUnderstanding', 'endgameSkill'].map((metric) => (
            <div key={metric}>
                <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700 dark:text-gray-300">{formatMetricName(metric)}</span>
                    <span className="font-medium text-teal-600 dark:text-teal-400">{Math.round(metrics[metric as keyof PlayerMetrics])}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className={`bg-teal-500 h-1.5 rounded-full player-metric-bar player-metric-${metric}`}></div>
                </div>
            </div>
        ))}
    </>
);

const PlayingStyle: React.FC<{ metrics: PlayerMetrics }> = ({ metrics }) => (
    <div className="grid grid-cols-2 gap-3 mt-2">
        {['aggressiveness', 'defensiveness'].map((style) => (
            <div key={style}>
                <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700 dark:text-gray-300">{formatMetricName(style)}</span>
                    <span className="font-medium text-teal-600 dark:text-teal-400">{Math.round(metrics[style as keyof PlayerMetrics])}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className={`bg-${style === 'aggressiveness' ? 'red' : 'blue'}-500 h-1.5 rounded-full player-metric-bar player-metric-${style}`}></div>
                </div>
            </div>
        ))}
    </div>
);

const formatMetricName = (name: string) => {
    switch (name) {
        case 'openingPreparation':
            return 'Opening Prep';
        case 'tacticalAwareness':
            return 'Tactical Awareness';
        case 'positionalUnderstanding':
            return 'Positional Understanding';
        case 'endgameSkill':
            return 'Endgame Skill';
        case 'aggressiveness':
            return 'Aggressiveness';
        case 'defensiveness':
            return 'Defensiveness';
        default:
            return name;
    }
};

    const RightSidebarSection = () => (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full max-h-[calc(100vh-10rem)]"> 
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0" role="tablist" aria-label="Chess information tabs">
                <button 
                    type="button"
                    onClick={() => setActiveTabRightSidebar('history')}
                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTabRightSidebar === 'history' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    aria-selected={activeTabRightSidebar === 'history'}
                    role="tab"
                    aria-controls="historyPanel"
                    id="historyTab"
                >
                   <Clock size={16} /> Move History
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTabRightSidebar('assistant')}
                    className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTabRightSidebar === 'assistant' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    aria-selected={activeTabRightSidebar === 'assistant'}
                    role="tab"
                    aria-controls="assistantPanel"
                    id="assistantTab"
                >
                   <MessageCircle size={16} /> Assistant
                </button>
            </div>
            
            {/* Content */}
            <div className="flex-grow overflow-y-auto">
                {activeTabRightSidebar === 'history' ? (
                     <div 
                         ref={moveHistoryRef} 
                         className="p-3 space-y-0.5"
                         role="tabpanel"
                         id="historyPanel"
                         aria-labelledby="historyTab"                     
                     >
                         {moveHistory.length === 0 ? (<p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No moves yet.</p>) 
                         : (moveHistory.reduce((acc, histItem, index) => { 
                                if (index % 2 === 0) { 
                                    const moveNumber = Math.floor(index / 2) + 1;
                                    const blackMoveItem = moveHistory[index + 1]; 
                                    acc.push(
                                        <div key={moveNumber} className={`grid grid-cols-[2.5rem_1fr_1fr] gap-1.5 items-center text-xs py-1 rounded ${index % 4 < 2 ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}>
                                            <span className="font-mono text-gray-500 dark:text-gray-400 text-center">{moveNumber}.</span>
                                            <span className={`px-1.5 py-0.5 rounded truncate ${histItem.check || histItem.checkmate ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : ''}`}>{renderMoveNotation(histItem)}</span>
                                            <span className={`px-1.5 py-0.5 rounded truncate ${blackMoveItem && (blackMoveItem.check || blackMoveItem.checkmate) ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : ''}`}>{renderMoveNotation(blackMoveItem)}</span>
                                        </div>
                                    );
                                }
                                return acc;
                            }, [] as JSX.Element[]))}
                     </div>
                ) : activeTabRightSidebar === 'assistant' ? (
                     <div 
                         role="tabpanel"
                         id="assistantPanel"
                         aria-labelledby="assistantTab"
                         className="h-full"
                     >
                         <ChatBox
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            inputRef={chatInputRef}
                            isLoading={thinking}
                            className="flex flex-col h-full"
                            maxHeight="60vh"
                            title=""
                         />
                    </div>
                ) : (
                     <div 
                         role="tabpanel"
                         id="modelInfoPanel"
                         aria-labelledby="modelInfoTab"
                         className="h-full"
                     >
                         <ModelInfo />
                    </div>
                )}
            </div>
        </div>
    );

    // ChessBoardSection renders the ChessGame component and passes state/callbacks
    const ChessBoardSection = () => (
        <div className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 w-full">
                <ChessGame
                    // State props for rendering
                    board={currentBoard}
                    orientation={playerColor}
                    legalMoves={turn === playerColor ? currentLegalMoves : []} 
                    lastMove={lastMove}
                    isCheck={gameStatus === 'check' || gameStatus === 'checkmate'}
                    checkPosition={findKing(currentBoard, turn)} 
                    disabled={turn !== playerColor || gameStatus !== 'playing' || thinking}
                    // Callbacks for interaction
                    onMove={handlePlayerMove}
                    onGameOver={handleGameOver} 
                    // Configuration props
                    playerColor={playerColor}
                    aiLevel={aiLevel} // Pass down aiLevel if ChessGame uses it
                    showPlayerAnalysis={false} 
                />
            </div>
        </div>
    );

    return (
        <main className="min-h-screen p-2 sm:p-4 md:p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100" ref={mainContainerRef} data-component-name="ChessAIDemo">
            {/* Preload client-side neural network model */}
            <ClientSideAI />
            <div className="max-w-screen-xl mx-auto px-4">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                        <Cpu className="h-7 w-7 md:h-8 md:w-8 text-blue-500" />
                        Chess AI Magnus
                        {/* Neural Network Status Indicator */}
                        <NeuralNetworkStatus />
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mt-2 mb-4">Play against a neural network-based chess AI with both client-side and server-side intelligence.</p>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={handleResetGame}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm"
                        >
                            <RotateCcw size={16} />New Game
                        </button>
                        <button
                            onClick={handleExportPGN}
                            disabled={moveHistory.length === 0}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileDown size={16} />Export PGN
                        </button>
                        <button
                            onClick={() => toggleSection('howToPlay')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm"
                        >
                            <HelpCircle size={16} />How to Play
                        </button>
                    </div>
                </div>

                {/* Message bar */}
                {message && (
                    <div className={`p-3 rounded-md mb-4 text-sm font-medium text-center ${gameStatus === 'checkmate' ? 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-200' : (gameStatus === 'stalemate' || gameStatus === 'draw') ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-700 dark:text-yellow-200' : 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-200'}`}>{message}</div>
                )}

                <HowToPlaySection />

                 {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                    <div className="lg:col-span-3"><LeftSidebarSection /></div>
                    <div className="lg:col-span-6"><ChessBoardSection /></div>
                    <div className="lg:col-span-3"><RightSidebarSection /></div>
                </div>
            </div>
        </main>
    );
}

export default ChessAIDemo;

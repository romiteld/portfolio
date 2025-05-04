"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import ChessBoard, { Board, Move, PieceColor, PieceType, Piece, CastlingRights } from './ChessBoard'
import { Clock, RotateCcw, Settings, Crown, Share, FileCog, Undo, Medal, Loader2, ChevronDown, ChevronUp, Info, TrendingUp, Target, Shield, Zap, Code, MessageCircle, AlertTriangle, Check, X, Lightbulb, User, Send } from 'lucide-react'
import ChatBox, { ChatMessage } from './ChatBox'
import * as chessAnalysis from '../utils/chessAnalysis'

// Constants
const INITIAL_BOARD: Board = [
  [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
  [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
  [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
]

// Game phases
type GamePhase = 'opening' | 'middlegame' | 'endgame'

// AI personality settings
type AIPersonality = {
  aggressiveness: number
  defensiveness: number
  mobility: number
  positionality: number
  riskTaking: number
  opening: string
}

// Default AI settings
const DEFAULT_AI_PERSONALITY: AIPersonality = {
  aggressiveness: 0.7, 
  defensiveness: 0.6,
  mobility: 0.8,
  positionality: 0.9, 
  riskTaking: 0.5,
  opening: 'versatile'
}

// Define move history type
type MoveHistoryItem = {
  move: Move
  piece: Piece
  captured?: Piece | null
  notation: string
  check: boolean
  checkmate: boolean
}

interface ChessGameProps {
  playerColor?: PieceColor
  aiLevel?: number  // 0-10 difficulty
  showControls?: boolean
  onGameOver?: (result: string) => void
  className?: string
  onMove?: (board: Board, move: Move | null, isCheck: boolean, checkPosition: { row: number, col: number } | null, legalMoves: Move[]) => void
}

// Helper functions
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

// Main component
const ChessGame = ({
  playerColor = 'w',
  aiLevel = 5,
  showControls = true,
  onGameOver,
  className = '',
  onMove
}: ChessGameProps) => {
  // Game state
  const [board, setBoard] = useState<Board>(JSON.parse(JSON.stringify(INITIAL_BOARD)))
  const [turn, setTurn] = useState<PieceColor>('w')
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'>('playing')
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([])
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [gamePhase, setGamePhase] = useState<GamePhase>('opening')
  const [thinking, setThinking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  // Create a unique message ID counter
  const messageIdCounter = useRef(0);
  
  // Utility function for generating unique message IDs
  const getUniqueMessageId = (prefix: string) => {
    messageIdCounter.current += 1;
    return `${prefix}-${Date.now()}-${messageIdCounter.current}`;
  };
  
  // Game settings
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>(DEFAULT_AI_PERSONALITY)
  
  // Castling rights
  const [castlingRights, setCastlingRights] = useState<CastlingRights>({
    w: { kingside: true, queenside: true },
    b: { kingside: true, queenside: true }
  })
  
  // En passant target
  const [enPassantTarget, setEnPassantTarget] = useState<{ row: number, col: number } | null>(null)
  
  // Track pieces for determining game phase
  const pieceCount = useMemo(() => {
    const pieces = { w: 0, b: 0, total: 0 }
    board.forEach(row => {
      row.forEach(square => {
        if (square) {
          pieces[square.color]++
          pieces.total++
        }
      })
    })
    return pieces
  }, [board])
  
  // Determine game phase based on piece count and moves
  useEffect(() => {
    if (moveHistory.length < 10) {
      setGamePhase('opening')
    } else if (pieceCount.total > 20) {
      setGamePhase('middlegame')
    } else {
      setGamePhase('endgame')
    }
  }, [moveHistory.length, pieceCount])
  
  // Generate legal moves for current position
  const legalMoves = useMemo(() => {
    // This is a simplified version, in a real app you'd use a chess engine or complete implementation
    const moves: Move[] = []
    
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = board[fromRow][fromCol]
        if (!piece || piece.color !== turn) continue
        
        // Generate pawn moves
        if (piece.type === 'p') {
          const direction = piece.color === 'w' ? -1 : 1
          
          // Forward move
          if (isInBounds(fromRow + direction, fromCol) && !board[fromRow + direction][fromCol]) {
            moves.push({ from: { row: fromRow, col: fromCol }, to: { row: fromRow + direction, col: fromCol } })
            
            // Double move from starting position
            const startingRow = piece.color === 'w' ? 6 : 1
            if (fromRow === startingRow && !board[fromRow + 2 * direction][fromCol]) {
              moves.push({ from: { row: fromRow, col: fromCol }, to: { row: fromRow + 2 * direction, col: fromCol } })
            }
          }
          
          // Captures
          for (const offset of [-1, 1]) {
            if (isInBounds(fromRow + direction, fromCol + offset)) {
              const target = board[fromRow + direction][fromCol + offset]
              if (target && target.color !== piece.color) {
                moves.push({ from: { row: fromRow, col: fromCol }, to: { row: fromRow + direction, col: fromCol + offset } })
              }
              
              // En passant capture
              if (enPassantTarget && enPassantTarget.row === fromRow + direction && enPassantTarget.col === fromCol + offset) {
                moves.push({ from: { row: fromRow, col: fromCol }, to: { row: fromRow + direction, col: fromCol + offset } })
              }
            }
          }
        }
        
        // Knight moves
        if (piece.type === 'n') {
          const knightMoves = [
            { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
            { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 },
          ]
          for (const move of knightMoves) {
            const toRow = fromRow + move.r
            const toCol = fromCol + move.c
            if (isInBounds(toRow, toCol) && (!board[toRow][toCol] || board[toRow][toCol]?.color !== piece.color)) {
              moves.push({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } })
            }
          }
        }
        
        // Bishop, rook and queen moves
        if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
          const directions: { r: number, c: number }[] = []
          if (piece.type === 'b' || piece.type === 'q') directions.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 })
          if (piece.type === 'r' || piece.type === 'q') directions.push({ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 })
          
          for (const dir of directions) {
            let r = fromRow + dir.r, c = fromCol + dir.c
            while (isInBounds(r, c)) {
              if (!board[r][c]) {
                moves.push({ from: { row: fromRow, col: fromCol }, to: { row: r, col: c } })
              } else {
                if (board[r][c]?.color !== piece.color) {
                  moves.push({ from: { row: fromRow, col: fromCol }, to: { row: r, col: c } })
                }
                break
              }
              r += dir.r
              c += dir.c
            }
          }
        }
        
        // King moves
        if (piece.type === 'k') {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const toRow = fromRow + dr
              const toCol = fromCol + dc
              if (isInBounds(toRow, toCol) && (!board[toRow][toCol] || board[toRow][toCol]?.color !== piece.color)) {
                moves.push({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } })
              }
            }
          }
          
          // Castling
          if (castlingRights[piece.color]) {
            const row = piece.color === 'w' ? 7 : 0
            
            // Kingside castling
            if (castlingRights[piece.color].kingside &&
                !board[row][5] && !board[row][6] &&
                board[row][7]?.type === 'r' && board[row][7]?.color === piece.color) {
              moves.push({ from: { row, col: 4 }, to: { row, col: 6 } })
            }
            
            // Queenside castling
            if (castlingRights[piece.color].queenside &&
                !board[row][3] && !board[row][2] && !board[row][1] &&
                board[row][0]?.type === 'r' && board[row][0]?.color === piece.color) {
              moves.push({ from: { row, col: 4 }, to: { row, col: 2 } })
            }
          }
        }
      }
    }
    
    // This is a simplified approach. A full implementation would:
    // 1. Check if moves leave the king in check and filter them out
    // 2. Handle special moves like promotion
    // 3. Check for checkmate and stalemate
    return moves
  }, [board, turn, castlingRights, enPassantTarget])
  
  // Add state for chatMessages after other state declarations
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    id: '0',
    text: 'Welcome to the chess game! I\'ll provide analysis and tips as you play.',
    type: 'info',
    timestamp: new Date()
  }])
  
  // Player analysis state
  const [analysisExpanded, setAnalysisExpanded] = useState<{[key: string]: boolean}>({
    performance: true,
    style: true,
    statistics: false,
    technical: false
  });
  
  // Calculate player metrics based on move history
  const playerMetrics = useMemo(() => {
    // Default starting values
    const metrics = {
      openingPreparation: 70,
      tacticalAwareness: 65,
      endgameSkill: 60,
      positionalUnderstanding: 75,
      aggressiveness: 60,
      defensiveness: 70,
      blunderRate: 15,
      accuracy: 80,
      moveTimes: [] as number[],
      captureRate: 25,
      checkRate: 20
    };
    
    // Skip calculation if no moves yet
    if (moveHistory.length === 0) return metrics;
    
    // We'll use move history to dynamically adjust these values
    // (This is a simplified simulation - in a real app you'd do deeper analysis)
    
    // Opening preparation increases with standard opening moves
    if (moveHistory.length >= 6 && gamePhase === 'opening') {
      metrics.openingPreparation += 15;
    }
    
    // Tactical awareness increases with checks, captures, and threats
    const captures = moveHistory.filter(m => m.captured !== null).length;
    const checks = moveHistory.filter(m => m.check).length;
    metrics.tacticalAwareness += Math.min(25, (captures + checks) * 2);
    
    // Endgame skill increases in endgame phase
    if (gamePhase === 'endgame') {
      metrics.endgameSkill += 20;
    }
    
    // Calculate capture and check rates
    if (moveHistory.length > 0) {
      metrics.captureRate = Math.round((captures / moveHistory.length) * 100);
      metrics.checkRate = Math.round((checks / moveHistory.length) * 100);
    }
    
    // Limit all metrics to 0-100 range
    Object.keys(metrics).forEach(key => {
      const metricKey = key as keyof typeof metrics;
      // Skip moveTimes array
      if (metricKey !== 'moveTimes' && typeof metrics[metricKey] === 'number') {
        // Ensure we're only updating number values, not arrays
        metrics[metricKey] = Math.min(100, Math.max(0, metrics[metricKey] as number));
      }
    });
    
    return metrics;
  }, [moveHistory, gamePhase]);
  
  // Function to toggle sections
  const toggleSection = (section: string) => {
    setAnalysisExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Function to get rating text based on score
  const getRatingText = (score: number) => {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Very Strong";
    if (score >= 70) return "Strong";
    if (score >= 60) return "Good";
    if (score >= 50) return "Average";
    if (score >= 40) return "Developing";
    return "Needs Work";
  };
  
  // Function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 65) return "bg-blue-600";
    if (score >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };
  
  // Handle move execution
  const makeMove = useCallback((move: Move) => {
    // Copy the board to avoid mutation
    const newBoard = JSON.parse(JSON.stringify(board))
    const piece = newBoard[move.from.row][move.from.col]
    const capturedPiece = newBoard[move.to.row][move.to.col]
    
    // Check for en passant capture
    let enPassantCapture = null
    if (piece?.type === 'p' && enPassantTarget &&
        move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
      enPassantCapture = newBoard[move.from.row][enPassantTarget.col]
      newBoard[move.from.row][enPassantTarget.col] = null
    }
    
    // Update the board with the move
    newBoard[move.to.row][move.to.col] = piece
    newBoard[move.from.row][move.from.col] = null
    
    // Handle castling
    if (piece?.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
      const isKingside = move.to.col === 6
      const rookFromCol = isKingside ? 7 : 0
      const rookToCol = isKingside ? 5 : 3
      
      // Move the rook
      newBoard[move.to.row][rookToCol] = newBoard[move.from.row][rookFromCol]
      newBoard[move.from.row][rookFromCol] = null
    }
    
    // Handle pawn promotion
    if (piece?.type === 'p' && (move.to.row === 0 || move.to.row === 7)) {
      newBoard[move.to.row][move.to.col] = { 
        type: move.promotion || 'q', // Default to queen if not specified
        color: piece.color 
      }
    }
    
    // Update castling rights
    const newCastlingRights = { ...castlingRights }
    if (piece?.type === 'k' && piece?.color) {
      newCastlingRights[piece.color as PieceColor].kingside = false
      newCastlingRights[piece.color as PieceColor].queenside = false
    }

    if (piece?.type === 'r' && piece?.color) {
      if (move.from.col === 0) { // Queenside rook
        newCastlingRights[piece.color as PieceColor].queenside = false
      } else if (move.from.col === 7) { // Kingside rook
        newCastlingRights[piece.color as PieceColor].kingside = false
      }
    }
    
    // Check for en passant possibility
    let newEnPassantTarget = null
    if (piece?.type === 'p' && Math.abs(move.from.row - move.to.row) === 2) {
      const direction = piece.color === 'w' ? -1 : 1
      newEnPassantTarget = { row: move.from.row + direction, col: move.from.col }
    }
    
    // Update turn for next player
    const nextTurn = turn === 'w' ? 'b' : 'w'
    
    // Build proper algebraic notation for the move
    const fromAlg = `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`
    const toAlg = `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`
    
    // Generate notation based on piece type and whether it's a capture
    let notation = ''
    if (piece.type === 'p') {
      // Pawn move
      if (capturedPiece || enPassantCapture) {
        notation = `${fromAlg[0]}x${toAlg}`
      } else {
        notation = toAlg
      }
      // Add promotion if applicable
      if (move.to.row === 0 || move.to.row === 7) {
        notation += `=${move.promotion || 'Q'}`
      }
    } else if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
      // Castling
      notation = move.to.col === 6 ? 'O-O' : 'O-O-O'
    } else {
      // Other pieces
      const pieceSymbol = piece.type.toUpperCase()
      if (capturedPiece) {
        notation = `${pieceSymbol}x${toAlg}`
      } else {
        notation = `${pieceSymbol}${toAlg}`
      }
    }
    
    // Check if the move puts the opponent in check or checkmate
    const isInCheck = checkForCheck(newBoard, nextTurn)
    const hasLegalMoves = checkForLegalMoves(newBoard, nextTurn, newCastlingRights, newEnPassantTarget)
    
    let newGameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw' = 'playing'
    
    if (isInCheck) {
      if (!hasLegalMoves) {
        // Checkmate
        newGameStatus = 'checkmate'
        notation += '#'
        onGameOver?.(turn === playerColor ? 'win' : 'loss')
        setMessage(turn === playerColor ? "Checkmate! You win!" : "Checkmate! You lose!")
        
        // Add checkmate explanation if it's the player who is checkmated
        if (nextTurn === playerColor) {
          const kingPos = findKing(newBoard, nextTurn)
          if (kingPos) {
            const explanation = chessAnalysis.getCheckmateExplanation(newBoard, kingPos, nextTurn)
            setChatMessages(prev => [...prev, {
              id: getUniqueMessageId('checkmate'),
              text: explanation,
              type: 'error',
              timestamp: new Date()
            }])
          }
        } else {
          // Player delivered checkmate
          setChatMessages(prev => [...prev, {
            id: getUniqueMessageId('checkmate-win'),
            text: "Congratulations! You've delivered checkmate and won the game.",
            type: 'success',
            timestamp: new Date()
          }])
        }
      } else {
        // Just check
        newGameStatus = 'check'
        notation += '+'
      }
    } else if (!hasLegalMoves) {
      // Stalemate
      newGameStatus = 'stalemate'
      onGameOver?.('draw')
      setMessage("Stalemate! Game drawn.")
      
      setChatMessages(prev => [...prev, {
        id: getUniqueMessageId('stalemate'),
        text: "Stalemate! The game is a draw because the player to move has no legal moves but is not in check.",
        type: 'info',
        timestamp: new Date()
      }])
    }
    
    // Check for other draw conditions (simplified)
    if (moveHistory.length > 100) {
      // 50-move rule (simplified - should be checking for captures and pawn moves)
      newGameStatus = 'draw'
      onGameOver?.('draw')
      setMessage("Draw by 50-move rule!")
    }
    
    // Update state
    setBoard(newBoard)
    setTurn(nextTurn)
    setCastlingRights(newCastlingRights)
    setEnPassantTarget(newEnPassantTarget)
    setLastMove(move)
    setGameStatus(newGameStatus)
    
    // Add to move history
    setMoveHistory(prev => [...prev, {
      move,
      piece: piece!,
      captured: capturedPiece || enPassantCapture,
      notation,
      check: newGameStatus === 'check',
      checkmate: newGameStatus === 'checkmate'
    }])
    
    // Notify parent component about board state change if callback is provided
    if (onMove) {
      // Generate new legal moves for the current position after the move
      const kingPos = findKing(newBoard, nextTurn)
      const isInCheck = newGameStatus === 'check' || newGameStatus === 'checkmate'
      
      // We'll use an empty array for now as we don't want to recalculate moves here
      // The next render cycle will generate the correct legal moves
      onMove(newBoard, move, isInCheck, kingPos, [])
    }
    
    // After the move is made but before state updates, analyze the move quality
    if (piece && piece.color === playerColor) {
      const analysis = chessAnalysis.analyzeMoveQuality(board, move, piece, capturedPiece)
      
      // Add analysis message after a slight delay to make it feel more natural
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: getUniqueMessageId('move'),
          text: analysis.text,
          type: analysis.type,
          timestamp: new Date()
        }])
      }, 500)
    }
    
    return newBoard
  }, [board, turn, castlingRights, enPassantTarget, moveHistory.length, onGameOver, playerColor, onMove])
  
  // Fix the checkForCheck function to correctly define isInCheck
  const checkForCheck = useCallback((board: Board, color: PieceColor): boolean => {
    const kingPos = findKing(board, color)
    if (!kingPos) return false
    
    const opponentColor = color === 'w' ? 'b' : 'w'
    
    // Check for attacks from each opponent piece
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (!piece || piece.color !== opponentColor) continue
        
        if (piece.type === 'p') {
          // Pawns
          const direction = piece.color === 'w' ? -1 : 1
          if ((r + direction === kingPos.row) && 
              (c - 1 === kingPos.col || c + 1 === kingPos.col)) {
            return true
          }
        } else if (piece.type === 'n') {
          // Knights
          const knightMoves = [
            { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
            { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 },
          ]
          for (const move of knightMoves) {
            if (r + move.r === kingPos.row && c + move.c === kingPos.col) {
              return true
            }
          }
        } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
          // Sliding pieces (bishop, rook, queen)
          const directions: { r: number, c: number }[] = []
          if (piece.type === 'b' || piece.type === 'q') directions.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 })
          if (piece.type === 'r' || piece.type === 'q') directions.push({ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 })
          
          for (const dir of directions) {
            let tr = r + dir.r, tc = c + dir.c
            while (isInBounds(tr, tc)) {
              if (tr === kingPos.row && tc === kingPos.col) {
                // King is in check - after determining this, add explanation message
                if (color === playerColor) {
                  const explanation = chessAnalysis.getCheckExplanation(board, kingPos, color, lastMove)
                  
                  setChatMessages(prev => [...prev, {
                    id: getUniqueMessageId('check'),
                    text: explanation,
                    type: 'warning',
                    timestamp: new Date()
                  }])
                }
                return true
              }
              if (board[tr][tc] !== null) break
              tr += dir.r
              tc += dir.c
            }
          }
        } else if (piece.type === 'k') {
          // King (for adjacent checks)
          if (Math.abs(r - kingPos.row) <= 1 && Math.abs(c - kingPos.col) <= 1) {
            if (color === playerColor) {
              const explanation = chessAnalysis.getCheckExplanation(board, kingPos, color, lastMove)
              
              setChatMessages(prev => [...prev, {
                id: getUniqueMessageId('check'),
                text: explanation,
                type: 'warning',
                timestamp: new Date()
              }])
            }
            return true
          }
        }
      }
    }
    
    return false
  }, [playerColor, lastMove])
  
  // Helper function to check if a player has any legal moves
  const checkForLegalMoves = useCallback((board: Board, color: PieceColor, castlingState: CastlingRights, enPassantSquare: { row: number, col: number } | null): boolean => {
    // For each piece, try to find at least one legal move
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (!piece || piece.color !== color) continue
        
        // Generate potential moves based on piece type
        const potentialMoves: Move[] = []
        
        // Pawns
        if (piece.type === 'p') {
          const direction = piece.color === 'w' ? -1 : 1
          
          // Forward move
          if (isInBounds(r + direction, c) && !board[r + direction][c]) {
            potentialMoves.push({ 
              from: { row: r, col: c }, 
              to: { row: r + direction, col: c } 
            })
            
            // Double move from starting position
            const startingRow = piece.color === 'w' ? 6 : 1
            if (r === startingRow && !board[r + 2 * direction][c] && !board[r + direction][c]) {
              potentialMoves.push({ 
                from: { row: r, col: c }, 
                to: { row: r + 2 * direction, col: c } 
              })
            }
          }
          
          // Captures
          for (const offset of [-1, 1]) {
            if (isInBounds(r + direction, c + offset)) {
              // Regular capture
              if (board[r + direction][c + offset] && board[r + direction][c + offset]?.color !== color) {
                potentialMoves.push({ 
                  from: { row: r, col: c }, 
                  to: { row: r + direction, col: c + offset } 
                })
              }
              
              // En passant
              if (enPassantSquare && 
                  enPassantSquare.row === r + direction && 
                  enPassantSquare.col === c + offset) {
                potentialMoves.push({ 
                  from: { row: r, col: c }, 
                  to: { row: r + direction, col: c + offset } 
                })
              }
            }
          }
        }
        
        // Knights
        else if (piece.type === 'n') {
          const knightMoves = [
            { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
            { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 },
          ]
          for (const move of knightMoves) {
            const tr = r + move.r, tc = c + move.c
            if (isInBounds(tr, tc) && (!board[tr][tc] || board[tr][tc]?.color !== color)) {
              potentialMoves.push({ 
                from: { row: r, col: c }, 
                to: { row: tr, col: tc } 
              })
            }
          }
        }
        
        // Sliding pieces (bishop, rook, queen)
        else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
          const directions: { r: number, c: number }[] = []
          if (piece.type === 'b' || piece.type === 'q') {
            directions.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 })
          }
          if (piece.type === 'r' || piece.type === 'q') {
            directions.push({ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 })
          }
          
          for (const dir of directions) {
            let tr = r + dir.r, tc = c + dir.c
            while (isInBounds(tr, tc)) {
              if (!board[tr][tc]) {
                potentialMoves.push({ 
                  from: { row: r, col: c }, 
                  to: { row: tr, col: tc } 
                })
              } else {
                if (board[tr][tc]?.color !== color) {
                  potentialMoves.push({ 
                    from: { row: r, col: c }, 
                    to: { row: tr, col: tc } 
                  })
                }
                break
              }
              tr += dir.r
              tc += dir.c
            }
          }
        }
        
        // King
        else if (piece.type === 'k') {
          // Normal moves
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const tr = r + dr, tc = c + dc
              if (isInBounds(tr, tc) && (!board[tr][tc] || board[tr][tc]?.color !== color)) {
                potentialMoves.push({ 
                  from: { row: r, col: c }, 
                  to: { row: tr, col: tc } 
                })
              }
            }
          }
          
          // Castling
          const castling = castlingState[color]
          if (castling) {
            const row = color === 'w' ? 7 : 0
            
            // Kingside castling
            if (castling.kingside && 
                !board[row][5] && !board[row][6] &&
                board[row][7]?.type === 'r' && board[row][7]?.color === color) {
              potentialMoves.push({ 
                from: { row, col: 4 }, 
                to: { row, col: 6 } 
              })
            }
            
            // Queenside castling
            if (castling.queenside && 
                !board[row][3] && !board[row][2] && !board[row][1] &&
                board[row][0]?.type === 'r' && board[row][0]?.color === color) {
              potentialMoves.push({ 
                from: { row, col: 4 }, 
                to: { row, col: 2 } 
              })
            }
          }
        }
        
        // Check if any move is legal (doesn't leave king in check)
        for (const move of potentialMoves) {
          // Make the move on a copy of the board
          const testBoard = JSON.parse(JSON.stringify(board))
          testBoard[move.to.row][move.to.col] = testBoard[move.from.row][move.from.col]
          testBoard[move.from.row][move.from.col] = null
          
          // Handle en passant capture in the test board
          if (piece.type === 'p' && enPassantSquare &&
              move.to.row === enPassantSquare.row && move.to.col === enPassantSquare.col) {
            testBoard[move.from.row][enPassantSquare.col] = null
          }
          
          // Handle castling in the test board
          if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
            const isKingside = move.to.col === 6
            const rookFromCol = isKingside ? 7 : 0
            const rookToCol = isKingside ? 5 : 3
            testBoard[move.to.row][rookToCol] = testBoard[move.from.row][rookFromCol]
            testBoard[move.from.row][rookFromCol] = null
          }
          
          // Check if king is in check after the move
          const kingInCheck = checkForCheck(testBoard, color)
          
          // If this move doesn't leave king in check, it's legal
          if (!kingInCheck) {
            return true
          }
        }
      }
    }
    
    // No legal moves found
    return false
  }, [checkForCheck])
  
  // Handle AI move
  const handleAIMove = useCallback(async () => {
    if (turn !== playerColor && gameStatus === 'playing') {
      setThinking(true)
      setMessage("AI is thinking...")
      
      try {
        const response = await fetch('/api/chess-ai/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board,
            turn,
            gamePhase, 
            aiPersonality,
            castlingRights,
            aiLevel,
            moveHistory: moveHistory.map(item => ({ notation: item.notation })),
            enPassantTargetSquare: enPassantTarget
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to get AI move')
        }
        
        const data = await response.json()
        
        if (data.status === 'checkmate' || data.status === 'stalemate') {
          setGameStatus(data.status)
          onGameOver?.(data.status === 'checkmate' ? "Checkmate! You win!" : "Stalemate! Game drawn.")
          setMessage(data.status === 'checkmate' ? "Checkmate! You win!" : "Stalemate! Game drawn.")
        } else if (data.move) {
          const newBoard = makeMove(data.move)
          
          // Check if the AI's move put the player in check or checkmate
          // This would require a full chess engine to implement properly
        }
      } catch (error) {
        console.error('Error getting AI move:', error)
        setMessage("Error: Couldn't get AI move. Try again.")
      } finally {
        setThinking(false)
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }, [turn, playerColor, gameStatus, board, gamePhase, aiPersonality, castlingRights, aiLevel, moveHistory, enPassantTarget, makeMove, onGameOver])
  
  // Handle human player move
  const handlePlayerMove = useCallback((move: Move) => {
    if (turn === playerColor && gameStatus === 'playing') {
      const newBoard = makeMove(move)
    }
  }, [turn, playerColor, gameStatus, makeMove])
  
  // AI moves automatically when it's their turn
  useEffect(() => {
    if (turn !== playerColor && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        handleAIMove()
      }, 500) // Short delay for better UX
      
      return () => clearTimeout(timer)
    }
  }, [turn, playerColor, gameStatus, handleAIMove])
  
  // Reset the game
  const resetGame = useCallback(() => {
    setBoard(JSON.parse(JSON.stringify(INITIAL_BOARD)))
    setTurn('w')
    setCastlingRights({
      w: { kingside: true, queenside: true },
      b: { kingside: true, queenside: true }
    })
    setEnPassantTarget(null)
    setMoveHistory([])
    setLastMove(null)
    setGameStatus('playing')
    setGamePhase('opening')
    setMessage(null)
  }, [])
  
  // Undo last move
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return
    
    // Remove last 2 moves (player and AI)
    const movesToUndo = moveHistory.length === 1 ? 1 : 2
    const newHistory = [...moveHistory]
    const undoneItems = newHistory.splice(-movesToUndo)
    
    // Reset to board before these moves
    // In a real app, you'd store full board states in history or use a proper chess engine
    // This is a simplified approach
    resetGame()
    
    // Replay moves up to the point we want
    let currentBoard = JSON.parse(JSON.stringify(INITIAL_BOARD))
    let currentTurn = 'w'
    let currentCastling = {
      w: { kingside: true, queenside: true },
      b: { kingside: true, queenside: true }
    }
    let currentEnPassant = null
    
    newHistory.forEach(historyItem => {
      // Logic to replay the move without triggering AI response
      // This would use the same logic as makeMove but without state updates
    })
    
    setMoveHistory(newHistory)
    setBoard(currentBoard)
    setTurn(currentTurn as PieceColor)
    setCastlingRights(currentCastling)
    setEnPassantTarget(currentEnPassant)
    setLastMove(newHistory.length > 0 ? newHistory[newHistory.length - 1].move : null)
    setGameStatus('playing')
  }, [moveHistory, resetGame])
  
  // Render game controls
  const renderControls = () => {
    if (!showControls) return null
    
    return (
      <div className="flex flex-wrap gap-2 mt-4 items-center">
        <button 
          onClick={resetGame}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
          aria-label="Start new game"
        >
          <RotateCcw size={16} />
          New Game
        </button>
        
        <button 
          onClick={undoMove}
          disabled={moveHistory.length === 0 || thinking}
          className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${
            moveHistory.length === 0 || thinking 
              ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          aria-label="Undo last move"
        >
          <Undo size={16} />
          Undo
        </button>
        
        {gameStatus === 'playing' && (
          <>
            <button 
              onClick={() => {
                setGameStatus('stalemate')
                onGameOver?.('draw')
                setMessage("Game drawn by agreement.")
              }}
              disabled={thinking}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              aria-label="Offer draw"
            >
              Offer Draw
            </button>
            
            <button 
              onClick={() => {
                setGameStatus('checkmate')
                onGameOver?.(turn === playerColor ? 'loss' : 'win')
                setMessage(turn === playerColor ? "You resigned." : "AI resigned.")
              }}
              disabled={thinking}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              aria-label="Resign"
            >
              Resign
            </button>
          </>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          {/* Game status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
            {gameStatus === 'check' && (
              <span className="flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium">
                Check
              </span>
            )}
            
            {gameStatus === 'checkmate' && (
              <span className="flex items-center text-red-600 dark:text-red-400 text-sm font-medium">
                Checkmate
              </span>
            )}
            
            {gameStatus === 'stalemate' && (
              <span className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                Draw
              </span>
            )}
            
            {gameStatus === 'playing' && (
              <span className="flex items-center text-sm">
                {thinking ? (
                  <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                    <Loader2 size={16} className="animate-spin" />
                    AI thinking...
                  </span>
                ) : (
                  <span className={`font-medium ${turn === playerColor ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {turn === playerColor ? 'Your turn' : 'AI turn'}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Render the move history
  const renderMoveHistory = () => {
    if (moveHistory.length === 0) {
      return (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 h-[200px] flex items-center justify-center text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-sm font-medium">No moves played yet</p>
            <p className="text-xs mt-1">Moves will appear here as the game progresses</p>
          </div>
        </div>
      )
    }
    
    const moveItems = []
    for (let i = 0; i < moveHistory.length; i += 2) {
      const whiteMove = moveHistory[i]
      const blackMove = moveHistory[i + 1]
      
      const moveNumber = Math.floor(i / 2) + 1
      
      moveItems.push(
        <div key={i} className={`grid grid-cols-[3rem_1fr_1fr] gap-2 text-sm py-1.5 ${i % 4 === 0 || i % 4 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
          <span className="font-mono text-gray-500 dark:text-gray-400 text-center">{moveNumber}.</span>
          <div 
            className={`font-medium px-2 py-0.5 rounded ${whiteMove.check || whiteMove.checkmate ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
          >
            {whiteMove.notation}
          </div>
          {blackMove && (
            <div 
              className={`font-medium px-2 py-0.5 rounded ${blackMove.check || blackMove.checkmate ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
            >
              {blackMove.notation}
            </div>
          )}
          {!blackMove && <div>...</div>}
        </div>
      )
    }
    
    return (
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-medium">Move History</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Based on {moveHistory.length} move{moveHistory.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="p-2 max-h-[200px] overflow-y-auto">
          <div className="space-y-0.5">
            {moveItems}
          </div>
        </div>
      </div>
    )
  }
  
  // Render player analysis panel
  const renderPlayerAnalysis = () => {
    return (
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <Medal className="mr-1.5 h-4 w-4 text-yellow-500" />
            Player Analysis
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Based on {moveHistory.length} move{moveHistory.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700 flex-grow overflow-auto">
          {/* Rest of the player analysis content */}
          {/* Performance Metrics Section */}
          <div>
            <button 
              onClick={() => toggleSection('performance')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
            >
              <span className="font-medium text-sm flex items-center">
                <TrendingUp className="mr-1.5 h-4 w-4 text-blue-500" />
                Performance Metrics
              </span>
              {analysisExpanded.performance ? 
                <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>
            
            {analysisExpanded.performance && (
              <div className="p-3 pt-0 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium flex items-center">
                      Opening Preparation
                      <span className="group relative ml-1">
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Knowledge of standard opening theory
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {getRatingText(playerMetrics.openingPreparation)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${getScoreColor(playerMetrics.openingPreparation)} rounded-full transition-all duration-500`} style={{ width: `${playerMetrics.openingPreparation}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium flex items-center">
                      Tactical Awareness
                      <span className="group relative ml-1">
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Ability to spot combinations and tactics
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {getRatingText(playerMetrics.tacticalAwareness)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${getScoreColor(playerMetrics.tacticalAwareness)} rounded-full transition-all duration-500`} style={{ width: `${playerMetrics.tacticalAwareness}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium flex items-center">
                      Positional Understanding
                      <span className="group relative ml-1">
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Strategic piece placement and pawn structure
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {getRatingText(playerMetrics.positionalUnderstanding)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${getScoreColor(playerMetrics.positionalUnderstanding)} rounded-full transition-all duration-500`} style={{ width: `${playerMetrics.positionalUnderstanding}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium flex items-center">
                      Endgame Skill
                      <span className="group relative ml-1">
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Technical precision in simplified positions
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {getRatingText(playerMetrics.endgameSkill)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${getScoreColor(playerMetrics.endgameSkill)} rounded-full transition-all duration-500`} style={{ width: `${playerMetrics.endgameSkill}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Playing Style Section */}
          <div>
            <button 
              onClick={() => toggleSection('style')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
            >
              <span className="font-medium text-sm flex items-center">
                <Target className="mr-1.5 h-4 w-4 text-red-500" />
                Playing Style
              </span>
              {analysisExpanded.style ? 
                <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>
            
            {analysisExpanded.style && (
              <div className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">Aggressive</span>
                      <span className="text-xs">{playerMetrics.aggressiveness}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${playerMetrics.aggressiveness}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">Defensive</span>
                      <span className="text-xs">{playerMetrics.defensiveness}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${playerMetrics.defensiveness}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="text-xs font-medium mb-2">Style Characteristics</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-yellow-500 dark:bg-yellow-700 text-white px-3 py-2 rounded-md hover:bg-yellow-600 dark:hover:bg-yellow-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-white flex-shrink-0" />
                        <span className="text-sm font-medium">Prefers positional play</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-white flex-shrink-0" />
                        <span className="text-sm font-medium">Solid defender</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-500 dark:bg-green-700 text-white px-3 py-2 rounded-md hover:bg-green-600 dark:hover:bg-green-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-white flex-shrink-0" />
                        <span className="text-sm font-medium">Strong endgame player</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Statistics Section */}
          <div>
            <button 
              onClick={() => toggleSection('statistics')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
            >
              <span className="font-medium text-sm flex items-center">
                <FileCog className="mr-1.5 h-4 w-4 text-purple-500" />
                Game Statistics
              </span>
              {analysisExpanded.statistics ? 
                <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>
            
            {analysisExpanded.statistics && (
              <div className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Capture Rate:</span>
                    <span className="text-xs font-medium">{playerMetrics.captureRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Check Rate:</span>
                    <span className="text-xs font-medium">{playerMetrics.checkRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Blunder Rate:</span>
                    <span className="text-xs font-medium">{playerMetrics.blunderRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Move Accuracy:</span>
                    <span className="text-xs font-medium">{playerMetrics.accuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Time Phase:</span>
                    <span className="text-xs font-medium capitalize">{gamePhase}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Moves Played:</span>
                    <span className="text-xs font-medium">{moveHistory.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Technical Implementation Section */}
          <div>
            <button 
              onClick={() => toggleSection('technical')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
            >
              <span className="font-medium text-sm flex items-center">
                <Code className="mr-1.5 h-4 w-4 text-emerald-500" />
                Technical Implementation
              </span>
              {analysisExpanded.technical ? 
                <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>
            
            {analysisExpanded.technical && (
              <div className="p-3 pt-0">
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Client-side React chessboard with server-side AI move generation via a Next.js API route.
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      Next.js
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      React
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      TypeScript
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      Supabase
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      ONNX Runtime
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                    Neural network model is stored in Supabase and dynamically loaded for inference.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Add a useEffect to provide game phase tips periodically
  useEffect(() => {
    if (gameStatus === 'playing' && moveHistory.length > 0 && moveHistory.length % 5 === 0) {
      const tipText = chessAnalysis.getGamePhaseTips(gamePhase, moveHistory.length)
      
      setChatMessages(prev => [...prev, {
        id: getUniqueMessageId('tip'),
        text: tipText,
        type: 'tip',
        timestamp: new Date()
      }])
    }
  }, [moveHistory.length, gamePhase, gameStatus])
  
  // Add a handler for user messages
  const handleUserMessage = useCallback((message: string) => {
    // First add the user's message to the chat
    setChatMessages(prev => [...prev, {
      id: getUniqueMessageId('user'),
      text: message,
      type: 'user',
      timestamp: new Date()
    }])
    
    // Generate a response based on the user's question
    let response = ""
    const lowerMessage = message.toLowerCase()
    
    // Check for common chess questions and provide appropriate responses
    if (lowerMessage.includes("checkmate") || lowerMessage.includes("how to win")) {
      response = "Checkmate occurs when a king is in check and has no legal moves to escape. To win, you need to attack the opponent's king while preventing any escape or defense moves."
    }
    else if (lowerMessage.includes("castling") || lowerMessage.includes("castle")) {
      response = "Castling is a special move involving the king and a rook. The king moves two squares toward the rook, and the rook moves to the square the king crossed. Requirements: neither piece has moved, no pieces between them, king not in check, and king doesn't move through or into check."
    }
    else if (lowerMessage.includes("en passant")) {
      response = "En passant is a special pawn capture. When a pawn moves two squares forward from its starting position and lands beside an opponent's pawn, that opponent can capture it 'in passing' as if it had only moved one square."
    }
    else if (lowerMessage.includes("promote") || lowerMessage.includes("promotion")) {
      response = "Pawn promotion occurs when a pawn reaches the opposite end of the board. The pawn can be exchanged for a queen, rook, bishop, or knight of the same color, regardless of pieces already on the board."
    }
    else if (lowerMessage.includes("check") && !lowerMessage.includes("checkmate")) {
      response = "Check occurs when a player's king is under attack by an opponent's piece. You must get out of check by moving the king, capturing the attacking piece, or placing a piece between the attacker and your king."
    }
    else if (lowerMessage.includes("stalemate")) {
      response = "Stalemate occurs when a player has no legal moves but their king is not in check. The game ends in a draw. It's a way to save a losing position."
    }
    else if (lowerMessage.includes("pin")) {
      response = "A pin is when a piece cannot move because it would expose a more valuable piece (often the king) to attack. An absolute pin (pinned against the king) makes the piece completely immobile."
    }
    else if (lowerMessage.includes("fork")) {
      response = "A fork is a tactic where one piece attacks two or more opponent pieces simultaneously. Knights are particularly good at forking."
    }
    else if (lowerMessage.includes("opening") || lowerMessage.includes("start")) {
      response = "In the opening phase, focus on developing your pieces quickly, controlling the center, ensuring king safety (often by castling), and connecting your rooks. Popular openings include the Ruy Lopez, Sicilian Defense, and Queen's Gambit."
    }
    else if (lowerMessage.includes("endgame")) {
      response = "In the endgame, activate your king, advance your pawns towards promotion, and look for zugzwang positions. Piece values change slightly - knights are weaker in open positions while bishops become stronger."
    }
    else if (lowerMessage.includes("middle game") || lowerMessage.includes("middlegame")) {
      response = "The middlegame is where strategic plans are executed and tactical opportunities arise. Look for weaknesses in pawn structure, piece coordination, and potential attacks against the opponent's king."
    }
    else if (lowerMessage.includes("value") || lowerMessage.includes("worth")) {
      response = "Standard piece values: pawn=1, knight=3, bishop=3, rook=5, queen=9, and king=invaluable. However, piece value can change based on the position - bishops are better in open positions, knights in closed ones."
    }
    else if (lowerMessage.includes("strategy") || lowerMessage.includes("plan")) {
      response = "Good chess strategy includes controlling the center, developing pieces efficiently, keeping your king safe, creating minimal weaknesses, improving piece positioning, and formulating long-term plans based on the pawn structure."
    }
    else if (lowerMessage.includes("tactic") || lowerMessage.includes("combination")) {
      response = "Tactics are short-term operations focused on material gain or checkmate. Common tactics include pins, forks, skewers, discovered attacks, double attacks, and removing the defender."
    }
    else if (lowerMessage.includes("how to improve") || lowerMessage.includes("get better")) {
      response = "To improve at chess: 1) Study tactics puzzles daily, 2) Analyze your games, 3) Learn basic endgames, 4) Study master games, 5) Understand common pawn structures, and 6) Play regularly against stronger opponents."
    }
    else if (lowerMessage.includes("best move") || lowerMessage.includes("what should i do")) {
      // Contextual advice based on game state
      if (gamePhase === 'opening' && moveHistory.length < 6) {
        response = "In the early opening, focus on developing your knights and bishops, controlling the center with pawns, and preparing to castle for king safety."
      } else if (gameStatus === 'check') {
        response = "Your king is in check - you must address this threat by moving the king, capturing the attacker, or blocking the attack."
      } else if (gamePhase === 'endgame') {
        response = "In the endgame, activate your king, advance your pawns carefully, and look to create passed pawns that can promote to a queen."
      } else {
        response = "Look for pieces that aren't active yet and find better squares for them. Also check for tactical opportunities like forks or pins, and watch for weak points in your opponent's position."
      }
    }
    else if (lowerMessage.includes("why did") && lowerMessage.includes("move")) {
      // Contextual explanation of AI's last move
      if (moveHistory.length > 0 && turn === playerColor) {
        const lastAIMove = moveHistory[moveHistory.length - 1]
        if (lastAIMove) {
          if (lastAIMove.check) {
            response = `The AI moved ${lastAIMove.notation} to put your king in check, forcing you to respond to the threat.`
          } else if (lastAIMove.captured) {
            response = `The AI captured your ${getPieceName(lastAIMove.captured.type)} to gain material advantage (${getPieceValue(lastAIMove.captured.type)} point${getPieceValue(lastAIMove.captured.type) !== 1 ? 's' : ''}).`
          } else if (lastAIMove.piece.type === 'p' && (lastAIMove.move.to.row === 3 || lastAIMove.move.to.row === 4)) {
            response = "The AI advanced a pawn to control central squares, which is a key strategic objective, especially in the opening and middlegame."
          } else {
            response = `The AI moved ${lastAIMove.notation} to improve piece positioning and develop its strategy.`
          }
        } else {
          response = "I can't provide specific details about the AI's last move, but generally it's looking to improve piece positions and create threats."
        }
      } else {
        response = "The AI is evaluating positions several moves ahead, looking for material gain, positional advantages, or checkmate opportunities."
      }
    }
    else if (lowerMessage.includes("analyze") || lowerMessage.includes("current position") || lowerMessage.includes("evaluation")) {
      // Count material to evaluate basic position strength
      const material = { w: 0, b: 0 }
      let whitePieces = 0
      let blackPieces = 0
      
      board.forEach(row => {
        row.forEach(square => {
          if (square) {
            if (square.color === 'w') {
              material.w += getPieceValue(square.type)
              whitePieces++
            } else {
              material.b += getPieceValue(square.type)
              blackPieces++
            }
          }
        })
      })
      
      const materialDiff = material.w - material.b
      const advantage = Math.abs(materialDiff) > 0 ? 
        `${materialDiff > 0 ? 'White' : 'Black'} has a material advantage of ${Math.abs(materialDiff)} point${Math.abs(materialDiff) !== 1 ? 's' : ''}.` : 
        'The material is equal.'
      
      // Game phase determination
      let phaseInfo = ''
      if (gamePhase === 'opening') {
        phaseInfo = `We're in the opening phase. ${moveHistory.length < 6 ? 'Focus on developing your pieces and controlling the center.' : 'Consider completing development and castling for king safety.'}`
      } else if (gamePhase === 'middlegame') {
        phaseInfo = `We're in the middlegame. Look for tactical opportunities and strategic plans based on the pawn structure.`
      } else {
        phaseInfo = `We're in the endgame with ${whitePieces + blackPieces} pieces remaining. King activity becomes crucial now.`
      }
      
      // Check for key positional factors
      const kingPos = findKing(board, playerColor)
      let kingInfo = ''
      if (kingPos) {
        // Check if king is safe
        if (moveHistory.length > 10 && !castlingRights[playerColor].kingside && !castlingRights[playerColor].queenside) {
          kingInfo = `Your king has moved or both rooks have moved, so castling is no longer available.`
        } else if (castlingRights[playerColor].kingside || castlingRights[playerColor].queenside) {
          kingInfo = `Your king can still castle ${
            castlingRights[playerColor].kingside && castlingRights[playerColor].queenside ? 
            'on either side' : 
            castlingRights[playerColor].kingside ? 'kingside' : 'queenside'
          }, which is often a good idea for safety.`
        }
      }
      
      response = `${advantage} ${phaseInfo} ${kingInfo}`
    }
    else if (lowerMessage.includes("hint") || lowerMessage.includes("suggest move") || lowerMessage.includes("help me")) {
      // Only provide hints if it's the player's turn
      if (turn === playerColor && gameStatus === 'playing') {
        // Look for tactical opportunities - captures and checks
        let hint = ""
        let foundHint = false
        
        // First, look for check moves
        for (const move of legalMoves) {
          const testBoard = JSON.parse(JSON.stringify(board))
          testBoard[move.to.row][move.to.col] = testBoard[move.from.row][move.from.col]
          testBoard[move.from.row][move.from.col] = null
          
          const opponentColor = playerColor === 'w' ? 'b' : 'w'
          const opponentKingPos = findKing(testBoard, opponentColor)
          
          if (opponentKingPos) {
            const isCheck = checkForCheck(testBoard, opponentColor)
            if (isCheck) {
              const piece = board[move.from.row][move.from.col]
              const from = `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}`
              const to = `${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`
              hint = `Consider moving your ${getPieceName(piece!.type)} from ${from} to ${to} to put your opponent in check.`
              foundHint = true
              break
            }
          }
        }
        
        // If no check moves, look for captures
        if (!foundHint) {
          const captureMoves = legalMoves.filter(move => 
            board[move.to.row][move.to.col] !== null && 
            board[move.to.row][move.to.col]?.color !== playerColor
          )
          
          if (captureMoves.length > 0) {
            // Find the most valuable capture
            let bestCapture = captureMoves[0]
            let bestValue = getPieceValue((board[bestCapture.to.row][bestCapture.to.col] as Piece).type)
            
            for (const move of captureMoves) {
              const captureValue = getPieceValue((board[move.to.row][move.to.col] as Piece).type)
              if (captureValue > bestValue) {
                bestValue = captureValue
                bestCapture = move
              }
            }
            
            const piece = board[bestCapture.from.row][bestCapture.from.col]
            const capturedPiece = board[bestCapture.to.row][bestCapture.to.col]
            const from = `${String.fromCharCode(97 + bestCapture.from.col)}${8 - bestCapture.from.row}`
            const to = `${String.fromCharCode(97 + bestCapture.to.col)}${8 - bestCapture.to.row}`
            
            hint = `You can capture a ${getPieceName(capturedPiece!.type)} at ${to} with your ${getPieceName(piece!.type)} from ${from}.`
            foundHint = true
          }
        }
        
        // If no tactical moves, give generic development advice
        if (!foundHint) {
          if (gamePhase === 'opening' && moveHistory.length < 10) {
            hint = "Try developing your knights and bishops toward the center, and consider castling for king safety."
          } else if (pieceCount.total < 20) {
            hint = "In the endgame, activate your king and try to advance pawns toward promotion."
          } else {
            // Find undeveloped pieces to suggest moving
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const piece = board[r][c]
                if (piece && piece.color === playerColor) {
                  // Check if piece hasn't moved yet
                  if ((piece.type === 'n' || piece.type === 'b') && 
                      ((playerColor === 'w' && r === 7) || (playerColor === 'b' && r === 0))) {
                    const from = `${String.fromCharCode(97 + c)}${8 - r}`
                    hint = `Consider developing your ${getPieceName(piece.type)} at ${from} to a more active position.`
                    foundHint = true
                    break
                  }
                  
                  // Suggest castling if king and rook haven't moved
                  if (piece.type === 'k' && 
                      ((playerColor === 'w' && r === 7 && c === 4) || (playerColor === 'b' && r === 0 && c === 4)) &&
                      castlingRights[playerColor].kingside) {
                    hint = "If safe, consider castling to protect your king and activate your rook."
                    foundHint = true
                    break
                  }
                }
              }
              if (foundHint) break
            }
            
            // If still no hint, give a generic suggestion
            if (!foundHint) {
              hint = "Look for pieces that can be improved in position, and always be alert for tactical opportunities."
            }
          }
        }
        
        response = hint
      } else if (gameStatus !== 'playing') {
        response = "The game is already over. You can start a new game to continue playing."
      } else {
        response = "It's currently the AI's turn. I'll provide analysis once the AI has made its move."
      }
    }
    else {
      // Generic response for other questions
      response = "I'm your chess assistant and can help with rules, strategies, and analysis. For specific position analysis, try asking about openings, tactics, or particular pieces on the board."
    }
    
    // Add the response to the chat messages after a short delay
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: getUniqueMessageId('response'),
        text: response,
        type: 'response',
        timestamp: new Date()
      }])
    }, 500)
  }, [gamePhase, gameStatus, moveHistory, playerColor, turn])
  
  // Add the getPieceName and getPieceValue functions
  const getPieceName = (type: string): string => {
    switch (type) {
      case 'p': return 'pawn'
      case 'n': return 'knight'
      case 'b': return 'bishop'
      case 'r': return 'rook'
      case 'q': return 'queen'
      case 'k': return 'king'
      default: return 'piece'
    }
  }
  
  const getPieceValue = (type: string): number => {
    switch (type) {
      case 'p': return 1
      case 'n': return 3
      case 'b': return 3
      case 'r': return 5
      case 'q': return 9
      case 'k': return 0 // Kings are invaluable
      default: return 0
    }
  }
  
  // Effect to notify parent component when legal moves change
  useEffect(() => {
    if (onMove) {
      const kingPos = findKing(board, turn)
      const isInCheck = gameStatus === 'check' || gameStatus === 'checkmate'
      onMove(board, lastMove, isInCheck, kingPos, legalMoves)
    }
  }, [board, lastMove, legalMoves, gameStatus, turn, onMove])
  
  return (
    <div className={`relative ${className}`}>
      {/* Chess board content */}
      
      {/* Content with slight transparency for readability */}
      <div className="relative z-10">
        {message && (
          <div className={`p-2.5 rounded-md mb-3 text-sm font-medium ${
            gameStatus === 'checkmate' 
              ? 'bg-red-100/90 dark:bg-red-900/90 text-red-800 dark:text-red-200' 
              : gameStatus === 'stalemate' || gameStatus === 'draw'
                ? 'bg-blue-100/90 dark:bg-blue-900/90 text-blue-800 dark:text-blue-200'
                : 'bg-blue-100/90 dark:bg-blue-900/90 text-blue-800 dark:text-blue-200'
          }`}>
            {message}
          </div>
        )}
        
        <div className="flex flex-col gap-6">
          {/* Main board area with backdrop blur for better visibility */}
          <div className="w-full p-6 rounded-xl bg-black/30 backdrop-blur-sm">
            <div className="mx-auto max-w-[600px]">
              <ChessBoard 
                board={board}
                onMove={handlePlayerMove}
                orientation={playerColor}
                legalMoves={turn === playerColor ? legalMoves : []}
                lastMove={lastMove}
                isCheck={gameStatus === 'check' || gameStatus === 'checkmate'}
                checkPosition={findKing(board, turn)}
                disabled={turn !== playerColor || gameStatus !== 'playing' || thinking}
              />
            </div>
            {renderControls()}
          </div>
          
          {/* Analysis and assistance section with improved layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              {/* Player Analysis Panel */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center">
                    <Medal className="mr-1.5 h-4 w-4 text-yellow-500" />
                    Player Analysis
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Based on {moveHistory.length} move{moveHistory.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 flex-grow overflow-auto max-h-[500px]">
                  {/* Performance Metrics Section */}
                  <div>
                    <button 
                      onClick={() => toggleSection('performance')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
                    >
                      <span className="font-medium text-sm flex items-center">
                        <TrendingUp className="mr-1.5 h-4 w-4 text-blue-500" />
                        Performance Metrics
                      </span>
                      {analysisExpanded.performance ? 
                        <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {analysisExpanded.performance && (
                      <div className="p-3 pt-0 space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium flex items-center">
                              Opening Preparation
                              <span className="group relative ml-1">
                                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                                <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                  Knowledge of standard opening theory
                                </span>
                              </span>
                            </span>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {getRatingText(playerMetrics.openingPreparation)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${getScoreColor(playerMetrics.openingPreparation)} rounded-full transition-all duration-500`} style={{ width: `${playerMetrics.openingPreparation}%` }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium flex items-center">
                              Tactical Awareness
                              <span className="group relative ml-1">
                                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                                <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                  Ability to spot combinations and tactics
                                </span>
                              </span>
                            </span>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {getRatingText(playerMetrics.tacticalAwareness)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${getScoreColor(playerMetrics.tacticalAwareness)} rounded-full transition-all duration-500`} style={{ width: `${playerMetrics.tacticalAwareness}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Playing Style Section */}
                  <div>
                    <button 
                      onClick={() => toggleSection('style')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
                    >
                      <span className="font-medium text-sm flex items-center">
                        <Target className="mr-1.5 h-4 w-4 text-red-500" />
                        Playing Style
                      </span>
                      {analysisExpanded.style ? 
                        <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {analysisExpanded.style && (
                      <div className="p-3 pt-0">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">Aggressive</span>
                              <span className="text-xs">{playerMetrics.aggressiveness}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${playerMetrics.aggressiveness}%` }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">Defensive</span>
                              <span className="text-xs">{playerMetrics.defensiveness}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${playerMetrics.defensiveness}%` }}></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="text-xs font-medium mb-2">Style Characteristics</div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="bg-yellow-500 dark:bg-yellow-700 text-white px-3 py-2 rounded-md hover:bg-yellow-600 dark:hover:bg-yellow-600 transition-colors">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-white flex-shrink-0" />
                                <span className="text-sm font-medium">Prefers positional play</span>
                              </div>
                            </div>
                            
                            <div className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-white flex-shrink-0" />
                                <span className="text-sm font-medium">Solid defender</span>
                              </div>
                            </div>
                            
                            <div className="bg-green-500 dark:bg-green-700 text-white px-3 py-2 rounded-md hover:bg-green-600 dark:hover:bg-green-600 transition-colors">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-white flex-shrink-0" />
                                <span className="text-sm font-medium">Strong endgame player</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Statistics Section */}
                  <div>
                    <button 
                      onClick={() => toggleSection('statistics')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
                    >
                      <span className="font-medium text-sm flex items-center">
                        <FileCog className="mr-1.5 h-4 w-4 text-purple-500" />
                        Game Statistics
                      </span>
                      {analysisExpanded.statistics ? 
                        <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {analysisExpanded.statistics && (
                      <div className="p-3 pt-0">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Capture Rate:</span>
                            <span className="text-xs font-medium">{playerMetrics.captureRate}%</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Check Rate:</span>
                            <span className="text-xs font-medium">{playerMetrics.checkRate}%</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Blunder Rate:</span>
                            <span className="text-xs font-medium">{playerMetrics.blunderRate}%</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Move Accuracy:</span>
                            <span className="text-xs font-medium">{playerMetrics.accuracy}%</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Time Phase:</span>
                            <span className="text-xs font-medium capitalize">{gamePhase}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Moves Played:</span>
                            <span className="text-xs font-medium">{moveHistory.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Technical Implementation Section */}
                  <div>
                    <button 
                      onClick={() => toggleSection('technical')}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
                    >
                      <span className="font-medium text-sm flex items-center">
                        <Code className="mr-1.5 h-4 w-4 text-emerald-500" />
                        Technical Implementation
                      </span>
                      {analysisExpanded.technical ? 
                        <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                    
                    {analysisExpanded.technical && (
                      <div className="p-3 pt-0">
                        <div className="space-y-3">
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Client-side React chessboard with server-side AI move generation via a Next.js API route.
                          </p>
                          
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              Next.js
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              React
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              TypeScript
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              Supabase
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              ONNX Runtime
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                            Neural network model is stored in Supabase and dynamically loaded for inference.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Move History */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Move History</h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Based on {moveHistory.length} move{moveHistory.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="p-2 overflow-auto max-h-[200px]">
                  {moveHistory.length === 0 ? (
                    <div className="flex items-center justify-center text-center py-6">
                      <div className="text-gray-500 dark:text-gray-400">
                        <p className="text-sm font-medium">No moves played yet</p>
                        <p className="text-xs mt-1">Moves will appear here as the game progresses</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {moveHistory.map((move, index) => {
                        const moveNumber = Math.floor(index / 2) + 1;
                        if (index % 2 === 0) {
                          // White move
                          const blackMove = moveHistory[index + 1];
                          return (
                            <div key={index} className={`grid grid-cols-[3rem_1fr_1fr] gap-2 text-sm py-1.5 ${index % 4 === 0 || index % 4 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                              <span className="font-mono text-gray-500 dark:text-gray-400 text-center">{moveNumber}.</span>
                              <div 
                                className={`font-medium px-2 py-0.5 rounded ${move.check || move.checkmate ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                              >
                                {move.notation}
                              </div>
                              {blackMove && (
                                <div 
                                  className={`font-medium px-2 py-0.5 rounded ${blackMove.check || blackMove.checkmate ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                                >
                                  {blackMove.notation}
                                </div>
                              )}
                              {!blackMove && <div>...</div>}
                            </div>
                          );
                        }
                        return null; // Skip black moves as they're handled with white moves
                      }).filter(Boolean)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chess Assistant - Fixed height issues */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center">
                    <MessageCircle className="mr-1.5 h-4 w-4 text-blue-500" />
                    Chess Assistant
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {moveHistory.length > 0 ? 'Providing analysis' : 'Waiting for moves'}
                  </div>
                </div>
                
                <div className="overflow-auto p-3 max-h-[250px]">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center text-center py-6">
                      <div className="text-gray-500 dark:text-gray-400">
                        <p className="text-sm font-medium">No messages yet</p>
                        <p className="text-xs mt-1">Ask questions or make moves to get analysis</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
                        <div 
                          key={message.id}
                          className={`p-2.5 rounded-lg flex items-start gap-2 ${
                            message.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                            message.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                            message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                            message.type === 'user' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                            message.type === 'response' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                            'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {message.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                            {message.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                            {message.type === 'success' && <Check className="w-4 h-4 text-green-500" />}
                            {message.type === 'error' && <X className="w-4 h-4 text-red-500" />}
                            {message.type === 'tip' && <Lightbulb className="w-4 h-4 text-purple-500" />}
                            {message.type === 'user' && <User className="w-4 h-4 text-gray-500" />}
                            {message.type === 'response' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask a chess question..."
                    className="w-full rounded-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleUserMessage(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-full p-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    aria-label="Send message"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        handleUserMessage(input.value.trim());
                        input.value = '';
                      }
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add a disclaimer at the bottom of the page */}
        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          This is a demonstration project and not affiliated with Magnus Carlsen or Star Wars.
          <br />
          Chess pieces imagery used under Creative Commons license.
        </div>
      </div>
    </div>
  )
}

export default ChessGame 
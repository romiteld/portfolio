import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Define necessary interfaces
interface MoveRequest {
  board: Board
  turn: PieceColor
  gamePhase: string
  aiPersonality: any
  castlingRights: CastlingRights
  aiLevel: number
  moveHistory: { notation: string }[]
  enPassantTargetSquare: { row: number, col: number } | null
}

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
type PieceColor = 'w' | 'b'
type Square = { type: PieceType; color: PieceColor } | null
type Board = Square[][]
type Move = { from: { row: number; col: number }; to: { row: number; col: number }; promotion?: PieceType }
type CastlingRights = { w: { kingside: boolean; queenside: boolean }; b: { kingside: boolean; queenside: boolean } }

// --- Standalone Chess Utility Functions (Copied/Adapted from frontend) ---

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

// Define stubs for isCheck and isSquareAttackedBy as they depend on getValidMovesForPiece
// declare var isSquareAttackedBy: (board: Board, row: number, col: number, attackerColor: PieceColor) => boolean;
// declare var isCheck: (board: Board, color: PieceColor) => boolean;

const getValidMovesForPiece = (board: Board, row: number, col: number, currentCastlingRights: CastlingRights, enPassantTarget: { row: number, col: number } | null): { row: number, col: number }[] => {
  const piece = board[row][col]
  if (!piece) return []
  const moves: { row: number, col: number }[] = []
  const { type, color } = piece

  if (type === 'p') {
    const direction = color === 'w' ? -1 : 1
    if (isInBounds(row + direction, col) && !board[row + direction][col]) {
      moves.push({ row: row + direction, col })
      const startingRow = color === 'w' ? 6 : 1
      if (row === startingRow && isInBounds(row + 2 * direction, col) && !board[row + 2 * direction][col] && !board[row + direction][col]) {
        moves.push({ row: row + 2 * direction, col })
      }
    }
    for (const offset of [-1, 1]) {
      if (isInBounds(row + direction, col + offset) && board[row + direction][col + offset]?.color !== color && board[row + direction][col + offset] !== null) {
        moves.push({ row: row + direction, col: col + offset })
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
      for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const newRow = row + dr
              const newCol = col + dc
              if (isInBounds(newRow, newCol) && (!board[newRow][newCol] || board[newRow][newCol]?.color !== color)) {
                  moves.push({ row: newRow, col: newCol })
              }
          }
      }
      const castling = currentCastlingRights[color]
      const opponentColor = color === 'w' ? 'b' : 'w'
      
      // Using direct king position check instead of isCheck which causes recursion
      const kingPos = { row, col }
      const kingInCheck = isSquareAttackedBy(board, kingPos.row, kingPos.col, opponentColor)
      
      if (!kingInCheck) {
          // Kingside castling
          if (castling.kingside && 
              board[row][col + 1] === null && 
              board[row][col + 2] === null &&
              !isSquareAttackedBy(board, row, col + 1, opponentColor) && 
              !isSquareAttackedBy(board, row, col + 2, opponentColor)) {
              moves.push({ row: row, col: col + 2 })
          }
          
          // Queenside castling
          if (castling.queenside && 
              board[row][col - 1] === null && 
              board[row][col - 2] === null && 
              board[row][col - 3] === null &&
              !isSquareAttackedBy(board, row, col - 1, opponentColor) && 
              !isSquareAttackedBy(board, row, col - 2, opponentColor)) {
              moves.push({ row: row, col: col - 2 })
          }
      }
  } else {
    const directions: { r: number, c: number }[] = []
    if (type === 'b' || type === 'q') directions.push({ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 })
    if (type === 'r' || type === 'q') directions.push({ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 })
    for (const dir of directions) {
      let r = row + dir.r, c = col + dir.c
      while (isInBounds(r, c)) {
        if (!board[r][c]) moves.push({ row: r, col: c })
        else { if (board[r][c]?.color !== color) moves.push({ row: r, col: c }); break }
        r += dir.r; c += dir.c
      }
    }
  }
  return moves
}

// Now define the actual functions, after getValidMovesForPiece is defined

const isSquareAttackedBy = (board: Board, row: number, col: number, attackerColor: PieceColor): boolean => {
  // Check for pawn attacks first (simple pattern)
  const pawnDirection = attackerColor === 'w' ? 1 : -1;
  for (const offset of [-1, 1]) {
    const checkRow = row + pawnDirection;
    const checkCol = col + offset;
    if (isInBounds(checkRow, checkCol) && 
        board[checkRow][checkCol]?.type === 'p' && 
        board[checkRow][checkCol]?.color === attackerColor) {
      return true;
    }
  }
  
  // Check for knight attacks (L-shape pattern)
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightMoves) {
    const checkRow = row + dr;
    const checkCol = col + dc;
    if (isInBounds(checkRow, checkCol) && 
        board[checkRow][checkCol]?.type === 'n' && 
        board[checkRow][checkCol]?.color === attackerColor) {
      return true;
    }
  }
  
  // Check for king attacks (adjacent squares)
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const checkRow = row + dr;
      const checkCol = col + dc;
      if (isInBounds(checkRow, checkCol) && 
          board[checkRow][checkCol]?.type === 'k' && 
          board[checkRow][checkCol]?.color === attackerColor) {
        return true;
      }
    }
  }
  
  // Check for sliding pieces (bishop, rook, queen)
  const directions = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    let checkRow = row + dr;
    let checkCol = col + dc;
    while (isInBounds(checkRow, checkCol)) {
      const piece = board[checkRow][checkCol];
      if (piece) {
        if (piece.color === attackerColor) {
          const isDiagonal = dr !== 0 && dc !== 0;
          const isOrthogonal = dr === 0 || dc === 0;
          
          if ((isDiagonal && (piece.type === 'b' || piece.type === 'q')) ||
              (isOrthogonal && (piece.type === 'r' || piece.type === 'q'))) {
            return true;
          }
        }
        break; // Stop checking in this direction if we hit any piece
      }
      checkRow += dr;
      checkCol += dc;
    }
  }
  
  return false;
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
    // Need to handle castling rook movement on test board for accurate check filtering?
    // For now, assuming basic move is sufficient for check test.
    return !isCheck(testBoard, color)
  })
}

// Placeholder for piece values - copy from frontend
const pieceValues: { [key in PieceType]?: number } = {
  'p': 1, 'n': 3, 'b': 3.25, 'r': 5, 'q': 9, 'k': 100 // Updated bishop value
}; 

// Define position bonuses here as they are constants
const positionBonuses = {
    'p': [
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        [0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1],
        [0.05, 0.05, 0.1, 0.25, 0.25, 0.1, 0.05, 0.05],
        [0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.0, 0.0],
        [0.05, -0.05, -0.1, 0.0, 0.0, -0.1, -0.05, 0.05],
        [0.05, 0.1, 0.1, -0.2, -0.2, 0.1, 0.1, 0.05],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
      ],
      'n': [
        [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
        [-0.4, -0.2, 0.0, 0.0, 0.0, 0.0, -0.2, -0.4],
        [-0.3, 0.0, 0.1, 0.15, 0.15, 0.1, 0.0, -0.3],
        [-0.3, 0.05, 0.15, 0.2, 0.2, 0.15, 0.05, -0.3],
        [-0.3, 0.0, 0.15, 0.2, 0.2, 0.15, 0.0, -0.3],
        [-0.3, 0.05, 0.1, 0.15, 0.15, 0.1, 0.05, -0.3],
        [-0.4, -0.2, 0.0, 0.05, 0.05, 0.0, -0.2, -0.4],
        [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5]
      ],
      'b': [
        [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2],
        [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
        [-0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, -0.1],
        [-0.1, 0.05, 0.1, 0.1, 0.1, 0.1, 0.05, -0.1],
        [-0.1, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, -0.1],
        [-0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, -0.1],
        [-0.1, 0.05, 0.0, 0.0, 0.0, 0.0, 0.05, -0.1],
        [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2]
      ],
      'r': [
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [0.05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
        [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
        [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
        [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
        [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
        [-0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.05],
        [0.0, 0.0, 0.0, 0.05, 0.05, 0.0, 0.0, 0.0]
      ],
      'q': [
        [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2],
        [-0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1],
        [-0.1, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.1],
        [-0.05, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.05],
        [0.0, 0.0, 0.05, 0.05, 0.05, 0.05, 0.0, -0.05],
        [-0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.0, -0.1],
        [-0.1, 0.0, 0.05, 0.0, 0.0, 0.0, 0.0, -0.1],
        [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2]
      ],
      'k': [
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.2, -0.3, -0.3, -0.4, -0.4, -0.3, -0.3, -0.2],
        [-0.1, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.1],
        [0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2],
        [0.2, 0.3, 0.1, 0.0, 0.0, 0.1, 0.3, 0.2]
      ],
      'k_endgame': [
        [-0.5, -0.4, -0.3, -0.2, -0.2, -0.3, -0.4, -0.5],
        [-0.4, -0.2, -0.1, 0.0, 0.0, -0.1, -0.2, -0.4],
        [-0.3, -0.1, 0.2, 0.3, 0.3, 0.2, -0.1, -0.3],
        [-0.2, 0.0, 0.3, 0.4, 0.4, 0.3, 0.0, -0.2],
        [-0.2, 0.0, 0.3, 0.4, 0.4, 0.3, 0.0, -0.2],
        [-0.3, -0.1, 0.2, 0.3, 0.3, 0.2, -0.1, -0.3],
        [-0.4, -0.2, -0.1, 0.0, 0.0, -0.1, -0.2, -0.4],
        [-0.5, -0.4, -0.3, -0.2, -0.2, -0.3, -0.4, -0.5]
      ]
}

// Placeholder for Magnus style patterns - copy from frontend
const magnusStylePatterns = {
    piecePreferences: { knight: 0.8, bishop: 0.7, centralControl: 0.9 },
    middleGamePreferences: { positional: 0.8 }, // Add other prefs if needed by eval
    // Add other style aspects if needed by evaluation logic
};

// Define Evaluation Helper Functions (Copied from page.tsx)
const countPieces = (currentBoard: Board) => {
    const pieces = {
      white: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, total: 0 },
      black: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, total: 0 },
      total: 0
    }
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c]
        if (piece) {
          const colorKey = piece.color === 'w' ? 'white' : 'black'
          pieces[colorKey][piece.type]++
          pieces[colorKey].total++
          pieces.total++
        }
      }
    }
    return pieces
}

const countDevelopedPieces = (currentBoard: Board, color: PieceColor): number => {
    let count = 0
    const homeRow = color === 'w' ? 7 : 0
    if (currentBoard[homeRow][1]?.type !== 'n' || currentBoard[homeRow][1]?.color !== color) count++
    if (currentBoard[homeRow][6]?.type !== 'n' || currentBoard[homeRow][6]?.color !== color) count++
    if (currentBoard[homeRow][2]?.type !== 'b' || currentBoard[homeRow][2]?.color !== color) count++
    if (currentBoard[homeRow][5]?.type !== 'b' || currentBoard[homeRow][5]?.color !== color) count++
    return count
}

const centerControlScore = (currentBoard: Board): number => {
    let score = 0
    const centralSquares = [{row: 3, col: 3}, {row: 3, col: 4}, {row: 4, col: 3}, {row: 4, col: 4}]
    const extendedCenter = [
      {row: 2, col: 2}, {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5},
      {row: 3, col: 2}, {row: 3, col: 5}, {row: 4, col: 2}, {row: 4, col: 5},
      {row: 5, col: 2}, {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}
    ]
    for (const square of centralSquares) {
      const piece = currentBoard[square.row][square.col]
      if (piece) score += piece.color === 'w' ? 0.5 : -0.5
      if (isSquareAttackedBy(currentBoard, square.row, square.col, 'w')) score += 0.3
      if (isSquareAttackedBy(currentBoard, square.row, square.col, 'b')) score -= 0.3
    }
    for (const square of extendedCenter) {
      const piece = currentBoard[square.row][square.col]
      if (piece) score += piece.color === 'w' ? 0.2 : -0.2
    }
    return score
}

const kingSafetyScore = (currentBoard: Board, color: PieceColor): number => {
    const kingPos = findKing(currentBoard, color)
    if (!kingPos) return 0
    let score = 0
    const direction = color === 'w' ? -1 : 1
    for (let c = Math.max(0, kingPos.col - 1); c <= Math.min(7, kingPos.col + 1); c++) {
      if (isInBounds(kingPos.row + direction, c) && currentBoard[kingPos.row + direction][c]?.type === 'p' && currentBoard[kingPos.row + direction][c]?.color === color) {
        score += 0.3 // Pawn shield
      }
    }
    // Simplified castling check for safety bonus (doesn't check rights)
    if ((color === 'w' && ((kingPos.row === 7 && kingPos.col === 6) || (kingPos.row === 7 && kingPos.col === 2))) ||
        (color === 'b' && ((kingPos.row === 0 && kingPos.col === 6) || (kingPos.row === 0 && kingPos.col === 2)))) {
      score += 0.5 // Castled bonus
    }
    const enemyColor = color === 'w' ? 'b' : 'w'
    for (let r = Math.max(0, kingPos.row - 2); r <= Math.min(7, kingPos.row + 2); r++) {
      for (let c = Math.max(0, kingPos.col - 2); c <= Math.min(7, kingPos.col + 2); c++) {
        if (currentBoard[r][c]?.color === enemyColor) {
          const distance = Math.max(Math.abs(r - kingPos.row), Math.abs(c - kingPos.col))
          score -= (3 - distance) * 0.2 // Penalty
        }
      }
    }
    return score
}

const mobilityScore = (currentBoard: Board, color: PieceColor): number => {
    let mobility = 0
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c]?.color === color) {
           // Pass dummy rights as mobility doesn't involve castling generation directly
           mobility += getValidMovesForPiece(currentBoard, r, c, { w: { kingside: false, queenside: false }, b: { kingside: false, queenside: false } }, null).length
        }
      }
    }
    return mobility * 0.01
}

const pawnStructureScore = (currentBoard: Board): number => {
    let score = 0
    const pawnPositions = { w: [] as {r: number, c: number}[], b: [] as {r: number, c: number}[] }
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c]?.type === 'p') {
          pawnPositions[currentBoard[r][c]!.color].push({r, c})
        }
      }
    }
    for (const color of ['w', 'b'] as PieceColor[]) {
      const positions = pawnPositions[color]
      let colorScore = 0
      for (const p of positions) {
        let doubled = false, isolated = true, supported = false
        for (const other of positions) {
          if (p.c === other.c && p.r !== other.r) doubled = true
          if (Math.abs(p.c - other.c) === 1) isolated = false
          if ((color === 'w' && p.r + 1 === other.r && Math.abs(p.c - other.c) === 1) || 
              (color === 'b' && p.r - 1 === other.r && Math.abs(p.c - other.c) === 1)) supported = true
        }
        if (doubled) colorScore -= 0.3
        if (isolated) colorScore -= 0.2
        if (supported) colorScore += 0.2
      }
      score += color === 'w' ? colorScore : -colorScore
    }
    return score
}

const kingCentralizationScore = (currentBoard: Board, color: PieceColor): number => {
    const kingPos = findKing(currentBoard, color)
    if (!kingPos) return 0
    const row = color === 'w' ? kingPos.row : 7 - kingPos.row
    const col = color === 'w' ? kingPos.col : 7 - kingPos.col
    return positionBonuses['k_endgame'][row][col]
}

const isPassedPawn = (currentBoard: Board, row: number, col: number, color: PieceColor): boolean => {
    const direction = color === 'w' ? -1 : 1
    const enemyColor = color === 'w' ? 'b' : 'w'
    for (let checkRow = row + direction; isInBounds(checkRow, col); checkRow += direction) {
      if (currentBoard[checkRow][col]?.color === enemyColor && currentBoard[checkRow][col]?.type === 'p') return false
      if (col > 0 && currentBoard[checkRow][col - 1]?.color === enemyColor && currentBoard[checkRow][col - 1]?.type === 'p') return false
      if (col < 7 && currentBoard[checkRow][col + 1]?.color === enemyColor && currentBoard[checkRow][col + 1]?.type === 'p') return false
    }
    return true
}

const passedPawnScore = (currentBoard: Board): number => {
    let score = 0
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c]
        if (piece?.type === 'p') {
          if (isPassedPawn(currentBoard, r, c, piece.color)) {
            const rankBonus = piece.color === 'w' ? (6 - r) : (r - 1)
            score += piece.color === 'w' ? (0.5 + rankBonus * 0.2) : -(0.5 + rankBonus * 0.2)
          }
        }
      }
    }
    return score
}

// --- Main Evaluation Function ---
const evaluateBoardUtil = (currentBoard: Board, gamePhase: string, aiPersonality: any): number => {
  let score = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  // Material value & Bishop Count
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = currentBoard[r][c];
      if (piece) {
        let pieceValue = pieceValues[piece.type] ?? 0;
        let row = piece.color === 'w' ? r : 7 - r;
        let col = piece.color === 'w' ? c : 7 - c;
        // @ts-ignore - Assuming positionBonuses structure matches keys
        const posTable = piece.type === 'k' && gamePhase === 'endgame' ? positionBonuses['k_endgame'] : positionBonuses[piece.type];
        if (posTable && posTable[row] && typeof posTable[row][col] === 'number') {
             pieceValue += posTable[row][col];
        }
        score += piece.color === 'w' ? pieceValue : -pieceValue;

        // Count bishops for bishop pair bonus
        if (piece.type === 'b') {
            if (piece.color === 'w') whiteBishops++;
            else blackBishops++;
        }
      }
    }
  }

  // Bishop Pair Bonus
  if (whiteBishops >= 2) score += 0.3;
  if (blackBishops >= 2) score -= 0.3;

  // Rook on Open/Semi-Open File Bonus
  for (let c = 0; c < 8; c++) { // Iterate through files
    let whitePawnsOnFile = 0;
    let blackPawnsOnFile = 0;
    let whiteRookOnFile = false;
    let blackRookOnFile = false;

    for (let r = 0; r < 8; r++) {
        const piece = currentBoard[r][c];
        if (piece?.type === 'p') {
            if (piece.color === 'w') whitePawnsOnFile++;
            else blackPawnsOnFile++;
        }
        if (piece?.type === 'r') {
            if (piece.color === 'w') whiteRookOnFile = true;
            else blackRookOnFile = true;
        }
    }

    if (whiteRookOnFile) {
        if (whitePawnsOnFile === 0) score += 0.3; // Open file
        if (whitePawnsOnFile === 0 && blackPawnsOnFile === 0) score += 0.15; // Fully open adds a bit more
        else if (whitePawnsOnFile === 0 && blackPawnsOnFile > 0) score += 0.15; // Semi-open file
    }
     if (blackRookOnFile) {
        if (blackPawnsOnFile === 0) score -= 0.3; // Open file
         if (whitePawnsOnFile === 0 && blackPawnsOnFile === 0) score -= 0.15; // Fully open adds a bit more
        else if (blackPawnsOnFile === 0 && whitePawnsOnFile > 0) score -= 0.15; // Semi-open file
    }
  }

  // Phase bonuses
  if (gamePhase === 'opening') {
    score += countDevelopedPieces(currentBoard, 'w') * 0.2
    score -= countDevelopedPieces(currentBoard, 'b') * 0.2
    score += centerControlScore(currentBoard)
  } else if (gamePhase === 'middlegame') {
    score += kingSafetyScore(currentBoard, 'w') * (1 + 0.1 * (aiPersonality?.defensiveness ?? 0.5))
    score -= kingSafetyScore(currentBoard, 'b') * (1 + 0.1 * (aiPersonality?.defensiveness ?? 0.5))
    score += mobilityScore(currentBoard, 'w') * (aiPersonality?.mobility ?? 0.7)
    score -= mobilityScore(currentBoard, 'b') * (aiPersonality?.mobility ?? 0.7)
    score += pawnStructureScore(currentBoard)
    // Add other middlegame specific bonuses here (e.g., knight outposts)
  } else if (gamePhase === 'endgame') {
    score += kingCentralizationScore(currentBoard, 'w')
    score -= kingCentralizationScore(currentBoard, 'b')
    score += passedPawnScore(currentBoard)
    // Add other endgame specific bonuses here
  }
  return parseFloat(score.toFixed(2))
}

// Simple Opening Book (Move sequence -> Next move in algebraic notation)
// Limited depth for demonstration
const openingBook: { [key: string]: string } = {
    "": "e4", // Start of game, White plays e4
    "e4": "c5", // Black responds with Sicilian
    "e4 c5": "Nf3", // White plays Nf3
    "e4 c5 Nf3": "d6", // Black plays d6
    "e4 c5 Nf3 d6": "d4", // White plays d4 (Open Sicilian)
    "e4 c5 Nf3 d6 d4": "cxd4",
    "e4 c5 Nf3 d6 d4 cxd4": "Nxd4",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4": "Nf6",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6": "Nc3",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3": "a6", // Najdorf variation
    
    "d4": "Nf6", // Indian Game
    "d4 Nf6": "c4",
    "d4 Nf6 c4": "g6", // King's Indian setup
    "d4 Nf6 c4 g6": "Nc3",
    "d4 Nf6 c4 g6 Nc3": "Bg7",
    "d4 Nf6 c4 g6 Nc3 Bg7": "e4",
    "d4 Nf6 c4 g6 Nc3 Bg7 e4": "d6",
    "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6": "Nf3",
    "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3": "O-O",
    
    // Add a few more simple lines...
    "e4 e5": "Nf3",
    "e4 e5 Nf3": "Nc6",
    "e4 e5 Nf3 Nc6": "Bb5", // Ruy Lopez
    
    "c4": "e5", // English Opening response
};

// Helper to convert algebraic notation (e.g., "Nf3", "e4", "O-O") to Move object
// This needs the current board state to resolve ambiguity (e.g., which Knight moved)
const algebraicToMove = (board: Board, notation: string, turn: PieceColor): Move | null => {
    // Basic parser - handles simple moves like "e4", "Nf3", "Bb5", "O-O", "O-O-O"
    // Does NOT handle captures (like "Nxd4"), checks ("+"), checkmates ("#"), or pawn promotions with piece specification ("e8=Q") yet.
    
    // Castling
    if (notation === "O-O") {
        const row = turn === 'w' ? 7 : 0;
        return { from: { row: row, col: 4 }, to: { row: row, col: 6 } };
    }
    if (notation === "O-O-O") {
        const row = turn === 'w' ? 7 : 0;
        return { from: { row: row, col: 4 }, to: { row: row, col: 2 } };
    }

    const pieceMap: { [key: string]: PieceType } = { 'N': 'n', 'B': 'b', 'R': 'r', 'Q': 'q', 'K': 'k' };
    let pieceType: PieceType = 'p'; // Default to pawn
    let targetNotation = notation;

    // Identify piece type if specified
    if (notation.length > 0 && pieceMap[notation[0]]) {
        pieceType = pieceMap[notation[0]];
        targetNotation = notation.substring(1);
    }

    // Extract target square (last 2 chars)
    if (targetNotation.length < 2) return null; 
    const targetFile = targetNotation[targetNotation.length - 2];
    const targetRank = parseInt(targetNotation[targetNotation.length - 1], 10);
    
    if (isNaN(targetRank) || targetFile < 'a' || targetFile > 'h' || targetRank < 1 || targetRank > 8) return null;

    const toCol = targetFile.charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = 8 - targetRank;

    // Find the piece that can move to the target square
    // This requires iterating through the board and checking valid moves
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === turn && piece.type === pieceType) {
                // Check if this piece can move to the target square
                // Need getValidMovesForPiece here - requires passing castling rights!
                // For simplicity in this helper, we assume the move is valid from the book
                // A full implementation would get valid moves and match the destination.
                // Let's find *a* piece that *could* make the move based on type/color
                // A better approach involves full move generation + filtering
                
                // Simplified check: Assume if a piece of the right type/color exists, it *could* be the one.
                // This is highly ambiguous for Knights, Rooks, Queens. Needs improvement for general use.
                
                // Crude filter: Check basic moves for the piece type
                const potentialMoves = getValidMovesForPiece(board, r, c, { w: { kingside: true, queenside: true }, b: { kingside: true, queenside: true } }, null); // Use dummy rights
                if (potentialMoves.some(m => m.row === toRow && m.col === toCol)) {
                    return { from: { row: r, col: c }, to: { row: toRow, col: toCol } };
                }
            }
        }
    }
    
    console.warn(`Could not find origin square for move: ${notation}`);
    return null; // Could not find a valid origin square
};

// Select Best Move Logic (Adapted from frontend)
const selectBestMoveBackend = (currentBoard: Board, color: PieceColor, gamePhase: string, aiPersonality: any, currentCastlingRights: CastlingRights, moveHistoryString: string, enPassantTarget: { row: number, col: number } | null): Move | null => {
    
    // 1. Check Opening Book
    if (moveHistoryString in openingBook) {
        const bookMoveNotation = openingBook[moveHistoryString];
        console.log(`AI found book move: ${bookMoveNotation} for history: ${moveHistoryString}`);
        const bookMove = algebraicToMove(currentBoard, bookMoveNotation, color);
        if (bookMove) {
            // Optional: Validate if book move is actually legal in current position?
            const legalMoves = getFilteredLegalMoves(currentBoard, color, currentCastlingRights, enPassantTarget);
            if (legalMoves.some(m => m.from.row === bookMove.from.row && m.from.col === bookMove.from.col && m.to.row === bookMove.to.row && m.to.col === bookMove.to.col)) {
                 console.log(`AI playing book move: ${bookMoveNotation}`);
                 return bookMove;
            } else {
                console.warn(`Book move ${bookMoveNotation} is illegal in current position! Falling back to calculation.`);
            }
        }
    }
    
    // 2. If not in book or book move illegal, proceed with calculation
    console.log("AI calculating move (not in book)...");
    const legalMoves = getFilteredLegalMoves(currentBoard, color, currentCastlingRights, enPassantTarget)
    if (legalMoves.length === 0) return null

    let chosenMove: Move = legalMoves[0] // Default

    // Check if we're using a high AI level (grandmaster)
    const isGrandmasterLevel = aiPersonality.positionality >= 0.95;

    // Perform deeper evaluation for grandmaster level
    // This simulates multi-ply thinking
    const evaluatedMoves = legalMoves.map(move => {
        const testBoard = JSON.parse(JSON.stringify(currentBoard))
        const piece = testBoard[move.from.row][move.from.col]
        if (!piece) return { move, score: color === 'w' ? -Infinity : Infinity }
        
        const promotionRank = piece.color === 'w' ? 0 : 7
        if (piece.type === 'p' && move.to.row === promotionRank) {
            testBoard[move.to.row][move.to.col] = { type: 'q', color: piece.color }
        } else {
            testBoard[move.to.row][move.to.col] = piece
        }
        testBoard[move.from.row][move.from.col] = null
        
        // Handle EP capture removal on test board before evaluation
        if (piece.type === 'p' && enPassantTarget && move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
            testBoard[move.from.row][enPassantTarget.col] = null;
        }
        
        // At Grandmaster level, add a simple 1-ply lookahead for deeper evaluation
        let score;
        if (isGrandmasterLevel) {
            // First evaluate this position
            const initialScore = evaluateBoardUtil(testBoard, gamePhase, aiPersonality);
            
            // Then look ahead at opponent's best response
            const opponentColor = color === 'w' ? 'b' : 'w';
            const opponentMoves = getFilteredLegalMoves(testBoard, opponentColor, currentCastlingRights, null);
            
            if (opponentMoves.length > 0) {
                // Find opponent's best move
                let bestOpponentScore = color === 'w' ? Infinity : -Infinity;
                
                for (const opMove of opponentMoves) {
                    const opTestBoard = JSON.parse(JSON.stringify(testBoard));
                    const opPiece = opTestBoard[opMove.from.row][opMove.from.col];
                    if (!opPiece) continue;
                    
                    // Apply opponent move
                    opTestBoard[opMove.to.row][opMove.to.col] = opPiece;
                    opTestBoard[opMove.from.row][opMove.from.col] = null;
                    
                    // Evaluate position after opponent's move
                    const opScore = evaluateBoardUtil(opTestBoard, gamePhase, aiPersonality);
                    
                    // Update best opponent score
                    if (color === 'w') {
                        bestOpponentScore = Math.min(bestOpponentScore, opScore);
                    } else {
                        bestOpponentScore = Math.max(bestOpponentScore, opScore);
                    }
                }
                
                // Final score is current position evaluation minus opponent's best response
                // This encourages moves that lead to positions where opponent's best move is still bad
                score = initialScore * 0.7 + bestOpponentScore * 0.3;
            } else {
                // If opponent has no moves, this is checkmate or stalemate
                score = opponentMoves.length === 0 && isCheck(testBoard, opponentColor) ? 
                    (color === 'w' ? 100 : -100) : // Checkmate
                    0; // Stalemate
            }
        } else {
            // Normal evaluation for non-grandmaster levels
            score = evaluateBoardUtil(testBoard, gamePhase, aiPersonality);
        }
        
        return { move, score }
    })

    evaluatedMoves.sort((a, b) => color === 'w' ? b.score - a.score : a.score - b.score)

    chosenMove = evaluatedMoves[0].move
    let bestScore = evaluatedMoves[0].score

    // For Grandmaster level, much less randomness in move selection
    if (isGrandmasterLevel) {
        // Almost always pick the best move
        if (Math.random() < 0.95) {
            return chosenMove;
        }
        
        // Occasionally pick from top 2 moves for some minimal variety
        const topMoves = evaluatedMoves.slice(0, Math.min(2, evaluatedMoves.length));
        chosenMove = topMoves[Math.floor(Math.random() * topMoves.length)].move;
        return chosenMove;
    }

    // Standard style adjustment for non-Grandmaster levels
    const potentialMoves = evaluatedMoves.slice(0, Math.min(5, evaluatedMoves.length)) // Consider top 5 moves
    const scoreThreshold = 0.6 // Slightly wider threshold to allow for style
    let bestStyleMove: Move | null = null;
    let maxStylePoints = -1;

    for (const { move, score } of potentialMoves) {
        const piece = currentBoard[move.from.row][move.from.col]
        if (!piece) continue
        const scoreDifference = Math.abs(score - bestScore)
        
        // Only consider moves within the score threshold
        if (scoreDifference <= scoreThreshold) {
            let stylePoints = 0;
            
            // Knight preference (consistent Magnus trait)
            if (piece.type === 'n') stylePoints += magnusStylePatterns.piecePreferences.knight * 0.1;
            // Bishop preference (consistent Magnus trait)
            if (piece.type === 'b') stylePoints += magnusStylePatterns.piecePreferences.bishop * 0.1;
            
            // Central Control (more important in opening/middlegame)
            if (gamePhase !== 'endgame' && (move.to.row === 3 || move.to.row === 4) && (move.to.col === 3 || move.to.col === 4)) {
                stylePoints += magnusStylePatterns.piecePreferences.centralControl * (gamePhase === 'middlegame' ? 0.3 : 0.2);
            }
            
            // Track the move with the highest style points within the threshold
            if (stylePoints > maxStylePoints) {
                maxStylePoints = stylePoints;
                bestStyleMove = move;
            }
        }
    }
    
    // Use the stylistically preferred move if found and style points are significant
    if (bestStyleMove && maxStylePoints > 0.15) { // Threshold to activate style override
        chosenMove = bestStyleMove;
        // Find the score associated with this move for logging (optional)
        const chosenEval = evaluatedMoves.find(em => em.move === chosenMove);
        bestScore = chosenEval ? chosenEval.score : bestScore; // Update score for logging
        console.log(`AI chose style move: ${JSON.stringify(chosenMove)} with score ${bestScore.toFixed(2)}, Style Points: ${maxStylePoints.toFixed(2)}`);
    } else {
        console.log(`AI chose best evaluated move: ${JSON.stringify(chosenMove)} with score ${bestScore.toFixed(2)}`);
    }

    return chosenMove
}

// --- API Route Handler ---

export async function POST(request: Request) {
  try {
    // Parse request body
    const requestData: MoveRequest = await request.json()
    
    const { 
      board, 
      turn, 
      gamePhase, 
      aiPersonality, 
      castlingRights, 
      aiLevel, 
      moveHistory, 
      enPassantTargetSquare 
    } = requestData
    
    // Validate request data
    if (!board || !turn || !gamePhase || !castlingRights || aiLevel === undefined) {
      return NextResponse.json({ error: 'Missing required game state parameters' }, { status: 400 })
    }

    // For Grandmaster level, use enhanced evaluation
    const isGrandmasterLevel = aiLevel >= 10;

    // Get active model from Supabase
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (modelError || !modelData) {
      console.error('Error fetching model:', modelError)
      // Instead of falling back to heuristic, return an error
      return NextResponse.json({ error: 'Model data not found' }, { status: 500 })
    }
    
    // Look for book moves first (for common openings)
    if (moveHistory.length < 10) { // Only use opening book in first 10 moves
      const moveHistoryString = moveHistory.map(m => m.notation).join(' ')
      
      const { data: openingData, error: openingError } = await supabase
        .from('chess_openings')
        .select('next_moves')
        .eq('fen', generateFEN(board, turn, castlingRights, enPassantTargetSquare))
        .maybeSingle()
      
      if (!openingError && openingData?.next_moves) {
        // Get book moves with their evaluations
        const bookMoves = openingData.next_moves
        
        // Select a book move based on AI level
        // Higher levels choose better moves more often
        const moveList = Object.entries(bookMoves)
        if (moveList.length > 0) {
          // Sort moves by evaluation (descending)
          moveList.sort((a, b) => (b[1] as number) - (a[1] as number))
          
          // Choose move based on AI level
          // Level 10 always chooses best move, lower levels may choose suboptimal moves
          const moveIndex = isGrandmasterLevel ? 0 : Math.min(
            Math.floor(Math.random() * (11 - aiLevel) * moveList.length / 10),
            moveList.length - 1
          )
          
          const bookMoveNotation = moveList[moveIndex][0]
          const bookMove = notationToMove(bookMoveNotation, board)
          
          if (bookMove) {
            console.log(`Using book move: ${bookMoveNotation}`)
            return NextResponse.json({ 
              move: bookMove, 
              source: 'opening_book' 
            }, { status: 200 })
          }
        }
      }
    }
    
    // If no book move is available, use the neural network model for move selection
    // This requires model_url to be stored in the model metadata
    if (!modelData.model_url) {
      console.error('Model URL not found in model metadata')
      return NextResponse.json({ error: 'Model URL not available' }, { status: 500 })
    }
    
    try {
      // Get the downloadable URL for the model
      const { data: modelFileData } = await supabase
        .storage
        .from('chess-models')
        .getPublicUrl(modelData.model_url)
      
      if (!modelFileData) {
        console.error('Failed to get model download URL')
        return NextResponse.json({ error: 'Model file not accessible' }, { status: 500 })
      }
      
      // Get legal moves
      const legalMoves = getFilteredLegalMoves(board, turn, castlingRights, enPassantTargetSquare)
      
      if (legalMoves.length === 0) {
        return NextResponse.json({ 
          move: null, 
          status: isCheck(board, turn) ? 'checkmate' : 'stalemate' 
        }, { status: 200 })
      }
      
      // For Grandmaster level, enhance the AI personality to make stronger moves
      let enhancedPersonality = { ...aiPersonality };
      if (isGrandmasterLevel) {
        // At Grandmaster level, optimize the AI personality for strong play
        enhancedPersonality = {
          ...aiPersonality,
          // Increase key attributes that make play stronger
          aggressiveness: Math.max(0.8, aiPersonality.aggressiveness || 0.7),
          defensiveness: Math.max(0.85, aiPersonality.defensiveness || 0.6),
          mobility: Math.max(0.9, aiPersonality.mobility || 0.8),
          positionality: Math.max(0.95, aiPersonality.positionality || 0.9),
          riskTaking: 0.4, // Lower risk taking for more solid play
          opening: 'mainline'
        };
        
        // For endgame, adjust to emphasize technical conversion skills
        if (gamePhase === 'endgame') {
          enhancedPersonality.aggressiveness = Math.min(1.0, enhancedPersonality.aggressiveness + 0.1);
          enhancedPersonality.positionality = Math.min(1.0, enhancedPersonality.positionality + 0.05);
          enhancedPersonality.mobility = Math.min(1.0, enhancedPersonality.mobility + 0.05);
        }
      }
      
      // Use the neural network move selector
      const moveHistoryString = moveHistory.map(m => m.notation).join(' ')
      const selectedMove = selectBestMoveBackend(
        board, 
        turn, 
        gamePhase, 
        isGrandmasterLevel ? enhancedPersonality : aiPersonality, 
        castlingRights, 
        moveHistoryString, 
        enPassantTargetSquare
      )
      
      // Add a simulated thinking time based on AI level and game phase
      // Higher level AI "thinks" longer
      const baseThinkingTime = 500 // ms
      const thinkingFactor = Math.min(1, aiLevel / 7)  // Cap at level 7
      const thinkingTime = baseThinkingTime * thinkingFactor
      
      await new Promise(resolve => setTimeout(resolve, thinkingTime))
      
      if (selectedMove) {
        // Add AI level adjustment - at lower levels, occasionally make suboptimal moves
        // At Grandmaster level (10), NEVER make suboptimal moves
        if (!isGrandmasterLevel && Math.random() > aiLevel / 10) {
          const randomMoveIndex = Math.floor(Math.random() * legalMoves.length)
          return NextResponse.json({ 
            move: legalMoves[randomMoveIndex], 
            source: 'neural_network_adjusted' 
          }, { status: 200 })
        }
        
        return NextResponse.json({ 
          move: selectedMove, 
          source: 'neural_network' 
        }, { status: 200 })
      } else {
        // If no move was selected, return a random legal move
        const randomIndex = Math.floor(Math.random() * legalMoves.length)
        return NextResponse.json({ 
          move: legalMoves[randomIndex], 
          source: 'random_fallback' 
        }, { status: 200 })
      }
    } catch (modelError) {
      console.error('Error using neural network model:', modelError)
      // Instead of falling back to heuristic, return the error
      return NextResponse.json({ error: 'Neural network error', details: String(modelError) }, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing chess AI move:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Function to convert algebraic notation to Move object
function notationToMove(notation: string, board: Board): Move | null {
  // Simple implementation for common notation formats like "e2e4"
  if (notation.length !== 4) return null
  
  const fromFile = notation.charCodeAt(0) - 'a'.charCodeAt(0)
  const fromRank = 8 - parseInt(notation[1], 10)
  const toFile = notation.charCodeAt(2) - 'a'.charCodeAt(0)
  const toRank = 8 - parseInt(notation[3], 10)
  
  if (
    fromFile < 0 || fromFile > 7 || 
    fromRank < 0 || fromRank > 7 || 
    toFile < 0 || toFile > 7 || 
    toRank < 0 || toRank > 7
  ) {
    return null
  }
  
  return {
    from: { row: fromRank, col: fromFile },
    to: { row: toRank, col: toFile }
  }
}

// Function to generate FEN string for position
function generateFEN(
  board: Board, 
  turn: PieceColor, 
  castlingRights: CastlingRights, 
  enPassantTarget: { row: number, col: number } | null
): string {
  // Simplified FEN generator (incomplete implementation)
  let fen = ''
  
  // Board position
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount
          emptyCount = 0
        }
        let pieceChar: PieceType = piece.type
        if (piece.color === 'w') {
          pieceChar = pieceChar.toUpperCase() as PieceType  
        }
        fen += pieceChar
      } else {
        emptyCount++
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount
    }
    if (r < 7) fen += '/'
  }
  
  // Active color
  fen += ' ' + turn
  
  // Castling availability
  let castlingStr = ''
  if (castlingRights.w.kingside) castlingStr += 'K'
  if (castlingRights.w.queenside) castlingStr += 'Q'
  if (castlingRights.b.kingside) castlingStr += 'k'
  if (castlingRights.b.queenside) castlingStr += 'q'
  fen += ' ' + (castlingStr || '-')
  
  // En passant target square
  if (enPassantTarget) {
    const file = String.fromCharCode('a'.charCodeAt(0) + enPassantTarget.col)
    const rank = 8 - enPassantTarget.row
    fen += ' ' + file + rank
  } else {
    fen += ' -'
  }
  
  // Halfmove clock and fullmove number (simplified)
  fen += ' 0 1'
  
  return fen
}

// Fallback function with simple heuristic evaluation if model loading fails
function getHeuristicMove(
  board: Board, 
  turn: PieceColor, 
  gamePhase: string, 
  aiPersonality: any, 
  castlingRights: CastlingRights, 
  aiLevel: number, 
  moveHistory: { notation: string }[], 
  enPassantTarget: { row: number, col: number } | null
): NextResponse {
  // Generate simple moves based on piece values and positions
  const pieceValues: { [key in PieceType]: number } = {
    'p': 1, 'n': 3, 'b': 3.25, 'r': 5, 'q': 9, 'k': 100
  }
  
  // Generate all legal moves for the current position
  const legalMoves = generateLegalMoves(board, turn, castlingRights, enPassantTarget)
  
  if (legalMoves.length === 0) {
    // Game is over (checkmate or stalemate)
    return NextResponse.json({ 
      move: null, 
      status: isInCheck(board, turn) ? 'checkmate' : 'stalemate' 
    }, { status: 200 })
  }
  
  // Evaluate moves
  const evaluatedMoves = legalMoves.map(move => {
    const newBoard = applyMove(board, move, enPassantTarget)
    const score = evaluatePosition(newBoard, turn, gamePhase)
    return { move, score }
  })
  
  // Sort moves by evaluation (best to worst for current player)
  evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score)
  
  // Select move based on AI level
  // Higher levels choose better moves more often
  const moveIndex = aiLevel >= 10 ? 0 : Math.min(
    Math.floor(Math.random() * (11 - aiLevel) * evaluatedMoves.length / 10),
    evaluatedMoves.length - 1
  )
  
  const selectedMove = evaluatedMoves[moveIndex].move
  
  return NextResponse.json({ 
    move: selectedMove, 
    evaluation: evaluatedMoves[moveIndex].score,
    source: 'heuristic'
  }, { status: 200 })
}

// Helper function to apply a move to the board (returns new board)
function applyMove(
  board: Board, 
  move: Move, 
  enPassantTarget: { row: number, col: number } | null
): Board {
  const newBoard: Board = JSON.parse(JSON.stringify(board))
  const piece = newBoard[move.from.row][move.from.col]
  
  // Move the piece
  newBoard[move.to.row][move.to.col] = piece
  newBoard[move.from.row][move.from.col] = null
  
  // Handle en passant capture
  if (
    piece?.type === 'p' && 
    enPassantTarget && 
    move.to.row === enPassantTarget.row && 
    move.to.col === enPassantTarget.col
  ) {
    // Remove the captured pawn
    newBoard[move.from.row][enPassantTarget.col] = null
  }
  
  // Handle pawn promotion
  if (piece?.type === 'p' && (move.to.row === 0 || move.to.row === 7)) {
    // Default to queen promotion
    newBoard[move.to.row][move.to.col] = { 
      type: move.promotion || 'q', 
      color: piece.color 
    }
  }
  
  // Handle castling (simplified)
  if (piece?.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
    const row = move.from.row
    const isKingside = move.to.col === 6
    
    // Move the rook
    if (isKingside) {
      newBoard[row][5] = newBoard[row][7] // Move rook to f1/f8
      newBoard[row][7] = null
    } else {
      newBoard[row][3] = newBoard[row][0] // Move rook to d1/d8
      newBoard[row][0] = null
    }
  }
  
  return newBoard
}

// Check if the king is in check
function isInCheck(board: Board, color: PieceColor): boolean {
  // Find the king
  let kingRow = -1, kingCol = -1
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece?.type === 'k' && piece.color === color) {
        kingRow = r
        kingCol = c
        break
      }
    }
    if (kingRow >= 0) break
  }
  
  if (kingRow < 0) return false // No king found
  
  // Check if any opponent's piece can attack the king
  const opponentColor = color === 'w' ? 'b' : 'w'
  
  // Check pawns (simplified)
  const pawnDirections = color === 'w' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
  for (const [dr, dc] of pawnDirections) {
    const r = kingRow + dr
    const c = kingCol + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c]
      if (piece?.type === 'p' && piece.color === opponentColor) {
        return true
      }
    }
  }
  
  // Check knights
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ]
  for (const [dr, dc] of knightMoves) {
    const r = kingRow + dr
    const c = kingCol + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c]
      if (piece?.type === 'n' && piece.color === opponentColor) {
        return true
      }
    }
  }
  
  // Check bishops, rooks, queens
  const directions = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1]
  ]
  for (const [dr, dc] of directions) {
    let r = kingRow + dr
    let c = kingCol + dc
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c]
      if (piece) {
        if (piece.color === opponentColor) {
          if (
            (Math.abs(dr) === 1 && Math.abs(dc) === 1 && (piece.type === 'b' || piece.type === 'q')) || // Bishop/Queen on diagonal
            (((dr === 0 || dc === 0) && (piece.type === 'r' || piece.type === 'q'))) || // Rook/Queen on rank/file
            (Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && piece.type === 'k' && r === kingRow + dr && c === kingCol + dc) // Adjacent king
          ) {
            return true
          }
        }
        break // Blocked by piece
      }
      r += dr
      c += dc
    }
  }
  
  return false
}

// Simple position evaluation function
function evaluatePosition(board: Board, perspective: PieceColor, gamePhase: string): number {
  let score = 0
  const pieceValues: { [key in PieceType]: number } = {
    'p': 1, 'n': 3, 'b': 3.25, 'r': 5, 'q': 9, 'k': 100
  }
  
  // Central squares are more valuable
  const centerBonus = [
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    [0.00, 0.05, 0.10, 0.10, 0.10, 0.10, 0.05, 0.00],
    [0.00, 0.10, 0.20, 0.20, 0.20, 0.20, 0.10, 0.00],
    [0.00, 0.10, 0.20, 0.30, 0.30, 0.20, 0.10, 0.00],
    [0.00, 0.10, 0.20, 0.30, 0.30, 0.20, 0.10, 0.00],
    [0.00, 0.10, 0.20, 0.20, 0.20, 0.20, 0.10, 0.00],
    [0.00, 0.05, 0.10, 0.10, 0.10, 0.10, 0.05, 0.00],
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00]
  ]
  
  // Simple evaluation - material + position
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        // Material score
        const value = pieceValues[piece.type] || 0
        const sign = piece.color === 'w' ? 1 : -1
        
        score += value * sign
        
        // Position bonus
        if (gamePhase !== 'endgame') {
          score += centerBonus[r][c] * sign * 0.5
        }
        
        // Pawn advancement bonus in endgame
        if (piece.type === 'p' && gamePhase === 'endgame') {
          const advancementBonus = piece.color === 'w' ? (6 - r) * 0.05 : (r - 1) * 0.05
          score += advancementBonus * sign
        }
      }
    }
  }
  
  // Mobility score (simplified)
  const whiteMoves = generateLegalMoves(board, 'w', { 
    w: { kingside: true, queenside: true }, 
    b: { kingside: true, queenside: true } 
  }, null).length
  
  const blackMoves = generateLegalMoves(board, 'b', { 
    w: { kingside: true, queenside: true }, 
    b: { kingside: true, queenside: true } 
  }, null).length
  
  score += (whiteMoves - blackMoves) * 0.01
  
  // Return the score from white's perspective
  return perspective === 'w' ? score : -score
}

// Generate legal moves (simplified implementation)
function generateLegalMoves(
  board: Board, 
  turn: PieceColor, 
  castlingRights: CastlingRights, 
  enPassantTarget: { row: number, col: number } | null
): Move[] {
  const moves: Move[] = []
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== turn) continue
      
      // Generate moves based on piece type
      if (piece.type === 'p') {
        generatePawnMoves(board, r, c, turn, moves, enPassantTarget)
      } else if (piece.type === 'n') {
        generateKnightMoves(board, r, c, turn, moves)
      } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
        generateSlidingMoves(board, r, c, turn, piece.type, moves)
      } else if (piece.type === 'k') {
        generateKingMoves(board, r, c, turn, moves, castlingRights)
      }
    }
  }
  
  // Filter out moves that leave the king in check
  return moves.filter(move => {
    const newBoard = applyMove(board, move, enPassantTarget)
    return !isInCheck(newBoard, turn)
  })
}

// Generate pawn moves
function generatePawnMoves(
  board: Board, 
  row: number, 
  col: number, 
  color: PieceColor, 
  moves: Move[], 
  enPassantTarget: { row: number, col: number } | null
): void {
  const direction = color === 'w' ? -1 : 1
  const startingRow = color === 'w' ? 6 : 1
  const promotionRow = color === 'w' ? 0 : 7
  
  // Forward move
  if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
    if (row + direction === promotionRow) {
      // Promotion moves
      for (const type of ['q', 'r', 'b', 'n'] as PieceType[]) {
        moves.push({ 
          from: { row, col }, 
          to: { row: row + direction, col }, 
          promotion: type 
        })
      }
    } else {
      moves.push({ from: { row, col }, to: { row: row + direction, col } })
    }
    
    // Double move from starting position
    if (row === startingRow && !board[row + 2 * direction][col]) {
      moves.push({ from: { row, col }, to: { row: row + 2 * direction, col } })
    }
  }
  
  // Capture moves
  for (const offset of [-1, 1]) {
    if (col + offset >= 0 && col + offset < 8) {
      const targetRow = row + direction
      const targetCol = col + offset
      
      if (targetRow >= 0 && targetRow < 8) {
        // Regular capture
        if (board[targetRow][targetCol]?.color !== color && board[targetRow][targetCol] !== null) {
          if (targetRow === promotionRow) {
            // Promotion + capture
            for (const type of ['q', 'r', 'b', 'n'] as PieceType[]) {
              moves.push({ 
                from: { row, col }, 
                to: { row: targetRow, col: targetCol }, 
                promotion: type 
              })
            }
          } else {
            moves.push({ from: { row, col }, to: { row: targetRow, col: targetCol } })
          }
        }
        
        // En passant capture
        if (enPassantTarget && targetRow === enPassantTarget.row && targetCol === enPassantTarget.col) {
          moves.push({ from: { row, col }, to: { row: targetRow, col: targetCol } })
        }
      }
    }
  }
}

// Generate knight moves
function generateKnightMoves(board: Board, row: number, col: number, color: PieceColor, moves: Move[]): void {
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ]
  
  for (const [dr, dc] of knightMoves) {
    const r = row + dr
    const c = col + dc
    
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (!board[r][c] || board[r][c]?.color !== color) {
        moves.push({ from: { row, col }, to: { row: r, col: c } })
      }
    }
  }
}

// Generate sliding piece moves (bishop, rook, queen)
function generateSlidingMoves(board: Board, row: number, col: number, color: PieceColor, type: PieceType, moves: Move[]): void {
  const directions: number[][] = []
  
  // Bishop moves diagonally
  if (type === 'b' || type === 'q') {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1])
  }
  
  // Rook moves in straight lines
  if (type === 'r' || type === 'q') {
    directions.push([-1, 0], [1, 0], [0, -1], [0, 1])
  }
  
  for (const [dr, dc] of directions) {
    let r = row + dr
    let c = col + dc
    
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (!board[r][c]) {
        moves.push({ from: { row, col }, to: { row: r, col: c } })
      } else {
        if (board[r][c]?.color !== color) {
          moves.push({ from: { row, col }, to: { row: r, col: c } })
        }
        break // Stop if we hit a piece
      }
      
      r += dr
      c += dc
    }
  }
}

// Generate king moves
function generateKingMoves(
  board: Board, 
  row: number, 
  col: number, 
  color: PieceColor, 
  moves: Move[], 
  castlingRights: CastlingRights
): void {
  // Regular king moves
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      
      const r = row + dr
      const c = col + dc
      
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (!board[r][c] || board[r][c]?.color !== color) {
          moves.push({ from: { row, col }, to: { row: r, col: c } })
        }
      }
    }
  }
  
  // Castling (simplified, doesn't check if king passes through check)
  if ((row === 7 && color === 'w') || (row === 0 && color === 'b')) {
    // Kingside castling
    if (castlingRights[color].kingside && !board[row][5] && !board[row][6] && board[row][7]?.type === 'r' && board[row][7]?.color === color) {
      moves.push({ from: { row, col }, to: { row, col: 6 } })
    }
    
    // Queenside castling
    if (castlingRights[color].queenside && !board[row][1] && !board[row][2] && !board[row][3] && board[row][0]?.type === 'r' && board[row][0]?.color === color) {
      moves.push({ from: { row, col }, to: { row, col: 2 } })
    }
  }
} 
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force this route to be dynamic and never run at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Define necessary interfaces
interface MoveRequest {
  board: Board
  turn: PieceColor
  gamePhase: string
  aiPersonality: any // Use 'any' for now, refine if possible
  castlingRights: CastlingRights
  aiLevel: number // Expecting 1-10 range
  moveHistory: { notation: string }[]
  enPassantTargetSquare: { row: number, col: number } | null
}

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
type PieceColor = 'w' | 'b'
type Square = { type: PieceType; color: PieceColor } | null
type Board = Square[][]
type Move = { from: { row: number; col: number }; to: { row: number; col: number }; promotion?: PieceType }
type CastlingRights = { w: { kingside: boolean; queenside: boolean }; b: { kingside: boolean; queenside: boolean } }

// --- Define Constants ---
const DEFAULT_AI_PERSONALITY = {
  aggressiveness: 0.7,
  defensiveness: 0.6,
  mobility: 0.8,
  positionality: 0.9,
  riskTaking: 0.5,
  opening: 'versatile'
};

const pieceValues: { [key in PieceType]: number } = {
  'p': 1, 'n': 3, 'b': 3.25, 'r': 5, 'q': 9, 'k': 100 // Updated bishop value
};

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

const magnusStylePatterns = {
    piecePreferences: { knight: 0.8, bishop: 0.7, centralControl: 0.9 },
    middleGamePreferences: { positional: 0.8 },
};

const openingBook: { [key: string]: string } = {
    "": "e2e4", 
    "e2e4": "c7c5", 
    "e2e4 c7c5": "g1f3",
    "e2e4 c7c5 g1f3": "d7d6",
    "e2e4 c7c5 g1f3 d7d6": "d2d4", 
    "e2e4 c7c5 g1f3 d7d6 d2d4": "c5d4", 
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4": "f3d4", 
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4": "g8f6", 
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6": "b1c3", 
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3": "a7a6", 
};

// --- Utility Functions ---

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

// --- Move Generation and Check Logic ---
// (Define these functions *before* they are used by other functions)

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
        if (enPassantTarget && enPassantTarget.row === row + direction && enPassantTarget.col === col + offset && board[row][col+offset]?.color !== color) {
            moves.push({ row: row + direction, col: col + offset });
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
                  // Check if move puts king into check (Simplified: just check target square)
                  // A full check needs to simulate the move and check the whole board
                  if (!isSquareAttackedBy(board, newRow, newCol, color === 'w' ? 'b' : 'w')) {
                     moves.push({ row: newRow, col: newCol })
                  }
              }
          }
      }
      // Castling
      const castling = currentCastlingRights[color]
      const opponentColor = color === 'w' ? 'b' : 'w'
      const kingInCheck = isSquareAttackedBy(board, row, col, opponentColor);

      if (!kingInCheck) { // Can't castle out of check
          // Kingside castling
          if (castling.kingside &&
              board[row][col + 1] === null &&
              board[row][col + 2] === null &&
              board[row][col + 3]?.type === 'r' && board[row][col + 3]?.color === color && // Ensure rook is there
              !isSquareAttackedBy(board, row, col + 1, opponentColor) && // Check squares king passes through
              !isSquareAttackedBy(board, row, col + 2, opponentColor)) { // Check destination square
              moves.push({ row: row, col: col + 2 })
          }
          
          // Queenside castling
          if (castling.queenside &&
              board[row][col - 1] === null &&
              board[row][col - 2] === null &&
              board[row][col - 3] === null &&
              board[row][col - 4]?.type === 'r' && board[row][col - 4]?.color === color && // Ensure rook is there
              !isSquareAttackedBy(board, row, col - 1, opponentColor) && // Check squares king passes through
              !isSquareAttackedBy(board, row, col - 2, opponentColor)) { // Check destination square
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
    // Check for attacks from each opponent piece
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === attackerColor) {
                // Use the non-recursive piece attack check
                if (getPieceAttacks(board, r, c, targetRow, targetCol)) {
                    return true; // The square is under attack
                }
            }
        }
    }
    return false; // Square is not under attack
}

const isCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color)
  if (!kingPos) return false // Should not happen in a valid game
  const opponentColor = color === 'w' ? 'b' : 'w'
  return isSquareAttackedBy(board, kingPos.row, kingPos.col, opponentColor)
}

// --- Get All Potential Moves ---
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

// --- Filter for Legal Moves (removes moves that leave king in check) ---
const getFilteredLegalMoves = (board: Board, color: PieceColor, currentCastlingRights: CastlingRights, enPassantTarget: { row: number, col: number } | null): Move[] => {
  const potentialMoves = getAllPotentialMoves(board, color, currentCastlingRights, enPassantTarget)
  return potentialMoves.filter(move => {
    const testBoard = JSON.parse(JSON.stringify(board))
    const piece = testBoard[move.from.row][move.from.col]
    if (!piece) return false // Should not happen if potentialMoves is correct

    // Simulate the move
    testBoard[move.to.row][move.to.col] = piece
    testBoard[move.from.row][move.from.col] = null

    // Handle special cases for simulation
    // En Passant capture simulation
    if (piece.type === 'p' && enPassantTarget && move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
      testBoard[move.from.row][enPassantTarget.col] = null; 
    }
    // Castling simulation (move the rook too)
    if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
      const isKingside = move.to.col === 6;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      if(testBoard[move.from.row][rookFromCol]){ // Check rook exists
          testBoard[move.from.row][rookToCol] = testBoard[move.from.row][rookFromCol];
          testBoard[move.from.row][rookFromCol] = null;
      }
    }
    // Promotion simulation (assume queen)
    const promotionRank = color === 'w' ? 0 : 7;
    if (piece.type === 'p' && move.to.row === promotionRank) {
        testBoard[move.to.row][move.to.col] = { type: move.promotion || 'q', color: color };
    }
    
    // Check if the king of the moving color is in check after the move
    return !isCheck(testBoard, color)
  })
}

// Define Evaluation Helper Functions
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
    // Count knights and bishops not on their starting squares
    if (!(currentBoard[homeRow][1]?.type === 'n' && currentBoard[homeRow][1]?.color === color && homeRow === (color === 'w' ? 7 : 0) && 1 === 1)) count++; // b1/b8
    if (!(currentBoard[homeRow][6]?.type === 'n' && currentBoard[homeRow][6]?.color === color && homeRow === (color === 'w' ? 7 : 0) && 6 === 6)) count++; // g1/g8
    if (!(currentBoard[homeRow][2]?.type === 'b' && currentBoard[homeRow][2]?.color === color && homeRow === (color === 'w' ? 7 : 0) && 2 === 2)) count++; // c1/c8
    if (!(currentBoard[homeRow][5]?.type === 'b' && currentBoard[homeRow][5]?.color === color && homeRow === (color === 'w' ? 7 : 0) && 5 === 5)) count++; // f1/f8
    // Also consider queen development (simplified)
    if (!(currentBoard[homeRow][3]?.type === 'q' && currentBoard[homeRow][3]?.color === color && homeRow === (color === 'w' ? 7 : 0) && 3 === 3)) count++; // d1/d8
    
    return count;
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
      if (piece) score += piece.color === 'w' ? 0.5 : -0.5 // Piece on center square
      // Influence on center squares
      if (isSquareAttackedBy(currentBoard, square.row, square.col, 'w')) score += 0.3
      if (isSquareAttackedBy(currentBoard, square.row, square.col, 'b')) score -= 0.3
    }
    for (const square of extendedCenter) {
      const piece = currentBoard[square.row][square.col]
      if (piece) score += piece.color === 'w' ? 0.2 : -0.2 // Piece on extended center
    }
    return score
}

const kingSafetyScore = (currentBoard: Board, color: PieceColor): number => {
    const kingPos = findKing(currentBoard, color)
    if (!kingPos) return 0
    let score = 0
    const direction = color === 'w' ? -1 : 1
    // Pawn shield bonus
    for (let c = Math.max(0, kingPos.col - 1); c <= Math.min(7, kingPos.col + 1); c++) {
      if (isInBounds(kingPos.row + direction, c) && currentBoard[kingPos.row + direction][c]?.type === 'p' && currentBoard[kingPos.row + direction][c]?.color === color) {
        score += 0.3 
      }
    }
    // Castled bonus (simplified check)
    if ((color === 'w' && kingPos.row === 7 && (kingPos.col === 6 || kingPos.col === 2)) ||
        (color === 'b' && kingPos.row === 0 && (kingPos.col === 6 || kingPos.col === 2))) {
      score += 0.5 
    }
    // Penalty for nearby enemy pieces
    const enemyColor = color === 'w' ? 'b' : 'w'
    for (let r = Math.max(0, kingPos.row - 2); r <= Math.min(7, kingPos.row + 2); r++) {
      for (let c = Math.max(0, kingPos.col - 2); c <= Math.min(7, kingPos.col + 2); c++) {
        if (currentBoard[r][c]?.color === enemyColor) {
          const distance = Math.max(Math.abs(r - kingPos.row), Math.abs(c - kingPos.col))
          score -= (3 - distance) * 0.2 // Closer pieces are more dangerous
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
    return mobility * 0.01 // Small bonus per available move
}

const pawnStructureScore = (currentBoard: Board): number => {
    let score = 0
    const pawnPositions: { [key in PieceColor]: {r: number, c: number}[] } = { w: [], b: [] }
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
          if (p.c === other.c && p.r !== other.r) doubled = true // Doubled pawn
          if (Math.abs(p.c - other.c) === 1) isolated = false // Not isolated
          // Check if supported by another pawn
          if ((color === 'w' && p.r + 1 === other.r && Math.abs(p.c - other.c) === 1) || 
              (color === 'b' && p.r - 1 === other.r && Math.abs(p.c - other.c) === 1)) supported = true
        }
        if (doubled) colorScore -= 0.3 // Penalty for doubled pawns
        if (isolated) colorScore -= 0.2 // Penalty for isolated pawns
        if (supported) colorScore += 0.1 // Small bonus for supported pawns
      }
      score += color === 'w' ? colorScore : -colorScore // Add/Subtract score based on color
    }
    return score
}

const kingCentralizationScore = (currentBoard: Board, color: PieceColor): number => {
    const kingPos = findKing(currentBoard, color)
    if (!kingPos) return 0
    // Use endgame position bonus table for king centralization in endgame
    const row = color === 'w' ? kingPos.row : 7 - kingPos.row // Adjust row for black
    const col = kingPos.col // Column doesn't need adjustment
    // Ensure posTable and row exist before accessing
    const posTable = positionBonuses['k_endgame'];
    if (posTable && posTable[row] && typeof posTable[row][col] === 'number') {
         return posTable[row][col];
    }
    return 0; // Return 0 if position bonus is not defined
}

const isPassedPawn = (currentBoard: Board, row: number, col: number, color: PieceColor): boolean => {
    const direction = color === 'w' ? -1 : 1
    const enemyColor = color === 'w' ? 'b' : 'w'
    // Check squares in front and adjacent files
    for (let checkRow = row + direction; isInBounds(checkRow, col); checkRow += direction) {
      // Check same file
      if (currentBoard[checkRow][col]?.type === 'p' && currentBoard[checkRow][col]?.color === enemyColor) return false
      // Check adjacent files
      if (col > 0 && currentBoard[checkRow][col - 1]?.type === 'p' && currentBoard[checkRow][col - 1]?.color === enemyColor) return false
      if (col < 7 && currentBoard[checkRow][col + 1]?.type === 'p' && currentBoard[checkRow][col + 1]?.color === enemyColor) return false
    }
    return true // No enemy pawns block the path
}

const passedPawnScore = (currentBoard: Board): number => {
    let score = 0
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c]
        if (piece?.type === 'p') {
          if (isPassedPawn(currentBoard, r, c, piece.color)) {
            // Bonus based on how far advanced the pawn is
            const rankBonus = piece.color === 'w' ? (6 - r) : (r - 1) // 0 for starting rank, 6 for almost promoting
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

  // Material value & Position Bonus & Bishop Count
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = currentBoard[r][c];
      if (piece) {
        let pieceValue = pieceValues[piece.type] ?? 0;
        // Adjust row for black's perspective when reading position bonuses
        let adjRow = piece.color === 'w' ? r : 7 - r; 
        let adjCol = c; // Column doesn't need adjustment

        // Use endgame king table if applicable
        const posTableKey = (piece.type === 'k' && gamePhase === 'endgame') ? 'k_endgame' : piece.type;
        // Assert the key is valid for positionBonuses
        const validKey = posTableKey as keyof typeof positionBonuses; 
        const posTable = positionBonuses[validKey];
        
        // Apply position bonus if valid
        if (posTable && posTable[adjRow] && typeof posTable[adjRow][adjCol] === 'number') {
             pieceValue += posTable[adjRow][adjCol];
        }
        
        score += piece.color === 'w' ? pieceValue : -pieceValue;

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
  for (let c = 0; c < 8; c++) { 
    let whitePawnsOnFile = 0; let blackPawnsOnFile = 0;
    let whiteRookOnFile = false; let blackRookOnFile = false;
    for (let r = 0; r < 8; r++) {
        const piece = currentBoard[r][c];
        if (piece?.type === 'p') { if (piece.color === 'w') whitePawnsOnFile++; else blackPawnsOnFile++; }
        if (piece?.type === 'r') { if (piece.color === 'w') whiteRookOnFile = true; else blackRookOnFile = true; }
    }
    if (whiteRookOnFile) {
        if (whitePawnsOnFile === 0) score += (blackPawnsOnFile === 0 ? 0.45 : 0.3); // Open or Semi-open
    }
     if (blackRookOnFile) {
        if (blackPawnsOnFile === 0) score -= (whitePawnsOnFile === 0 ? 0.45 : 0.3); // Open or Semi-open
    }
  }

  // --- Apply Phase-Specific Bonuses ---
  const whiteMobility = mobilityScore(currentBoard, 'w');
  const blackMobility = mobilityScore(currentBoard, 'b');
  const mobilityDiff = whiteMobility - blackMobility;
  const whiteSafety = kingSafetyScore(currentBoard, 'w');
  const blackSafety = kingSafetyScore(currentBoard, 'b');
  const safetyDiff = whiteSafety - blackSafety;
  const pawnStructure = pawnStructureScore(currentBoard);
  
  // Apply AI personality weights
  const aggFactor = aiPersonality?.aggressiveness ?? 0.7;
  const defFactor = aiPersonality?.defensiveness ?? 0.6;
  const mobFactor = aiPersonality?.mobility ?? 0.8;
  const posFactor = aiPersonality?.positionality ?? 0.9;

  if (gamePhase === 'opening') {
    score += countDevelopedPieces(currentBoard, 'w') * 0.2;
    score -= countDevelopedPieces(currentBoard, 'b') * 0.2;
    score += centerControlScore(currentBoard) * posFactor; // Emphasize center more based on positionality
    score += safetyDiff * defFactor * 0.5; // King safety matters less early on
    score += mobilityDiff * mobFactor * 0.5; // Mobility bonus scaled
  } else if (gamePhase === 'middlegame') {
    score += safetyDiff * defFactor; // King safety is important
    score += mobilityDiff * mobFactor; // Mobility is key
    score += pawnStructure * posFactor * 0.5; // Pawn structure bonus
    score += centerControlScore(currentBoard) * posFactor * 0.5; // Center control still matters
    // Add bonus for attack potential based on aggressiveness? (Simplified for now)
    score += (whiteMobility * aggFactor - blackMobility * aggFactor) * 0.05; 
  } else if (gamePhase === 'endgame') {
    score += kingCentralizationScore(currentBoard, 'w');
    score -= kingCentralizationScore(currentBoard, 'b');
    score += passedPawnScore(currentBoard) * 1.5; // Passed pawns are critical
    score += mobilityDiff * mobFactor * 0.8; // Mobility is still important
    score += safetyDiff * defFactor * 0.3; // King safety is less critical unless under direct attack
  }
  
  return parseFloat(score.toFixed(2))
}

// --- Algebraic Notation to Move Conversion ---
const algebraicToMove = (board: Board, notation: string, turn: PieceColor): Move | null => {
    // Simplified version for book moves (e.g., "e2e4")
    if (notation.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(notation)) {
        const fromCol = notation.charCodeAt(0) - 'a'.charCodeAt(0);
        const fromRow = 8 - parseInt(notation[1], 10);
        const toCol = notation.charCodeAt(2) - 'a'.charCodeAt(0);
        const toRow = 8 - parseInt(notation[3], 10);
        
        if (isInBounds(fromRow, fromCol) && isInBounds(toRow, toCol)) {
            return { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        }
    }
    console.warn(`Could not parse book move notation: ${notation}`);
    return null;
};

// --- Select Best Move Logic ---
const selectBestMoveBackend = (currentBoard: Board, color: PieceColor, gamePhase: string, aiPersonality: any, currentCastlingRights: CastlingRights, moveHistoryString: string, enPassantTarget: { row: number, col: number } | null): Move | null => {
    
    // 1. Check Opening Book (convert history to space-separated simple moves like e2e4)
    const simpleHistoryKey = moveHistoryString; // Assuming history notation is already simple 'e2e4' like
    if (simpleHistoryKey in openingBook) {
        const bookMoveNotation = openingBook[simpleHistoryKey];
        console.log(`AI found book move: ${bookMoveNotation} for history: ${simpleHistoryKey}`);
        const bookMove = algebraicToMove(currentBoard, bookMoveNotation, color); 
        if (bookMove) {
            // Validate if book move is legal
            const legalMoves = getFilteredLegalMoves(currentBoard, color, currentCastlingRights, enPassantTarget);
            if (legalMoves.some(m => m.from.row === bookMove.from.row && m.from.col === bookMove.from.col && m.to.row === bookMove.to.row && m.to.col === bookMove.to.col)) {
                 console.log(`AI playing book move: ${bookMoveNotation}`);
                 return bookMove;
            } else {
                console.warn(`Book move ${bookMoveNotation} is illegal! Falling back.`);
            }
        } else {
             console.warn(`Failed to parse book move notation: ${bookMoveNotation}`);
        }
    }
    
    // 2. If not in book or book move illegal, proceed with calculation
    console.log("AI calculating move (not in book)...");
    const legalMoves = getFilteredLegalMoves(currentBoard, color, currentCastlingRights, enPassantTarget)
    if (legalMoves.length === 0) return null

    // Evaluate all legal moves
    const evaluatedMoves = legalMoves.map(move => {
        const testBoard = JSON.parse(JSON.stringify(currentBoard))
        const piece = testBoard[move.from.row][move.from.col]
        if (!piece) return { move, score: color === 'w' ? -Infinity : Infinity } // Should not happen
        
        // Apply move to test board (including special moves like promotion, castling, en passant)
        testBoard[move.to.row][move.to.col] = piece
        testBoard[move.from.row][move.from.col] = null
        
        const promotionRank = color === 'w' ? 0 : 7;
        if (piece.type === 'p' && move.to.row === promotionRank) {
            testBoard[move.to.row][move.to.col] = { type: move.promotion || 'q', color: color };
        }
         if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
            const isKingside = move.to.col === 6;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
             if(testBoard[move.from.row][rookFromCol]){ // Check rook exists
                 testBoard[move.from.row][rookToCol] = testBoard[move.from.row][rookFromCol];
                 testBoard[move.from.row][rookFromCol] = null;
             }
        }
        if (piece.type === 'p' && enPassantTarget && move.to.row === enPassantTarget.row && move.to.col === enPassantTarget.col) {
            testBoard[move.from.row][enPassantTarget.col] = null;
        }

        // Evaluate the resulting position
        const score = evaluateBoardUtil(testBoard, gamePhase, aiPersonality);
        
        return { move, score }
    })

    // Sort moves based on evaluation score
    evaluatedMoves.sort((a, b) => color === 'w' ? b.score - a.score : a.score - b.score)

    let chosenMove: Move = evaluatedMoves[0].move;
    let bestScore = evaluatedMoves[0].score;

    // --- Difficulty Adjustment ---
    const aiLevel = aiPersonality.level ?? 5; // Get level from personality object
    const isGrandmasterLevel = aiLevel >= 10; 

    if (isGrandmasterLevel) {
        // Grandmaster Level: Minimal randomness, prioritize best eval + maybe slight style
         if (evaluatedMoves.length > 1 && Math.abs(evaluatedMoves[0].score - evaluatedMoves[1].score) < 0.2 && Math.random() < 0.05) { // Reduced chance
            // Tiny chance to pick second best if very close
            chosenMove = evaluatedMoves[1].move;
            bestScore = evaluatedMoves[1].score;
         } else {
            chosenMove = evaluatedMoves[0].move;
            bestScore = evaluatedMoves[0].score;
         }
         console.log(`Grandmaster AI chose move: ${JSON.stringify(chosenMove)} with score ${bestScore.toFixed(2)}`);

    } else {
        // Lower Levels: Introduce more randomness based on aiLevel
        const randomnessFactor = (10 - aiLevel) / 10; // More randomness at lower levels
        const topMovesCount = Math.min(evaluatedMoves.length, Math.max(1, Math.floor(3 + randomnessFactor * 5))); // Consider more moves at lower levels
        const topMoves = evaluatedMoves.slice(0, topMovesCount);

        // Weighted random choice from top moves
        const weights = topMoves.map((_, index) => Math.pow(0.7, index)); // Higher weight for better moves
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let randomChoice = Math.random() * totalWeight;
        
        // Find the chosen move based on weighted random choice
        let selectedIndex = 0; // Default to best move if loop fails
        for (let i = 0; i < topMoves.length; i++) {
            randomChoice -= weights[i];
            if (randomChoice <= 0) {
                selectedIndex = i;
                break;
            }
        }
        // Ensure selectedIndex is valid
        selectedIndex = Math.min(selectedIndex, topMoves.length - 1); 
        chosenMove = topMoves[selectedIndex].move;
        bestScore = topMoves[selectedIndex].score; // Update bestScore to the chosen move's score

        console.log(`AI Level ${aiLevel} chose move: ${JSON.stringify(chosenMove)} with score ${bestScore.toFixed(2)} (from top ${topMovesCount})`);
    }

    return chosenMove
}

// --- API Route Handler ---

export async function POST(request: Request) {
  // Initialize Supabase client inside the handler for serverless environments
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing in environment variables.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const requestData: MoveRequest = await request.json()
    
    const { 
      board, 
      turn, 
      gamePhase, 
      aiPersonality, // Should contain aiLevel if sent from frontend
      castlingRights, 
      aiLevel, // Explicit aiLevel is also received
      moveHistory, 
      enPassantTargetSquare 
    } = requestData
    
    // Validate request data
    if (!board || !turn || !gamePhase || !castlingRights || aiLevel === undefined) {
      return NextResponse.json({ error: 'Missing required game state parameters' }, { status: 400 })
    }
    
    // --- Model Loading Logic (SINGLE MODEL) ---
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .single() // Fetch exactly one active model
    
    if (modelError || !modelData) {
      console.error('Error fetching active model:', modelError)
      return NextResponse.json({ error: 'Chess AI model data not found' }, { status: 500 })
    }
    
    console.log(`Using model: ${modelData.name} (Version: ${modelData.version})`);
    
    // --- Move Selection Logic ---
    try {
      // Prepare move history string for opening book lookup if needed
      const moveHistoryString = moveHistory.map(m => m.notation || '').join(' '); // Use notation if available
      
      // Adjust personality based on aiLevel for evaluation purposes
      const effectivePersonality = { 
          ...DEFAULT_AI_PERSONALITY, // Start with defaults
          ...(aiPersonality || {}), // Overlay any provided personality
          level: aiLevel // Ensure level is included for selectBestMoveBackend
      };
      
      // Get the best move using the backend logic
      const selectedMove = selectBestMoveBackend(
        board, 
        turn, 
        gamePhase, 
        effectivePersonality, // Pass the adjusted personality
        castlingRights, 
        moveHistoryString, 
        enPassantTargetSquare
      )
      
      // Add a simulated thinking time based on AI level
      const baseThinkingTime = 300 // Base ms
      const thinkingTime = baseThinkingTime + (aiLevel * 100); // Longer thinking for higher levels
      await new Promise(resolve => setTimeout(resolve, thinkingTime))
      
      // Check for game end conditions after selecting the move
      if (!selectedMove) {
        const checkStatus = isCheck(board, turn);
        return NextResponse.json({ 
            move: null, 
            status: checkStatus ? 'checkmate' : 'stalemate' 
        }, { status: 200 });
      }
      
      return NextResponse.json({ 
        move: selectedMove, 
        source: 'neural_network_logic' // Indicate the source of the move decision
      }, { status: 200 })

    } catch (logicError) {
      console.error('Error during move selection logic:', logicError)
      return NextResponse.json({ error: 'Error calculating move', details: String(logicError) }, { status: 500 })
    }

  } catch (error) {
    console.error('Error processing chess AI move request:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}

// --- Utility functions ---
function generateFEN(
  board: Board, 
  turn: PieceColor, 
  castlingRights: CastlingRights, 
  enPassantTarget: { row: number, col: number } | null
): string {
  let fen = ''
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        if (emptyCount > 0) { fen += emptyCount; emptyCount = 0; }
        let pieceChar: string = piece.type; 
        if (piece.color === 'w') { pieceChar = pieceChar.toUpperCase(); }
        fen += pieceChar;
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) { fen += emptyCount; }
    if (r < 7) fen += '/';
  }
  fen += ' ' + turn;
  let castlingStr = '';
  if (castlingRights.w.kingside) castlingStr += 'K';
  if (castlingRights.w.queenside) castlingStr += 'Q';
  if (castlingRights.b.kingside) castlingStr += 'k';
  if (castlingRights.b.queenside) castlingStr += 'q';
  fen += ' ' + (castlingStr || '-');
  if (enPassantTarget) {
    const file = String.fromCharCode('a'.charCodeAt(0) + enPassantTarget.col);
    const rank = 8 - enPassantTarget.row;
    fen += ' ' + file + rank;
  } else {
    fen += ' -';
  }
  fen += ' 0 1'; // Simplified halfmove clock and fullmove number
  return fen;
}
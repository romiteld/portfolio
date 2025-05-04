import type { Board, Move, Piece, PieceColor } from '../components/ChessBoard'

// Check explanations
const checkExplanations = [
  "Your king is under attack! You must move your king, capture the attacking piece, or block the attack.",
  "Check! Your king is being threatened. You have three options: move the king, capture the attacking piece, or block the attack line.",
  "Your king is in check. This means it's being directly attacked and you must address this threat immediately.",
  "Check - your king is under attack and must be protected. Find a way to move, block, or capture the attacking piece."
]

// Checkmate explanations
const checkmateExplanations = [
  "Checkmate! Your king is under attack and has no legal moves to escape. The game is over.",
  "That's checkmate! Your king is in check and has no way to escape, block, or capture the attacking piece.",
  "Checkmate has been delivered. Your king is trapped with no legal moves remaining, ending the game."
]

// Specific check pattern explanations
export const getCheckExplanation = (
  board: Board, 
  kingPosition: { row: number, col: number },
  kingColor: PieceColor,
  lastMove: Move | null
): string => {
  const opponentColor = kingColor === 'w' ? 'b' : 'w'
  
  // Find all attacking pieces
  const attackers = findAttackingPieces(board, kingPosition, opponentColor)
  
  if (attackers.length === 0) {
    return checkExplanations[Math.floor(Math.random() * checkExplanations.length)]
  }
  
  if (attackers.length > 1) {
    return "You're in double check! Your king is being attacked by multiple pieces at once. You must move your king as this is the only legal move in double check."
  }
  
  const attacker = attackers[0]
  
  // Specific check patterns based on piece type
  switch (attacker.piece.type) {
    case 'p':
      return `Your king is in check from a ${attacker.piece.color === 'w' ? 'white' : 'black'} pawn. Pawns attack diagonally, which can sometimes be overlooked.`
    
    case 'n':
      return `A ${attacker.piece.color === 'w' ? 'white' : 'black'} knight has put your king in check. Knights move in an L-shape and can jump over other pieces, making them tricky to defend against.`
    
    case 'b':
      return `Your king is in check along a diagonal from a ${attacker.piece.color === 'w' ? 'white' : 'black'} bishop. You can move your king, capture the bishop, or block the diagonal.`
    
    case 'r':
      return `A ${attacker.piece.color === 'w' ? 'white' : 'black'} rook has put your king in check along a ${isHorizontalCheck(kingPosition, attacker.position) ? 'horizontal' : 'vertical'} line. Consider how to block, capture, or move away.`
    
    case 'q':
      if (isHorizontalCheck(kingPosition, attacker.position) || isVerticalCheck(kingPosition, attacker.position)) {
        return `The ${attacker.piece.color === 'w' ? 'white' : 'black'} queen has put your king in check along a straight line. The queen is the most powerful piece, able to move any number of squares horizontally, vertically, or diagonally.`
      } else {
        return `The ${attacker.piece.color === 'w' ? 'white' : 'black'} queen has put your king in check along a diagonal. The queen is the most powerful piece, able to move any number of squares horizontally, vertically, or diagonally.`
      }
      
    default:
      return checkExplanations[Math.floor(Math.random() * checkExplanations.length)]
  }
}

// Move analysis explanations
export const analyzeMoveQuality = (
  board: Board,
  move: Move,
  piece: Piece,
  captured?: Piece | null
): { text: string, type: 'info' | 'warning' | 'success' | 'error' | 'tip' } => {
  // Special move recognitions
  if (piece.type === 'k' && Math.abs(move.from.col - move.to.col) > 1) {
    return {
      text: move.to.col > move.from.col 
        ? "Good move! You've castled kingside, which helps protect your king and activates your rook."
        : "Good move! You've castled queenside, which helps protect your king and activates your rook.",
      type: 'success'
    }
  }
  
  if (captured) {
    const capturedValue = getPieceValue(captured.type)
    const pieceValue = getPieceValue(piece.type)
    
    if (capturedValue > pieceValue) {
      return {
        text: `Excellent capture! You traded your ${getPieceName(piece.type)} (${pieceValue} points) for a ${getPieceName(captured.type)} (${capturedValue} points), gaining ${capturedValue - pieceValue} points in material advantage.`,
        type: 'success'
      }
    } else if (capturedValue === pieceValue) {
      return {
        text: `Even exchange - you captured a ${getPieceName(captured.type)} with your ${getPieceName(piece.type)} of equal value (${pieceValue} points).`,
        type: 'info'
      }
    } else {
      return {
        text: `You captured a ${getPieceName(captured.type)} (${capturedValue} points) with your ${getPieceName(piece.type)} (${pieceValue} points). This is a material loss of ${pieceValue - capturedValue} points, but might be part of a larger plan.`,
        type: 'warning'
      }
    }
  }
  
  // Pawn advancement
  if (piece.type === 'p') {
    const targetRow = piece.color === 'w' ? 0 : 7
    if (move.to.row === targetRow || move.to.row === targetRow - 1) {
      return {
        text: "Your pawn is close to promoting! Pawns that reach the opposite end of the board can be promoted to any piece (usually a queen).",
        type: 'tip'
      }
    }
  }
  
  // Central control with pawns/knights in opening
  if ((piece.type === 'p' || piece.type === 'n') && 
      (move.to.row >= 3 && move.to.row <= 4) && 
      (move.to.col >= 3 && move.to.col <= 4)) {
    return {
      text: "Good move! Controlling the center is a key strategic goal in chess, especially in the opening phase.",
      type: 'success'
    }
  }
  
  // Default message
  return {
    text: `You moved your ${getPieceName(piece.type)} from ${algebraicNotation(move.from)} to ${algebraicNotation(move.to)}.`,
    type: 'info'
  }
}

// Checkmate analysis to explain why the king is in checkmate
export const getCheckmateExplanation = (
  board: Board,
  kingPosition: { row: number, col: number },
  kingColor: PieceColor
): string => {
  const opponentColor = kingColor === 'w' ? 'b' : 'w'
  const attackers = findAttackingPieces(board, kingPosition, opponentColor)
  
  if (attackers.length > 1) {
    return "Checkmate by multiple pieces! Your king is attacked by more than one piece and has no escape squares. In a double check, the only way to escape is to move the king, but all escape squares are also threatened."
  }
  
  // Check if king has any valid moves
  const kingEscapeSquares = getKingEscapeSquares(board, kingPosition)
  if (kingEscapeSquares.length === 0) {
    return "Checkmate! Your king has no legal moves. All surrounding squares are either occupied by your own pieces or are under attack by your opponent's pieces."
  }
  
  // If we have one attacker, check if it can be captured or blocked
  const attacker = attackers[0]
  
  // Check if the attacker can be captured
  const canCapture = canAttackerBeCaptured(board, attacker.position, kingColor)
  
  // Check if the check can be blocked (only applicable for bishops, rooks, and queens)
  const canBlock = ['b', 'r', 'q'].includes(attacker.piece.type) && 
                   canCheckBeBlocked(board, kingPosition, attacker.position, kingColor)
  
  if (!canCapture && !canBlock) {
    return `Checkmate! The ${getPieceName(attacker.piece.type)} at ${algebraicNotation(attacker.position)} has your king in check. You cannot move your king to a safe square, capture the attacking piece, or block the attack.`
  }
  
  return checkmateExplanations[Math.floor(Math.random() * checkmateExplanations.length)]
}

// Helper functions
function findAttackingPieces(
  board: Board, 
  kingPosition: { row: number, col: number },
  attackerColor: PieceColor
): Array<{ piece: Piece, position: { row: number, col: number } }> {
  const attackers = []
  
  // Loop through the board to find all attacking pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== attackerColor) continue
      
      const isAttacking = isPieceAttackingKing(board, { row: r, col: c }, kingPosition)
      if (isAttacking) {
        attackers.push({ piece, position: { row: r, col: c } })
      }
    }
  }
  
  return attackers
}

function isPieceAttackingKing(
  board: Board,
  piecePosition: { row: number, col: number },
  kingPosition: { row: number, col: number }
): boolean {
  const piece = board[piecePosition.row][piecePosition.col]
  if (!piece) return false
  
  // Check based on piece type
  switch (piece.type) {
    case 'p': // Pawns attack diagonally
      const direction = piece.color === 'w' ? -1 : 1
      return (
        piecePosition.row + direction === kingPosition.row &&
        (piecePosition.col + 1 === kingPosition.col || piecePosition.col - 1 === kingPosition.col)
      )
      
    case 'n': // Knights move in L-shape
      const knightMoves = [
        { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
        { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 }
      ]
      return knightMoves.some(move => 
        piecePosition.row + move.r === kingPosition.row && 
        piecePosition.col + move.c === kingPosition.col
      )
      
    case 'b': // Bishops move diagonally
      return isDiagonalAttack(board, piecePosition, kingPosition)
      
    case 'r': // Rooks move horizontally or vertically
      return isHorizontalAttack(board, piecePosition, kingPosition) || 
             isVerticalAttack(board, piecePosition, kingPosition)
      
    case 'q': // Queens move diagonally, horizontally, or vertically
      return isDiagonalAttack(board, piecePosition, kingPosition) || 
             isHorizontalAttack(board, piecePosition, kingPosition) || 
             isVerticalAttack(board, piecePosition, kingPosition)
      
    case 'k': // Kings attack adjacent squares
      return Math.abs(piecePosition.row - kingPosition.row) <= 1 && 
             Math.abs(piecePosition.col - kingPosition.col) <= 1
      
    default:
      return false
  }
}

function isDiagonalAttack(
  board: Board,
  from: { row: number, col: number },
  to: { row: number, col: number }
): boolean {
  const rowDiff = to.row - from.row
  const colDiff = to.col - from.col
  
  // Not on a diagonal
  if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false
  
  const rowStep = rowDiff > 0 ? 1 : -1
  const colStep = colDiff > 0 ? 1 : -1
  
  // Check for pieces in between
  let r = from.row + rowStep
  let c = from.col + colStep
  
  while (r !== to.row && c !== to.col) {
    if (board[r][c] !== null) return false
    r += rowStep
    c += colStep
  }
  
  return true
}

function isHorizontalAttack(
  board: Board,
  from: { row: number, col: number },
  to: { row: number, col: number }
): boolean {
  // Not on the same row
  if (from.row !== to.row) return false
  
  const start = Math.min(from.col, to.col)
  const end = Math.max(from.col, to.col)
  
  // Check for pieces in between
  for (let c = start + 1; c < end; c++) {
    if (board[from.row][c] !== null) return false
  }
  
  return true
}

function isVerticalAttack(
  board: Board,
  from: { row: number, col: number },
  to: { row: number, col: number }
): boolean {
  // Not on the same column
  if (from.col !== to.col) return false
  
  const start = Math.min(from.row, to.row)
  const end = Math.max(from.row, to.row)
  
  // Check for pieces in between
  for (let r = start + 1; r < end; r++) {
    if (board[r][from.col] !== null) return false
  }
  
  return true
}

function isHorizontalCheck(
  kingPosition: { row: number, col: number },
  attackerPosition: { row: number, col: number }
): boolean {
  return kingPosition.row === attackerPosition.row
}

function isVerticalCheck(
  kingPosition: { row: number, col: number },
  attackerPosition: { row: number, col: number }
): boolean {
  return kingPosition.col === attackerPosition.col
}

function getKingEscapeSquares(
  board: Board,
  kingPosition: { row: number, col: number }
): Array<{ row: number, col: number }> {
  const escapeSquares = []
  const directions = [
    { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
    { r: 0, c: -1 }, { r: 0, c: 1 },
    { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
  ]
  
  for (const dir of directions) {
    const r = kingPosition.row + dir.r
    const c = kingPosition.col + dir.c
    
    // Check if square is on the board
    if (r < 0 || r >= 8 || c < 0 || c >= 8) continue
    
    // Check if square is empty or has opponent's piece
    const piece = board[r][c]
    if (piece === null || piece.color !== board[kingPosition.row][kingPosition.col]?.color) {
      escapeSquares.push({ row: r, col: c })
    }
  }
  
  return escapeSquares
}

function canAttackerBeCaptured(
  board: Board,
  attackerPosition: { row: number, col: number },
  defendingColor: PieceColor
): boolean {
  // Check if any defending piece can capture the attacker
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== defendingColor) continue
      
      if (canPieceMoveTo(board, { row: r, col: c }, attackerPosition)) {
        return true
      }
    }
  }
  
  return false
}

function canPieceMoveTo(
  board: Board,
  from: { row: number, col: number },
  to: { row: number, col: number }
): boolean {
  const piece = board[from.row][from.col]
  if (!piece) return false
  
  // This is a simplified check and doesn't account for pins or other complex rules
  switch (piece.type) {
    case 'p':
      // Pawns move differently for captures
      const direction = piece.color === 'w' ? -1 : 1
      if (from.row + direction === to.row &&
          (from.col + 1 === to.col || from.col - 1 === to.col)) {
        return true
      }
      return false
      
    case 'n':
      const knightMoves = [
        { r: -2, c: -1 }, { r: -2, c: 1 }, { r: -1, c: -2 }, { r: -1, c: 2 },
        { r: 1, c: -2 }, { r: 1, c: 2 }, { r: 2, c: -1 }, { r: 2, c: 1 }
      ]
      return knightMoves.some(move => 
        from.row + move.r === to.row && 
        from.col + move.c === to.col
      )
    
    case 'b':
      return isDiagonalAttack(board, from, to)
      
    case 'r':
      return isHorizontalAttack(board, from, to) || isVerticalAttack(board, from, to)
      
    case 'q':
      return isDiagonalAttack(board, from, to) || 
             isHorizontalAttack(board, from, to) || 
             isVerticalAttack(board, from, to)
             
    case 'k':
      return Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1
      
    default:
      return false
  }
}

function canCheckBeBlocked(
  board: Board,
  kingPosition: { row: number, col: number },
  attackerPosition: { row: number, col: number },
  defendingColor: PieceColor
): boolean {
  // Get squares between attacker and king
  const blockSquares = getSquaresBetween(kingPosition, attackerPosition)
  
  // Check if any defending piece can move to a blocking square
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== defendingColor || piece.type === 'k') continue
      
      for (const blockSquare of blockSquares) {
        if (canPieceMoveTo(board, { row: r, col: c }, blockSquare)) {
          return true
        }
      }
    }
  }
  
  return false
}

function getSquaresBetween(
  from: { row: number, col: number },
  to: { row: number, col: number }
): Array<{ row: number, col: number }> {
  const squares = []
  
  // Check if squares are on same row, column, or diagonal
  const rowDiff = to.row - from.row
  const colDiff = to.col - from.col
  
  if (rowDiff === 0) {
    // Horizontal
    const start = Math.min(from.col, to.col)
    const end = Math.max(from.col, to.col)
    for (let c = start + 1; c < end; c++) {
      squares.push({ row: from.row, col: c })
    }
  } else if (colDiff === 0) {
    // Vertical
    const start = Math.min(from.row, to.row)
    const end = Math.max(from.row, to.row)
    for (let r = start + 1; r < end; r++) {
      squares.push({ row: r, col: from.col })
    }
  } else if (Math.abs(rowDiff) === Math.abs(colDiff)) {
    // Diagonal
    const rowStep = rowDiff > 0 ? 1 : -1
    const colStep = colDiff > 0 ? 1 : -1
    
    let r = from.row + rowStep
    let c = from.col + colStep
    
    while (r !== to.row && c !== to.col) {
      squares.push({ row: r, col: c })
      r += rowStep
      c += colStep
    }
  }
  
  return squares
}

function getPieceValue(type: string): number {
  switch (type) {
    case 'p': return 1
    case 'n': return 3
    case 'b': return 3
    case 'r': return 5
    case 'q': return 9
    case 'k': return 0  // Kings are invaluable
    default: return 0
  }
}

function getPieceName(type: string): string {
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

function algebraicNotation(square: { row: number, col: number }): string {
  const files = 'abcdefgh'
  const ranks = '87654321'
  return `${files[square.col]}${ranks[square.row]}`
}

// Tips for development phases
export const getGamePhaseTips = (
  gamePhase: 'opening' | 'middlegame' | 'endgame',
  moveNumber: number
): string => {
  switch (gamePhase) {
    case 'opening':
      const openingTips = [
        "In the opening, try to control the center with pawns and develop your knights and bishops.",
        "Castling early helps protect your king and connect your rooks.",
        "Try to avoid moving the same piece multiple times in the opening.",
        "Knights before bishops is a common opening strategy.",
        "Try to control the center squares with pawns and pieces."
      ]
      return openingTips[moveNumber % openingTips.length]
      
    case 'middlegame':
      const middlegameTips = [
        "Look for tactical opportunities like forks, pins, and skewers.",
        "Create threats that force your opponent to react.",
        "Connect your rooks by clearing the back rank.",
        "Watch for weaknesses in your opponent's pawn structure.",
        "Look for opportunities to create pawn majorities on one side of the board."
      ]
      return middlegameTips[moveNumber % middlegameTips.length]
      
    case 'endgame':
      const endgameTips = [
        "Activate your king in the endgame - it becomes a powerful piece.",
        "Pawns become extremely valuable in the endgame as they can promote.",
        "Try to create passed pawns that can advance to promotion.",
        "The opposition (kings facing each other with one square between) is a key endgame concept.",
        "Rook endgames are the most common type and require precise technique."
      ]
      return endgameTips[moveNumber % endgameTips.length]
      
    default:
      return "Focus on developing your pieces and controlling the center."
  }
} 
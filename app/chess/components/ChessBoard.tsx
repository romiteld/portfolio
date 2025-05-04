"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftCircle } from 'lucide-react'

// Define types
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type PieceColor = 'w' | 'b'
export type Piece = { type: PieceType; color: PieceColor }
export type Square = Piece | null
export type Board = Square[][]
export type Move = { from: { row: number; col: number }; to: { row: number; col: number }; promotion?: PieceType }
export type CastlingRights = { w: { kingside: boolean; queenside: boolean }; b: { kingside: boolean; queenside: boolean } }

interface ChessBoardProps {
  board: Board
  onMove: (move: Move) => void
  orientation: PieceColor
  legalMoves?: Move[]
  lastMove?: Move | null
  isCheck?: boolean
  checkPosition?: { row: number; col: number } | null
  disabled?: boolean
  showCoordinates?: boolean
  animationDuration?: number
  className?: string
}

const ChessBoard = ({
  board,
  onMove,
  orientation = 'w',
  legalMoves = [],
  lastMove = null,
  isCheck = false,
  checkPosition = null,
  disabled = false,
  showCoordinates = true,
  animationDuration = 0.2,
  className = ''
}: ChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null)
  const [hoveredSquare, setHoveredSquare] = useState<{ row: number; col: number } | null>(null)
  
  // Reset selected square when board changes
  useEffect(() => {
    setSelectedSquare(null)
  }, [board])
  
  // Map of legal moves for the selected piece for quick lookup
  const legalMovesMap = useMemo(() => {
    if (!selectedSquare) return new Map()
    
    const map = new Map()
    legalMoves
      .filter(move => move.from.row === selectedSquare.row && move.from.col === selectedSquare.col)
      .forEach(move => {
        map.set(`${move.to.row},${move.to.col}`, move)
      })
    
    return map
  }, [selectedSquare, legalMoves])
  
  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (disabled) return
    
    // If a square is already selected, attempt to move
    if (selectedSquare) {
      // Check if this is a legal destination
      const moveKey = `${row},${col}`
      if (legalMovesMap.has(moveKey)) {
        const move = legalMovesMap.get(moveKey)
        onMove(move)
        setSelectedSquare(null)
        return
      }
      
      // Check if clicking on the same square (deselect)
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null)
        return
      }
      
      // Check if clicking on another piece of the same color
      const piece = board[row][col]
      if (piece && board[selectedSquare.row][selectedSquare.col]?.color === piece.color) {
        setSelectedSquare({ row, col })
        return
      }
    }
    
    // No square selected, check if this square has a piece
    const piece = board[row][col]
    if (piece) {
      // Check if there are legal moves for this piece
      const hasLegalMoves = legalMoves.some(move => move.from.row === row && move.from.col === col)
      if (hasLegalMoves) {
        setSelectedSquare({ row, col })
      }
    }
  }
  
  // Render the board
  const renderBoard = () => {
    const rows = []
    
    for (let r = 0; r < 8; r++) {
      const row = []
      for (let c = 0; c < 8; c++) {
        // Get the actual row and column based on orientation
        const actualRow = orientation === 'w' ? r : 7 - r
        const actualCol = orientation === 'w' ? c : 7 - c
        
        const piece = board[actualRow][actualCol]
        const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol
        const isLegalMove = selectedSquare && legalMovesMap.has(`${actualRow},${actualCol}`)
        const isLastMoveFrom = lastMove && lastMove.from.row === actualRow && lastMove.from.col === actualCol
        const isLastMoveTo = lastMove && lastMove.to.row === actualRow && lastMove.to.col === actualCol
        const isHovered = hoveredSquare?.row === actualRow && hoveredSquare?.col === actualCol
        const isInCheck = isCheck && checkPosition && checkPosition.row === actualRow && checkPosition.col === actualCol
        
        // Square color (light or dark)
        const isLightSquare = (r + c) % 2 === 0
        const squareClasses = `relative w-full aspect-square flex items-center justify-center cursor-pointer 
          ${isLightSquare 
            ? 'bg-[#f0d9b5] dark:bg-[#f0d9b5] shadow-inner' 
            : 'bg-[#b58863] dark:bg-[#b58863]'} 
          ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}
          ${isHovered && !isSelected ? 'ring-1 ring-blue-300 ring-inset' : ''}
          ${isLastMoveFrom ? 'bg-blue-200/50 dark:bg-blue-800/30' : ''}
          ${isLastMoveTo ? 'bg-blue-300/50 dark:bg-blue-700/40' : ''}
          ${isInCheck ? 'bg-red-300/50 dark:bg-red-900/30' : ''}
          transition-colors duration-200
        `
        
        // Get piece image file name
        const pieceImageName = piece ? `${piece.color}${piece.type}` : null
        
        row.push(
          <div
            key={`${r}-${c}`}
            className={squareClasses}
            onClick={() => handleSquareClick(actualRow, actualCol)}
            onMouseEnter={() => setHoveredSquare({ row: actualRow, col: actualCol })}
            onMouseLeave={() => setHoveredSquare(null)}
          >
            {/* Piece */}
            {piece && (
              <motion.div
                className={`w-[85%] h-[85%] cursor-grab relative group ${isInCheck && piece.type === 'k' ? 'animate-pulse' : ''}`}
                animate={{ 
                  scale: isSelected ? 1.1 : 1,
                  filter: isInCheck && piece.type === 'k' 
                    ? 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.8))' 
                    : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }}
                whileHover={{
                  scale: 1.05,
                  y: -3,
                  filter: 'drop-shadow(0 5px 8px rgba(0, 0, 0, 0.4))'
                }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src={`/images/chess/${pieceImageName}.svg`} 
                  alt={`${piece.color === 'w' ? 'White' : 'Black'} ${pieceTypeToName(piece.type)}`} 
                  className="w-full h-full select-none object-contain transition-transform" 
                  draggable={false}
                />
                {/* Subtle reflection effect */}
                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-gradient-to-t from-white/20 to-transparent rounded-full blur-sm opacity-50 dark:opacity-30 pointer-events-none"></div>
              </motion.div>
            )}
            
            {/* Legal move indicator */}
            {isLegalMove && (
              <motion.div 
                className={`absolute ${piece 
                  ? 'w-full h-full border-2 border-blue-500/50 rounded-full' 
                  : 'w-[30%] h-[30%] bg-blue-500/50 rounded-full flex items-center justify-center'}`}
                animate={{
                  opacity: [0.5, 0.7, 0.5],
                  scale: [1, 1.05, 1],
                  boxShadow: ['0 0 5px rgba(59, 130, 246, 0.3)', '0 0 8px rgba(59, 130, 246, 0.5)', '0 0 5px rgba(59, 130, 246, 0.3)']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {!piece && (
                  <motion.div 
                    className="w-[60%] h-[60%] bg-blue-400/70 rounded-full"
                    animate={{
                      opacity: [0.6, 0.9, 0.6]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>
            )}
            
            {/* Check indicator for king */}
            {isInCheck && piece?.type === 'k' && (
              <motion.div 
                className="absolute inset-0 border-2 border-red-500 rounded-md"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  boxShadow: [
                    'inset 0 0 10px rgba(220, 38, 38, 0.4)',
                    'inset 0 0 20px rgba(220, 38, 38, 0.7)',
                    'inset 0 0 10px rgba(220, 38, 38, 0.4)'
                  ],
                  scale: [1, 1.03, 1]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            {/* Coordinates */}
            {showCoordinates && (
              <>
                {c === 0 && (
                  <div className="absolute top-1 left-1 text-xs font-medium opacity-60">
                    {orientation === 'w' ? 8 - r : r + 1}
                  </div>
                )}
                {r === 7 && (
                  <div className="absolute bottom-1 right-1 text-xs font-medium opacity-60">
                    {String.fromCharCode(97 + (orientation === 'w' ? c : 7 - c))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      }
      rows.push(
        <div key={r} className="grid grid-cols-8">
          {row}
        </div>
      )
    }
    
    return (
      <div className={`board-container relative w-full aspect-square border border-[#7d694c] dark:border-[#5d4a38] shadow-lg rounded-sm overflow-hidden ${className} bg-[#b58863]/10`}>
        {/* Board texture overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[url('/images/chess/wood-pattern.png')] opacity-5 mix-blend-overlay"></div>
        
        {/* Outer frame */}
        <div className="absolute inset-0 border-8 border-[#8a6642] dark:border-[#6d5036] rounded-sm shadow-inner pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9e7b52]/20 to-transparent"></div>
        </div>
        
        {/* Environment reflection */}
        <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none opacity-10 dark:opacity-5">
          <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-white/30 to-transparent transform scale-y-[-1] blur-sm"></div>
        </div>
        
        {rows}
        
        {/* Last move arrow indicator */}
        {lastMove && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" style={{ zIndex: 5 }}>
              <g opacity="0.7">
                {renderMoveArrow(lastMove, orientation)}
              </g>
            </svg>
          </div>
        )}
      </div>
    )
  }
  
  // Render arrow for the last move
  const renderMoveArrow = (move: Move, orientation: PieceColor) => {
    const squareSize = 12.5; // 100% / 8 squares = 12.5%
    
    const fromRow = orientation === 'w' ? move.from.row : 7 - move.from.row;
    const fromCol = orientation === 'w' ? move.from.col : 7 - move.from.col;
    const toRow = orientation === 'w' ? move.to.row : 7 - move.to.row;
    const toCol = orientation === 'w' ? move.to.col : 7 - move.to.col;
    
    // Calculate center points of squares
    const fromX = (fromCol * squareSize) + (squareSize / 2);
    const fromY = (fromRow * squareSize) + (squareSize / 2);
    const toX = (toCol * squareSize) + (squareSize / 2);
    const toY = (toRow * squareSize) + (squareSize / 2);
    
    // Calculate arrow properties
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    // Shorten the arrow slightly to not cover the pieces
    const shortenFactor = 0.3;
    const newFromX = fromX + (dx * shortenFactor);
    const newFromY = fromY + (dy * shortenFactor);
    const newToX = toX - (dx * shortenFactor);
    const newToY = toY - (dy * shortenFactor);
    
    // Arrow head
    const arrowHeadSize = 2.5;
    const arrowPoint1X = newToX - arrowHeadSize * Math.cos(angle - Math.PI / 6);
    const arrowPoint1Y = newToY - arrowHeadSize * Math.sin(angle - Math.PI / 6);
    const arrowPoint2X = newToX - arrowHeadSize * Math.cos(angle + Math.PI / 6);
    const arrowPoint2Y = newToY - arrowHeadSize * Math.sin(angle + Math.PI / 6);
    
    return (
      <g>
        <defs>
          <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse" gradientTransform={`rotate(${angle * 180 / Math.PI})`}>
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <line
          x1={`${newFromX}%`}
          y1={`${newFromY}%`}
          x2={`${newToX}%`}
          y2={`${newToY}%`}
          stroke="url(#arrowGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#glow)"
        >
          <animate attributeName="strokeOpacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" />
        </line>
        <polygon
          points={`${newToX}%,${newToY}% ${arrowPoint1X}%,${arrowPoint1Y}% ${arrowPoint2X}%,${arrowPoint2Y}%`}
          fill="url(#arrowGradient)"
          filter="url(#glow)"
        >
          <animate attributeName="fillOpacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" />
        </polygon>
      </g>
    );
  };
  
  return renderBoard()
}

// Helper function to convert piece type to full name
function pieceTypeToName(type: PieceType): string {
  switch (type) {
    case 'p': return 'Pawn'
    case 'n': return 'Knight'
    case 'b': return 'Bishop'
    case 'r': return 'Rook'
    case 'q': return 'Queen'
    case 'k': return 'King'
  }
}

export default ChessBoard 
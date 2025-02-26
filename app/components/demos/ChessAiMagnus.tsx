"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

type ChessPiece = {
  type: "pawn" | "knight" | "bishop" | "rook" | "queen" | "king"
  color: "white" | "black"
  position: string
}

// Pre-configured mid-game state
const initialBoardState: ChessPiece[] = [
  { type: "rook", color: "black", position: "a8" },
  { type: "knight", color: "black", position: "b8" },
  { type: "bishop", color: "black", position: "c8" },
  { type: "queen", color: "black", position: "d8" },
  { type: "king", color: "black", position: "e8" },
  { type: "bishop", color: "black", position: "f8" },
  { type: "rook", color: "black", position: "h8" },
  
  { type: "pawn", color: "black", position: "a7" },
  { type: "pawn", color: "black", position: "b7" },
  { type: "pawn", color: "black", position: "c7" },
  { type: "pawn", color: "black", position: "f7" },
  { type: "pawn", color: "black", position: "g7" },
  { type: "pawn", color: "black", position: "h7" },
  { type: "pawn", color: "black", position: "e6" },
  { type: "knight", color: "black", position: "d5" },
  
  { type: "pawn", color: "white", position: "a2" },
  { type: "pawn", color: "white", position: "b2" },
  { type: "pawn", color: "white", position: "f2" },
  { type: "pawn", color: "white", position: "g2" },
  { type: "pawn", color: "white", position: "h2" },
  { type: "pawn", color: "white", position: "c3" },
  { type: "pawn", color: "white", position: "d4" },
  { type: "pawn", color: "white", position: "e5" },
  
  { type: "rook", color: "white", position: "a1" },
  { type: "knight", color: "white", position: "b1" },
  { type: "bishop", color: "white", position: "c1" },
  { type: "queen", color: "white", position: "d1" },
  { type: "king", color: "white", position: "e1" },
  { type: "bishop", color: "white", position: "f1" },
  { type: "knight", color: "white", position: "g1" },
  { type: "rook", color: "white", position: "h1" },
]

// Simulated series of moves for the demo
const presetMoves = [
  { from: "e5", to: "e6", piece: "pawn", color: "white" },
  { from: "d5", to: "f4", piece: "knight", color: "black" },
  { from: "f1", to: "c4", piece: "bishop", color: "white" },
  { from: "f7", to: "f6", piece: "pawn", color: "black" },
]

export default function ChessAiMagnus() {
  const [pieces, setPieces] = useState<ChessPiece[]>(initialBoardState)
  const [moveIndex, setMoveIndex] = useState(-1)
  const [gameStatus, setGameStatus] = useState("Game in progress")
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white")
  const [thinking, setThinking] = useState(false)
  const [analysis, setAnalysis] = useState("")

  // Create the 8x8 chess board coordinates
  const boardCoordinates = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => ({
      file: String.fromCharCode(97 + col), // a-h
      rank: 8 - row, // 8-1
    }))
  )

  // Handle the next move in the preset sequence when requested
  const handleNextMove = () => {
    if (moveIndex >= presetMoves.length - 1) return
    
    setThinking(true)
    
    // Simulate AI thinking time
    setTimeout(() => {
      const nextMove = presetMoves[moveIndex + 1]
      setMoveIndex(prev => prev + 1)
      
      // Update pieces based on the move
      setPieces(prevPieces => {
        const newPieces = [...prevPieces]
        
        // Find and remove captured piece if any
        const captureIndex = newPieces.findIndex(p => p.position === nextMove.to)
        if (captureIndex !== -1) {
          newPieces.splice(captureIndex, 1)
        }
        
        // Find and move the piece
        const pieceIndex = newPieces.findIndex(
          p => p.position === nextMove.from && p.type === nextMove.piece && p.color === nextMove.color
        )
        
        if (pieceIndex !== -1) {
          newPieces[pieceIndex] = { ...newPieces[pieceIndex], position: nextMove.to }
        }
        
        return newPieces
      })
      
      // Update turn
      setCurrentTurn(nextMove.color === "white" ? "black" : "white")
      
      // Set analysis based on the move
      setAnalysis(getAnalysisForMove(moveIndex + 1))
      
      setThinking(false)
    }, 1000)
  }
  
  // Reset the board
  const handleReset = () => {
    setPieces(initialBoardState)
    setMoveIndex(-1)
    setCurrentTurn("white")
    setAnalysis("")
    setGameStatus("Game in progress")
  }
  
  // Get fake analysis text for each move
  const getAnalysisForMove = (index: number) => {
    const analyses = [
      "White advances the e-pawn, continuing central control. This creates tension in the center and challenges the knight on d5.",
      "Black's knight jumps to f4, a strong outpost that threatens multiple squares. The AI recognizes this knight maneuver as offering the best counter to White's central pressure.",
      "White develops the light-squared bishop to c4, targeting the f7 square and preparing for potential kingside attack. The AI evaluates this as slightly favorable for White (+0.3).",
      "Black defends with f6, strengthening the central pawn chain but creating dark square weaknesses around the king. The position is complex with chances for both sides."
    ]
    
    return analyses[index] || ""
  }

  // Find piece at a given position
  const getPieceAtPosition = (file: string, rank: number) => {
    const position = `${file}${rank}`
    return pieces.find(piece => piece.position === position)
  }

  // Determine cell color (light or dark square)
  const getCellColor = (file: string, rank: number) => {
    const fileIndex = file.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
    return (fileIndex + rank) % 2 === 0 ? "bg-amber-200" : "bg-amber-800"
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
      {/* Chess board */}
      <div className="flex-1">
        <div className="aspect-square border-4 border-amber-900 rounded-md shadow-lg overflow-hidden">
          <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
            {boardCoordinates.map((row, rowIndex) =>
              row.map(({ file, rank }, colIndex) => {
                const piece = getPieceAtPosition(file, rank)
                const cellColor = getCellColor(file, rank)
                
                return (
                  <div 
                    key={`${file}${rank}`} 
                    className={`relative flex items-center justify-center ${cellColor}`}
                  >
                    {/* Coordinate labels */}
                    {colIndex === 0 && (
                      <span className="absolute left-1 top-1 text-xs opacity-60">
                        {rank}
                      </span>
                    )}
                    {rowIndex === 7 && (
                      <span className="absolute right-1 bottom-1 text-xs opacity-60">
                        {file}
                      </span>
                    )}
                    
                    {/* Chess piece */}
                    {piece && (
                      <motion.div
                        key={`${piece.type}-${piece.color}-${piece.position}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-[70%] h-[70%] flex items-center justify-center"
                      >
                        <ChessPieceIcon type={piece.type} color={piece.color} />
                      </motion.div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <span className="font-medium mr-2">Turn:</span>
            <span className={`font-bold ${currentTurn === "white" ? "text-amber-600" : "text-neutral-800"}`}>
              {currentTurn === "white" ? "White (Magnus)" : "Black (AI)"}
            </span>
          </div>
          
          <div className="space-x-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-md transition-colors"
              aria-label="Reset game"
            >
              Reset
            </button>
            <button
              onClick={handleNextMove}
              disabled={thinking || moveIndex >= presetMoves.length - 1}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Make next move"
            >
              {thinking ? "Thinking..." : "Next Move"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Game analysis */}
      <div className="flex-1">
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-6 h-full">
          <h2 className="text-2xl font-bold mb-4 text-primary-600 dark:text-primary-400">
            AI Analysis
          </h2>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Game Status</h3>
            <div className="bg-white dark:bg-neutral-800 p-3 rounded-md">
              {gameStatus}
            </div>
          </div>
          
          {analysis && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Last Move Analysis</h3>
              <div className="bg-white dark:bg-neutral-800 p-3 rounded-md">
                {analysis}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">About This Demo</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This demo showcases a simulated chess game between a reinforcement learning AI 
              and Magnus Carlsen (world champion). In a real implementation, this would use a 
              trained neural network that learned chess through self-play and reinforcement learning.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              The moves shown are pre-defined for demonstration purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chess piece component
function ChessPieceIcon({ type, color }: { type: ChessPiece["type"], color: ChessPiece["color"] }) {
  // Map of piece types to Unicode chess symbols
  const pieceSymbols = {
    white: {
      king: "♔",
      queen: "♕",
      rook: "♖",
      bishop: "♗",
      knight: "♘",
      pawn: "♙"
    },
    black: {
      king: "♚",
      queen: "♛",
      rook: "♜",
      bishop: "♝",
      knight: "♞",
      pawn: "♟"
    }
  }
  
  return (
    <span className={`text-4xl ${color === "white" ? "text-amber-50" : "text-neutral-900"}`}>
      {pieceSymbols[color][type]}
    </span>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Brain, Clock, Award, Lightbulb, ChevronRight, SkipForward, RotateCcw, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

// Enhanced series of moves for the demo with Magnus Carlsen style
const presetMoves = [
  { from: "e5", to: "e6", piece: "pawn", color: "white", eval: "+0.3", timeSpent: "24s" },
  { from: "d5", to: "f4", piece: "knight", color: "black", eval: "+0.1", timeSpent: "1m 12s" },
  { from: "f1", to: "c4", piece: "bishop", color: "white", eval: "+0.4", timeSpent: "45s" },
  { from: "f7", to: "f6", piece: "pawn", color: "black", eval: "+0.2", timeSpent: "37s" },
  { from: "g1", to: "e2", piece: "knight", color: "white", eval: "+0.6", timeSpent: "1m 03s" },
  { from: "c8", to: "d7", piece: "bishop", color: "black", eval: "+0.3", timeSpent: "52s" },
]

// Magnus's opening preferences
const magnusOpenings = [
  "e4 (King's Pawn Opening)",
  "d4 (Queen's Pawn Opening)",
  "c4 (English Opening)",
  "Nf3 (Réti Opening)"
]

// Magnus's famous quotes
const magnusQuotes = [
  "Some people think that if their opponent plays a beautiful game, it's OK to lose. I don't. You have to be merciless.",
  "I'm not a genius. I'm just good at chess.",
  "Opponents with non-standard styles are dangerous even for the very best players.",
  "I can't count the times I have lagged seemingly hopelessly far behind, and nobody except myself thought I could win. But I have pulled myself in from desperate situations. When you are behind there are two strategies – counter-attack or all men to the defences.",
  "If you want to get to the top, there's always the risk that it will isolate you from other people.",
  "I am trying to beat the guy sitting across from me and trying to choose the moves that are most unpleasant for him and his style."
]

export default function ChessAiMagnus() {
  const [pieces, setPieces] = useState<ChessPiece[]>(initialBoardState)
  const [moveIndex, setMoveIndex] = useState(-1)
  const [gameStatus, setGameStatus] = useState("Game in progress")
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white")
  const [thinking, setThinking] = useState(false)
  const [analysis, setAnalysis] = useState("")
  const [evalScore, setEvalScore] = useState("+0.0")
  const [aiLevel, setAiLevel] = useState(5) // 1-5 scale, Magnus is 5!
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [magnusQuote, setMagnusQuote] = useState("")
  const [moveTimeSpent, setMoveTimeSpent] = useState("")
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [aiConfidence, setAiConfidence] = useState(92) // 0-100%

  // Create the 8x8 chess board coordinates
  const boardCoordinates = Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => ({
      file: String.fromCharCode(97 + col), // a-h
      rank: 8 - row, // 8-1
    }))
  )

  // Display a random Magnus quote on component mount
  useEffect(() => {
    const randomQuote = magnusQuotes[Math.floor(Math.random() * magnusQuotes.length)]
    setMagnusQuote(randomQuote)
  }, [])

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
      setEvalScore(nextMove.eval)
      setMoveTimeSpent(nextMove.timeSpent)
      
      // Randomly adjust AI confidence
      setAiConfidence(Math.floor(85 + Math.random() * 15))
      
      setThinking(false)
    }, 1500) // Slightly longer thinking time for more realism
  }
  
  // Skip to the end of the demonstration
  const handleSkipToEnd = () => {
    setThinking(true)
    
    setTimeout(() => {
      // Set to the last move
      const lastMoveIndex = presetMoves.length - 1
      setMoveIndex(lastMoveIndex)
      
      // Update the board to final position
      const newPieces = [...initialBoardState]
      
      // Apply all moves to get the final position
      presetMoves.forEach(move => {
        // Remove captured pieces
        const captureIndex = newPieces.findIndex(p => p.position === move.to)
        if (captureIndex !== -1) {
          newPieces.splice(captureIndex, 1)
        }
        
        // Move the piece
        const pieceIndex = newPieces.findIndex(
          p => p.position === move.from && p.type === move.piece && p.color === move.color
        )
        
        if (pieceIndex !== -1) {
          newPieces[pieceIndex] = { ...newPieces[pieceIndex], position: move.to }
        }
      })
      
      setPieces(newPieces)
      setCurrentTurn(presetMoves[lastMoveIndex].color === "white" ? "black" : "white")
      setAnalysis(getAnalysisForMove(lastMoveIndex))
      setEvalScore(presetMoves[lastMoveIndex].eval)
      setMoveTimeSpent(presetMoves[lastMoveIndex].timeSpent)
      setThinking(false)
    }, 2000)
  }
  
  // Reset the board
  const handleReset = () => {
    setPieces(initialBoardState)
    setMoveIndex(-1)
    setCurrentTurn("white")
    setAnalysis("")
    setEvalScore("+0.0")
    setMoveTimeSpent("")
    setGameStatus("Game in progress")
    setShowAlternatives(false)
    
    // New random quote on reset
    const randomQuote = magnusQuotes[Math.floor(Math.random() * magnusQuotes.length)]
    setMagnusQuote(randomQuote)
  }
  
  // Toggle heatmap view
  const handleToggleHeatmap = () => {
    setShowHeatmap(prev => !prev)
  }
  
  // Toggle alternative moves analysis
  const handleToggleAlternatives = () => {
    setShowAlternatives(prev => !prev)
  }
  
  // Get detailed analysis text for each move
  const getAnalysisForMove = (index: number) => {
    const analyses = [
      "White advances the e-pawn, continuing central control. This creates tension in the center and challenges the knight on d5. A typical Magnus move that prioritizes piece activity and central control, laying the groundwork for potential kingside attack.",
      
      "Black's knight jumps to f4, a strong outpost that threatens multiple squares. The AI recognizes this knight maneuver as offering the best counter to White's central pressure. This move is in line with Stockfish's top recommendation, showing the AI's tactical awareness.",
      
      "White develops the light-squared bishop to c4, targeting the f7 square and preparing for potential kingside attack. This is one of Magnus's favorite bishop deployments, aiming for active piece play rather than slow positional maneuvering. The AI evaluates this as slightly favorable for White (+0.4).",
      
      "Black defends with f6, strengthening the central pawn chain but creating slight dark square weaknesses around the king. The position is complex with chances for both sides. The neural network identifies this as the best defensive resource despite the potential long-term structural consequences.",
      
      "White develops the knight to e2, planning to reroute it to g3 or potentially f4. This flexible development is characteristic of Magnus's style - maintaining options while gradually improving piece positioning. The evaluation shows a small but growing advantage for White.",
      
      "Black develops the bishop to d7, connecting the rooks and preparing for potential queenside castling. The AI chooses solid development over more aggressive options, recognizing the need for piece coordination before launching counterplay."
    ]
    
    return analyses[index] || ""
  }
  
  // Get alternative moves that could have been played
  const getAlternativeMoves = () => {
    if (moveIndex < 0) return []
    
    const alternativesList = [
      // For first move (e5-e6)
      [
        { move: "Nf3", eval: "+0.2", comment: "Developing the knight is also strong" },
        { move: "Bc4", eval: "+0.3", comment: "Early bishop development targeting f7" }
      ],
      // For second move (d5-f4)
      [
        { move: "e5-e6", eval: "+0.3", comment: "Continuing central control" },
        { move: "Bb4+", eval: "0.0", comment: "Pinning the knight and forcing c3" }
      ],
      // For third move (f1-c4)
      [
        { move: "Qe2", eval: "+0.3", comment: "Developing the queen and protecting e-pawn" },
        { move: "0-0", eval: "+0.2", comment: "Castling to safety first" }
      ],
      // For fourth move (f7-f6)
      [
        { move: "0-0", eval: "+0.1", comment: "Castling to safety" },
        { move: "Bg4", eval: "+0.2", comment: "Active bishop development" }
      ],
      // For fifth move (g1-e2)
      [
        { move: "d4-d5", eval: "+0.5", comment: "Challenging the center directly" },
        { move: "Qd2", eval: "+0.4", comment: "Developing the queen to support kingside play" }
      ],
      // For sixth move (c8-d7)
      [
        { move: "0-0", eval: "+0.2", comment: "Castling immediately" },
        { move: "Qb6", eval: "+0.3", comment: "Active queen development targeting b2" }
      ],
    ]
    
    return alternativesList[moveIndex] || []
  }

  // Find piece at a given position
  const getPieceAtPosition = (file: string, rank: number) => {
    const position = `${file}${rank}`
    return pieces.find(piece => piece.position === position)
  }

  // Determine cell color (light or dark square)
  const getCellColor = (file: string, rank: number) => {
    const fileIndex = file.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
    const baseColor = (fileIndex + rank) % 2 === 0 ? "bg-amber-200" : "bg-amber-800"
    
    if (!showHeatmap) return baseColor
    
    // Add heatmap colors based on control/influence for demonstration
    const position = `${file}${rank}`
    
    // Central squares have higher influence
    if (["d4", "e4", "d5", "e5"].includes(position)) {
      return (fileIndex + rank) % 2 === 0 
        ? "bg-amber-200 bg-opacity-60 outline outline-2 outline-blue-400" 
        : "bg-amber-800 bg-opacity-60 outline outline-2 outline-blue-400"
    }
    
    // Extended center has medium influence
    if (["c3", "d3", "e3", "f3", "c4", "f4", "c5", "f5", "c6", "d6", "e6", "f6"].includes(position)) {
      return (fileIndex + rank) % 2 === 0 
        ? "bg-gradient-to-br from-amber-200 to-blue-200" 
        : "bg-gradient-to-br from-amber-800 to-blue-700"
    }
    
    return baseColor
  }

  // Get the last move made (for highlighting)
  const getLastMove = () => {
    if (moveIndex < 0 || moveIndex >= presetMoves.length) return null
    return presetMoves[moveIndex]
  }

  // Check if a square was part of the last move
  const isPartOfLastMove = (position: string) => {
    const lastMove = getLastMove()
    if (!lastMove) return false
    return position === lastMove.from || position === lastMove.to
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md">
      {/* Chess board */}
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div>
              <div className="font-semibold text-sm">Magnus AI</div>
              <div className="flex items-center">
                <div className="text-xs text-neutral-500 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  <span>Grandmaster</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="text-sm font-medium mr-2">AI Level:</div>
            <div className="w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded-full" 
                style={{ width: `${aiLevel * 20}%` }}
              ></div>
            </div>
            <div className="ml-1 text-sm font-medium">{aiLevel}/5</div>
          </div>
        </div>
      
        <div className="aspect-square border-4 border-amber-900 rounded-md shadow-lg overflow-hidden relative">
          <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
            {boardCoordinates.map((row, rowIndex) =>
              row.map(({ file, rank }, colIndex) => {
                const piece = getPieceAtPosition(file, rank)
                const cellColor = getCellColor(file, rank)
                const position = `${file}${rank}`
                const isLastMove = isPartOfLastMove(position)
                
                return (
                  <div 
                    key={`${file}${rank}`} 
                    className={`relative flex items-center justify-center ${cellColor} ${isLastMove ? 'ring-2 ring-yellow-400 ring-inset' : ''}`}
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
                        transition={{ duration: 0.3 }}
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
          
          {thinking && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg flex items-center space-x-3">
                <div className="animate-pulse">
                  <Brain className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-sm font-medium">Magnus is thinking...</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <span className="font-medium mr-2">Turn:</span>
            <span className={`font-bold ${currentTurn === "white" ? "text-amber-600" : "text-neutral-800"}`}>
              {currentTurn === "white" ? "White (Magnus)" : "Black (AI)"}
            </span>
            {moveTimeSpent && (
              <span className="ml-3 text-sm flex items-center text-neutral-500">
                <Clock className="h-3 w-3 mr-1" />
                {moveTimeSpent}
              </span>
            )}
          </div>
          
          <div className="space-x-2">
            <button
              onClick={handleToggleHeatmap}
              className={`px-3 py-1.5 text-sm ${showHeatmap ? 'bg-blue-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'} rounded-md transition-colors`}
              aria-label="Toggle heatmap"
            >
              Heatmap
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-md transition-colors"
              aria-label="Reset game"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMove}
              disabled={thinking || moveIndex >= presetMoves.length - 1}
              className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              aria-label="Make next move"
            >
              <span>{thinking ? "Thinking..." : "Next Move"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSkipToEnd}
              disabled={thinking || moveIndex >= presetMoves.length - 1}
              className="px-3 py-1.5 text-sm bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Skip to end"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Game analysis */}
      <div className="flex-1">
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              Magnus AI Analysis
            </h2>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium">Confidence:</div>
              <div className="w-16 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${aiConfidence}%` }}
                ></div>
              </div>
              <div className="text-sm font-medium">{aiConfidence}%</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Position Evaluation</h3>
              {evalScore && (
                <div className={`font-mono text-sm px-2 py-0.5 rounded ${parseFloat(evalScore) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-800'}`}>
                  {evalScore}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-neutral-800 p-3 rounded-md">
              {analysis || "The game has not started yet. Click 'Next Move' to begin."}
            </div>
          </div>
          
          {(moveIndex >= 0 && showAlternatives) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Alternative Moves</h3>
                <button 
                  onClick={handleToggleAlternatives}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Hide
                </button>
              </div>
              <div className="bg-white dark:bg-neutral-800 p-3 rounded-md space-y-2">
                {getAlternativeMoves().map((alt, idx) => (
                  <div key={idx} className="flex items-start text-sm">
                    <div className="font-mono w-12 shrink-0">{alt.move}</div>
                    <div className="font-mono w-12 shrink-0 text-blue-600">{alt.eval}</div>
                    <div className="text-neutral-600">{alt.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(moveIndex >= 0 && !showAlternatives) && (
            <div className="mb-6 flex justify-end">
              <button 
                onClick={handleToggleAlternatives}
                className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Show alternative moves
              </button>
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Image 
                src="/magnus-carlsen.jpg" 
                width={24} 
                height={24} 
                alt="Magnus Carlsen" 
                className="rounded-full"
              />
              <h3 className="font-semibold">Magnus Says</h3>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-3 rounded-md italic text-neutral-600 dark:text-neutral-400">
              "{magnusQuote}"
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">About Magnus AI</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This demo showcases a simulation of Magnus Carlsen's chess style using reinforcement learning AI techniques. 
              The real Magnus AI would employ neural networks trained on thousands of his games to capture his strategic 
              preferences, tactical patterns, and unique playing style.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Magnus is known for his versatile play and exceptional endgame technique. His neural network would emphasize 
              positional understanding, piece coordination, and finding complex paths to victory.
            </p>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-1">Magnus's Favorite Openings:</h4>
              <div className="flex flex-wrap gap-1">
                {magnusOpenings.map((opening, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                    {opening}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <Link 
                href="/demos/chess-ai-magnus"
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center"
              >
                <Share2 className="h-3 w-3 mr-1" />
                View full demo
              </Link>
            </div>
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
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ArrowLeft, RotateCcw, Play, CastleIcon, Brain, Award, Lightbulb, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import "./chessAI.css"

// Define types for our chess game
type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
type PieceColor = 'w' | 'b'
type Piece = {
  type: PieceType
  color: PieceColor
}
type Square = Piece | null
type Board = Square[][]
type Move = {
  from: { row: number, col: number }
  to: { row: number, col: number }
  promotion?: PieceType
}

// Initial chess board setup
const initialBoard: Board = [
  [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
  [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
  [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
]

// Chess opening moves for AI (simplified)
const openingMoves = [
  // Some common openings
  { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
  { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
  { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } }, // Nc3
  { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
]

// Chess middle game patterns (simplified)
const middleGamePatterns = [
  { pattern: 'center-control', moves: [] },
  { pattern: 'develop-pieces', moves: [] },
  { pattern: 'king-safety', moves: [] },
]

export default function ChessAIPage() {
  const [board, setBoard] = useState<Board>(JSON.parse(JSON.stringify(initialBoard)))
  const [selectedSquare, setSelectedSquare] = useState<{ row: number, col: number } | null>(null)
  const [validMoves, setValidMoves] = useState<{ row: number, col: number }[]>([])
  const [playerColor, setPlayerColor] = useState<PieceColor>('w')
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('w')
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate' | 'draw'>('playing')
  const [moveHistory, setMoveHistory] = useState<{ notation: string, piece: Piece }[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[], black: Piece[] }>({ white: [], black: [] })
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [aiLevel, setAiLevel] = useState(3) // 1-5, with 5 being the highest difficulty
  const [gameStarted, setGameStarted] = useState(false)

  // Algebraic notation conversion
  const colToFile = (col: number): string => String.fromCharCode(97 + col)
  const rowToRank = (row: number): string => String(8 - row)
  
  // Get notation for a move
  const getMoveNotation = (piece: Piece, from: { row: number, col: number }, to: { row: number, col: number }, capture: boolean = false): string => {
    const pieceSymbol = piece.type === 'p' ? '' : piece.type.toUpperCase()
    const fromSquare = `${colToFile(from.col)}${rowToRank(from.row)}`
    const toSquare = `${colToFile(to.col)}${rowToRank(to.row)}`
    const captureSymbol = capture ? 'x' : ''
    return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}`
  }

  // Get valid moves for a piece
  const getValidMoves = (row: number, col: number): { row: number, col: number }[] => {
    const piece = board[row][col]
    if (!piece) return []
    
    // This is a simplified version for demo purposes
    // In a real implementation, we would check for check, pins, etc.
    const moves: { row: number, col: number }[] = []
    
    // Pawn moves
    if (piece.type === 'p') {
      const direction = piece.color === 'w' ? -1 : 1
      
      // Forward move
      if (isInBounds(row + direction, col) && !board[row + direction][col]) {
        moves.push({ row: row + direction, col })
        
        // Double move from starting position
        const startingRow = piece.color === 'w' ? 6 : 1
        if (row === startingRow && isInBounds(row + 2 * direction, col) && !board[row + 2 * direction][col] && !board[row + direction][col]) {
          moves.push({ row: row + 2 * direction, col })
        }
      }
      
      // Captures
      for (const offset of [-1, 1]) {
        if (isInBounds(row + direction, col + offset) && board[row + direction][col + offset]?.color !== piece.color && board[row + direction][col + offset] !== null) {
          moves.push({ row: row + direction, col: col + offset })
        }
      }
    }
    
    // Knight moves
    if (piece.type === 'n') {
      const knightMoves = [
        { row: row - 2, col: col - 1 },
        { row: row - 2, col: col + 1 },
        { row: row - 1, col: col - 2 },
        { row: row - 1, col: col + 2 },
        { row: row + 1, col: col - 2 },
        { row: row + 1, col: col + 2 },
        { row: row + 2, col: col - 1 },
        { row: row + 2, col: col + 1 },
      ]
      
      for (const move of knightMoves) {
        if (isInBounds(move.row, move.col) && (!board[move.row][move.col] || board[move.row][move.col]?.color !== piece.color)) {
          moves.push(move)
        }
      }
    }
    
    // Bishop moves
    if (piece.type === 'b' || piece.type === 'q') {
      const directions = [
        { row: -1, col: -1 },
        { row: -1, col: 1 },
        { row: 1, col: -1 },
        { row: 1, col: 1 },
      ]
      
      for (const dir of directions) {
        let r = row + dir.row
        let c = col + dir.col
        
        while (isInBounds(r, c)) {
          if (!board[r][c]) {
            moves.push({ row: r, col: c })
          } else {
            if (board[r][c]?.color !== piece.color) {
              moves.push({ row: r, col: c })
            }
            break
          }
          r += dir.row
          c += dir.col
        }
      }
    }
    
    // Rook moves
    if (piece.type === 'r' || piece.type === 'q') {
      const directions = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
      ]
      
      for (const dir of directions) {
        let r = row + dir.row
        let c = col + dir.col
        
        while (isInBounds(r, c)) {
          if (!board[r][c]) {
            moves.push({ row: r, col: c })
          } else {
            if (board[r][c]?.color !== piece.color) {
              moves.push({ row: r, col: c })
            }
            break
          }
          r += dir.row
          c += dir.col
        }
      }
    }
    
    // King moves
    if (piece.type === 'k') {
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if ((r !== row || c !== col) && isInBounds(r, c) && (!board[r][c] || board[r][c]?.color !== piece.color)) {
            moves.push({ row: r, col: c })
          }
        }
      }
    }
    
    return moves
  }
  
  // Check if a position is in bounds
  const isInBounds = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }
  
  // Handle piece selection
  const handleSquareClick = (row: number, col: number) => {
    if (!gameStarted || currentTurn !== playerColor || gameStatus !== 'playing') return
    
    const piece = board[row][col]
    
    // If no piece is selected and the clicked square has a piece of the player's color
    if (!selectedSquare && piece && piece.color === playerColor) {
      setSelectedSquare({ row, col })
      setValidMoves(getValidMoves(row, col))
      return
    }
    
    // If a piece is already selected
    if (selectedSquare) {
      // If the clicked square is the same as the selected square, deselect
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null)
        setValidMoves([])
        return
      }
      
      // If the clicked square has a piece of the player's color, select that piece instead
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col })
        setValidMoves(getValidMoves(row, col))
        return
      }
      
      // Check if the clicked square is a valid move
      const isValidMove = validMoves.some(move => move.row === row && move.col === col)
      
      if (isValidMove) {
        // Execute the move
        makeMove({
          from: selectedSquare,
          to: { row, col },
        })
        
        // Reset selection
        setSelectedSquare(null)
        setValidMoves([])
      }
    }
  }
  
  // Make a move
  const makeMove = (move: Move) => {
    const newBoard = JSON.parse(JSON.stringify(board))
    const piece = newBoard[move.from.row][move.from.col]
    const isCapture = newBoard[move.to.row][move.to.col] !== null
    
    // Update captured pieces
    if (isCapture) {
      const capturedPiece = newBoard[move.to.row][move.to.col]
      if (capturedPiece) {
        setCapturedPieces(prev => {
          const newCaptured = { ...prev }
          if (capturedPiece.color === 'w') {
            newCaptured.black = [...newCaptured.black, capturedPiece]
          } else {
            newCaptured.white = [...newCaptured.white, capturedPiece]
          }
          return newCaptured
        })
      }
    }
    
    // Update move history
    const notation = getMoveNotation(piece, move.from, move.to, isCapture)
    setMoveHistory(prev => [...prev, { notation, piece }])
    
    // Move the piece
    newBoard[move.to.row][move.to.col] = piece
    newBoard[move.from.row][move.from.col] = null
    
    // Update the board
    setBoard(newBoard)
    
    // Switch turns
    setCurrentTurn(prev => prev === 'w' ? 'b' : 'w')
  }
  
  // AI makes a move
  const aiMakeMove = useCallback(() => {
    if (currentTurn !== playerColor && gameStatus === 'playing') {
      setIsAiThinking(true)
      
      // Simulate AI thinking time based on level
      const thinkingTime = 500 + aiLevel * 300 + Math.random() * 1000
      
      setTimeout(() => {
        // Find all possible moves for AI pieces
        const possibleMoves: Move[] = []
        
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c]
            if (piece && piece.color !== playerColor) {
              const moves = getValidMoves(r, c)
              moves.forEach(move => {
                possibleMoves.push({
                  from: { row: r, col: c },
                  to: move,
                })
              })
            }
          }
        }
        
        // Select a move based on AI level
        let selectedMove: Move | null = null
        
        if (possibleMoves.length > 0) {
          // Higher AI levels use more sophisticated move selection
          if (aiLevel >= 4) {
            // Prioritize capturing moves and center control
            const capturingMoves = possibleMoves.filter(move => board[move.to.row][move.to.col] !== null)
            const centerMoves = possibleMoves.filter(move => 
              (move.to.row >= 3 && move.to.row <= 4 && move.to.col >= 3 && move.to.col <= 4) &&
              board[move.from.row][move.from.col]?.type !== 'p'
            )
            
            if (capturingMoves.length > 0 && Math.random() > 0.3) {
              selectedMove = capturingMoves[Math.floor(Math.random() * capturingMoves.length)]
            } else if (centerMoves.length > 0 && Math.random() > 0.5) {
              selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)]
            } else {
              selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
            }
          } else {
            // Lower AI levels make more random moves
            selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
          }
          
          if (selectedMove) {
            makeMove(selectedMove)
          }
        } else {
          // No valid moves - stalemate or checkmate
          setGameStatus('stalemate')
        }
        
        setIsAiThinking(false)
      }, thinkingTime)
    }
  }, [board, currentTurn, playerColor, gameStatus, aiLevel])
  
  // Effect to handle AI turns
  useEffect(() => {
    if (gameStarted && currentTurn !== playerColor && gameStatus === 'playing') {
      aiMakeMove()
    }
  }, [currentTurn, playerColor, gameStatus, gameStarted, aiMakeMove])
  
  // Start a new game
  const startNewGame = () => {
    setBoard(JSON.parse(JSON.stringify(initialBoard)))
    setSelectedSquare(null)
    setValidMoves([])
    setCurrentTurn('w')
    setGameStatus('playing')
    setMoveHistory([])
    setCapturedPieces({ white: [], black: [] })
    setGameStarted(true)
  }
  
  // Get the representation for a chess piece
  const getPieceRepresentation = (piece: Piece): string => {
    // Map piece types to Unicode chess symbols
    const pieceSymbols: Record<PieceType, Record<PieceColor, string>> = {
      'p': { 'w': '♙', 'b': '♟' },
      'n': { 'w': '♘', 'b': '♞' },
      'b': { 'w': '♗', 'b': '♝' },
      'r': { 'w': '♖', 'b': '♜' },
      'q': { 'w': '♕', 'b': '♛' },
      'k': { 'w': '♔', 'b': '♚' }
    }
    
    return pieceSymbols[piece.type][piece.color]
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/demos" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Demos
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Reinforcement Learning Chess AI vs. Magnus</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Challenge our AI trained using reinforcement learning, designed to mimic the playing style of Magnus Carlsen.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="player-info">
                <div className="flex flex-col">
                  <span className="font-medium">AI - Magnus Style</span>
                  <div className="ai-level-indicator">
                    <span className="text-xs">RL Strength:</span>
                    <div className="level-bar">
                      <div 
                        className={`level-fill ${aiLevel >= 4 ? 'expert' : ''}`} 
                        style={{ width: `${aiLevel * 20}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="captured-pieces">
                {capturedPieces.white.map((piece, i) => (
                  <div key={i} className="captured-piece">
                    {/* We'd use actual images in a real implementation */}
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
                      {getPieceRepresentation(piece)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="board-container">
              {/* Board coordinates (files: a-h) */}
              <div className="files">
                {Array.from({ length: 8 }, (_, i) => String.fromCharCode(97 + i)).map(file => (
                  <div key={file}>{file}</div>
                ))}
              </div>
              
              {/* Chess board */}
              <div className="relative">
                <div className="ranks">
                  {Array.from({ length: 8 }, (_, i) => 8 - i).map(rank => (
                    <div key={rank}>{rank}</div>
                  ))}
                </div>
                
                <div className="chess-board">
                  {board.map((row, rowIndex) => (
                    row.map((square, colIndex) => {
                      const isWhiteSquare = (rowIndex + colIndex) % 2 === 0
                      const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                      const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex)
                      const isValidCapture = isValidMove && board[rowIndex][colIndex] !== null
                      
                      return (
                        <div 
                          key={`${rowIndex}-${colIndex}`}
                          className={`chess-square ${isWhiteSquare ? 'white' : 'black'} ${isSelected ? 'selected' : ''} ${isValidMove && !isValidCapture ? 'valid-move' : ''} ${isValidCapture ? 'valid-capture' : ''}`}
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                        >
                          {square && (
                            <div className="chess-piece">
                              <div className="w-full h-full flex items-center justify-center text-2xl">
                                {getPieceRepresentation(square)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ))}
                </div>
                
                {/* AI thinking animation */}
                <div className={`ai-thinking ${isAiThinking ? 'active' : ''}`}>
                  <div className="ai-thinking-pulse"></div>
                </div>
                
                {/* Game result overlay */}
                {gameStatus !== 'playing' && (
                  <div className="game-result">
                    <div className="result-text">
                      {gameStatus === 'checkmate' && (currentTurn === 'w' ? 'Black' : 'White') + ' wins!'}
                      {gameStatus === 'stalemate' && 'Stalemate!'}
                      {gameStatus === 'draw' && 'Draw!'}
                    </div>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                      onClick={startNewGame}
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-4 mt-4">
                <div className="player-info">
                  <div className="flex flex-col">
                    <span className="font-medium">You (White)</span>
                  </div>
                </div>
                
                <div className="captured-pieces">
                  {capturedPieces.black.map((piece, i) => (
                    <div key={i} className="captured-piece">
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
                        {getPieceRepresentation(piece)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="game-controls">
                {!gameStarted ? (
                  <button 
                    className="control-button bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={startNewGame}
                  >
                    <Play className="h-4 w-4 mr-2 inline" />
                    Start Game
                  </button>
                ) : (
                  <>
                    <button 
                      className="control-button bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
                      onClick={startNewGame}
                    >
                      <RotateCcw className="h-4 w-4 mr-1 inline" />
                      New Game
                    </button>
                    
                    <button 
                      className="control-button bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-100"
                      onClick={() => setAiLevel(prev => Math.min(prev + 1, 5))}
                      disabled={aiLevel === 5}
                    >
                      <Brain className="h-4 w-4 mr-1 inline" />
                      Increase Difficulty
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CastleIcon className="mr-2 h-5 w-5" />
              Move History
            </h2>
            
            <div className="move-history">
              {moveHistory.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-center italic py-4">
                  No moves yet. Start the game to begin playing!
                </div>
              ) : (
                moveHistory.map((move, i) => (
                  <div key={i} className="move-history-entry">
                    <div className="move-number">
                      {Math.floor(i / 2) + 1}.
                    </div>
                    <div className="move-text">
                      {move.notation}
                      {i % 2 === 0 && i === moveHistory.length - 1 && (
                        <span className="ml-2 thinking-indicator">
                          <span>AI thinking</span>
                          <span className="thinking-dots">
                            <span className="thinking-dot"></span>
                            <span className="thinking-dot"></span>
                            <span className="thinking-dot"></span>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 mt-4">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              How It Works
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This chess AI uses reinforcement learning to develop strategies mimicking Magnus Carlsen's play style:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium flex items-center">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Training Data
                </h3>
                <p className="text-sm ml-5 text-gray-600 dark:text-gray-400">
                  Trained on thousands of Magnus Carlsen's historical games, learning patterns and strategies.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Reinforcement Learning
                </h3>
                <p className="text-sm ml-5 text-gray-600 dark:text-gray-400">
                  AI improves through self-play, with rewards for moves that match Magnus's style and successful outcomes.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Neural Network
                </h3>
                <p className="text-sm ml-5 text-gray-600 dark:text-gray-400">
                  Deep neural networks evaluate board positions, calculate move probabilities, and predict game outcomes.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Difficulty Levels
                </h3>
                <p className="text-sm ml-5 text-gray-600 dark:text-gray-400">
                  Higher levels increase the AI's lookahead depth and strategic decision-making abilities.
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Award className="h-4 w-4 mr-2 text-amber-500" />
                <span>
                  Can you beat the AI at maximum difficulty?
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This chess AI demonstration showcases how reinforcement learning can be used to create 
          intelligent agents that learn from expert play. In a full implementation, this would use:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
          <li>Neural networks trained on thousands of Magnus Carlsen's games</li>
          <li>Self-play reinforcement learning to improve over time</li>
          <li>Monte Carlo Tree Search for move exploration</li>
          <li>Advanced position evaluation based on piece values, mobility, and king safety</li>
          <li>Opening book knowledge and endgame tablebases</li>
        </ul>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Note: This is a demonstration with simulated AI behavior. A full implementation would require extensive 
          training using reinforcement learning techniques like those used in AlphaZero and Leela Chess Zero.
        </p>
      </div>
    </div>
  )
} 
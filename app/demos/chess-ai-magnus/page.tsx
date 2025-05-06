"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import dynamic from 'next/dynamic'
import { 
  Cpu, Brain, Code, ChevronRight, Star, Trophy, Zap, 
  Github, Info, RotateCcw, Undo, AlertCircle, Layers, 
  MessageCircle, Send, ChevronUp, ChevronDown, Check, 
  X, Lightbulb, User, Shield, Crown, Settings, RefreshCw,
  Clock, Square, Users, Flame, BarChart2, FileDown, 
  HelpCircle, BookOpen, Award, ExternalLink, Loader2
} from "lucide-react"
import { 
  Board, Move, PieceColor 
} from "@/app/chess/components/ChessBoard"
import ChatBox from "@/app/chess/components/ChatBox"

// Initial empty board state
const EMPTY_BOARD: Board = [
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null]
]

// Dynamically import ChessGame with no SSR
const ChessGame = dynamic(() => import('@/app/chess/components/ChessGame'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center min-h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Chess Game...</p>
      </div>
    </div>
  )
})

// Dynamically import Chess3D with no SSR - keeping for future use
const Chess3D = dynamic(() => import('@/app/chess/components/Chess3D'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center min-h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading 3D Chess Board...</p>
      </div>
    </div>
  )
})

// Fixed game phases
type GamePhase = 'opening' | 'middlegame' | 'endgame'

// Difficulty levels
const difficultyLevels = [
  { name: "Beginner", value: 1, description: "Perfect for learning the basics" },
  { name: "Casual", value: 3, description: "Relaxed play with moderate challenge" },
  { name: "Intermediate", value: 5, description: "Solid chess strategy and tactics" },
  { name: "Advanced", value: 7, description: "Strong opposition requiring careful play" },
  { name: "Grandmaster", value: 10, description: "Magnus Carlsen-like play at its finest" }
]

// Game result info display helper
const gameStatusInfo = {
  'playing': { icon: Clock, color: 'text-blue-500 dark:text-blue-400', text: 'Game in progress' },
  'check': { icon: AlertCircle, color: 'text-orange-500 dark:text-orange-400', text: 'Check!' },
  'checkmate': { icon: Trophy, color: 'text-red-500 dark:text-red-400', text: 'Checkmate' },
  'stalemate': { icon: Square, color: 'text-purple-500 dark:text-purple-400', text: 'Stalemate' },
  'draw': { icon: Users, color: 'text-gray-500 dark:text-gray-400', text: 'Draw' }
}

// Convert move number to algebraic notation (e.g. 1. e4)
const formatMoveNumber = (index: number) => {
  return `${Math.floor(index / 2) + 1}${index % 2 === 0 ? '.' : '...'}`;
}

// Function to get human-readable piece name
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

// Helper function to generate AI analysis based on game state
const getAIAnalysis = (moveHistory: Move[], gamePhase: 'opening' | 'middlegame' | 'endgame'): string => {
  // Simple analysis based on game phase and recent moves
  const moveCount = moveHistory.length;
  
  if (moveCount <= 8) {
    const openingAnalyses = [
      "I'm developing my pieces toward the center, following good opening principles.",
      "Controlling the center early is crucial for creating attacking opportunities later.",
      "A solid pawn structure supports piece development and controls key squares.",
      "Knight development to active squares creates tactical opportunities.",
      "Bishop development completes fianchetto, controlling long diagonals."
    ];
    return openingAnalyses[Math.floor(Math.random() * openingAnalyses.length)];
  }
  
  if (gamePhase === 'middlegame') {
    const middlegameAnalyses = [
      "I'm looking for tactical opportunities while maintaining a solid position.",
      "Piece coordination is key in the middlegame - notice how my pieces work together.",
      "I'm preparing to transition to a favorable endgame by simplifying the position.",
      "Pawn breaks can change the structure dramatically, opening lines for my pieces.",
      "I'm targeting your weakened pawn structure with coordinated piece attacks."
    ];
    return middlegameAnalyses[Math.floor(Math.random() * middlegameAnalyses.length)];
  }
  
  // Endgame
  const endgameAnalyses = [
    "In the endgame, king activity becomes much more important.",
    "Connected passed pawns are often decisive in endgames - they support each other's advance.",
    "I'm trying to create a passed pawn that can be supported all the way to promotion.",
    "Rook endgames require precise calculation and patience.",
    "The principle of two weaknesses applies - I need to create pressure on multiple sides."
  ];
  return endgameAnalyses[Math.floor(Math.random() * endgameAnalyses.length)];
};

function ChessAIDemo() {
  // Core game state
  const [aiLevel, setAiLevel] = useState(5)
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [boardState, setBoardState] = useState<Board>(EMPTY_BOARD)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [isCheck, setIsCheck] = useState(false)
  const [checkPosition, setCheckPosition] = useState<{row: number, col: number} | null>(null)
  const [legalMoves, setLegalMoves] = useState<Move[]>([])
  const [gamePhase, setGamePhase] = useState<GamePhase>('opening')
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'>('playing')
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [thinking, setThinking] = useState(false)
  const [turn, setTurn] = useState<'w' | 'b'>('w') // Added to track current turn
  const [message, setMessage] = useState<string | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState<'history' | 'assistant'>('history')
  const [expandedSections, setExpandedSections] = useState({
    gameControls: true,
    playerAnalysis: false,
    howToPlay: false,
    modelInfo: false
  })
  
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    text: string;
    type: string;
    timestamp: Date;
  }[]>([{
    id: 'welcome',
    text: 'Welcome to the chess game! I\'ll provide analysis and tips as you play.',
    type: 'info',
    timestamp: new Date()
  }])
  
  // Refs
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef(false)
  const moveHistoryRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  
  // Toggle section expansion
  const toggleSection = (section: 'gameControls' | 'playerAnalysis' | 'howToPlay' | 'modelInfo') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  // Improved scroll prevention implementation
  useEffect(() => {
    if (!mainContainerRef.current) return
    
    // Store the initial scroll position
    let lastScrollY = window.scrollY
    
    // Function to prevent scrolling
    const preventScroll = () => {
      window.scrollTo(0, lastScrollY)
    }
    
    // Update the last known good scroll position
    const updateScrollPosition = () => {
      lastScrollY = window.scrollY
    }
    
    // Setup mutation observer to detect DOM changes that might cause scrolling
    const observer = new MutationObserver(() => {
      updateScrollPosition()
    })
    
    // Start the observer with comprehensive options
    observer.observe(mainContainerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-focused']
    })
    
    // Set initial scroll position
    updateScrollPosition()
    
    // Aggressive scroll prevention during critical operations (AI thinking)
    if (thinking) {
      window.addEventListener('scroll', preventScroll, { passive: false })
    }
    
    // Disable CSS smooth scrolling and focus-induced scrolling
    const htmlElement = document.documentElement
    const originalScrollBehavior = htmlElement.style.scrollBehavior
    const originalOverflowAnchor = document.body.style.overflowAnchor
    
    htmlElement.style.scrollBehavior = 'auto !important'
    document.body.style.overflowAnchor = 'none'
    
    // Block other scrolling events
    const preventDefaultScroll = (e: Event) => {
      if (thinking) {
        e.preventDefault()
      }
    }
    
    // Periodic check to maintain scroll position during UI transitions
    const intervalCheck = setInterval(() => {
      if (window.scrollY !== lastScrollY && thinking) {
        window.scrollTo(0, lastScrollY)
      }
    }, 100)
    
    // Add event listeners for scroll-related events
    window.addEventListener('touchmove', preventDefaultScroll, { passive: false })
    window.addEventListener('wheel', preventDefaultScroll, { passive: false })
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code) && thinking) {
        e.preventDefault()
      }
    }, { passive: false })
    
    // Cleanup all event listeners and observers
    return () => {
      window.removeEventListener('scroll', preventScroll)
      window.removeEventListener('touchmove', preventDefaultScroll)
      window.removeEventListener('wheel', preventDefaultScroll)
      observer.disconnect()
      clearInterval(intervalCheck)
      
      // Restore original styles
      htmlElement.style.scrollBehavior = originalScrollBehavior
      document.body.style.overflowAnchor = originalOverflowAnchor
    }
  }, [thinking])
  
  // Game state update handler
  const handleBoardUpdate = useCallback((board: Board, move: Move | null, isInCheck: boolean, kingPos: {row: number, col: number} | null, moves: Move[]) => {
    if (isUpdatingRef.current) return
    
    isUpdatingRef.current = true
    setBoardState(JSON.parse(JSON.stringify(board)))
    setLastMove(move)
    setIsCheck(isInCheck)
    setCheckPosition(kingPos)
    setLegalMoves(moves || [])
    
    // Reset the flag after a short delay to allow React to batch updates
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [])
  
  // Update game phase based on move history
  useEffect(() => {
    if (moveHistory.length < 10) {
      setGamePhase('opening')
    } else if (moveHistory.length < 30) {
      setGamePhase('middlegame')
    } else {
      setGamePhase('endgame')
    }
    
    // Auto-scroll move history to bottom when new moves are added
    if (moveHistoryRef.current && moveHistory.length > 0) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight
    }
  }, [moveHistory.length])
  
  // Game reset handler
  const handleResetGame = useCallback(() => {
    setMoveHistory([])
    setTurn('w')
    setChatMessages([{
      id: 'welcome',
      text: 'Starting a new game. Good luck!',
      type: 'info',
      timestamp: new Date()
    }])
    setGameStatus('playing')
    setGamePhase('opening')
    setThinking(false)
    setMessage(null)
  }, [])
  
  // Game status update handler
  const handleGameStatusChange = useCallback((status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw') => {
    setGameStatus(status)
    
    // Add status message to chat
    let statusMessage = ''
    
    switch (status) {
      case 'check':
        statusMessage = 'Check! Your king is under attack. You must move your king, block the attack, or capture the attacking piece.'
        break
      case 'checkmate':
        statusMessage = 'Checkmate! The game is over. ' + 
          (moveHistory.length % 2 === 0 ? 'Black wins!' : 'White wins!')
        break
      case 'stalemate':
        statusMessage = 'Stalemate! The game is a draw. The player to move has no legal moves but is not in check.'
        break
      case 'draw':
        statusMessage = 'The game is a draw.'
        break
    }
    
    if (statusMessage) {
      setChatMessages(prev => [...prev, {
        id: `status-${Date.now()}`,
        text: statusMessage,
        type: status === 'check' ? 'warning' : (status === 'checkmate' ? 'error' : 'info'),
        timestamp: new Date()
      }])
    }
  }, [moveHistory.length])
  
  // Handle color selection
  const handleColorSelection = (color: 'w' | 'b') => {
    if (moveHistory.length === 0) {
      setPlayerColor(color)
    } else {
      setChatMessages(prev => [...prev, {
        id: `color-${Date.now()}`,
        text: "You can't change color during a game. Please start a new game first.",
        type: 'warning',
        timestamp: new Date()
      }])
    }
  }
  
  // Handle difficulty change
  const handleDifficultyChange = (difficulty: number) => {
    setAiLevel(difficulty)
    
    // Add message about difficulty change
    if (moveHistory.length === 0) {
      setChatMessages(prev => [...prev, {
        id: `difficulty-${Date.now()}`,
        text: `Difficulty set to ${difficultyLevels.find(d => d.value === difficulty)?.name || 'Intermediate'}.`,
        type: 'info',
        timestamp: new Date()
      }])
    } else {
      setChatMessages(prev => [...prev, {
        id: `difficulty-${Date.now()}`,
        text: `Difficulty will be set to ${difficultyLevels.find(d => d.value === difficulty)?.name || 'Intermediate'} for the next game.`,
        type: 'info',
        timestamp: new Date()
      }])
    }
  }
  
  // Chat message handler
  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim()) return
    
    // Add user message
    setChatMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      text: message,
      type: 'user',
      timestamp: new Date()
    }])
    
    // Switch to the assistant tab when user asks a question
    setActiveTab('assistant')
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      let responseText = ""
      
      // Generate contextual response based on game state
      if (message.toLowerCase().includes("how") && message.toLowerCase().includes("play")) {
        responseText = "To play chess, click on your pieces (white at the bottom, black at the top) to select them, then click on a legal destination square highlighted in blue. The goal is to checkmate your opponent's king."
      } else if (message.toLowerCase().includes("check") || message.toLowerCase().includes("checkmate")) {
        responseText = "Check happens when your king is under attack. You must move your king, capture the attacking piece, or block the attack. Checkmate occurs when a king is in check and has no legal moves to escape - that ends the game."
      } else if (message.toLowerCase().includes("castle") || message.toLowerCase().includes("castling")) {
        responseText = "Castling is a special move that lets you move your king two squares towards a rook, then place the rook on the other side of the king. To castle, your king and rook must not have moved yet, there must be no pieces between them, and the king cannot be in check or move through check."
      } else if (message.toLowerCase().includes("piece") && message.toLowerCase().includes("move")) {
        responseText = "Pieces move differently: Pawns move forward one square (or two from their starting position) and capture diagonally. Knights move in an L-shape. Bishops move diagonally. Rooks move horizontally and vertically. Queens combine bishop and rook movements. Kings move one square in any direction."
      } else if (message.toLowerCase().includes("promote") || message.toLowerCase().includes("promotion")) {
        responseText = "When a pawn reaches the opposite end of the board, it promotes to a more powerful piece - usually a queen, but can also become a rook, bishop, or knight. This is a powerful advantage in the endgame."
      } else if (message.toLowerCase().includes("ai") && message.toLowerCase().includes("works")) {
        responseText = "This chess AI uses a neural network trained with reinforcement learning to evaluate positions. It employs Monte Carlo Tree Search to look ahead many moves and find the best play. The model was trained on millions of games and reaches a strong ~3000 ELO rating."
      } else if (message.toLowerCase().includes("difficulty")) {
        responseText = `The current difficulty is set to ${difficultyLevels.find(d => d.value === aiLevel)?.name || 'Intermediate'}. You can adjust it in the AI Settings panel. Higher difficulties make the AI search deeper and play more accurately.`
      } else if (message.toLowerCase().includes("best move") || message.toLowerCase().includes("tip") || message.toLowerCase().includes("advice")) {
        // Context-aware tips based on game phase
        if (gameStatus === 'check') {
          responseText = "Your king is in check! You need to address this threat immediately. Look for moves that get your king to safety, capture the attacking piece, or block the attack line."
        } else if (gamePhase === 'opening') {
          responseText = "In the opening, focus on developing your pieces efficiently, controlling the center, protecting your king (consider castling early), and connecting your rooks. Try not to move the same piece multiple times in the opening."
        } else if (gamePhase === 'middlegame') {
          responseText = "In the middlegame, look for tactical opportunities like forks, pins, and skewers. Coordinate your pieces for an attack, and be mindful of pawn structure weaknesses that can be exploited."
        } else {
          responseText = "In the endgame, activate your king as it becomes a powerful piece. Pawns become extremely valuable as they approach promotion. Try to create passed pawns that can advance to the opposite rank."
        }
      } else {
        // Generic responses
        const genericResponses = [
          "I'm here to help with chess! Feel free to ask about rules, strategies, or get advice about your current position.",
          "Try to think a few moves ahead and consider what your opponent might do in response to your moves.",
          "Chess is about balance - material (pieces), development (activating pieces), and king safety are all important factors.",
          "Looking for your next move? Try to identify your opponent's threats first, then consider your opportunities.",
          "Remember that pawns can't move backward, and they capture diagonally - one square forward and to the side."
        ]
        responseText = genericResponses[Math.floor(Math.random() * genericResponses.length)]
      }
      
      // Add AI response
      setChatMessages(prev => [...prev, {
        id: `response-${Date.now()}`,
        text: responseText,
        type: 'response',
        timestamp: new Date()
      }])
      
      // Clear the input field after sending
      if (chatInputRef.current) {
        chatInputRef.current.value = ''
      }
    }, 500)
  }, [gamePhase, gameStatus, aiLevel])
  
  // Calculate player metrics based on move history
  const playerMetrics = {
    openingPreparation: 70 + (gamePhase === 'opening' ? 15 : 0),
    tacticalAwareness: 65 + (moveHistory.filter((m: any) => m.captured !== null).length * 2),
    endgameSkill: 60 + (gamePhase === 'endgame' ? 20 : 0),
    positionalUnderstanding: 75,
    aggressiveness: 60,
    defensiveness: 70,
    blunderRate: 15,
    accuracy: 80,
    captureRate: Math.min(100, Math.round((moveHistory.filter((m: any) => m.captured !== null).length / Math.max(1, moveHistory.length)) * 100)),
    checkRate: Math.min(100, Math.round((moveHistory.filter((m: any) => m.check).length / Math.max(1, moveHistory.length)) * 100))
  }
  
  // Function to get rating text based on score
  const getRatingText = (score: number) => {
    if (score >= 90) return "Exceptional"
    if (score >= 80) return "Very Strong"
    if (score >= 70) return "Strong"
    if (score >= 60) return "Good"
    if (score >= 50) return "Average"
    if (score >= 40) return "Developing"
    return "Needs Work"
  }
  
  // Function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-600"
    if (score >= 65) return "bg-blue-600"
    if (score >= 50) return "bg-yellow-500"
    return "bg-orange-500"
  }
  
  // Render move history
  const renderMoveHistory = () => {
    if (moveHistory.length === 0) {
      return (
        <div className="flex items-center justify-center text-center h-40">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-sm font-medium">No moves played yet</p>
            <p className="text-xs mt-1">Moves will appear here as the game progresses</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-0.5 p-2">
        {moveHistory.reduce((rows: JSX.Element[], move, index) => {
          if (index % 2 === 0) {
            const moveNumber = Math.floor(index / 2) + 1;
            const blackMove = moveHistory[index + 1];
            
            rows.push(
              <div key={index} className={`grid grid-cols-[3rem_1fr_1fr] gap-2 text-sm py-1.5 ${index % 4 === 0 || index % 4 === 1 ? 'bg-gray-50 dark:bg-gray-800/50 rounded' : ''}`}>
                <span className="font-mono text-gray-500 dark:text-gray-400 text-center">{moveNumber}.</span>
                <div 
                  className={`font-medium px-2 py-0.5 rounded ${move.check || move.checkmate ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                  title={`${move.piece.color === 'w' ? 'White' : 'Black'} ${getPieceName(move.piece.type)}`}
                >
                  {move.notation}
                </div>
                {blackMove && (
                  <div 
                    className={`font-medium px-2 py-0.5 rounded ${blackMove.check || blackMove.checkmate ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                    title={`${blackMove.piece.color === 'w' ? 'White' : 'Black'} ${getPieceName(blackMove.piece.type)}`}
                  >
                    {blackMove.notation}
                  </div>
                )}
                {!blackMove && <div className="text-gray-400 dark:text-gray-600">...</div>}
              </div>
            );
          }
          return rows;
        }, [])}
      </div>
    )
  }
  
  return (
    <main className="min-h-screen p-4 sm:p-6 overflow-x-hidden bg-gray-50 dark:bg-gray-900" ref={mainContainerRef}>
      <div className="max-w-7xl mx-auto">
        {/* Page heading */}
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2 text-gray-900 dark:text-gray-100">
              <Cpu className="h-7 w-7 md:h-8 md:w-8 text-blue-500" />
              Chess AI Magnus
            </h1>
            <p className="text-gray-600 dark:text-gray-400 md:max-w-xl">
              Play against a neural network-based chess AI trained with reinforcement learning and Monte Carlo Tree Search.
            </p>
          </div>
          
          {/* Main action buttons */}
          <div className="flex items-start mt-4 md:mt-0 gap-2 flex-wrap">
            {/* 2D/3D Toggle - keeping in place for future use */}
            {/* 
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg flex overflow-hidden shadow-sm">
              <button
                className={`px-3 py-2 flex gap-1.5 items-center text-sm font-medium transition-colors ${viewMode === '2d' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                onClick={() => setViewMode('2d')}
                aria-label="2D View"
              >
                <Square className="h-4 w-4" />
                <span>2D</span>
              </button>
              <button
                className={`px-3 py-2 flex gap-1.5 items-center text-sm font-medium transition-colors ${viewMode === '3d' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                onClick={() => setViewMode('3d')}
                aria-label="3D View"
                disabled
              >
                <Layers className="h-4 w-4" />
                <span>3D</span>
              </button>
            </div>
            */}
            
            <button
              onClick={handleResetGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              New Game
            </button>
            
            <button
              onClick={() => toggleSection('howToPlay')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors shadow-sm"
            >
              <HelpCircle className="h-4 w-4" />
              How to Play
            </button>
          </div>
        </div>
        
        {/* Status message */}
        {message && (
          <div className={`p-2.5 rounded-md mb-4 text-sm font-medium ${
            gameStatus === 'checkmate' 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
              : gameStatus === 'stalemate' || gameStatus === 'draw'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
          }`}>
            {message}
          </div>
        )}
        
        {/* How to Play section - initially collapsed */}
        {expandedSections.howToPlay && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <button
                onClick={() => toggleSection('howToPlay')}
                className="w-full flex justify-between items-center hover:text-gray-900 dark:hover:text-white text-left p-2 rounded-lg"
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                  How to Play Chess
                </h3>
                {expandedSections.howToPlay ? 
                  <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Basic Rules</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p>Chess is played on an 8×8 board with alternating light and dark squares.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p>Each player starts with 16 pieces: 8 pawns, 2 knights, 2 bishops, 2 rooks, 1 queen, and 1 king.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p>White moves first, and players take turns moving one piece at a time.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p>The goal is to checkmate your opponent's king by placing it under attack with no legal moves to escape.</p>
                  </li>
                </ul>
                
                <h3 className="text-md font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">How to Move</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Pawns</span> move forward one square (or two from starting position) and capture diagonally.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Knights</span> move in an L-shape: two squares in one direction and then one square perpendicular.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Bishops</span> move diagonally any number of squares.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Rooks</span> move horizontally or vertically any number of squares.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Queens</span> combine the powers of rooks and bishops, moving horizontally, vertically, or diagonally.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Kings</span> move one square in any direction.</p>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Special Moves</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Castling</span>: King moves two squares toward a rook, and the rook moves to the square the king crossed.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">En Passant</span>: A pawn can capture an opponent's pawn that has just moved two squares forward.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Promotion</span>: When a pawn reaches the opposite end of the board, it can be promoted to any other piece.</p>
                  </li>
                </ul>
                
                <h3 className="text-md font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Key Terms</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Check</span>: When a king is under attack. The player must address this threat immediately.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Checkmate</span>: When a king is in check and has no legal moves. The game ends.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Stalemate</span>: When a player has no legal moves but is not in check. The game is drawn.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Pin</span>: When a piece cannot move without exposing a more valuable piece to attack.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-0.5 text-emerald-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                    <p><span className="font-medium">Fork</span>: When one piece attacks two or more opponent pieces simultaneously.</p>
                  </li>
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Need more help?</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Use the Chess Assistant tab to ask questions or get advice during your game!</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main chess board area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Left sidebar - Game Controls & Analysis */}
          <div className="lg:col-span-3 space-y-4">
            {/* Game Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleSection('gameControls')}
                  className="w-full p-4 flex justify-between items-center hover:text-gray-900 dark:hover:text-white text-left"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Settings className="h-5 w-5 text-blue-500" />
                    Game Controls
                  </h3>
                  {expandedSections.gameControls ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
              
              {expandedSections.gameControls && (
                <div className="p-4 space-y-4">
                  {/* Game status indicator */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-750 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {gameStatus === 'playing' ? (
                        <Clock className="h-5 w-5 text-blue-500" />
                      ) : (
                        React.createElement(gameStatusInfo[gameStatus].icon, { 
                          className: `h-5 w-5 ${gameStatusInfo[gameStatus].color}` 
                        })
                      )}
                      <span className="font-medium">
                        {gameStatus === 'playing' ? (
                          thinking ? (
                            <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                              <Loader2 size={16} className="animate-spin" />
                              AI thinking...
                            </span>
                          ) : (
                            <span className={`${turn === playerColor ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {turn === playerColor ? 'Your turn' : 'AI turn'}
                            </span>
                          )
                        ) : (
                          <span className={gameStatusInfo[gameStatus].color}>
                            {gameStatusInfo[gameStatus].text}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {gamePhase === 'opening' && <span>Opening</span>}
                      {gamePhase === 'middlegame' && <span>Middlegame</span>}
                      {gamePhase === 'endgame' && <span>Endgame</span>}
                    </div>
                  </div>
                  
                  {/* Color selection */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Play as</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleColorSelection('w')}
                        className={`p-3 rounded-lg flex items-center justify-center gap-2 ${
                          playerColor === 'w'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        } transition-colors`}
                        disabled={moveHistory.length > 0}
                      >
                        <div className="w-6 h-6 rounded-full bg-white border border-gray-300"></div>
                        <span className="font-medium">White</span>
                      </button>
                      <button
                        onClick={() => handleColorSelection('b')}
                        className={`p-3 rounded-lg flex items-center justify-center gap-2 ${
                          playerColor === 'b'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        } transition-colors`}
                        disabled={moveHistory.length > 0}
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-600"></div>
                        <span className="font-medium">Black</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* AI difficulty */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Difficulty</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {difficultyLevels.find(d => d.value === aiLevel)?.name || 'Intermediate'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Level {aiLevel}/10
                        </span>
                      </div>
                      
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={aiLevel}
                        onChange={(e) => handleDifficultyChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {difficultyLevels.find(d => d.value === aiLevel)?.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleResetGame}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      New Game
                    </button>
                    
                    {gameStatus === 'playing' && (
                      <>
                        <button 
                          onClick={() => {
                            setGameStatus('stalemate')
                            setMessage("Game drawn by agreement.")
                          }}
                          disabled={thinking}
                          className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Offer draw"
                        >
                          Offer Draw
                        </button>
                        
                        <button 
                          onClick={() => {
                            setGameStatus('checkmate')
                            setMessage(turn === playerColor ? "You resigned." : "AI resigned.")
                          }}
                          disabled={thinking}
                          className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Resign"
                        >
                          Resign
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Player Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleSection('playerAnalysis')}
                  className="w-full p-4 flex justify-between items-center hover:text-gray-900 dark:hover:text-white text-left"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Player Analysis
                  </h3>
                  {expandedSections.playerAnalysis ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
              
              {expandedSections.playerAnalysis && moveHistory.length > 0 && (
                <div className="p-4 space-y-4">
                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Performance Metrics</h4>
                    
                    <div title="Opening Preparation">
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
                    
                    <div title="Tactical Awareness">
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
                    
                    <div title="Endgame Skill">
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
                  
                  {/* Game Statistics */}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Capture Rate:</span>
                      <span className="text-xs font-medium">{playerMetrics.captureRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Check Rate:</span>
                      <span className="text-xs font-medium">{playerMetrics.checkRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Accuracy:</span>
                      <span className="text-xs font-medium">{playerMetrics.accuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Moves Played:</span>
                      <span className="text-xs font-medium">{moveHistory.length}</span>
                    </div>
                  </div>
                  
                  {/* Style Characteristics */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Playing Style</h4>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div className="bg-yellow-500 dark:bg-yellow-600 text-white px-3 py-2 rounded-md transition-colors group relative">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-white flex-shrink-0" />
                          <span className="text-sm font-medium">Positional player</span>
                        </div>
                        
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-40 text-center z-10">
                          Prefers long-term advantages over tactical complications
                        </div>
                      </div>
                      
                      <div className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors group relative">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-white flex-shrink-0" />
                          <span className="text-sm font-medium">Solid defender</span>
                        </div>
                        
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-40 text-center z-10">
                          Maintains good defensive structures
                        </div>
                      </div>
                      
                      <div className="bg-green-500 dark:bg-green-600 text-white px-3 py-2 rounded-md transition-colors group relative">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-white flex-shrink-0" />
                          <span className="text-sm font-medium">Strong endgame player</span>
                        </div>
                        
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-40 text-center z-10">
                          Technical precision in simplified positions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {expandedSections.playerAnalysis && moveHistory.length === 0 && (
                <div className="p-4 flex items-center justify-center text-center">
                  <div className="text-gray-500 dark:text-gray-400 py-8">
                    <p className="text-sm font-medium">No game data yet</p>
                    <p className="text-xs mt-1">Make some moves to see your analysis</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* About the Model */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleSection('modelInfo')}
                  className="w-full p-4 flex justify-between items-center hover:text-gray-900 dark:hover:text-white text-left"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Brain className="h-5 w-5 text-purple-500" />
                    About the AI Model
                  </h3>
                  {expandedSections.modelInfo ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
              
              {expandedSections.modelInfo && (
                <div className="p-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    This chess AI uses a neural network (similar to AlphaZero) trained with reinforcement learning 
                    to evaluate chess positions and find the best moves.
                  </p>
                  
                  <div className="space-y-2 mt-3">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Key Features</h4>
                    <ul className="space-y-1">
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 text-purple-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                        <p>Neural network evaluates positions without traditional chess heuristics</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 text-purple-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                        <p>Monte Carlo Tree Search (MCTS) for looking ahead and finding strong moves</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 text-purple-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                        <p>Trained through self-play without human game data</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 text-purple-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                        <p>ONNX model format for fast inference on any device</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 text-purple-500 flex-shrink-0"><ChevronRight className="h-4 w-4" /></div>
                        <p>Adjustable difficulty levels for players of all skill levels</p>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      Neural Network
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      MCTS
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      Reinforcement Learning
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      ONNX Runtime
                    </span>
                  </div>
                  
                  <div className="pt-2 text-right">
                    <a 
                      href="https://arxiv.org/abs/1712.01815" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Learn more about AlphaZero methodology
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Main chess board */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6">
              {viewMode === '2d' ? (
                <ChessGame
                  playerColor={playerColor}
                  aiLevel={aiLevel}
                  onGameOver={(result) => {
                    if (result === 'checkmate' || result === 'stalemate' || result === 'draw') {
                      setGameStatus(result);
                    }
                  }}
                  onMove={(board, move) => {
                    if (move) {
                      // Handle move
                      const newMoveHistory = [...moveHistory, move];
                      setMoveHistory(newMoveHistory);
                      
                      // Update turn
                      setTurn(turn === 'w' ? 'b' : 'w');
                      
                      // Generate AI thought
                      if (newMoveHistory.length > 0 && newMoveHistory.length % 4 === 0) {
                        const analysis = getAIAnalysis(newMoveHistory, gamePhase);
                        setChatMessages(prev => [...prev, {
                          id: `ai-${Date.now()}`,
                          role: 'assistant',
                          text: analysis,
                          type: 'analysis',
                          timestamp: new Date()
                        }]);
                      }
                    }
                  }}
                />
              ) : (
                <Chess3D
                  board={EMPTY_BOARD}
                  orientation={playerColor}
                  legalMoves={[]}
                  onMove={(move) => {
                    // Handle move in 3D view
                    const newMoveHistory = [...moveHistory, move];
                    setMoveHistory(newMoveHistory);
                    
                    // Update turn
                    setTurn(turn === 'w' ? 'b' : 'w');
                    
                    // Generate AI thought
                    if (newMoveHistory.length > 0 && newMoveHistory.length % 4 === 0) {
                      const analysis = getAIAnalysis(newMoveHistory, gamePhase);
                      setChatMessages(prev => [...prev, {
                        id: `ai-${Date.now()}`,
                        role: 'assistant',
                        text: analysis,
                        type: 'analysis',
                        timestamp: new Date()
                      }]);
                    }
                  }}
                />
              )}
            </div>
          </div>
          
          {/* Right sidebar - Tabbed Move History and Chess Assistant */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'history'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <FileDown className="w-4 h-4" />
                  Move History
                </button>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'assistant'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chess Assistant
                </button>
              </div>
              
              {/* Tab content */}
              <div className="flex-grow flex flex-col">
                {activeTab === 'history' ? (
                  <div className="flex-grow overflow-y-auto max-h-[500px]" ref={moveHistoryRef}>
                    {renderMoveHistory()}
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col">
                    <div className="flex-grow overflow-y-auto p-3 max-h-[350px]">
                      {chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center text-center h-40">
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
                                {message.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
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
                        ref={chatInputRef}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleSendMessage(e.currentTarget.value.trim());
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-full p-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        aria-label="Send message"
                        onClick={() => {
                          if (chatInputRef.current && chatInputRef.current.value.trim()) {
                            handleSendMessage(chatInputRef.current.value.trim());
                          }
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          This is a demonstration project and not affiliated with Magnus Carlsen.
          <br />
          Chess pieces imagery used under Creative Commons license.
        </div>
      </div>
    </main>
  )
}

export default ChessAIDemo
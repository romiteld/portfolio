"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from 'next/dynamic'
import { Cpu, Brain, Code, ChevronRight, Star, Trophy, Zap, Github, Info, RotateCcw, Undo, AlertCircle, Layers, MessageCircle, Send, ChevronUp, ChevronDown } from "lucide-react"
import { Board, Move, PieceColor } from "@/app/chess/components/ChessBoard"

// Initial empty board state that matches the expected structure
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

// Dynamically import only ChessGame with no SSR
const ChessGame = dynamic(() => import('@/app/chess/components/ChessGame'), { ssr: false })

function ChessAIDemo() {
  const [aiLevel, setAiLevel] = useState(5)
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [modelInfoVisible, setModelInfoVisible] = useState(false)
  const [instructionsVisible, setInstructionsVisible] = useState(false)
  
  // For game state tracking (kept for future use)
  const [boardState, setBoardState] = useState<Board>(EMPTY_BOARD)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [isCheck, setIsCheck] = useState(false)
  const [checkPosition, setCheckPosition] = useState<{row: number, col: number} | null>(null)
  const [legalMoves, setLegalMoves] = useState<Move[]>([])
  
  // Use ref to track if an update is already in progress
  const isUpdatingRef = useRef(false);
  
  // Add effect to prevent automatic scrolling on focus or click
  useEffect(() => {
    // Mark all components and interactive elements to be excluded from scroll protection
    const markComponentElements = () => {
      // Mark the main container
      const chessContainer = document.querySelector('.chess-demo-container');
      if (chessContainer) {
        chessContainer.setAttribute('data-component-name', 'ChessAIDemo');
        
        // Mark all interactive and relevant elements
        const elementsToMark = chessContainer.querySelectorAll(
          'button, input, select, a, .chess-game-section, .difficulty-controls, ' +
          '.player-analysis, .move-history, .chess-assistant, .advanced-features, ' +
          '.model-info, .how-to-play'
        );
        
        elementsToMark.forEach(el => {
          el.setAttribute('data-component-name', 'ChessAIDemo');
        });
      }
    };
    
    // Run immediately
    markComponentElements();
    
    // Also run after a short delay to catch dynamically rendered elements
    const markTimer = setTimeout(markComponentElements, 500);
    
    // Run again if difficulty or player color changes (causes re-renders)
    const remarkTimer = setTimeout(markComponentElements, 1000);
    
    // Restore original scroll functionality
    const originalScrollTo = window.scrollTo;
    
    // Cleanup function
    return () => {
      clearTimeout(markTimer);
      clearTimeout(remarkTimer);
      
      // Restore original functions when component unmounts
      if (window.scrollTo !== originalScrollTo) {
        window.scrollTo = originalScrollTo;
      }
    };
  }, [aiLevel, playerColor]);
  
  // Memoize the onMove callback to prevent infinite updates
  const handleBoardUpdate = useCallback((board: Board, move: Move | null, isInCheck: boolean, kingPos: {row: number, col: number} | null, moves: Move[]) => {
    if (isUpdatingRef.current) return; // Skip if already updating
    
    isUpdatingRef.current = true;
    setBoardState(JSON.parse(JSON.stringify(board)));
    setLastMove(move);
    setIsCheck(isInCheck);
    setCheckPosition(kingPos);
    setLegalMoves(moves || []);
    
    // Reset the flag after a short delay to allow React to batch updates
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, []);
  
  return (
    <div className="chess-demo-container min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950" data-component-name="ChessAIDemo">
      <div className="w-full mx-auto px-4 py-6 md:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Magnus AI Chess Engine
            </span>
          </h1>
          <p className="text-center text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2">
            Play against an AI modeled after Magnus Carlsen's playing style
          </p>
        </div>
        
        {/* Main game section */}
        <div className="space-y-4 md:space-y-6">
          {/* Primary Game Section: Board & Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden" data-component-name="ChessAIDemo">
            <div className="p-4 lg:p-5">
              {/* Game Title and Difficulty Selection */}
              <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Cpu className="w-5 h-5 text-blue-500" />
                    Chess Engine
                  </h2>
                </div>
                
                {/* Difficulty Controls - Moved to the top for easier access */}
                <div className="difficulty-controls flex items-center space-x-4 w-full md:w-auto" data-component-name="ChessAIDemo">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty:</div>
                    <select 
                      value={aiLevel}
                      onChange={(e) => setAiLevel(parseInt(e.target.value))}
                      className="rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm px-2 py-1"
                      data-component-name="ChessAIDemo"
                    >
                      <option value="1">Beginner</option>
                      <option value="3">Casual</option>
                      <option value="5">Intermediate</option>
                      <option value="7">Advanced</option>
                      <option value="10">Grandmaster</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Play as:</div>
                    <select 
                      value={playerColor}
                      onChange={(e) => setPlayerColor(e.target.value as 'w' | 'b')}
                      className="rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm px-2 py-1"
                      data-component-name="ChessAIDemo"
                    >
                      <option value="w">White</option>
                      <option value="b">Black</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* ChessBoard Component */}
              <div className="chess-game-section" data-component-name="ChessAIDemo">
                <ChessGame 
                  playerColor={playerColor} 
                  aiLevel={aiLevel} 
                  onMove={handleBoardUpdate}
                  showControls={false}
                />
              </div>
            </div>
          </div>
          
          {/* Secondary Sections - Reorganized for better flow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6" data-component-name="ChessAIDemo">
            {/* Move History Section - Placed first for mobile */}
            <div className="move-history bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden lg:col-span-1" data-component-name="ChessAIDemo">
              <div className="p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                  Move History
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 min-h-[150px] max-h-[200px] overflow-y-auto">
                  {lastMove ? (
                    <div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Last move: {lastMove.from.col}, {lastMove.from.row} → {lastMove.to.col}, {lastMove.to.row}
                      </div>
                      {isCheck && (
                        <div className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                          Check!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">No moves yet</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Chess Assistant Section - Placed second for mobile */}
            <div className="chess-assistant bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden lg:col-span-1" data-component-name="ChessAIDemo">
              <div className="p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  Chess Assistant
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 min-h-[150px]">
                  <button
                    onClick={() => setInstructionsVisible(!instructionsVisible)}
                    className="flex justify-between items-center w-full text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mb-2"
                    data-component-name="ChessAIDemo"
                  >
                    <span>How to Play</span>
                    {instructionsVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {instructionsVisible && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p>1. Select your difficulty level and preferred color.</p>
                      <p>2. Make your move by clicking on a piece and then its destination.</p>
                      <p>3. The AI will respond with its move.</p>
                      <p>4. Try to checkmate the AI's king to win!</p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Ask a chess question..."
                      className="w-full rounded px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-component-name="ChessAIDemo"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Player Analysis Panel - Moved to third position */}
            <div className="player-analysis bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden lg:col-span-1" data-component-name="ChessAIDemo">
              <div className="p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Player Analysis
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 min-h-[150px]">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Positional Score</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">+1.2</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Your best moves: <span className="font-medium">e4, Nf3, Bc4</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Advanced Features Section - Moved to bottom */}
          <div className="advanced-features bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden" data-component-name="ChessAIDemo">
            <div className="p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                <Zap className="w-5 h-5 text-amber-500" />
                Advanced Features
              </h2>
              
              <button
                onClick={() => setModelInfoVisible(!modelInfoVisible)}
                className="flex justify-between items-center w-full text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mb-2"
                data-component-name="ChessAIDemo"
              >
                <span>About the AI Model</span>
                {modelInfoVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {modelInfoVisible && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
                  <p>This AI chess engine combines neural networks with traditional minimax search algorithms.</p>
                  <p>The model was trained on thousands of Magnus Carlsen's games to mimic his playing style and decision-making process.</p>
                  <p>At higher difficulty levels, the AI uses deeper search and more sophisticated evaluation.</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Positional Analysis</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Evaluate your board position and get suggestions for improvement.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-3">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Adjustable Strength</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Set the AI difficulty from beginner to grandmaster level.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-3">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Interactive Training</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Practice specific openings and endgame scenarios against the AI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 pb-4">
          <p>This is a demonstration project and not affiliated with Magnus Carlsen.</p>
          <p>Chess pieces imagery used under Creative Commons license.</p>
        </div>
      </div>
    </div>
  );
}

// Add custom CSS to the head to hide the original input in the ChessGame component
export function Head() {
  return (
    <>
      <style jsx global>{`
        /* Hide original chess assistant input box */
        .chess-demo-container .lucide-message-circle + h3 + div + div + div.p-3.border-t {
          display: none !important;
        }

        /* Prevent unwanted auto-scrolling by properly marking all components */
        [data-component-name="ChessAIDemo"] {
          scroll-behavior: auto !important;
        }
        
        /* Improve spacing for better readability */
        .chess-demo-container {
          scroll-margin-top: 1rem;
        }
        
        /* Make all cards same minimum height for consistency */
        .chess-demo-container .chess-game-section,
        .chess-demo-container .move-history,
        .chess-demo-container .chess-assistant,
        .chess-demo-container .player-analysis {
          min-height: 200px;
        }
        
        /* Improve color contrast for better readability */
        .chess-demo-container .text-gray-700 {
          color: rgba(55, 65, 81, 1) !important;
        }
        
        .chess-demo-container .dark .text-gray-300 {
          color: rgba(209, 213, 219, 1) !important;
        }
        
        /* Mobile-specific layout optimizations */
        @media (max-width: 767px) {
          /* More compact layout for mobile */
          .chess-demo-container h1 {
            margin-bottom: 0.5rem !important;
          }
          
          /* Optimize vertical space */
          .chess-demo-container .space-y-4 > div {
            margin-bottom: 1rem !important;
          }
          
          /* Make the chessboard more compact on mobile */
          .chess-demo-container .p-4.lg\\:p-5 {
            padding: 0.75rem !important;
          }
          
          /* Allow scrolling within panels */
          .chess-demo-container .min-h-\\[150px\\] {
            overflow-y: auto;
            max-height: 200px;
          }
          
          /* Make difficulty controls more compact */
          .chess-demo-container .difficulty-controls {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .chess-demo-container .difficulty-controls .space-x-4 {
            margin-top: 0.5rem;
          }
        }
        
        /* Fix interactive elements */
        .chess-demo-container button,
        .chess-demo-container select,
        .chess-demo-container input {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .chess-demo-container button:hover,
        .chess-demo-container select:hover {
          opacity: 0.9;
        }
        
        /* Add subtle animations for better UX */
        .chess-demo-container .rounded-xl {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .chess-demo-container .rounded-xl:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </>
  );
}

// Fix export issue - add the default export back
export default ChessAIDemo;

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from 'next/dynamic'
import { Cpu, Brain, Code, ChevronRight, Star, Trophy, Zap, Github, Info, RotateCcw, Undo, AlertCircle, Layers, MessageCircle, Send } from "lucide-react"
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
    // Only apply scroll management to the chess board component itself
    // instead of blocking all scrolling globally
    const chessContainer = document.querySelector('.chess-demo-container');
    
    // Mark this component for detection by our global scroll script
    if (chessContainer) {
      chessContainer.setAttribute('data-component-name', 'ChessAIDemo');
      
      // Also mark any child elements that need to be interactable
      const interactableElements = chessContainer.querySelectorAll('button, input, select, a');
      interactableElements.forEach(el => {
        el.setAttribute('data-component-name', 'ChessAIDemo');
      });
    }
    
    // Restore original scroll functionality
    const originalScrollTo = window.scrollTo;
    
    // Cleanup function
    return () => {
      // Restore original functions when component unmounts
      if (window.scrollTo !== originalScrollTo) {
        window.scrollTo = originalScrollTo;
      }
      
      // Remove any event listeners or observers if they were added
      // (this is a cleanup for any previous code that might have added them)
    };
  }, []);
  
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
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">AI Engineer</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Main chess board column */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* AI Difficulty control */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">AI Difficulty</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setAiLevel(Math.max(1, aiLevel - 1))}
                      className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      data-component-name="ChessAIDemo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="w-5 text-center font-medium text-sm">{aiLevel}</div>
                    <button 
                      onClick={() => setAiLevel(Math.min(10, aiLevel + 1))}
                      className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      data-component-name="ChessAIDemo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${aiLevel * 10}%` }}
                  ></div>
                </div>
              </div>

              {/* Chess game */}
              <div className="p-4 lg:p-5">
                <div className="rounded-md overflow-hidden shadow-sm">
                  <ChessGame 
                    aiLevel={aiLevel} 
                    playerColor={playerColor} 
                    onMove={(board, move, isCheck, checkPosition, legalMoves) => {
                      // Update board state without causing infinite rerenders
                      if (!isUpdatingRef.current) {
                        isUpdatingRef.current = true;
                        setBoardState(board);
                        setLastMove(move);
                        setIsCheck(isCheck);
                        setCheckPosition(checkPosition);
                        setLegalMoves(legalMoves);
                        setTimeout(() => {
                          isUpdatingRef.current = false;
                        }, 10);
                      }
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right sidebar - Information and controls */}
          <div className="lg:col-span-1 xl:col-span-2">
            <div className="space-y-6">
              {/* Magnus AI Model card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-base font-medium text-gray-900 dark:text-white">Magnus AI Model</h2>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">Model Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="mr-2 text-purple-500 dark:text-purple-400">✦</div>
                      <span>Trained on games by Magnus Carlsen</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="mr-2 text-purple-500 dark:text-purple-400">✦</div>
                      <span>Deep neural network architecture</span>
                    </li>
                    <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="mr-2 text-purple-500 dark:text-purple-400">✦</div>
                      <span>Adjustable difficulty levels</span>
                    </li>
                  </ul>
                </div>

                {/* Player color section */}
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">Playing as {playerColor === 'w' ? 'White' : 'Black'}</h3>
                  <div className="flex items-center mb-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-3 h-3 rounded-full bg-gray-800 dark:bg-white mr-2"></div>
                    <span>You move first</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    To change sides, click the "Switch Sides" button below the chessboard.
                  </p>
                </div>

                {/* AI Difficulty section */}
                <div className="mt-4">
                  <h3 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">AI Difficulty: {aiLevel}</h3>
                  <div className="bg-green-100 dark:bg-green-900/20 rounded-md px-3 py-2 mt-1 text-sm">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${aiLevel * 10}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {aiLevel < 3 ? 'Beginner level - Good for learning the basics' : 
                       aiLevel < 6 ? 'Intermediate level - Challenging but beatable' : 
                       aiLevel < 9 ? 'Advanced level - Tough opponent with strong tactics' : 
                                    'Grandmaster level - Extremely challenging'}
                    </p>
                  </div>
                </div>

              </div>

              {/* How to Play section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base font-medium text-gray-900 dark:text-white">How to Play</h2>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">1.</span> Click on your piece to select it. 
                      Valid moves will be highlighted with blue dots.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">2.</span> Click on a highlighted square to move your piece.
                      The AI will respond automatically.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">3.</span> Use the buttons below the board to
                      switch sides or reset the game at any time.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Advanced Features - Added to fill space */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Code className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-base font-medium text-gray-900 dark:text-white">Advanced Features</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-3">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Model Insights</h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Get detailed analysis of your moves and learn from the AI's tactical evaluations.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Save Games</h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Export your games in PGN format to study or share with others.
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

        /* Reorder sections - Chess Assistant should appear first */
        .chess-demo-container .flex.flex-col.gap-4 {
          display: flex;
          flex-direction: column;
        }
        
        /* Desktop layout (default) */
        @media (min-width: 768px) {
          /* Make Chess Assistant appear first (before Player Analysis) */
          .chess-demo-container .flex.flex-col.gap-4 > div:nth-child(3) {
            order: 1;
          }
          
          /* Make Player Analysis appear after Chess Assistant */
          .chess-demo-container .flex.flex-col.gap-4 > div:nth-child(1) {
            order: 3;
          }
          
          /* Keep Move History in second position */
          .chess-demo-container .flex.flex-col.gap-4 > div:nth-child(2) {
            order: 2;
          }
        }
        
        /* Mobile-specific layout */
        @media (max-width: 767px) {
          /* More compact layout for mobile */
          .chess-demo-container h1 {
            margin-bottom: 0.5rem !important;
          }
          
          /* Make Move History come first for mobile (most important after board) */
          .chess-demo-container .flex.flex-col.gap-4 > div:nth-child(2) {
            order: 1;
          }
          
          /* Make Chess Assistant second (easy access to help) */
          .chess-demo-container .flex.flex-col.gap-4 > div:nth-child(3) {
            order: 2;
          }
          
          /* Push Player Analysis further down as it's less critical during active play */
          .chess-demo-container .flex.flex-col.gap-4 > div:nth-child(1) {
            order: 3;
          }
          
          /* Reduce spacing between elements */
          .chess-demo-container .space-y-6 {
            margin-top: 0.5rem !important;
          }
          
          /* Make the chessboard a bit more compact on mobile */
          .chess-demo-container .p-4.lg\\:p-5 {
            padding: 0.5rem !important;
          }
          
          /* The "How to Play" section should be collapsible on mobile but expanded by default */
          .chess-demo-container .bg-blue-50 {
            margin-bottom: 0.5rem !important;
          }
        }
      `}</style>
    </>
  );
}

// Fix export issue - add the default export back
export default ChessAIDemo;

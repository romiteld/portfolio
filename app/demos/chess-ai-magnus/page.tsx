"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from 'next/dynamic'
import { Cpu, Brain, Code, ChevronRight, Star, Trophy, Zap, Github, Info, RotateCcw, Undo, AlertCircle, Layers } from "lucide-react"
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

export default function ChessAIDemo() {
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
    // Disable automatic scrolling behavior
    if (typeof window !== 'undefined') {
      // Get initial scroll position
      const initialScrollPosition = window.scrollY;
      
      // Create handler for focus events that would cause scrolling
      const preventScrollOnFocus = () => {
        // If scroll position changed from external causes, don't override
        if (Math.abs(window.scrollY - initialScrollPosition) < 100) {
          window.scrollTo(0, initialScrollPosition);
        }
      };
      
      // Create a MutationObserver to watch for focus changes
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'tabindex') {
            preventScrollOnFocus();
          }
        }
      });
      
      // Apply the observer to the chess game container
      const chessGameContainer = document.querySelector('.chess-game');
      if (chessGameContainer) {
        observer.observe(chessGameContainer, { 
          attributes: true,
          childList: true,
          subtree: true
        });
      }
      
      // Cleanup function
      return () => {
        observer.disconnect();
      };
    }
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
    <div className="w-full min-h-screen text-gray-900 dark:text-white relative">
      {/* Space background with CSS */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black to-[#050520] overflow-hidden">
        {/* Stars effect using pseudo-elements in a div */}
        <div className="stars-container absolute inset-0">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>
      </div>
      
      <div className="container mx-auto pt-4 md:pt-16 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-3xl md:text-6xl font-bold text-center text-gray-900 dark:text-white mb-1 md:mb-2 glow-text">
            Advanced Chess AI Engine
          </h1>
          <p className="text-sm md:text-lg text-gray-700 dark:text-gray-300 text-center mb-2 md:mb-8">
            Play against a neural network chess engine trained with deep reinforcement learning techniques
          </p>
          
          <div className="absolute top-2 md:top-4 right-2 md:right-4 md:top-8 md:right-8 flex space-x-2 z-10">
            <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              <span className="mr-1">✨</span> AI Chess Demo
            </div>
          </div>

          {/* Game Instructions - conditionally shown with compact styling */}
          {instructionsVisible && (
            <div className="mb-2 md:mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 md:p-4 md:p-6 relative instruction-box">
              <button 
                onClick={() => setInstructionsVisible(false)}
                className="absolute top-1 right-1 md:top-3 md:right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close instructions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="flex items-start gap-2 md:gap-3">
                <Info className="text-blue-600 w-4 h-4 md:w-5 md:h-5 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="font-bold text-blue-800 dark:text-blue-300 text-base md:text-lg mb-1 md:mb-2">How to Play</h2>
                  <div className="grid gap-2 md:gap-4 md:grid-cols-3 mt-2 md:mt-4">
                    <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-sm">
                      <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-1 md:mb-2 flex items-center gap-1 md:gap-2 text-sm">
                        <span className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 dark:bg-blue-800 rounded-full inline-flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs md:text-sm">1</span>
                        Game Controls
                      </h3>
                      <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                        <li className="flex items-start gap-1 md:gap-2">
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span>Use <strong>New Game</strong> to reset the board</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <Undo className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span>Use <strong>Undo</strong> to take back your last move</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span>The game status is shown in the controls bar</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-sm">
                      <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-1 md:mb-2 flex items-center gap-1 md:gap-2 text-sm">
                        <span className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 dark:bg-blue-800 rounded-full inline-flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs md:text-sm">2</span>
                        Visual Feedback
                      </h3>
                      <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                        <li className="flex items-start gap-1 md:gap-2">
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500/40 rounded-full mt-0.5 flex-shrink-0"></div>
                          <span>Blue dots show legal move destinations</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-red-500 rounded-full mt-0.5 flex-shrink-0"></div>
                          <span>Red highlight shows king in check</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-300/50 mt-0.5 flex-shrink-0"></div>
                          <span>Blue highlights show the last move played</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-sm">
                      <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-1 md:mb-2 flex items-center gap-1 md:gap-2 text-sm">
                        <span className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 dark:bg-blue-800 rounded-full inline-flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs md:text-sm">3</span>
                        Game Settings
                      </h3>
                      <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                        <li className="flex items-start gap-1 md:gap-2">
                          <Cpu className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span>Adjust <strong>AI Strength</strong> to change difficulty</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-white border border-gray-300 rounded-sm mt-0.5 flex-shrink-0"></div>
                          <span>Choose to play as <strong>White</strong> or <strong>Black</strong></span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main content area - already has flex-col-mobile */}
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8 min-h-[650px] flex-col-mobile">
            {/* Chess Game */}
            <div className="lg:w-2/3 bg-white/95 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 p-6">
              <div className="flex flex-wrap items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Cpu className="text-blue-500" />
                  Play Against AI
                </h2>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">AI Strength:</span>
                    <select 
                      value={aiLevel}
                      onChange={(e) => setAiLevel(parseInt(e.target.value))}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
                      aria-label="AI difficulty level"
                    >
                      <option value="1">Beginner</option>
                      <option value="3">Casual</option>
                      <option value="5">Intermediate</option>
                      <option value="7">Advanced</option>
                      <option value="10">Grandmaster</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Play as:</span>
                    <select 
                      value={playerColor}
                      onChange={(e) => setPlayerColor(e.target.value as 'w' | 'b')}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
                      aria-label="Choose which color to play as"
                    >
                      <option value="w">White</option>
                      <option value="b">Black</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chess Game Component */}
              {typeof ChessGame === 'function' ? (
                <div>
                  <ChessGame
                    playerColor={playerColor}
                    aiLevel={aiLevel}
                    showControls={true}
                    className="chess-game"
                    onGameOver={(result) => console.log("Game over:", result)}
                    onMove={handleBoardUpdate}
                  />
                </div>
              ) : (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md">
                  Error loading chess game component. Please check the console for errors.
                </div>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="lg:w-1/3 flex flex-col gap-6 info-sidebar">
              {/* Model Information */}
              <div className="bg-white/95 dark:bg-[#1e293b]/80 rounded-xl shadow-xl border border-gray-300 dark:border-gray-800 backdrop-blur-lg p-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Brain className="text-purple-500" />
                    Neural Network Model
                  </h2>
                  <button 
                    onClick={() => setModelInfoVisible(!modelInfoVisible)}
                    className="text-sm text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                  >
                    {modelInfoVisible ? "Hide details" : "Show details"}
                    <ChevronRight className={`ml-1 w-4 h-4 transition-transform ${modelInfoVisible ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                <div className={`mt-4 space-y-4 transition-all duration-300 ${modelInfoVisible ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Model Architecture</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Type</p>
                        <p className="font-medium">Deep ResNet</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Size</p>
                        <p className="font-medium">32 Residual Blocks</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Parameters</p>
                        <p className="font-medium">~18 Million</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Format</p>
                        <p className="font-medium">ONNX</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Training Process</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 min-w-[18px]">
                          <Zap className="w-[18px] h-[18px] text-amber-500" />
                        </div>
                        <p>Self-play reinforcement learning with Monte Carlo Tree Search</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 min-w-[18px]">
                          <Zap className="w-[18px] h-[18px] text-amber-500" />
                        </div>
                        <p>Trained on 10+ million games</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 min-w-[18px]">
                          <Zap className="w-[18px] h-[18px] text-amber-500" />
                        </div>
                        <p>Fine-tuned on GM games with positional style similar to Magnus Carlsen</p>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Performance</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">ELO Rating</span>
                      <span className="font-bold">3000+</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                </div>

                {/* Simplified info when collapsed */}
                {!modelInfoVisible && (
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">ResNet Architecture</div>
                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">3000+ ELO</div>
                    <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">ONNX Format</div>
                  </div>
                )}

                {!instructionsVisible && (
                  <button 
                    onClick={() => setInstructionsVisible(true)}
                    className="mt-2 text-xs md:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <Info className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Show game instructions</span>
                    <span className="md:hidden">How to play</span>
                  </button>
                )}
              </div>

              {/* AI Playing Style */}
              <div className="bg-white/95 dark:bg-[#1e293b]/80 rounded-xl shadow-xl border border-gray-300 dark:border-gray-800 backdrop-blur-lg p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Trophy className="text-amber-500" />
                  Magnus-like Playing Style
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Positional Understanding</span>
                      <span className="text-sm font-medium">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "90%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Endgame Technique</span>
                      <span className="text-sm font-medium">Masterful</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Opening Preparation</span>
                      <span className="text-sm font-medium">Very Strong</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Tactical Awareness</span>
                      <span className="text-sm font-medium">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "90%" }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2 text-sm">Style Characteristics</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-amber-500 mt-0.5" />
                      <p>Prefers positional advantages over material</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-amber-500 mt-0.5" />
                      <p>Excels in complex middlegame positions</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-amber-500 mt-0.5" />
                      <p>Precise technical endgame conversion</p>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Technical Implementation */}
              <div className="bg-white/95 dark:bg-[#1e293b]/80 rounded-xl shadow-xl border border-gray-300 dark:border-gray-800 backdrop-blur-lg p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Code className="text-green-500" />
                  Technical Implementation
                </h2>

                <div className="space-y-3 text-sm">
                  <p>This demo uses a client-side React chessboard with server-side AI move generation via a Next.js API route. The neural network model is stored in Supabase and dynamically loaded for inference.</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">Next.js</div>
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">React</div>
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">TypeScript</div>
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">ONNX Runtime</div>
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">Supabase</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              This is a demonstration project and not affiliated with Magnus Carlsen.
              <br />
              Chess pieces imagery used under Creative Commons license.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
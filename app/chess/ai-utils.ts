/**
 * Chess AI Utilities
 * Provides client-side chess AI capabilities and integration with the server API
 */

import type { Board, Move, PieceColor, AIPersonality } from './types';

// Timestamp tracking to avoid duplicated API calls
let lastApiCallTimestamp = 0;
let pendingMovePromise: Promise<Move | null> | null = null;

/**
 * Evaluate a chess position using traditional methods on the client side
 * This is a fallback when the neural network is not available
 */
export function evaluatePositionTraditional(board: Board, turn: PieceColor): number {
  // Piece values (standard chess piece values)
  const pieceValues: Record<string, number> = {
    'p': 1, 'n': 3, 'b': 3.25, 'r': 5, 'q': 9, 'k': 0 // King has no material value in evaluation
  };
  
  // Position evaluation parameters
  const centerControlBonus = 0.3;  // Bonus for controlling center squares
  const developmentBonus = 0.1;    // Bonus for piece development
  const pawnStructureBonus = 0.15; // Bonus for good pawn structure

  let score = 0;
  
  // Material evaluation
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        // Add or subtract piece value based on color
        const value = pieceValues[piece.type] || 0;
        score += piece.color === 'w' ? value : -value;

        // Position evaluation - center control
        if ((row > 1 && row < 6) && (col > 1 && col < 6)) {
          score += piece.color === 'w' ? centerControlBonus : -centerControlBonus;
        }

        // Development bonus - knights and bishops being developed
        if ((piece.type === 'n' || piece.type === 'b') && 
            ((piece.color === 'w' && row < 6) || (piece.color === 'b' && row > 1))) {
          score += piece.color === 'w' ? developmentBonus : -developmentBonus;
        }
        
        // Pawn structure - connected pawns
        if (piece.type === 'p') {
          // Check for adjacent pawns (simple connected pawn detection)
          if (col > 0 && board[row][col-1]?.type === 'p' && board[row][col-1]?.color === piece.color) {
            score += piece.color === 'w' ? pawnStructureBonus : -pawnStructureBonus;
          }
          if (col < 7 && board[row][col+1]?.type === 'p' && board[row][col+1]?.color === piece.color) {
            score += piece.color === 'w' ? pawnStructureBonus : -pawnStructureBonus;
          }
        }
      }
    }
  }
  
  // Return evaluation from white's perspective
  return turn === 'w' ? score : -score;
}

/**
 * Select a move using client-side intelligence
 */
async function selectMoveClientSide(board: Board, legalMoves: Move[], turn: PieceColor, aiLevel: number): Promise<Move | null> {
  try {
    // First try the neural network for higher AI levels
    if (aiLevel >= 6) {
      // Try to use the client-side neural network model
      const { selectMoveWithModel } = await import("./utils/clientNeuralNet");
      const move = await selectMoveWithModel(board, legalMoves, turn, aiLevel);
      if (move) {
        console.log("Client-side neural network used for move selection");
        return move;
      }
    }
    
    // Fall back to traditional evaluation
    console.log('Using client-side traditional evaluation...');
    
    // Evaluate each move with traditional method
    const evaluatedMoves = legalMoves.map(move => {
      // Create a copy of the board
      const newBoard: Board = JSON.parse(JSON.stringify(board));
      
      // Make the move
      if (newBoard[move.from.row][move.from.col]) {
        newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
        newBoard[move.from.row][move.from.col] = null;
        
        // Handle promotion
        if (move.promotion && newBoard[move.to.row][move.to.col]) {
          newBoard[move.to.row][move.to.col]!.type = move.promotion;
        }
      }
      
      // Base score on simple material evaluation
      let score = evaluatePositionTraditional(newBoard, turn === 'w' ? 'b' : 'w');
      
      // Add randomness based on AI level (lower levels play more randomly)
      const randomFactor = (10 - aiLevel) / 10;
      score += (Math.random() * 2 - 1) * randomFactor * 2;
      
      return { move, score };
    });
    
    // Sort moves by score (white wants max, black wants min)
    evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score);
    
    // Apply AI level variation for move selection
    if (aiLevel >= 8) {
      // Top players almost always choose the best move (90%)
      const random = Math.random();
      if (random < 0.9 || evaluatedMoves.length === 1) {
        return evaluatedMoves[0].move;
      } else {
        // Sometimes choose the second-best move (10%)
        return evaluatedMoves[Math.min(1, evaluatedMoves.length - 1)].move;
      }
    } else {
      // Lower levels consider more options with more randomness
      const randomnessFactor = (10 - aiLevel) / 10;
      const topMovesCount = Math.min(
        evaluatedMoves.length, 
        Math.max(1, Math.floor(2 + randomnessFactor * 5))
      );
      
      // Choose randomly from top moves with weighted probability
      const topMoves = evaluatedMoves.slice(0, topMovesCount);
      const randomIndex = Math.floor(Math.random() * topMoves.length);
      return topMoves[randomIndex].move;
    }
  } catch (error) {
    console.error('Error in client-side move selection:', error);
    return null;
  }
}

/**
 * Get an AI move using the server API
 */
async function getAIMoveFromServer(
  board: Board,
  legalMoves: Move[],
  turn: PieceColor,
  aiLevel: number,
  personality?: AIPersonality
): Promise<Move | null> {
  try {
    // Rate limit API calls
    const now = Date.now();
    if (now - lastApiCallTimestamp < 500) {
      console.log('Throttling API calls');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    lastApiCallTimestamp = Date.now();

    // Prepare the request body
    const requestBody = {
      board,
      turn,
      aiLevel,
      personality: personality || undefined
    };

    // Make the API call
    const response = await fetch('/api/chess-ai/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API error: ${data.error}`);
    }
    
    if (!data.move) {
      throw new Error('No move returned from API');
    }
    
    return data.move as Move;
  } catch (error) {
    console.error('Error getting move from server:', error);
    return null;
  }
}

/**
 * Main function to get an AI move, trying client-side first, then server API as fallback
 */
export async function getAIMove(
  board: Board,
  legalMoves: Move[],
  turn: PieceColor,
  aiLevel: number,
  personality?: AIPersonality,
  preferClientSide: boolean = true
): Promise<Move | null> {
  // Prevent duplicate calls
  if (pendingMovePromise) {
    return pendingMovePromise;
  }
  
  pendingMovePromise = (async () => {
    try {
      if (preferClientSide) {
        // Try client-side first
        const clientMove = await selectMoveClientSide(board, legalMoves, turn, aiLevel);
        if (clientMove) {
          return clientMove;
        }
      }
      
      // Fall back to server API
      const serverMove = await getAIMoveFromServer(board, legalMoves, turn, aiLevel, personality);
      if (serverMove) {
        return serverMove;
      }
      
      // If server failed and we haven't tried client-side yet, try it now
      if (!preferClientSide) {
        const clientMove = await selectMoveClientSide(board, legalMoves, turn, aiLevel);
        if (clientMove) {
          return clientMove;
        }
      }
      
      // If everything failed, choose a random move as last resort
      if (legalMoves.length > 0) {
        console.log('All move selection methods failed, selecting random move');
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
      
      return null;
    } finally {
      pendingMovePromise = null;
    }
  })();
  
  return pendingMovePromise;
}

/**
 * Generate AI commentary on the current game state
 */
export function getAIAnalysis(board: Board, lastMove: Move | null, turn: PieceColor): string {
  if (!lastMove) {
    return "I'm ready to play! I'll be analyzing the game as we progress.";
  }
  
  // Sample phrases for variety
  const openingPhrases = [
    "Interesting move.", 
    "I see what you're doing.",
    "That's a solid choice.",
    "Hmm, let me think about this position."
  ];
  
  const goodMovePhrases = [
    "That's a strong move!",
    "Well played.",
    "Good positional play.",
    "You're playing with precision."
  ];
  
  const badMovePhrases = [
    "I think there might be better options here.",
    "This move gives me some opportunities.",
    "Interesting choice, though I see some tactical possibilities now.",
    "I'll need to capitalize on this position."
  ];
  
  // Evaluate the position after the move
  const score = evaluatePositionTraditional(board, turn);
  const moveQuality = turn === 'w' ? -score : score; // Negative for white means good for black
  
  // Generate commentary
  const randomPhrase = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  let commentary = "";
  
  // Randomly select what kind of comment to make
  const commentType = Math.random();
  
  if (commentType < 0.3) {
    // Comment on the piece that was moved
    const movedPiece = board[lastMove.to.row][lastMove.to.col];
    if (movedPiece) {
      const pieceNames = {
        'p': 'pawn',
        'n': 'knight',
        'b': 'bishop',
        'r': 'rook',
        'q': 'queen',
        'k': 'king'
      };
      const pieceName = pieceNames[movedPiece.type] || 'piece';
      commentary = `Your ${pieceName} move is interesting. `;
    }
  } else if (commentType < 0.6) {
    // Comment on board position/control
    if (Math.abs(score) > 3) {
      commentary = score > 0 ? 
        "White has a material advantage now. " : 
        "Black has a material advantage now. ";
    } else {
      commentary = "The position looks relatively balanced. ";
    }
  }
  
  // Add assessment of move quality
  if (moveQuality > 1.5) {
    commentary += randomPhrase(goodMovePhrases);
  } else if (moveQuality < -1.5) {
    commentary += randomPhrase(badMovePhrases);
  } else {
    commentary += randomPhrase(openingPhrases);
  }
  
  return commentary;
}
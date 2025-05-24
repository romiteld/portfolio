import { NextResponse } from 'next/server'
import type { Board, PieceColor, Move, CastlingRights } from '@/app/chess/types'
import { evaluatePositionTraditional } from '@/app/chess/ai-utils'
import { createClient } from '@supabase/supabase-js'

// Force this route to be dynamic and never run at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Request interface definition 
interface MoveRequest {
  board: Board
  turn: PieceColor
  gamePhase: string
  aiPersonality: {
    aggressiveness: number
    defensiveness: number
    mobility: number
    positionality: number
    riskTaking: number
    opening: string
    level?: number
  }
  castlingRights: CastlingRights
  aiLevel: number
  moveHistory: { notation: string }[]
  enPassantTargetSquare: { row: number, col: number } | null
}


// Supabase client initialization
let supabase: ReturnType<typeof createClient>;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase URL or Key is missing in environment variables.');
  throw new Error('Server configuration error');
} else {
  supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// --- API Route Handler ---
// Main API route handler
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    
    const {
      board,
      turn,
      castlingRights,
      aiLevel = 8,
      enPassantTargetSquare = null
    } = body as MoveRequest
    
    // Validate request data
    if (!board || !turn || !castlingRights) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // --- Model Loading Logic (SINGLE MODEL) ---
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .single() // Fetch exactly one active model
    
    if (modelError || !modelData) {
      console.error('Error fetching active model:', modelError)
      return NextResponse.json({ error: 'Chess AI model data not found' }, { status: 500 })
    }
    
  console.log(`Using model: ${modelData.name} (Version: ${modelData.version})`);
    
    // --- Move Selection Logic ---
    try {
      console.log(`Chess AI thinking as ${turn} at level ${aiLevel}...`);
      
      // Get legal moves for the current position
      const getLegalMoves = (board: Board, turn: PieceColor, castlingRights: CastlingRights, enPassantTarget: { row: number, col: number } | null): Move[] => {
        // This is a simplified implementation to find legal moves
        // In a real implementation, this would fully validate moves including check detection
        const moves: Move[] = [];
        
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === turn) {
              // For each piece of the current player's color
              
              // Simple move patterns (this is very simplified)
              if (piece.type === 'p') { // Pawn
                const direction = turn === 'w' ? -1 : 1;
                // Forward move
                if (row + direction >= 0 && row + direction < 8 && 
                    !board[row + direction][col]) {
                  moves.push({ from: { row, col }, to: { row: row + direction, col } });
                }
                // Diagonal captures
                [-1, 1].forEach(offset => {
                  if (col + offset >= 0 && col + offset < 8 && 
                      board[row + direction][col + offset] && 
                      board[row + direction][col + offset]?.color !== turn) {
                    moves.push({ from: { row, col }, to: { row: row + direction, col: col + offset } });
                  }
                });
              } else if (piece.type === 'n') { // Knight
                [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
                  const newRow = row + dr;
                  const newCol = col + dc;
                  if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && 
                      (!board[newRow][newCol] || board[newRow][newCol]?.color !== turn)) {
                    moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                  }
                });
              } else if (piece.type === 'k') { // King
                for (let dr = -1; dr <= 1; dr++) {
                  for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && 
                        (!board[newRow][newCol] || board[newRow][newCol]?.color !== turn)) {
                      moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                    }
                  }
                }
              }
              // Other pieces would have more complex move patterns
            }
          }
        }
        
        return moves;
      };
      
      const legalMoves = getLegalMoves(board, turn, castlingRights, enPassantTargetSquare);
      
      if (legalMoves.length === 0) {
        return NextResponse.json({ error: 'No legal moves available' }, { status: 200 });
      }
      
      try {
        // Server-side move selection only uses traditional evaluation
        // Client-side will handle neural network evaluation
        console.log('Using server-side traditional evaluation');
        
        // Select best move using traditional evaluation
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
          
          // Evaluate the position using material and basic strategic factors
          const score = evaluatePositionTraditional(newBoard, turn === 'w' ? 'b' : 'w');
          
          return { move, score };
        });
        
        // Sort moves by score
        evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score);
        
        // Add some randomness based on AI level
        const randomFactor = (10 - aiLevel) / 10; // Higher AI level means less randomness
        const topMovesCount = Math.max(1, Math.min(Math.floor(evaluatedMoves.length * randomFactor) + 1, evaluatedMoves.length));
        
        // Select from top moves with bias toward better moves
        const selectedIndex = Math.floor(Math.random() * Math.min(topMovesCount, evaluatedMoves.length));
        const selectedMove = evaluatedMoves[selectedIndex].move;
        
        // Add a simulated thinking time based on AI level
        const baseThinkingTime = 300; // Base ms
        const thinkingTime = baseThinkingTime + (aiLevel * 100); // Longer thinking for higher levels
        await new Promise(resolve => setTimeout(resolve, thinkingTime));
        
        if (selectedMove) {
          return NextResponse.json({ 
            move: selectedMove, 
            status: 'success'
          }, { status: 200 });
        } else {
          // This should rarely happen since we have internal fallbacks
          console.error('Move selection failed completely');
          return NextResponse.json({ error: 'Failed to select a move' }, { status: 500 });
        }
      } catch (modelError) {
        console.error('Critical error in move selection:', modelError);
        return NextResponse.json({ error: 'Error in move selection' }, { status: 500 });
      }

    } catch (logicError) {
      console.error('Error during move selection logic:', logicError);
      return NextResponse.json({ error: 'Error calculating move', details: String(logicError) }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing chess AI move request:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

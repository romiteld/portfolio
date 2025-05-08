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

// Default AI personality if none provided
const DEFAULT_AI_PERSONALITY = {
  aggressiveness: 0.7,
  defensiveness: 0.6,
  mobility: 0.8,
  positionality: 0.9,
  riskTaking: 0.5,
  opening: 'versatile',
  level: 8
};

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
      gamePhase, 
      aiPersonality = DEFAULT_AI_PERSONALITY, 
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
    
// Get the model URL from Supabase using environment variables
let modelUrl = ''

// Public URL as fallback
const publicModelUrl = 'https://vzhrmffwrkgvaziiompu.supabase.co/storage/v1/object/public/chess-models//model.onnx';

if (modelData.model_url && typeof modelData.model_url === 'string') {
  try {
    // Try to get signed URL for the model file from Supabase storage
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('chess-models')
      .createSignedUrl(modelData.model_url, 60) // 60 seconds expiry
        
    if (urlError) {
      console.error('Error getting signed URL:', urlError)
      // Fall back to public URL on error
      modelUrl = publicModelUrl;
      console.log('Using public URL as fallback:', modelUrl);
    } else if (urlData) {
      modelUrl = urlData.signedUrl
      console.log('Using signed URL for model access');
    }
  } catch (error) {
    console.error('Exception when getting signed URL:', error);
    // Fall back to public URL on exception
    modelUrl = publicModelUrl;
    console.log('Using public URL as fallback after exception:', modelUrl);
  }
} else {
  // If no model_url in database, use the public URL
  modelUrl = publicModelUrl;
  console.log('No model_url found, using public URL as fallback:', modelUrl);
}
    
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

// --- Utility functions ---
function generateFEN(
  board: Board, 
  turn: PieceColor, 
  castlingRights: CastlingRights, 
  enPassantTarget: { row: number, col: number } | null
): string {
  let fen = ''
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        if (emptyCount > 0) { fen += emptyCount; emptyCount = 0; }
        let pieceChar: string = piece.type; 
        if (piece.color === 'w') { pieceChar = pieceChar.toUpperCase(); }
        fen += pieceChar;
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) { fen += emptyCount; }
    if (r < 7) fen += '/';
  }
  fen += ' ' + turn;
  let castlingStr = '';
  if (castlingRights.w.kingside) castlingStr += 'K';
  if (castlingRights.w.queenside) castlingStr += 'Q';
  if (castlingRights.b.kingside) castlingStr += 'k';
  if (castlingRights.b.queenside) castlingStr += 'q';
  fen += ' ' + (castlingStr || '-');
  if (enPassantTarget) {
    const file = String.fromCharCode('a'.charCodeAt(0) + enPassantTarget.col);
    const rank = 8 - enPassantTarget.row;
    fen += ' ' + file + rank;
  } else {
    fen += ' -';
  }
  fen += ' 0 1'; // Simplified halfmove clock and fullmove number
  return fen;
}

import * as ort from 'onnxruntime-web';
import { createClient } from '@supabase/supabase-js';
import type { Board, PieceColor, Move, CastlingRights } from './types';

/**
 * Converts a chess board to the input tensor format required by the ONNX model
 */
export function boardToModelInput(board: Board, turn: PieceColor): ort.Tensor {
  // Initialize a 8x8x12 tensor (6 piece types × 2 colors × 8×8 board)
  const channels = 12; // 6 piece types for each color
  const inputData = new Float32Array(8 * 8 * channels).fill(0);
  
  // Map pieces to channels (standard indexing for chess models)
  const pieceToChannel: Record<string, number> = {
    'wp': 0, 'wn': 1, 'wb': 2, 'wr': 3, 'wq': 4, 'wk': 5,
    'bp': 6, 'bn': 7, 'bb': 8, 'br': 9, 'bq': 10, 'bk': 11
  };
  
  // Fill the tensor with piece positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const channel = pieceToChannel[`${piece.color}${piece.type}`];
        // Convert 3D coordinates to flat index: (row, col, channel)
        const index = row * 8 * channels + col * channels + channel;
        inputData[index] = 1.0;
      }
    }
  }
  
  return new ort.Tensor('float32', inputData, [1, channels, 8, 8]);
}

/**
 * Make a temporary move on the board without modifying the original
 */
export function makeTemporaryMove(board: Board, move: Move): Board {
  const newBoard: Board = JSON.parse(JSON.stringify(board));
  
  // Move the piece
  newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = null;
  
  // Handle promotion
  if (move.promotion && newBoard[move.to.row][move.to.col]) {
    newBoard[move.to.row][move.to.col]!.type = move.promotion;
  }
  
  return newBoard;
}

/**
 * Evaluate a position using the neural network model
 */
export async function evaluatePositionWithModel(
  session: ort.InferenceSession, 
  board: Board, 
  turn: PieceColor
): Promise<number> {
  try {
    // Convert the board to input tensor format
    const inputTensor = boardToModelInput(board, turn);
    
    // Run inference with the model
    const feeds = { input: inputTensor };
    const results = await session.run(feeds);
    
    // Process the output from the model (typically a score)
    const outputData = results.output.data as Float32Array;
    let score = outputData[0];
    
    // Scale the score to a reasonable range
    score = score * 100; // Common scaling factor for chess evaluation
    
    // Return from current player's perspective
    return turn === 'w' ? score : -score;
  } catch (error) {
    console.error('Neural network evaluation error:', error);
    return 0; // Fallback neutral score
  }
}

/**
 * Fetch the ONNX model from Supabase
 */
export async function getModelFromSupabase(): Promise<ArrayBuffer | null> {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing');
    return null;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Fetch the active model
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (modelError || !modelData) {
      console.error('Error fetching active model:', modelError);
      return null;
    }
    
    console.log(`Using model: ${modelData.name} v${modelData.version}`);
    
    // Get the signed URL for the model file
    if (modelData.model_url) {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('chess-models')
        .createSignedUrl(modelData.model_url, 60); // 60 seconds expiry
      
      if (urlError) {
        console.error('Error getting signed URL:', urlError);
        return null;
      }
      
      if (urlData && urlData.signedUrl) {
        // Fetch the model file
        const response = await fetch(urlData.signedUrl);
        return await response.arrayBuffer();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in getModelFromSupabase:', error);
    return null;
  }
}

/**
 * Select the best move using the neural network
 */
export async function selectMoveWithModel(
  session: ort.InferenceSession,
  board: Board,
  legalMoves: Move[],
  turn: PieceColor,
  aiLevel: number = 10
): Promise<Move | null> {
  if (legalMoves.length === 0) return null;
  
  try {
    // Evaluate all legal moves
    const evaluatedMoves = [];
    
    for (const move of legalMoves) {
      // Make the move on a temporary board
      const tempBoard = makeTemporaryMove(board, move);
      
      // Evaluate the resulting position
      const score = await evaluatePositionWithModel(session, tempBoard, turn === 'w' ? 'b' : 'w');
      
      evaluatedMoves.push({
        move,
        score: turn === 'w' ? score : -score
      });
    }
    
    // Sort moves by score (descending for white, ascending for black)
    evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score);
    
    // Apply AI level variation (higher levels choose better moves more consistently)
    let chosenMove: Move;
    
    if (aiLevel >= 9) {
      // Top players almost always choose the best move (90%)
      const random = Math.random();
      if (random < 0.9 || evaluatedMoves.length === 1) {
        chosenMove = evaluatedMoves[0].move;
      } else {
        // Sometimes choose the second-best move (10%)
        chosenMove = evaluatedMoves[Math.min(1, evaluatedMoves.length - 1)].move;
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
      const weights = topMoves.map((_, index) => Math.pow(0.7, index));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      let randomValue = Math.random() * totalWeight;
      let selectedIndex = 0;
      
      for (let i = 0; i < weights.length; i++) {
        randomValue -= weights[i];
        if (randomValue <= 0) {
          selectedIndex = i;
          break;
        }
      }
      
      chosenMove = topMoves[Math.min(selectedIndex, topMoves.length - 1)].move;
    }
    
    return chosenMove;
  } catch (error) {
    console.error('Error in selectMoveWithModel:', error);
    return legalMoves[Math.floor(Math.random() * legalMoves.length)]; // Fallback to random move
  }
}

import { createClient } from '@supabase/supabase-js';
import type { Board, PieceColor, Move } from '../../chess/types';

// Define types for ONNX Runtime to avoid direct dependency in TypeScript
interface InferenceSession {
  run(feeds: Record<string, unknown>): Promise<any>;
}

interface OnnxRuntime {
  InferenceSession: {
    create(buffer: ArrayBuffer): Promise<InferenceSession>;
  };
  env: {
    wasm: {
      numThreads: number;
      simd: boolean;
    };
  };
}

// Import onnxruntime-web only on client side
let ort: OnnxRuntime | null = null;

// Set safe ONNX Runtime configuration - only attempt in browser environment
if (typeof window !== 'undefined') {
  import('onnxruntime-web').then((module) => {
    ort = module as unknown as OnnxRuntime;
    try {
      // Reduced threads and disabled SIMD for better compatibility
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = false;
    } catch (error) {
      console.warn('Failed to configure ONNX Runtime settings:', error);
    }
  }).catch(err => {
    console.error('Failed to import onnxruntime-web:', err);
  });
}

// Types for ONNX Tensor to help with TypeScript even without importing onnxruntime-web directly
type OnnxTensor = {
  dims: number[];
  data: Float32Array;
  type: string;
};

// Convert chess board to model input tensor format
export function boardToModelInput(board: Board, turn: PieceColor): OnnxTensor {
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
  
  // Return a tensor object that matches OnnxTensor interface
  // In the browser context, this will be converted to a proper ort.Tensor
  return {
    type: 'float32',
    data: inputData,
    dims: [1, channels, 8, 8]
  };
}

// Make a temp move without changing game state (for evaluation)
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

// Neural network model evaluation
export async function evaluatePositionWithModel(
  session: InferenceSession, 
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
    
    // Scale the score to a reasonable range (adjust as needed)
    score = score * 100;
    
    // Return from white's perspective
    return turn === 'w' ? score : -score;
  } catch (error) {
    console.error('Neural network evaluation error:', error);
    return 0; // Fallback neutral score
  }
}

// Load the ONNX model from Supabase
export async function getModelFromSupabase(): Promise<ArrayBuffer | null> {
  /**
   * Server-side ONNX model handling for Chess AI
   * 
   * Note: This file now only provides model info and metadata
   * The actual neural network operations are performed client-side only
   */

  // External dependencies
  const { createClient } = require('@supabase/supabase-js');

  // Model information
  const MODEL_INFO = {
    name: 'Magnus Chess AI',
    version: '1.0',
    path: 'chess-models/model.onnx'
  };

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Check if code is running on server or client
  const isServer = typeof window === 'undefined';

  // Use environment variable for public model URL
  const publicModelUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chess-models/model.onnx`;
      
  try {
    // Fetch the active model
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (modelError || !modelData) {
      console.error('Error fetching active model:', modelError);
      console.log('Falling back to public URL');
      return await fetchModelFromUrl(publicModelUrl);
    }
    
    console.log(`Found model: ${modelData.name} (Version: ${modelData.version})`);
    
    // Get the signed URL for the model file
    if (modelData.model_url) {
      try {
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('chess-models')
          .createSignedUrl(modelData.model_url, 60); // 60 seconds expiry
        
        if (urlError) {
          console.error('Error getting signed URL:', urlError);
          console.log('Falling back to public URL after signed URL error');
          return await fetchModelFromUrl(publicModelUrl);
        }
        
        if (urlData && urlData.signedUrl) {
          // Fetch the model file
          return await fetchModelFromUrl(urlData.signedUrl);
        }
      } catch (urlError) {
        console.error('Exception when getting signed URL:', urlError);
        console.log('Falling back to public URL after exception');
        return await fetchModelFromUrl(publicModelUrl);
      }
    }
    
    // If we get here without a valid URL, use the public URL
    console.log('No model_url found, using public URL');
    return await fetchModelFromUrl(publicModelUrl);
  } catch (error) {
    console.error('Error in getModelFromSupabase:', error);
    console.log('Falling back to public URL after general error');
    return await fetchModelFromUrl(publicModelUrl);
  }
}

/**
 * Helper function to fetch model from URL
 * This is used to fetch the model from the Supabase URL
 */
async function fetchModelFromUrl(url: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Fetching model from URL: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch model: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching model from URL:', error);
    return null;
  }
}

// Simple evaluation function for when ONNX isn't available
function evaluatePositionTraditional(board: Board, turn: PieceColor): number {
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

// Select the best move using neural network model or fallback to traditional evaluation
export async function selectMoveWithModel(
  board: Board,
  legalMoves: Move[],
  turn: PieceColor,
  aiLevel: number = 8
): Promise<Move | null> {
  if (legalMoves.length === 0) return null;
  
  let useNeuralNetwork = aiLevel >= 6;
  let evaluatedMoves: {move: Move, score: number}[] = [];
  
  // First try to use the neural network if the AI level is high enough
  if (useNeuralNetwork) {
    try {
      console.log('Attempting to use neural network model...');
      
      // Get the model from Supabase
      const modelBuffer = await getModelFromSupabase();
      if (!modelBuffer) {
        console.log('Model not available, falling back to traditional evaluation');
        useNeuralNetwork = false;
      } else {
        // This block might fail on server-side rendering
        if (!ort) {
          throw new Error('ONNX Runtime not available');
        }
        const session = await ort.InferenceSession.create(modelBuffer);
        
        // Evaluate all legal moves with the neural network
        for (const move of legalMoves) {
          const tempBoard = makeTemporaryMove(board, move);
          const score = await evaluatePositionWithModel(
            session, 
            tempBoard, 
            turn === 'w' ? 'b' : 'w'
          );
          
          evaluatedMoves.push({
            move,
            score: turn === 'w' ? score : -score
          });
        }
        
        console.log('Successfully evaluated moves with neural network');
      }
    } catch (error) {
      console.error('Error in neural network evaluation:', error);
      console.log('Neural network failed, falling back to traditional evaluation');
      useNeuralNetwork = false;
      // Clear any partial evaluation
      evaluatedMoves = [];
    }
  }
  
  // If neural network wasn't used or failed, use traditional evaluation
  if (!useNeuralNetwork || evaluatedMoves.length === 0) {
    console.log('Using traditional evaluation...');
    
    // Evaluate each move with traditional method
    for (const move of legalMoves) {
      const tempBoard = makeTemporaryMove(board, move);
      
      // Base score on the traditional evaluator
      let score = evaluatePositionTraditional(tempBoard, turn === 'w' ? 'b' : 'w');
      
      // Add randomization based on AI level (lower levels play more randomly)
      const randomFactor = (10 - aiLevel) / 10;
      score += (Math.random() * 2 - 1) * randomFactor * 2;
      
      evaluatedMoves.push({ move, score });
    }
  }
  
  // Sort moves by score (white wants max, black wants min)
  evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score);
  
  // Apply AI level variation for move selection
  let chosenMove: Move;
  
  if (aiLevel >= 8) {
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
}

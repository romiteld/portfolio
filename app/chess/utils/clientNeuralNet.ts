/**
 * Client-side neural network implementation for Chess AI
 * This allows the model to run in the browser using ONNX Runtime Web
 */

import * as ort from 'onnxruntime-web';

// Model URL from environment variables
const PUBLIC_MODEL_URL = process.env.NEXT_PUBLIC_CHESS_MODEL_URL || '/models/chess-model.onnx';

// Initialize ONNX session lazily
let session: ort.InferenceSession | null = null;
let isModelLoading = false;
let modelLoadError: Error | null = null;

/**
 * Convert chess board to model input tensor format
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
 * Make a temporary move without changing game state (for evaluation)
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
 * Initialize ONNX Runtime and load the model
 */
export async function initializeModel(): Promise<ort.InferenceSession | null> {
  if (session) return session;
  if (isModelLoading) return null;
  
  try {
    console.log("Initializing client-side neural network model...");
    isModelLoading = true;
    modelLoadError = null;
    
    // Configure ONNX Runtime settings
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false;
    
    // Fetch the model
    const response = await fetch(PUBLIC_MODEL_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
    }
    
    const modelBuffer = await response.arrayBuffer();
    console.log("Model fetched, creating session...");
    
    // Create ONNX session
    session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });
    
    console.log("Client-side neural network model initialized successfully");
    return session;
  } catch (error) {
    console.error("Error initializing client-side neural network:", error);
    modelLoadError = error instanceof Error ? error : new Error(String(error));
    return null;
  } finally {
    isModelLoading = false;
  }
}

/**
 * Evaluate a position with the neural network model
 */
export async function evaluatePositionWithModel(
  board: Board, 
  turn: PieceColor
): Promise<number> {
  try {
    if (!session) {
      await initializeModel();
      if (!session) {
        throw new Error("Model not initialized");
      }
    }
    
    // Convert the board to input tensor format
    const inputTensor = boardToModelInput(board, turn);
    
    // Run inference with the model
    const feeds = { input: inputTensor };
    const results = await session.run(feeds);
    
    // Process the output from the model (typically a score)
    const outputData = results.output.data as Float32Array;
    let score = outputData[0];
    
    // Scale the score to a reasonable range
    score = score * 100;
    
    // Return from white's perspective
    return turn === 'w' ? score : -score;
  } catch (error) {
    console.error('Neural network evaluation error:', error);
    return 0; // Fallback neutral score
  }
}

/**
 * Select the best move using the neural network model
 */
export async function selectMoveWithModel(
  board: Board,
  legalMoves: Move[],
  turn: PieceColor,
  aiLevel: number = 8
): Promise<Move | null> {
  if (legalMoves.length === 0) return null;
  
  try {
    // Initialize model if needed
    if (!session) {
      await initializeModel();
      if (!session) {
        throw new Error("Failed to initialize model");
      }
    }
    
    // Evaluate all legal moves
    const evaluatedMoves = [];
    
    for (const move of legalMoves) {
      // Make the move on a temporary board
      const tempBoard = makeTemporaryMove(board, move);
      
      // Evaluate the resulting position
      const score = await evaluatePositionWithModel(tempBoard, turn === 'w' ? 'b' : 'w');
      
      evaluatedMoves.push({
        move,
        score: turn === 'w' ? score : -score
      });
    }
    
    // Sort moves by score (white wants max, black wants min)
    evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score);
    
    // Apply AI level variation (higher levels choose better moves more consistently)
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
  } catch (error) {
    console.error('Error in client-side selectMoveWithModel:', error);
    return null;
  }
}


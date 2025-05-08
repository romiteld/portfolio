import * as ort from 'onnxruntime-web';
import type { Board, PieceColor, Move } from './types';

// Convert chess board to model input tensor format
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

// Creates a simple move from algebraic notation (e.g., "e2e4")
export function moveFromAlgebraic(notation: string, board: Board): Move | null {
  // Simplified version for book moves (e.g., "e2e4")
  if (notation.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(notation)) {
    const fromCol = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRow = 8 - parseInt(notation[1], 10);
    const toCol = notation.charCodeAt(2) - 'a'.charCodeAt(0);
    const toRow = 8 - parseInt(notation[3], 10);
    
    if (fromRow >= 0 && fromRow < 8 && fromCol >= 0 && fromCol < 8 &&
        toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
      return { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    }
  }
  return null;
}

// Make a temp move without changing game state (for evaluation)
export function makeTemporaryMove(
  board: Board, 
  move: Move
): Board {
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
    score = score * 10;
    
    // Return from white's perspective
    return turn === 'w' ? score : -score;
  } catch (error) {
    console.error('Neural network evaluation error:', error);
    return 0; // Fallback neutral score
  }
}

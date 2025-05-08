import { createClient } from '@supabase/supabase-js'
import * as ort from 'onnxruntime-web'
import type { Board, PieceColor, Move, CastlingRights } from '@/app/chess/types'
import { boardToModelInput, moveFromAlgebraic, makeTemporaryMove, evaluatePositionWithModel } from '@/app/chess/onnx-model'

// Interface for model data from Supabase
interface ChessModelData {
  id: string
  name: string
  version: string
  model_url: string
  is_active: boolean
  description?: string
  created_at: string
}

// Get the model URL from Supabase
export async function getModelFromSupabase(): Promise<string | null> {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing in environment variables.')
    return null
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Fetch the active model
    const { data: modelData, error: modelError } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (modelError || !modelData) {
      console.error('Error fetching active model:', modelError)
      return null
    }
    
    console.log(`Using model: ${modelData.name} (Version: ${modelData.version})`)
    
    // Get the signed URL for the model file
    if (modelData.model_url) {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('chess-models')
        .createSignedUrl(modelData.model_url, 60) // 60 seconds expiry
      
      if (urlError) {
        console.error('Error getting signed URL:', urlError)
        return null
      }
      
      if (urlData) {
        return urlData.signedUrl
      }
    }
    
    return null
  } catch (error) {
    console.error('Error in getModelFromSupabase:', error)
    return null
  }
}

// Use the neural network to select the best move
export async function selectMoveWithNeuralNetwork(
  modelUrl: string,
  board: Board,
  turn: PieceColor,
  legalMoves: Move[],
  aiLevel: number = 8
): Promise<Move | null> {
  if (legalMoves.length === 0) return null
  
  try {
    // Load the ONNX model
    console.log('Loading ONNX model from URL...')
    const response = await fetch(modelUrl)
    const modelBuffer = await response.arrayBuffer()
    
    // Create an ONNX session
    const session = await ort.InferenceSession.create(modelBuffer)
    
    // Evaluate all legal moves
    const evaluatedMoves = []
    
    for (const move of legalMoves) {
      // Make the move on a temporary board
      const tempBoard = makeTemporaryMove(board, move)
      
      // Evaluate the resulting position
      const score = await evaluatePositionWithModel(session, tempBoard, turn === 'w' ? 'b' : 'w')
      
      evaluatedMoves.push({
        move,
        score: turn === 'w' ? score : -score
      })
    }
    
    // Sort moves by score (white wants max, black wants min)
    evaluatedMoves.sort((a, b) => turn === 'w' ? b.score - a.score : a.score - b.score)
    
    // Apply AI level variation (higher levels choose better moves more consistently)
    let chosenMove: Move
    
    if (aiLevel >= 8) {
      // Top players almost always choose the best move (90%)
      const random = Math.random()
      if (random < 0.9 || evaluatedMoves.length === 1) {
        chosenMove = evaluatedMoves[0].move
      } else {
        // Sometimes choose the second-best move (10%)
        chosenMove = evaluatedMoves[Math.min(1, evaluatedMoves.length - 1)].move
      }
    } else {
      // Lower levels consider more options with more randomness
      const randomnessFactor = (10 - aiLevel) / 10
      const topMovesCount = Math.min(
        evaluatedMoves.length, 
        Math.max(1, Math.floor(2 + randomnessFactor * 5))
      )
      
      // Choose randomly from top moves with weighted probability
      const topMoves = evaluatedMoves.slice(0, topMovesCount)
      const weights = topMoves.map((_, index) => Math.pow(0.7, index))
      const totalWeight = weights.reduce((sum, w) => sum + w, 0)
      
      let randomValue = Math.random() * totalWeight
      let selectedIndex = 0
      
      for (let i = 0; i < weights.length; i++) {
        randomValue -= weights[i]
        if (randomValue <= 0) {
          selectedIndex = i
          break
        }
      }
      
      chosenMove = topMoves[Math.min(selectedIndex, topMoves.length - 1)].move
    }
    
    console.log('Neural network model used for move selection')
    return chosenMove
  } catch (error) {
    console.error('Error using neural network for move selection:', error)
    return null
  }
}

// Try to find a move in the opening book
export function findOpeningBookMove(
  openingBook: { [key: string]: string },
  moveHistoryString: string,
  board: Board,
  legalMoves: Move[]
): Move | null {
  if (moveHistoryString in openingBook) {
    const bookMoveNotation = openingBook[moveHistoryString]
    console.log(`Found book move: ${bookMoveNotation} for history: ${moveHistoryString}`)
    
    const bookMove = moveFromAlgebraic(bookMoveNotation, board)
    if (bookMove) {
      // Check if this book move is valid according to our legal moves
      const isValid = legalMoves.some(move => 
        move.from.row === bookMove.from.row && move.from.col === bookMove.from.col && 
        move.to.row === bookMove.to.row && move.to.col === bookMove.to.col
      )
      
      if (isValid) {
        console.log(`Using book move: ${bookMoveNotation}`)
        return bookMove
      }
      
      console.log(`Book move ${bookMoveNotation} is not valid in current position.`)
    }
  }
  
  return null
}

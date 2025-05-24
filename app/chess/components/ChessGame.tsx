"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
// Import types from the central types file
import type { Move, ChessGameProps } from '../types';
import ChessBoard from './ChessBoard' // Assuming ChessBoard is the visual component

// The ChessGame component now primarily focuses on rendering the board passed via props
// and calling the onMove callback when a player makes a move on the UI.
const ChessGame = ({
  board,
  onMove,
  orientation = 'w',
  legalMoves = [],
  lastMove = null,
  isCheck = false,
  checkPosition = null,
  disabled = false,
  showCoordinates = true,
  animationDuration = 0.2,
  className = '',
  playerColor,
  aiLevel: _aiLevel,
  showControls: _showControls,
  showPlayerAnalysis: _showPlayerAnalysis,
  onGameOver: _onGameOver
}: ChessGameProps) => {

  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    setSelectedSquare(null);
  }, [board]);

  const legalMovesMap = useMemo(() => {
    if (!selectedSquare) return new Map();

    const map = new Map();
    legalMoves
      .filter(move => move.from.row === selectedSquare.row && move.from.col === selectedSquare.col)
      .forEach(move => {
        map.set(`${move.to.row},${move.to.col}`, move);
      });

    return map;
  }, [selectedSquare, legalMoves]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (disabled) return;

    if (selectedSquare) {
      const moveKey = `${row},${col}`;
      if (legalMovesMap.has(moveKey)) {
        const move = legalMovesMap.get(moveKey) as Move;
        // Directly call onMove with the move object when a valid move is selected
        onMove(move);
        setSelectedSquare(null);
        return;
      }

      if ((selectedSquare.row === row && selectedSquare.col === col) || !board[row][col]) {
        setSelectedSquare(null);
        return;
      }

      const piece = board[row][col];
      if (piece && piece.color === board[selectedSquare.row][selectedSquare.col]?.color) {
        const hasMoves = legalMoves.some(m => m.from.row === row && m.from.col === col);
        if (hasMoves) setSelectedSquare({ row, col });
        else setSelectedSquare(null);
        return;
      }

      setSelectedSquare(null);
    } else {
      const piece = board[row][col];
      if (piece && piece.color === playerColor) {
        const hasLegalMoves = legalMoves.some(m => m.from.row === row && m.from.col === col);
        if (hasLegalMoves) {
          setSelectedSquare({ row, col });
        }
      }
    }
  }, [disabled, selectedSquare, legalMovesMap, board, legalMoves, playerColor, onMove]);

  // Create a wrapper function that adapts our row/col based click handler to the Move-based interface
  const handleMove = useCallback((move: Move) => {
    // When a move object is directly passed (like drag and drop), directly use the onMove callback
    if (move.from && move.to) {
      // Check if this is a legal move
      const isLegalMove = legalMoves.some(
        m => m.from.row === move.from.row && m.from.col === move.from.col && 
             m.to.row === move.to.row && m.to.col === move.to.col
      );
      
      if (isLegalMove) {
        // Directly pass the move to the parent component
        onMove(move);
        setSelectedSquare(null);
        return;
      }
    }
    
    // For click-based moves, handle them through our square click handler
    if (selectedSquare) {
      handleSquareClick(move.to.row, move.to.col);
    } else {
      // If no square is selected yet, we can use 'from' as the initial selection
      handleSquareClick(move.from.row, move.from.col);
    }
  }, [selectedSquare, handleSquareClick, legalMoves, onMove]);

  return (
    <ChessBoard
      board={board}
      onMove={handleMove}
      orientation={orientation}
      legalMoves={legalMoves}
      lastMove={lastMove}
      isCheck={isCheck}
      checkPosition={checkPosition}
      disabled={disabled}
      showCoordinates={showCoordinates}
      animationDuration={animationDuration}
      className={className}
    />
  );
};

export default ChessGame  
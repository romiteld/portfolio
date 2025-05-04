"use client"

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Text, Sphere } from '@react-three/drei'
import { Physics, useBox, usePlane } from '@react-three/cannon'
import * as THREE from 'three'
import { Board, Move, PieceColor, Piece } from './ChessBoard'

// Define colors
const LIGHT_SQUARE = '#f0d9b5'
const DARK_SQUARE = '#b58863'
const HIGHLIGHT_COLOR = '#5a81d4'
const MOVE_HIGHLIGHT_COLOR = '#66bb6a'
const CHECK_HIGHLIGHT_COLOR = '#ef5350'
const BOARD_EDGE_COLOR = '#703c19'

// Chess pieces
const ChessPiece = ({ position, pieceType, pieceColor, selected, onClick }: { 
  position: [number, number, number], 
  pieceType: string, 
  pieceColor: PieceColor,
  selected: boolean,
  onClick: () => void
}) => {
  // For now, using simple geometries. Will replace with actual models later
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Different shapes for different pieces
  const getGeometry = () => {
    switch(pieceType) {
      case 'p': return <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
      case 'r': return <boxGeometry args={[0.5, 0.6, 0.5]} />
      case 'n': return <coneGeometry args={[0.3, 0.7, 32]} />
      case 'b': return <coneGeometry args={[0.35, 0.8, 32]} />
      case 'q': return <sphereGeometry args={[0.45, 32, 32]} />
      case 'k': return <cylinderGeometry args={[0.3, 0.4, 0.9, 32]} />
      default: return <boxGeometry args={[0.5, 0.5, 0.5]} />
    }
  }
  
  // Animation on selection
  useFrame(() => {
    if (!meshRef.current) return
    
    if (selected) {
      // Make piece float/bounce when selected
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.005) * 0.1 + 0.2
      meshRef.current.rotation.y += 0.01
    } else {
      // Reset position when not selected
      meshRef.current.position.y = position[1]
      meshRef.current.rotation.y = 0
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      castShadow
      receiveShadow
    >
      {getGeometry()}
      <meshStandardMaterial 
        color={pieceColor === 'w' ? 'white' : 'black'} 
        metalness={0.5}
        roughness={0.5}
        emissive={selected ? HIGHLIGHT_COLOR : 'black'}
        emissiveIntensity={selected ? 0.5 : 0}
      />
    </mesh>
  )
}

// Chess board square
const Square = ({ 
  position, 
  color, 
  size, 
  isHighlighted = false,
  highlightColor = HIGHLIGHT_COLOR,
  onClick
}: { 
  position: [number, number, number], 
  color: string, 
  size: number,
  isHighlighted?: boolean,
  highlightColor?: string,
  onClick: () => void
}) => {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={isHighlighted ? highlightColor : color} />
    </mesh>
  )
}

// Board base with wooden texture
const BoardBase = () => {
  return (
    <>
      {/* Main wooden base */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[9, 0.3, 9]} />
        <meshStandardMaterial 
          color={BOARD_EDGE_COLOR} 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Decorative border around the playing area */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[8.6, 0.1, 8.6]} />
        <meshStandardMaterial 
          color="#5d341d" 
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      
      {/* Bottom with felt texture */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[9, 0.05, 9]} />
        <meshStandardMaterial color="#2d160b" roughness={1} />
      </mesh>
    </>
  )
}

// Loading message while board is initializing
const LoadingMessage = () => {
  return (
    <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <Text
        color="white"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        Loading Chess Board...
      </Text>
    </mesh>
  )
}

// Visual indicator for legal moves
const MoveIndicator = ({ position }: { position: [number, number, number] }) => {
  return (
    <Sphere args={[0.2, 16, 16]} position={[position[0], position[1] + 0.1, position[2]]}>
      <meshStandardMaterial 
        color={MOVE_HIGHLIGHT_COLOR} 
        transparent={true} 
        opacity={0.6} 
        emissive={MOVE_HIGHLIGHT_COLOR}
        emissiveIntensity={0.3}
      />
    </Sphere>
  )
}

// Main 3D chess board
interface Chess3DProps {
  board: Board
  onMove: (move: Move) => void
  orientation: PieceColor
  legalMoves?: Move[]
  lastMove?: Move | null
  isCheck?: boolean
  checkPosition?: { row: number, col: number } | null
  disabled?: boolean
  className?: string
}

const Chess3D = ({
  board,
  onMove,
  orientation = 'w',
  legalMoves = [],
  lastMove = null,
  isCheck = false,
  checkPosition = null,
  disabled = false,
  className = ''
}: Chess3DProps) => {
  const [selectedSquare, setSelectedSquare] = useState<{ row: number, col: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Check if the board is fully initialized
  useEffect(() => {
    if (board && board.length === 8 && board[0].length === 8) {
      // Check if there's at least one piece on the board
      let hasPieces = false
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c] !== null) {
            hasPieces = true
            break
          }
        }
        if (hasPieces) break
      }
      setIsInitialized(hasPieces)
    } else {
      setIsInitialized(false)
    }
  }, [board])
  
  // Reset selected square when board changes
  useEffect(() => {
    setSelectedSquare(null)
  }, [board])
  
  // Map of legal moves for the selected piece
  const legalMovesMap = new Map()
  if (selectedSquare) {
    legalMoves
      .filter(move => move.from.row === selectedSquare.row && move.from.col === selectedSquare.col)
      .forEach(move => {
        legalMovesMap.set(`${move.to.row},${move.to.col}`, move)
      })
  }
  
  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (disabled) return
    
    // If a square is already selected, attempt to move
    if (selectedSquare) {
      // Check if this is a legal destination
      const moveKey = `${row},${col}`
      if (legalMovesMap.has(moveKey)) {
        const move = legalMovesMap.get(moveKey)
        onMove(move)
        setSelectedSquare(null)
        return
      }
      
      // Check if clicking on the same square (deselect)
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null)
        return
      }
      
      // Check if clicking on another piece of the same color
      const piece = board[row][col]
      if (piece && board[selectedSquare.row][selectedSquare.col]?.color === piece.color) {
        setSelectedSquare({ row, col })
        return
      }
    }
    
    // No square selected, check if this square has a piece
    const piece = board[row][col]
    if (piece) {
      // Check if there are legal moves for this piece
      const hasLegalMoves = legalMoves.some(move => move.from.row === row && move.from.col === col)
      if (hasLegalMoves) {
        setSelectedSquare({ row, col })
      }
    }
  }
  
  // Render the board
  const renderBoard = () => {
    if (!isInitialized) {
      return <LoadingMessage />
    }

    const squares = []
    const pieces = []
    const moveIndicators = []
    const squareSize = 1
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        // Get the actual row and column based on orientation
        const actualRow = orientation === 'w' ? r : 7 - r
        const actualCol = orientation === 'w' ? c : 7 - c
        
        const piece = board[actualRow][actualCol]
        const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol
        const isLegalMove = selectedSquare && legalMovesMap.has(`${actualRow},${actualCol}`)
        const isLastMoveFrom = lastMove && lastMove.from.row === actualRow && lastMove.from.col === actualCol
        const isLastMoveTo = lastMove && lastMove.to.row === actualRow && lastMove.to.col === actualCol
        const isInCheck = isCheck && checkPosition && checkPosition.row === actualRow && checkPosition.col === actualCol
        
        // Square color (light or dark)
        const isLightSquare = (r + c) % 2 === 0
        const squareColor = isLightSquare ? LIGHT_SQUARE : DARK_SQUARE
        
        // Determine if square should be highlighted
        let isHighlighted = false
        let highlightColor = HIGHLIGHT_COLOR
        
        if (isLastMoveFrom || isLastMoveTo) {
          isHighlighted = true
          highlightColor = HIGHLIGHT_COLOR
        }
        
        if (isLegalMove) {
          isHighlighted = true
          highlightColor = MOVE_HIGHLIGHT_COLOR
        }
        
        if (isInCheck) {
          isHighlighted = true
          highlightColor = CHECK_HIGHLIGHT_COLOR
        }
        
        // Create square
        const squarePosition: [number, number, number] = [c - 3.5, 0, r - 3.5]
        squares.push(
          <Square
            key={`square-${r}-${c}`}
            position={squarePosition}
            color={squareColor}
            size={squareSize}
            isHighlighted={isHighlighted}
            highlightColor={highlightColor}
            onClick={() => handleSquareClick(actualRow, actualCol)}
          />
        )
        
        // Add move indicators for legal moves
        if (isLegalMove) {
          moveIndicators.push(
            <MoveIndicator
              key={`indicator-${r}-${c}`}
              position={[c - 3.5, 0, r - 3.5]}
            />
          )
        }
        
        // Create piece if exists
        if (piece) {
          const piecePosition: [number, number, number] = [c - 3.5, 0.25, r - 3.5]
          pieces.push(
            <ChessPiece
              key={`piece-${r}-${c}`}
              position={piecePosition}
              pieceType={piece.type}
              pieceColor={piece.color}
              selected={isSelected}
              onClick={() => handleSquareClick(actualRow, actualCol)}
            />
          )
        }
      }
    }
    
    return (
      <>
        {squares}
        {moveIndicators}
        {pieces}
      </>
    )
  }
  
  // Add file and rank labels
  const renderLabels = () => {
    const labels = []
    const offset = 4
    
    // Files (a-h)
    for (let c = 0; c < 8; c++) {
      const actualCol = orientation === 'w' ? c : 7 - c
      const file = String.fromCharCode(97 + actualCol)
      labels.push(
        <Text
          key={`file-${c}`}
          position={[c - 3.5, 0, 4.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="white"
        >
          {file}
        </Text>
      )
    }
    
    // Ranks (1-8)
    for (let r = 0; r < 8; r++) {
      const actualRow = orientation === 'w' ? r : 7 - r
      const rank = 8 - actualRow
      labels.push(
        <Text
          key={`rank-${r}`}
          position={[-4.2, 0, r - 3.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="white"
        >
          {rank}
        </Text>
      )
    }
    
    return labels
  }
  
  return (
    <div className={`w-full aspect-square ${className}`}>
      <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        <fog attach="fog" args={['#1a1a1a', 10, 30]} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.4} color="#FFF5E6" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={0.6}
          intensity={0.5}
          castShadow
          shadow-bias={-0.0001}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={15}
          autoRotate={!isInitialized}
          autoRotateSpeed={1}
        />
        
        <group>
          <BoardBase />
          {renderBoard()}
          {isInitialized && renderLabels()}
        </group>
        
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}

export default Chess3D 
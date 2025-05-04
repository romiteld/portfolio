"use client"

import React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Simple placeholder component for the financial visualization
export default function FinancialScene() {
  const groupRef = React.useRef<THREE.Group>(null)
  
  // Simple animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })
  
  return (
    <>
      {/* Simple ambient light */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Simple group with some basic shapes */}
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4284f5" />
        </mesh>
        
        {/* Some market indicator-like bars */}
        <mesh position={[-2, 0, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
          <meshStandardMaterial color="#11be69" />
        </mesh>
        
        <mesh position={[-1, 0, 0]}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color="#11be69" />
        </mesh>
        
        <mesh position={[1, 0, 0]}>
          <boxGeometry args={[0.5, 0.8, 0.5]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
        
        <mesh position={[2, 0, 0]}>
          <boxGeometry args={[0.5, 1.2, 0.5]} />
          <meshStandardMaterial color="#11be69" />
        </mesh>
      </group>
    </>
  )
} 
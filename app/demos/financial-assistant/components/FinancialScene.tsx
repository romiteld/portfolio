"use client"

import React, { Suspense, useEffect, useState, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'

// Simple placeholder component for the financial visualization
const FinancialScene = () => {
  const [ready, setReady] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useThree()
  
  // Make sure the scene is ready before animating
  useEffect(() => {
    // Set ready state after component has mounted
    const timeout = setTimeout(() => {
      setReady(true)
    }, 300) // Increase timeout to ensure complete hydration
    
    // Cleanup WebGL renderer on unmount
    return () => {
      clearTimeout(timeout)
      
      // Clean up THREE.js resources when component unmounts
      if (scene) {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose()
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose())
              } else {
                object.material.dispose()
              }
            }
          }
        })
      }
    }
  }, [scene])
  
  // Simple animation with safety check
  useFrame(({ clock }) => {
    if (!ready || !groupRef.current) return
    // Use less frequent rotation for better performance
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.05
  })
  
  // Handle renderer errors
  useEffect(() => {
    const handleErrors = (event: ErrorEvent) => {
      if (event.message.includes('WebGL') || event.message.includes('THREE')) {
        console.warn('WebGL error occurred:', event.message)
        // Could implement a fallback here if needed
      }
    }
    
    window.addEventListener('error', handleErrors)
    return () => window.removeEventListener('error', handleErrors)
  }, [])
  
  return (
    <Suspense fallback={null}>
      {/* Simple ambient light */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.4} />
      
      {/* Simple group with some basic shapes */}
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4284f5" roughness={0.7} />
        </mesh>
        
        {/* Some market indicator-like bars */}
        <mesh position={[-2, 0, 0]}>
          <boxGeometry args={[0.5, 1.5, 0.5]} />
          <meshStandardMaterial color="#11be69" roughness={0.7} />
        </mesh>
        
        <mesh position={[-1, 0, 0]}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color="#11be69" roughness={0.7} />
        </mesh>
        
        <mesh position={[1, 0, 0]}>
          <boxGeometry args={[0.5, 0.8, 0.5]} />
          <meshStandardMaterial color="#e11d48" roughness={0.7} />
        </mesh>
        
        <mesh position={[2, 0, 0]}>
          <boxGeometry args={[0.5, 1.2, 0.5]} />
          <meshStandardMaterial color="#11be69" roughness={0.7} />
        </mesh>
      </group>
      
      <Environment preset="city" background={false} />
    </Suspense>
  )
}

export default FinancialScene 
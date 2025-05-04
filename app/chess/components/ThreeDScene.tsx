'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

// Death Star component
const DeathStar = () => {
  const deathStarRef = useRef<THREE.Mesh>(null)
  
  useFrame(({clock}) => {
    if (deathStarRef.current) {
      // Slow rotation
      deathStarRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })
  
  return (
    <mesh ref={deathStarRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} emissive="#111111" />
      {/* Add the equatorial trench */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[2.05, 0.15, 16, 100]} />
        <meshStandardMaterial color="#333333" emissive="#222222" />
      </mesh>
      {/* Add the super laser */}
      <mesh position={[0, -1.8, 0.9]} rotation={[Math.PI/8, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="#222222" emissive="#333333" />
      </mesh>
      {/* Add green laser effect */}
      <pointLight position={[0, -1.8, 0.9]} color="#00ff00" intensity={2} distance={5} />
    </mesh>
  )
}

// X-Wing component
const XWing = ({ index }: { index: number }) => {
  const xWingRef = useRef<THREE.Group>(null)
  const speed = 0.2 + Math.random() * 1
  
  // Create more varied flight paths across the entire scene
  const startPosition = [
    Math.cos(Math.random() * Math.PI * 2) * (50 + Math.random() * 30),
    Math.random() * 40 - 20,
    Math.sin(Math.random() * Math.PI * 2) * (50 + Math.random() * 30)
  ] as [number, number, number]
  
  const endPosition = [
    Math.cos(Math.random() * Math.PI * 2) * (50 + Math.random() * 30),
    Math.random() * 40 - 20,
    Math.sin(Math.random() * Math.PI * 2) * (50 + Math.random() * 30)
  ] as [number, number, number]
  
  const currentPosition = useRef(startPosition)
  const targetPosition = useRef(endPosition)
  
  useFrame(() => {
    if (xWingRef.current) {
      // Move toward target
      const newPos: [number, number, number] = currentPosition.current.map((coord, i) => {
        return coord + (targetPosition.current[i] - coord) * 0.005 * speed
      }) as [number, number, number]
      
      currentPosition.current = newPos
      xWingRef.current.position.set(newPos[0], newPos[1], newPos[2])
      
      // Look at next position
      const direction = new THREE.Vector3(
        targetPosition.current[0] - newPos[0],
        targetPosition.current[1] - newPos[1],
        targetPosition.current[2] - newPos[2]
      ).normalize()
      
      const lookAt = new THREE.Vector3(
        newPos[0] + direction.x,
        newPos[1] + direction.y,
        newPos[2] + direction.z
      )
      
      xWingRef.current.lookAt(lookAt)
      
      // Check if we're close to target
      const distance = Math.sqrt(
        Math.pow(newPos[0] - targetPosition.current[0], 2) +
        Math.pow(newPos[1] - targetPosition.current[1], 2) +
        Math.pow(newPos[2] - targetPosition.current[2], 2)
      )
      
      if (distance < 2) {
        // Pick a new random destination
        targetPosition.current = [
          Math.cos(Math.random() * Math.PI * 2) * (50 + Math.random() * 30),
          Math.random() * 40 - 20,
          Math.sin(Math.random() * Math.PI * 2) * (50 + Math.random() * 30)
        ]
      }
    }
  })
  
  // X-wing appearance remains the same
  return (
    <group ref={xWingRef} scale={[0.2, 0.2, 0.2]}>
      {/* X-Wing body */}
      <mesh>
        <boxGeometry args={[1, 0.3, 3]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Wings */}
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1.5]} />
        <meshStandardMaterial color="#cc0000" emissive="#330000" />
      </mesh>
      <mesh position={[-1, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1.5]} />
        <meshStandardMaterial color="#cc0000" emissive="#330000" />
      </mesh>
      {/* Engines with glowing effect */}
      <mesh position={[1.5, 0, -0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <pointLight position={[1.5, 0, -1]} color="#ff6600" intensity={0.5} distance={2} />
      
      <mesh position={[-1.5, 0, -0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <pointLight position={[-1.5, 0, -1]} color="#ff6600" intensity={0.5} distance={2} />
      
      {/* Cockpit */}
      <mesh position={[0, 0.3, 0.5]}>
        <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.7} emissive="#003366" />
      </mesh>
    </group>
  )
}

// Main ThreeDScene component
const ThreeDScene = () => {
  return (
    <Canvas 
      camera={{ position: [5, 2, 15], fov: 60 }}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        background: 'linear-gradient(to bottom, #000000, #050520)'
      }}
    >
      {/* Add more light sources for better visibility */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6666ff" />
      <spotLight 
        position={[5, 5, 5]} 
        angle={0.3} 
        penumbra={0.8} 
        intensity={2} 
        castShadow 
        color="#ffffff"
      />
      
      {/* Position Death Star to the side */}
      <group position={[20, 0, -30]}>
        <DeathStar />
      </group>
      
      {Array.from({ length: 15 }).map((_, index) => (
        <XWing key={index} index={index} />
      ))}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade speed={1.5} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.1} />
    </Canvas>
  )
}

export default ThreeDScene 
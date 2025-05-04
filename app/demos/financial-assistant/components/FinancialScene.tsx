"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Text, Environment } from "@react-three/drei"
import * as THREE from "three"
import { useTheme } from "next-themes"
import gsap from "gsap"

interface GroupProps {
  children?: React.ReactNode;
  position?: [number, number, number];
  ref?: React.RefObject<THREE.Group>;
}

// Financial Scene component that handles 3D rendering
const FinancialScene = () => {
  const { camera } = useThree()
  const gridRef = useRef<THREE.Group>(null)
  const sceneRef = useRef<THREE.Group>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = theme === 'dark' || resolvedTheme === 'dark'
  
  // Use GSAP for enhanced depth animation
  useEffect(() => {
    // Position camera for better view of scene
    camera.position.z = 15
    
    // Check if camera is PerspectiveCamera to safely use fov property
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50
      camera.updateProjectionMatrix()
    }
    
    // Initialize GSAP with ScrollTrigger
    if (typeof window !== 'undefined') {
      // Add ambient animation independent of scrolling
      if (gridRef.current) {
        gsap.to(gridRef.current.position, {
          y: 0.5,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })
        
        gsap.to(gridRef.current.rotation, {
          x: 0.05,
          y: 0.05,
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })
      }
      
      if (sceneRef.current) {
        gsap.to(sceneRef.current.position, {
          y: 0.2,
          duration: 6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })
      }
    }
  }, [camera])
  
  // Additional subtle animations with useFrame
  useFrame(({ clock }) => {
    if (gridRef.current) {
      // Add very subtle movement to enhance depth
      gridRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.05) * 0.02
    }
    
    if (sceneRef.current) {
      // Subtle breathing animation for the entire scene
      sceneRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 0.2) * 0.01
      sceneRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 0.2) * 0.01
    }
  })
  
  return (
    <>
      {/* Background color based on theme */}
      <color attach="background" args={[isDark ? '#0a101f' : '#f0f4f8']} />
      
      {/* Ambient lighting adjusted for theme */}
      <ambientLight intensity={isDark ? 0.2 : 0.5} />
      
      {/* Directional light */}
      <directionalLight
        position={[10, 10, 10]}
        intensity={isDark ? 0.1 : 0.3}
        color={isDark ? "#ffffff" : "#e0e0e0"}
      />
      
      {/* Grid background with depth */}
      <group ref={gridRef} position={[0, 0, -5]}>
        <GridBackground isDark={isDark} />
      </group>
      
      {/* Main content with GSAP-enhanced depth */}
      <group ref={sceneRef}>
        <Particles count={3000} />
      </group>
      
      {/* Environment for better lighting */}
      <Environment preset={isDark ? "night" : "city"} background={false} />
    </>
  )
}

// Professional grid background like a trading platform
function GridBackground({ isDark = true }) {
  const linesRef = useRef<THREE.Group>(null)
  
  // Use GSAP-compatible animation via useFrame
  useFrame(({ clock }) => {
    if (linesRef.current) {
      // Create wave-like motion in the grid for depth
      linesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const phase = i * 0.05
          const amplitude = 0.1
          // Apply different motion to different grid lines for 3D effect
          child.position.z = Math.sin(clock.elapsedTime * 0.2 + phase) * amplitude
          
          // Modulate opacity for depth effect
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.opacity = 0.2 + Math.sin(clock.elapsedTime * 0.1 + phase) * 0.1
          }
        }
      })
    }
  })

  return (
    <group>
      {/* Dark background plane */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[100, 60]} />
        <meshBasicMaterial color="#0a112e" opacity={0.9} transparent />
      </mesh>
      
      {/* Grid lines with depth effect */}
      <group ref={linesRef}>
        {/* Horizontal grid lines - more subtle */}
        {Array.from({ length: 24 }).map((_, i) => (
          <mesh key={`h-${i}`} position={[0, i * 2 - 22, -0.5]}>
            <planeGeometry args={[100, 0.02]} />
            <meshBasicMaterial color="#213363" opacity={0.3} transparent />
          </mesh>
        ))}
        
        {/* Vertical grid lines - more subtle */}
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh key={`v-${i}`} position={[i * 2 - 48, 0, -0.5]}>
            <planeGeometry args={[0.02, 60]} />
            <meshBasicMaterial color="#213363" opacity={0.3} transparent />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// Enhanced particles component for financial data visualization
function Particles({ count = 5000 }) {
  const camera = useThree(state => state.camera)
  const { viewport } = useThree()
  
  // Create points with varying sizes and colors for more realism
  const { points, sizes, colors } = useMemo(() => {
    const p: THREE.Vector3[] = []
    const s: number[] = []
    const c: THREE.Color[] = []
    
    // Financial data color palette - less saturated, more professional
    const colorPalette = [
      new THREE.Color("#3b71cf").multiplyScalar(0.6), // Muted blue
      new THREE.Color("#11be69").multiplyScalar(0.5), // Muted green
      new THREE.Color("#4a6dff").multiplyScalar(0.6), // Financial blue
      new THREE.Color("#5994ce").multiplyScalar(0.6), // Light blue
      new THREE.Color("#e1bd3c").multiplyScalar(0.6)  // Gold
    ]
    
    // Create wider distribution that extends far beyond visible area
    const distributionRange = 50
    
    // Generate data that looks more like financial market data points
    for (let i = 0; i < count; i++) {
      let x, y, z;
      
      // Create different distribution patterns for different particles
      const pattern = Math.floor(Math.random() * 5);
      
      if (pattern === 0) {
        // Grid-like pattern - resembling data tables/matrix
        const gridSize = Math.sqrt(count / 5); // Use 1/5th of particles for grid
        const row = Math.floor(i % gridSize);
        const col = Math.floor((i / gridSize) % gridSize);
        x = (col / gridSize - 0.5) * distributionRange * 1.5;
        y = (row / gridSize - 0.5) * distributionRange;
        z = (Math.random() * 2 - 1) * distributionRange * 0.3 - 15;
      } else if (pattern === 1) {
        // Price chart pattern (like stock charts)
        x = (Math.random() * 2 - 1) * distributionRange;
        // Create price action patterns with support/resistance levels
        const baseLevel = Math.floor(Math.random() * 5) - 2;
        y = Math.sin(x * 0.2) * 3 + baseLevel * 3 + (Math.random() * 1 - 0.5);
        z = (Math.random() * 2 - 1) * distributionRange * 0.3 - 10;
      } else if (pattern === 2) {
        // Cluster pattern (like price consolidations)
        const clusterCount = 7;
        const cluster = Math.floor(Math.random() * clusterCount);
        const clusterX = (cluster / clusterCount - 0.5) * distributionRange;
        const clusterY = (Math.random() * 0.6 - 0.3) * 10;
        x = clusterX + (Math.random() * 2 - 1) * 3;
        y = clusterY + (Math.random() * 2 - 1) * 3;
        z = (Math.random() * 2 - 1) * distributionRange * 0.3 - 20;
      } else if (pattern === 3) {
        // Volume profile pattern (bell curve distribution)
        x = (Math.random() * 2 - 1) * distributionRange;
        // Normal distribution around zero
        const norm = Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random();
        y = ((norm / 6) * 2 - 1) * 15;
        z = (Math.random() * 2 - 1) * distributionRange * 0.2 - 12;
      } else {
        // Random distribution for market noise
        const radius = Math.random() * distributionRange;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta) * 0.4;
        z = (radius * Math.cos(phi) * 0.3) - 25;
      }
      
      p.push(new THREE.Vector3(x, y, z));
      
      // Much smaller particles - financial data visualization is typically fine-grained
      s.push(Math.random() * 0.06 + 0.01);
      
      // Assign colors based on position - financial data often uses color for meaning
      let color;
      if (y > 3) {
        // Strong positive - green shades
        color = new THREE.Color("#11be69").multiplyScalar(0.8 + (y / 30));
      } else if (y > 0) {
        // Slight positive - blue/green
        color = new THREE.Color("#3b71cf").multiplyScalar(0.7 + (y / 30));
      } else if (y > -3) {
        // Slight negative - light red/orange
        color = new THREE.Color("#e67c42").multiplyScalar(0.7 + Math.abs(y / 30));
      } else {
        // Strong negative - red
        color = new THREE.Color("#e11d48").multiplyScalar(0.7 + Math.abs(y / 30));
      }
      
      c.push(color);
    }
    
    return { points: p, sizes: s, colors: c };
  }, [count, viewport]);
  
  const pointsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow rotation for subtle movement - data visualization shouldn't move too much
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.005;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.003;
      
      // Subtle oscillation - like market fluctuations
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.3;
    }
  });
  
  return (
    <group ref={pointsRef}>
      <EnhancedPoints points={points} sizes={sizes} colors={colors} />
    </group>
  );
}

interface PointsProps {
  points: THREE.Vector3[];
  sizes?: number[];
  colors?: THREE.Color[];
}

function EnhancedPoints({ points, sizes, colors }: PointsProps) {
  const position = useMemo(() => {
    return Float32Array.from(points.flatMap(p => [p.x, p.y, p.z]));
  }, [points]);
  
  // Create size attribute if provided
  const size = useMemo(() => {
    return sizes ? Float32Array.from(sizes) : null;
  }, [sizes]);
  
  // Create color attribute if provided
  const color = useMemo(() => {
    return colors ? Float32Array.from(colors.flatMap(c => [c.r, c.g, c.b])) : null;
  }, [colors]);
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={position}
          itemSize={3}
        />
        {size && (
          <bufferAttribute
            attach="attributes-size"
            count={sizes!.length}
            array={size}
            itemSize={1}
          />
        )}
        {color && (
          <bufferAttribute
            attach="attributes-color"
            count={colors!.length}
            array={color}
            itemSize={3}
          />
        )}
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        sizeAttenuation={true}
        vertexColors={!!colors}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default FinancialScene; 
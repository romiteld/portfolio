"use client"

import { Metadata } from "next"
import { useRef, useEffect, useState, RefObject, useMemo, useCallback } from "react"
import FinancialChatWidget from "@/app/components/demos/FinancialChatWidget"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text, Float, Sphere, MeshDistortMaterial, Environment, Trail, PointMaterial, Stars, useTexture, useAspect } from "@react-three/drei"
import * as THREE from "three"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TrendingUp, Activity, DollarSign, LineChart, CircleDollarSign, ArrowUp, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon, BarChart as ChartBarIcon } from "lucide-react"
import "./financialAssistant.css" // Import our custom CSS
import { Mesh, Vector3, Group, BufferGeometry, Object3D, ColorRepresentation } from "three"
import { useTheme } from "next-themes"

// Type definitions for data
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Type definitions for components
interface PointsProps {
  points: THREE.Vector3[];
  sizes?: number[];
  colors?: THREE.Color[];
}

interface FlowingLineProps {
  color?: string;
  width?: number;
  length?: number;
  speed?: number;
  position?: [number, number, number];
}

interface CandlestickProps {
  count?: number;
  position?: [number, number, number];
  scale?: [number, number, number];
  speed?: number;
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
  
  const pointsRef = useRef<Group>(null);
  
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

// Data flow visualization - replaces the flowing line
function DataFlowVisualization({ color = "#11be69", width = 0.05, count = 100, speed = 1, position = [0, 0, 0] }: { 
  color?: string; 
  width?: number; 
  count?: number; 
  speed?: number;
  position?: [number, number, number];
}) {
  const linePoints = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const t = i / count
      return new THREE.Vector3(
        (t - 0.5) * 20, // Horizontal spread
        Math.sin(t * Math.PI * 4) * 1.5, // Wave pattern
        0
      )
    })
  }, [count])
  
  const lineRef = useRef<Group>(null)
  
  useFrame(({ clock }) => {
    if (lineRef.current) {
      // Moving the line to create flowing data effect
      lineRef.current.position.x = (Math.sin(clock.elapsedTime * speed * 0.5) * 2)
      
      // Have children points move independently
      lineRef.current.children.forEach((child, i) => {
        // @ts-ignore - position exists on Object3D
        if (child.position) {
          child.position.y = Math.sin((i * 0.1) + (clock.elapsedTime * speed)) * 0.5
          
          // Random slight movement on x and z to create more organic data flow
          child.position.x += (Math.random() - 0.5) * 0.01
          child.position.z += (Math.random() - 0.5) * 0.01
        }
      })
    }
  })
  
  return (
    <group ref={lineRef} position={position}>
      {linePoints.map((point, i) => (
        <mesh key={i} position={point.toArray()}>
          <boxGeometry args={[width, width, width]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.6} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// Candlestick chart component for realistic financial visualization
function CandlestickChart({ position = [0, -5, -15], width = 25, height = 10, count = 24 }: {
  position?: [number, number, number];
  width?: number;
  height?: number;
  count?: number;
}) {
  const chartRef = useRef<Group>(null);
  
  // Generate realistic candlestick data
  const candleData = useMemo(() => {
    const candles = [];
    let price = 100 + Math.random() * 20;
    
    for (let i = 0; i < count; i++) {
      // Generate realistic OHLC price action
      const volatility = 2 + Math.random() * 3;
      const change = (Math.random() - 0.48) * volatility; // Slight bullish bias
      
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      const isUp = close >= open;
      const x = ((i / count) - 0.5) * width;
      
      candles.push({
        open, high, low, close,
        isUp,
        x
      });
      
      // Set up for next candle
      price = close;
    }
    
    return candles;
  }, [count, width]);
  
  useFrame(({ clock }) => {
    if (chartRef.current) {
      // Very subtle movement to simulate market activity
      chartRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.03;
    }
  });
  
  return (
    <group ref={chartRef} position={position}>
      {/* Chart grid lines */}
      <mesh position={[0, 0, -0.1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[width + 2, height + 2]} />
        <meshBasicMaterial color="#0a1530" transparent opacity={0.5} />
      </mesh>
      
      {/* Grid lines - horizontal */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`h-${i}`} position={[0, ((i / 4) - 0.5) * height, 0]}>
          <boxGeometry args={[width + 1, 0.02, 0.01]} />
          <meshBasicMaterial color="#1a2b4c" transparent opacity={0.5} />
        </mesh>
      ))}
      
      {/* Grid lines - vertical */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`v-${i}`} position={[((i / 4) - 0.5) * width, 0, 0]}>
          <boxGeometry args={[0.02, height + 1, 0.01]} />
          <meshBasicMaterial color="#1a2b4c" transparent opacity={0.5} />
        </mesh>
      ))}
      
      {/* Candles */}
      {candleData.map((candle, i) => {
        const normalizedOpen = ((candle.open - 100) / 20) * height * 0.6;
        const normalizedClose = ((candle.close - 100) / 20) * height * 0.6;
        const normalizedHigh = ((candle.high - 100) / 20) * height * 0.6;
        const normalizedLow = ((candle.low - 100) / 20) * height * 0.6;
        
        const bodyHeight = Math.abs(normalizedClose - normalizedOpen) || 0.05;
        const bodyY = (normalizedOpen + normalizedClose) / 2;
        
        const wickHeight = normalizedHigh - normalizedLow;
        const wickY = (normalizedHigh + normalizedLow) / 2;
        
        return (
          <group key={i} position={[candle.x, 0, 0]}>
            {/* Candle wick */}
            <mesh position={[0, wickY, 0]}>
              <boxGeometry args={[0.04, wickHeight, 0.04]} />
              <meshBasicMaterial color={candle.isUp ? "#11be69" : "#e11d48"} />
            </mesh>
            
            {/* Candle body */}
            <mesh position={[0, bodyY, 0]}>
              <boxGeometry args={[0.25, bodyHeight, 0.1]} />
              <meshBasicMaterial color={candle.isUp ? "#11be69" : "#e11d48"} />
            </mesh>
          </group>
        );
      })}
      
      {/* Chart axis labels */}
      <group position={[-width/2 - 0.8, 0, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`price-${i}`} position={[0, ((i / 4) - 0.5) * height, 0]}>
            <boxGeometry args={[0.6, 0.3, 0.05]} />
            <meshBasicMaterial color="#1a2b4c" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Market ticker data visualization
function MarketTicker({ length = 20, height = 3, color = "#3b71cf", position = [0, 0, -5] }: {
  length?: number;
  height?: number;
  color?: string;
  position?: [number, number, number];
}) {
  const tickerRef = useRef<Group>(null)
  
  // Generate ticker data points
  const tickerData = useMemo(() => {
    return new Array(length).fill(0).map((_, i) => {
      // Generate a realistic stock price movement
      const values = []
      let price = 100 + Math.random() * 50
      for (let j = 0; j < 20; j++) {
        // Simulate price movement
        price += (Math.random() - 0.48) * 2 // Slightly bullish bias
        values.push(price)
      }
      return {
        x: (i - length/2) * 1.5,
        values
      }
    })
  }, [length])
  
  useFrame(({ clock }) => {
    if (tickerRef.current) {
      // Slowly move the ticker
      tickerRef.current.position.x = Math.sin(clock.elapsedTime * 0.1) * 2
      
      // Update each ticker column
      tickerRef.current.children.forEach((child, i) => {
        // Animate height of each bar in the ticker
        const data = tickerData[i]
        if (data) {
          const time = Math.floor(clock.elapsedTime * 2) % 20
          const value = data.values[time]
          const normalizedValue = (value - 100) / 50 // Normalize to 0-1 range
          
          // Update scale - safe way
          if (child.scale) {
            child.scale.y = normalizedValue * height
          }
          
          // Color based on price movement
          const prevTime = (time - 1 + 20) % 20
          const prevValue = data.values[prevTime]
          const isUp = value >= prevValue
          
          // Type guard: check if child is a Mesh with MeshBasicMaterial
          if (child instanceof THREE.Mesh) {
            const material = child.material;
            if (material instanceof THREE.MeshBasicMaterial) {
              // Now TypeScript knows these properties exist
              material.color.set(isUp ? "#11be69" : "#ff6b6b");
              material.opacity = 0.6 + normalizedValue * 0.4;
            }
          }
        }
      })
    }
  })
  
  return (
    <group ref={tickerRef} position={position}>
      {tickerData.map((data, i) => (
        <mesh key={i} position={[data.x, 0, 0]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.6} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// For the financial 3D scene with enhanced effects
function FinancialScene() {
  const { camera } = useThree()
  const gridRef = useRef<Group>(null)
  const sceneRef = useRef<Group>(null)
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
      gsap.registerPlugin(ScrollTrigger)
      
      // Remove the timeline with scrollTrigger that was causing the background to shrink
      // Instead, just add simple ambient animations that aren't tied to scroll position
      
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
        <MarketChart position={[0, 0, 5]} isDark={isDark} />
        <PriceLevels position={[-7, 0, 0]} isDark={isDark} />
        <MovingAverages position={[0, 0, 5.1]} isDark={isDark} />
        <Particles count={3000} />
      </group>
      
      {/* Environment for better lighting */}
      <Environment preset={isDark ? "night" : "city"} background={false} />
    </>
  )
}

// Professional grid background like a trading platform
function GridBackground({ isDark = true }) {
  const linesRef = useRef<Group>(null)
  
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

// Custom Line component for charts
function Line({ points, color = "white", lineWidth = 1, dashed = false }: {
  points: [number, number, number][];
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
}) {
  const ref = useRef<THREE.Line>(null)
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    // Add points to geometry
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        points.flat(),
        3
      )
    )
    
    return geo
  }, [points])
  
  // Set up line material
  const material = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ 
      color: color,
      linewidth: lineWidth
    })
    
    if (dashed) {
      return new THREE.LineDashedMaterial({
        color: color,
        linewidth: lineWidth,
        dashSize: 0.2,
        gapSize: 0.1,
        scale: 1
      })
    }
    
    return mat
  }, [color, lineWidth, dashed])
  
  useEffect(() => {
    if (ref.current && dashed) {
      ref.current.computeLineDistances()
    }
  }, [dashed, points])
  
  return <primitive object={new THREE.Line(geometry, material)} ref={ref} />
}

// Professional-looking market chart
function MarketChart({ position = [0, 0, 0], width = 14, height = 5, isDark = false }) {
  const chartRef = useRef<Group>(null)
  
  // Generate realistic market data
  const chartData = useMemo(() => {
    const dataPoints = 60
    const data = []
    let price = 100
    
    for (let i = 0; i < dataPoints; i++) {
      // More realistic price movements
      const change = (Math.random() - 0.48) * (Math.sqrt(price) * 0.3)
      price += change
      
      // Ensure price doesn't go negative
      price = Math.max(price, 10)
      
      data.push({
        price,
        x: ((i / (dataPoints - 1)) - 0.5) * width
      })
    }
    
    return data
  }, [width])
  
  // Find min and max for scaling
  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100 }
    
    const prices = chartData.map(d => d.price)
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    }
  }, [chartData])
  
  // Scale price to chart height
  const scaleY = useCallback((price: number) => {
    const range = maxPrice - minPrice
    const normalizedPrice = (price - minPrice) / range
    return (normalizedPrice - 0.5) * height
  }, [minPrice, maxPrice, height])
  
  // Very subtle animation
  useFrame(({ clock }) => {
    if (chartRef.current) {
      // Extremely subtle movement
      chartRef.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.05
    }
  })
  
  // Convert chart data to properly typed points for Line component
  const linePoints = useMemo(() => {
    return chartData.map(d => [d.x, scaleY(d.price), 0] as [number, number, number])
  }, [chartData, scaleY])
  
  // For the area under the curve, use a proper mesh with ShapeGeometry
  const areaGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    
    if (chartData.length > 0) {
      // Start at the first point
      shape.moveTo(chartData[0].x, scaleY(chartData[0].price))
      
      // Add all points along the top of the shape
      chartData.forEach((d) => {
        shape.lineTo(d.x, scaleY(d.price))
      })
      
      // Complete the shape by going back along the bottom
      shape.lineTo(chartData[chartData.length-1].x, -height/2)
      shape.lineTo(chartData[0].x, -height/2)
      shape.closePath()
    }
    
    return new THREE.ShapeGeometry(shape)
  }, [chartData, scaleY, height])
  
  return (
    <group ref={chartRef} position={position instanceof THREE.Vector3 ? position : new THREE.Vector3(...position)}>
      {/* Chart line */}
      <Line 
        points={linePoints}
        color="#4284f5"
        lineWidth={1.5}
      />
      
      {/* Subtle area under the curve */}
      <mesh position={[0, 0, -0.1]} geometry={areaGeometry}>
        <meshBasicMaterial color="#4284f5" opacity={0.1} transparent />
      </mesh>
    </group>
  )
}

// Professional moving averages
function MovingAverages({ position = [0, 0, 0], width = 14, isDark = false }) {
  // Generate moving average lines (50-day, 200-day style)
  const ma50 = useMemo(() => {
    const dataPoints = 60
    const data = []
    let basePrice = 110
    
    for (let i = 0; i < dataPoints; i++) {
      // Smoother changes for moving average
      const change = (Math.random() - 0.48) * 0.5
      basePrice += change
      
      data.push({
        price: basePrice,
        x: ((i / (dataPoints - 1)) - 0.5) * width
      })
    }
    
    return data
  }, [width])
  
  const ma200 = useMemo(() => {
    const dataPoints = 60
    const data = []
    let basePrice = 90
    
    for (let i = 0; i < dataPoints; i++) {
      // Even smoother for long-term MA
      const change = (Math.random() - 0.48) * 0.2
      basePrice += change
      
      data.push({
        price: basePrice,
        x: ((i / (dataPoints - 1)) - 0.5) * width
      })
    }
    
    return data
  }, [width])
  
  // Convert moving average data to properly typed points
  const ma50Points = useMemo(() => {
    return ma50.map(d => [d.x, d.price - 100, 0.1] as [number, number, number])
  }, [ma50])
  
  const ma200Points = useMemo(() => {
    return ma200.map(d => [d.x, d.price - 100, 0.1] as [number, number, number])
  }, [ma200])
  
  return (
    <group position={position instanceof THREE.Vector3 ? position : new THREE.Vector3(...position)}>
      {/* 50-day MA (in practice would use actual averaging) */}
      <Line 
        points={ma50Points}
        color="#f59742"
        lineWidth={1}
        dashed
      />
      
      {/* 200-day MA */}
      <Line 
        points={ma200Points}
        color="#d648f5"
        lineWidth={1}
        dashed
      />
    </group>
  )
}

// Price levels like a real trading platform
function PriceLevels({ position = [0, 0, 0], isDark = false }) {
  return (
    <group position={position instanceof THREE.Vector3 ? position : new THREE.Vector3(...position)}>
      {/* Price axis labels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = (i - 2) * 1.5
        const price = 100 + y * 10
        
        return (
          <group key={i} position={[-6.5, y, 0.1]}>
            <mesh>
              <planeGeometry args={[1.5, 0.6]} />
              <meshBasicMaterial color="#1a2b4c" opacity={0.8} transparent />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {price.toFixed(2)}
            </Text>
          </group>
        )
      })}
      
      {/* Horizontal price level lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = (i - 2) * 1.5
        
        return (
          <mesh key={`line-${i}`} position={[0, y, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[14, 0.02]} />
            <meshBasicMaterial color="#213363" opacity={0.5} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

// The actual page component
export default function FinancialAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId] = useState(`user-${Math.random().toString(36).substring(2, 12)}`)
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<Group>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Load initial messages when component mounts
  useEffect(() => {
    loadHistory()
    refreshMarketData()
    
    // Set interval to refresh market data every 60 seconds
    const intervalId = setInterval(() => {
      refreshMarketData()
    }, 60000)
    
    // Initialize GSAP for enhanced background depth
    if (typeof window !== 'undefined' && sceneRef.current) {
      gsap.registerPlugin(ScrollTrigger)
      
      // Remove the parallax scrolling effect that was causing the background to shrink
      // Keep only the ambient animations that don't depend on scroll position
    }
    
    return () => {
      clearInterval(intervalId)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleScroll = () => {
    const container = chatContainerRef.current
    if (!container) return
    
    // Get the scroll position and check if user has scrolled up
    const { scrollTop, scrollHeight, clientHeight } = container
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10
    
    // Only auto-scroll if user is already at the bottom
    if (isScrolledToBottom) {
      scrollToBottom()
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/market/chat?userId=${userId}`)
      const data = await response.json()
      
      if (data.history && Array.isArray(data.history)) {
        const historyMessages = data.history.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
        
        setMessages(historyMessages)
      }
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }
  
  const refreshMarketData = async () => {
    try {
      const response = await fetch('/api/market/data')
      const data = await response.json()
      
      if (data.stocks && Array.isArray(data.stocks)) {
        // Format market data for display
        const formattedData = data.stocks.map((stock: any) => ({
          symbol: stock.symbol,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent
        }))
        
        setMarketData(formattedData)
      }
    } catch (error) {
      console.error("Error loading market data:", error)
    }
  }
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      timeoutRef.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }
    
    // Add user message and a loading indicator for the assistant
    setMessages(prev => [
      ...prev,
      userMessage,
      {
        role: "assistant",
        content: "Analyzing financial data...", // Placeholder content
        timestamp: new Date(),
        isLoading: true,
      },
    ])
    setInput("")
    setLoading(true)
    
    try {
      // Call the new API route
      const response = await fetch('/api/financial-assistant/firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Format the response from Firecrawl
      let assistantResponseContent = `**Financial Summary for ${userMessage.content}:**\n\n`
      if (data.summary) {
          assistantResponseContent += `${data.summary}\n\n`
      }
      if (data.key_metrics && Object.keys(data.key_metrics).length > 0) {
        assistantResponseContent += "**Key Metrics:**\n"
        for (const [key, value] of Object.entries(data.key_metrics)) {
          assistantResponseContent += `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}\n`
        }
         assistantResponseContent += "\n"
      }
       if (data.recent_news_summary) {
          assistantResponseContent += `**Recent News Summary:**\n${data.recent_news_summary}`
      }

      if (assistantResponseContent === `**Financial Summary for ${userMessage.content}:**\n\n`) {
          // If no specific data was found
          assistantResponseContent = "I couldn't find specific financial data for that query using Firecrawl. Please try a different company name or stock symbol."
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantResponseContent,
        timestamp: new Date(),
      }

      // Replace the loading message with the actual response
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the loading message
        assistantMessage,
      ])

    } catch (error) {
      console.error("Error fetching financial data:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error trying to fetch financial data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
       // Replace the loading message with the error message
      setMessages(prev => [
           ...prev.slice(0, -1),
            errorMessage,
        ])
    } finally {
      setLoading(false)
      // Ensure input is focused after submission attempt
      setTimeout(() => chatContainerRef.current?.focus(), 0)
    }
  }
  
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Scroll to bottom when input is focused to show latest messages
    scrollToBottom()
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }
  
  const formatTime = (date?: Date) => {
    if (!date) return ""
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date)
  }
  
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      const preventParentScroll = (e: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer
        
        // If we're at the top and trying to scroll up, or
        // at the bottom and trying to scroll down, prevent default
        if (
          (scrollTop === 0 && e.deltaY < 0) ||
          (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)
        ) {
          return
        }
        
        // Otherwise prevent default to stop page scroll
        e.stopPropagation()
      }
      
      chatContainer.addEventListener('wheel', preventParentScroll)
      return () => {
        chatContainer.removeEventListener('wheel', preventParentScroll)
      }
    }
  }, [])

  // Render the 3D scene backgrounds
  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white relative overflow-hidden" ref={sceneRef}>
      {/* 3D Scene Canvas - make it fixed and ensure it covers the entire viewport */}
      <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0">
        <Canvas>
          <FinancialScene />
        </Canvas>
      </div>
      
      {/* Content */}
      <div className="container mx-auto pt-16 pb-12 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-center text-gray-900 dark:text-white mb-2 glow-text">
            Financial Market Assistant
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-12">
            This AI assistant provides real-time financial analysis, market insights, stock recommendations, and portfolio guidance
          </p>
          
          <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
            {/* Chat Interface */}
            <div className="flex-1 bg-white/95 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 flex flex-col">
              {/* Chat Messages */}
              <div 
                className="flex-1 overflow-y-auto p-6 h-[500px]" 
                ref={chatContainerRef}
                onScroll={handleScroll}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="bg-primary-500/10 p-4 rounded-full mb-4">
                      <CircleDollarSign size={40} className="text-primary-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Financial Assistant</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                      Ask me about market trends, stock analysis, economic data, or trading strategies.
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex mb-4 ${
                        message.role === "assistant" 
                          ? "justify-start" 
                          : "justify-end"
                      }`}
                    >
                      <div 
                        className={`rounded-xl p-4 max-w-[80%] ${
                          message.role === "assistant"
                            ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none shadow-md border border-gray-300 dark:border-gray-700"
                            : "bg-primary-600 text-white rounded-tr-none shadow-md border border-primary-700"
                        }`}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        ) : (
                          <>
                            <div className="prose prose-sm dark:prose-invert max-w-none">{message.content}</div>
                            <div className="text-xs mt-1 opacity-80">
                              {formatTime(message.timestamp)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input form */}
              <form 
                onSubmit={handleSubmit} 
                className="border-t border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder="Ask about stocks, market trends, portfolio advice..."
                    className="flex-1 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-md"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className={`rounded-lg px-4 py-2 text-white font-medium transition-colors shadow-md ${
                      loading || !input.trim() 
                        ? "bg-gray-400 dark:bg-primary-500 opacity-90 cursor-not-allowed" 
                        : "bg-primary-700 dark:bg-primary-600 hover:bg-primary-800 dark:hover:bg-primary-700"
                    }`}
                  >
                    Send
                  </button>
                </div>
                
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {suggestions
                      .map((suggestion, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs rounded-full bg-gray-200 dark:bg-gray-800 px-2 py-0.5 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700 shadow-sm mr-1 mb-1"
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </form>
            </div>
            
            {/* Market Data Sidebar */}
            <div className="lg:w-80 bg-white/95 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 text-primary-500 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Market Data</h3>
                  <span className="ml-auto text-xs text-green-500 font-medium px-2 py-0.5 rounded bg-green-500/10">
                    Live
                  </span>
                </div>
              </div>
               
              <div className="flex-1 overflow-y-auto h-[500px]">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {marketData.map((stock) => (
                    <div key={stock.symbol} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {stock.symbol}
                          </h4>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Change</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            ${stock.price.toFixed(2)}
                          </div>
                          <div
                            className={`text-xs font-medium flex items-center ${
                              stock.change >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {stock.change >= 0 ? (
                              <ChevronUpIcon className="w-3 h-3 mr-0.5" />
                            ) : (
                              <ChevronDownIcon className="w-3 h-3 mr-0.5" />
                            )}
                            {stock.change >= 0 ? "+" : ""}
                            {stock.change.toFixed(2)} (
                            {stock.changePercent >= 0 ? "+" : ""}
                            {stock.changePercent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Market Insights</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">• S&P 500:</span>
                      <span className="text-green-500">+0.4%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">• Nasdaq:</span>
                      <span className="text-green-500">+0.7%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">• Dow Jones:</span>
                      <span className="text-red-500">-0.2%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">• VIX Index:</span>
                      <span className="text-red-500">-1.3%</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Using live market data
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              All financial information is for educational purposes only.
              <br />
              Past performance does not guarantee future results. Consider consulting a financial advisor before investing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
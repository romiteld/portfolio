"use client"

import { Metadata } from "next"
import { useRef, useEffect, useState, RefObject, useMemo, useCallback, Fragment } from "react"
import FinancialChatWidget from "@/app/components/demos/FinancialChatWidget"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { TrendingUp, Activity, DollarSign, LineChart, CircleDollarSign, ArrowUp, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon, BarChart as ChartBarIcon, Filter as FilterIcon, List as ListIcon, TrendingDown } from "lucide-react"
import "./financialAssistant.css" // Import our custom CSS
import { useTheme } from "next-themes"
import dynamic from 'next/dynamic';
import UserPreferences, { UserPreferencesData } from './components/UserPreferences';
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

// Dynamically import the chart components (client-side only)
const StockChart = dynamic(() => import('./components/StockChart'), { ssr: false });
const VolatilityChart = dynamic(() => import('./components/VolatilityChart'), { ssr: false });

// Dynamically import the 3D components with no SSR
const Canvas3D = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), { ssr: false });
const FinancialSceneWrapper = dynamic(() => import('./components/FinancialScene'), { ssr: false });

// Type definitions for data
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: { count: number; ragUsed: boolean };
}

// Updated MarketData types to handle different asset classes
interface StockData {
  type: 'stock';
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector?: string;
  marketCap?: number | null;
  volume?: number | null;
  peRatio?: number | null;
}

interface IndexData {
  type: 'index';
  name: string;
  value: number;
  change: number; // For indices, this typically represents percentage change
}

interface CryptoData {
  type: 'crypto';
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number | null;
  volume24h?: number | null;
}

// Consolidated type for display
type MarketDataItem = StockData | IndexData | CryptoData;

// Define filter and sort types
type FilterType = 'all' | 'stocks' | 'indices' | 'crypto';
type SortType = 'symbol' | 'name' | 'price' | 'change' | 'changePercent';
type SortDirection = 'asc' | 'desc';

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

// Define NewsItem structure
interface NewsItem {
  id: number;
  category: string;
  timestamp: string;
  title: string;
  summary: string;
  fullContent?: string; // Placeholder for full article text
  source?: string;
}

// Sample news data (replace with API fetch later)
const sampleNewsData: NewsItem[] = [
  {
    id: 1,
    category: 'Markets',
    timestamp: '2 hours ago',
    title: 'S&P 500 reaches new highs amid strong earnings reports',
    summary: 'Major indices continue upward trend as quarterly results exceed analyst expectations in tech and financial sectors.',
    fullContent: 'The S&P 500 reached new record levels today, fueled by exceptional quarterly earnings reports across multiple sectors. Tech giants like Apple, Microsoft, and Google parent Alphabet all exceeded analyst expectations, with revenue growth averaging 18% year-over-year.\n\nFinancial institutions also contributed significantly to the rally, with major banks reporting strong performance in investment banking and wealth management divisions. JP Morgan Chase saw a 22% increase in investment banking revenue, while Goldman Sachs reported record client assets under management.\n\nMarket analysts attribute this strong performance to several factors, including resilient consumer spending, continued technological adoption across industries, and the impact of AI innovations on productivity. "We\'re seeing a market that\'s responding not just to short-term performance, but to longer-term technological transformations that are reshaping entire industries," noted Sarah Chen, Chief Market Strategist at Morgan Financial.\n\nThe rally extended beyond just tech and financials, with consumer discretionary and healthcare sectors also showing strong gains. Notable performers included Tesla, which saw shares jump 5.2% after reporting better-than-expected delivery numbers, and Pfizer, which gained 3.7% following positive late-stage trial results for a new cancer treatment.\n\nVolume was notably higher than average, with over 5.2 billion shares changing hands, suggesting broad participation in the rally. Market breadth was similarly impressive, with advancers outnumbering decliners by more than 3 to 1.\n\nLooking forward, analysts remain cautiously optimistic. While valuations are somewhat elevated by historical standards, strong earnings growth may justify current price levels. However, investors should remain vigilant about potential headwinds, including inflation concerns and geopolitical tensions that could introduce volatility in the coming months.',
    source: 'Reuters'
  },
  {
    id: 2,
    category: 'Economy',
    timestamp: '5 hours ago',
    title: 'Federal Reserve signals potential pause in rate hikes',
    summary: 'Central bank officials indicate inflation pressures may be easing, suggesting a shift in monetary policy approach.',
    fullContent: 'Federal Reserve officials signaled a potential pause in their ongoing interest rate hike campaign during their latest policy meeting, according to minutes released today. The shift comes as several inflation indicators show modest easing of price pressures across the economy.\n\nThe Federal Open Market Committee (FOMC) noted that while inflation remains above their 2% long-term target, recent data suggests the aggressive rate hikes implemented over the past 18 months are beginning to have the desired effect of cooling demand without triggering a severe economic downturn.\n\n"The committee discussed at length the appropriate timing for a potential pause in rate increases," the minutes stated. "Several members expressed the view that sufficient tightening may have already been achieved, while others advocated for a more cautious approach with one additional modest increase before reassessing."\n\nMarkets reacted positively to the news, with the 10-year Treasury yield declining by 12 basis points and major stock indices advancing by approximately 1.5%. The dollar index also weakened against major currencies, reflecting expectations of a less aggressive Fed stance.\n\nEconomists widely interpreted the minutes as a significant shift in tone. "This is the clearest indication yet that the Fed believes it may be approaching the end of its tightening cycle," said Michael Rodriguez, Chief Economist at Capital Research Group. "They\'re acknowledging the progress made on inflation while remaining appropriately cautious about declaring victory too soon."\n\nRecent economic data supports this measured optimism. The Consumer Price Index rose at an annual rate of 3.2% last month, down from 3.7% in the previous reading. Core inflation, which excludes volatile food and energy prices, has shown similar moderation. Meanwhile, the labor market remains resilient, with unemployment holding steady at 3.8%.\n\nConsumer spending has slowed but not collapsed, suggesting the economy may achieve the "soft landing" that policymakers have been targeting. Retail sales declined by 0.2% last month, slightly less than the 0.3% drop economists had anticipated.\n\nThe next FOMC meeting, scheduled for early next month, will be closely watched for confirmation of this policy shift. Market participants now assign a 65% probability that the Fed will hold rates steady, up from 35% just a week ago.',
    source: 'Bloomberg'
  },
  {
    id: 3,
    category: 'Commodities',
    timestamp: 'Yesterday',
    title: 'Oil prices stabilize after recent volatility',
    summary: 'Crude markets find balance following supply concerns, with production adjustments offsetting geopolitical tensions.',
    fullContent: 'Oil prices found stable footing today after weeks of significant volatility, as supply and demand factors reached a tentative equilibrium. Brent crude settled at $82.45 per barrel, while West Texas Intermediate (WTI) closed at $78.12, both representing modest gains of less than 1%.\n\nThe stabilization comes after an OPEC+ meeting where member nations agreed to modest production increases to alleviate supply concerns. Saudi Arabia, the group\'s de facto leader, announced it would boost output by 300,000 barrels per day beginning next month, while maintaining flexibility to adjust if market conditions change.\n\n"We are responding to legitimate concerns about tight supply while remaining vigilant about market stability," said Saudi Energy Minister Prince Abdulaziz bin Salman. "Our approach is measured and responsive to actual market conditions."\n\nRecent geopolitical tensions in Eastern Europe and the Middle East had driven prices higher amid fears of supply disruptions. However, those concerns have been partially offset by signs of slowing demand growth in China, the world\'s largest oil importer. Chinese manufacturing data released yesterday showed continued contraction, suggesting lower energy consumption in the near term.\n\nU.S. production has also played a role in balancing markets. American output reached 13.2 million barrels per day last week, according to the Energy Information Administration (EIA), representing a record high. However, the rate of production growth appears to be moderating as producers exercise capital discipline.\n\n"We\'re seeing U.S. producers take a much more measured approach to investment than in previous price cycles," noted Rebecca Johnson, energy analyst at Global Resource Partners. "They\'re focused on generating returns for shareholders rather than maximizing production at all costs."\n\nInventory data has been mixed. U.S. commercial crude stockpiles fell by 3.2 million barrels last week, exceeding analyst expectations. However, gasoline inventories rose unexpectedly, suggesting some weakness in consumer demand as the summer driving season winds down.\n\nTraders are now watching several key factors that could influence prices in the coming weeks, including the next round of U.S.-Iran nuclear negotiations, hurricane season in the Gulf of Mexico, and upcoming OPEC+ compliance reports. For now, though, the market appears to have found a more stable range after months of heightened volatility.',
    source: 'Wall Street Journal'
  }
];

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

// --- Utility Functions ---
const formatNumber = (num: number | null | undefined, decimals = 2): string => {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(decimals);
};

const formatLargeNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

// The actual page component
export default function FinancialAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId] = useState(`user-${Math.random().toString(36).substring(2, 12)}`)
  // States for different data types
  const [stockData, setStockData] = useState<StockData[]>([])
  const [indexData, setIndexData] = useState<IndexData[]>([])
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [sectorData, setSectorData] = useState<{ name: string; performance: string }[]>([])
  const [isSimulated, setIsSimulated] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // States for sorting and filtering
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreferencesData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

  // Load initial messages and data
  useEffect(() => {
    loadHistory()
    refreshMarketData() // Initial fetch
    loadUserPreferences() // Load saved preferences
    
    const intervalId = setInterval(() => {
      refreshMarketData()
    }, 60000) // Refresh every 60 seconds
    
    if (typeof window !== 'undefined' && sceneRef.current) {
      gsap.registerPlugin(ScrollTrigger)
    }
    
    return () => {
      clearInterval(intervalId)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  // Scroll chat to bottom on new messages
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
  
  // Updated refreshMarketData to handle new structure
  const refreshMarketData = async () => {
    try {
      setApiError(null); // Clear previous errors
      
      const response = await fetch('/api/market/data');
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
      }

      // Safely parse the JSON response
      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Failed to parse API response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      // Update states with data from API
      setStockData((data.stocks || []).map((s: any) => ({ ...s, type: 'stock' })));
      setIndexData((data.indices || []).map((i: any) => ({ ...i, type: 'index' })));
      setCryptoData((data.crypto || []).map((c: any) => ({ ...c, type: 'crypto' })));
      setSectorData(data.sectors || []);
      setIsSimulated(data.isSimulated || false);
      setApiError(data.apiError || null);

      if (data.isSimulated) {
         console.warn("Displaying simulated market data.");
      }
      if (data.apiError) {
         console.error("API Error during data fetch:", data.apiError);
      }

    } catch (error) {
      console.error("Error loading market data:", error);
      setApiError(error instanceof Error ? error.message : 'Unknown error fetching data');
      // Set to simulated mode with empty data
      setStockData([]); 
      setIndexData([]); 
      setCryptoData([]);
      setSectorData([]);
      setIsSimulated(true);
    }
  }
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      timeoutRef.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }
  
  // Updated handleSubmit to use the new query endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [
      ...prev,
      userMessage,
      { role: "assistant", content: "Processing financial query...", timestamp: new Date(), isLoading: true },
    ])
    setInput("")
    setLoading(true)
    
    try {
      // Call the RENAMED API route
      const response = await fetch('/api/financial-assistant/query', { // UPDATED ROUTE
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content,
          userPreferences: userPreferences // Include user preferences
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.summary || `API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      
      // Format the response (assuming API returns structure with summary, key_metrics etc.)
      let assistantResponseContent = `**Financial Query Results:**\n\n` // Generic title
      
      if (data.summary) {
          assistantResponseContent += `${data.summary}\n\n`
      }
      
      // Display key metrics if available (might need adjustment based on API response)
      if (data.key_metrics && Object.keys(data.key_metrics).length > 0) {
        assistantResponseContent += "**Key Metrics:**\n"
        for (const [key, value] of Object.entries(data.key_metrics)) {
           // Simple formatting, might need enhancement for tables etc.
          assistantResponseContent += `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}\n`
        }
        assistantResponseContent += "\n"
      }
      
      if (data.comparison_table) { // Example for comparison
         assistantResponseContent += `**Comparison:**\n${data.comparison_table}\n` // Assuming backend formats a markdown table
      }

      if (data.recent_news_summary) {
        assistantResponseContent += `**News/Context:**\n${data.recent_news_summary}\n`
      }

      // Fallback message if content is still minimal
      if (assistantResponseContent === `**Financial Query Results:**\n\n`) {
        assistantResponseContent = "I processed your query, but couldn't retrieve specific details. Please try rephrasing or ask about a specific stock/index."
      }
       
      // Add disclaimer for analysis/advice types
      if (data.type === 'analysis' || data.type === 'advice') { // Assuming backend adds `type`
         assistantResponseContent += `\n\n**Disclaimer:** *This information is for educational purposes only and not financial advice. Consult a qualified professional before making investment decisions.*`;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantResponseContent,
        timestamp: new Date(),
      }

      setMessages(prev => [ ...prev.slice(0, -1), assistantMessage ])

    } catch (error) {
      console.error("Error fetching financial query response:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [ ...prev.slice(0, -1), errorMessage ])
    } finally {
      setLoading(false)
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
  
  // --- Sorting and Filtering Logic ---
  const sortedAndFilteredData = useMemo(() => {
    let combinedData: MarketDataItem[] = [];
    
    // Apply filter
    switch (filter) {
      case 'stocks':
        combinedData = [...stockData];
        break;
      case 'indices':
        combinedData = [...indexData];
        break;
      case 'crypto':
        combinedData = [...cryptoData];
        break;
      case 'all':
      default:
        combinedData = [...stockData, ...indexData, ...cryptoData];
        break;
    }
    
    // Apply sorting
    combinedData.sort((a, b) => {
      let valA: string | number | undefined;
      let valB: string | number | undefined;

      switch (sortBy) {
        case 'symbol':
           // Indices don't have a symbol, use name
           valA = (a.type === 'stock' || a.type === 'crypto') ? a.symbol : a.name;
           valB = (b.type === 'stock' || b.type === 'crypto') ? b.symbol : b.name;
           break;
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'price':
          valA = a.type === 'index' ? a.value : a.price;
          valB = b.type === 'index' ? b.value : b.price;
          break;
        case 'change': // Sort by absolute change value for stocks/crypto, % for indices
          valA = a.type === 'index' ? a.change : (a.type === 'stock' || a.type === 'crypto' ? a.change : 0);
          valB = b.type === 'index' ? b.change : (b.type === 'stock' || b.type === 'crypto' ? b.change : 0);
          break;
        case 'changePercent': // Sort by % change for stocks/crypto, already % for indices
           valA = a.type === 'index' ? a.change : (a.type === 'stock' || a.type === 'crypto' ? a.changePercent : 0);
           valB = b.type === 'index' ? b.change : (b.type === 'stock' || b.type === 'crypto' ? b.changePercent : 0);
           break;
        default:
          return 0;
      }

      // Handle potential undefined values and type differences
      const comparison = 
         (valA === undefined || valA === null) ? -1 : 
         (valB === undefined || valB === null) ? 1 : 
         (typeof valA === 'string' && typeof valB === 'string') ? valA.localeCompare(valB) :
         (valA < valB) ? -1 :
         (valA > valB) ? 1 : 0;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return combinedData;
  }, [stockData, indexData, cryptoData, filter, sortBy, sortDirection]);

  const handleSortChange = (newSortBy: SortType) => {
    if (newSortBy === sortBy) {
      // Toggle direction if same column clicked
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Reset to ascending for new column
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    if (typeof window === 'undefined') return
    
    try {
      const savedPrefs = localStorage.getItem('financialAssistantPreferences')
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs))
      }
    } catch (error) {
      console.error("Error loading user preferences:", error)
    }
  }
  
  // Save user preferences handler
  const handleSavePreferences = (preferences: UserPreferencesData) => {
    setUserPreferences(preferences)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('financialAssistantPreferences', JSON.stringify(preferences))
    }
  }

  // Add useEffect to monitor isModalOpen state
  useEffect(() => {
    console.log('Modal state changed:', isModalOpen);
  }, [isModalOpen]);

  const handleNewsItemClick = (item: NewsItem) => {
    console.log('News item clicked:', item.title);
    setSelectedNewsItem(item);
    setIsModalOpen(true);
    console.log('Set modal open to true');
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    // Delay clearing the selected item to allow for transition
    setTimeout(() => {
      setSelectedNewsItem(null);
    }, 300);
  };

  // Render the 3D scene backgrounds
  return (
    <>
      <div className="w-full min-h-screen bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white relative overflow-hidden" ref={sceneRef}>
        {/* 3D Scene Canvas */}
        <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0">
          <Canvas3D>
            <FinancialSceneWrapper />
          </Canvas3D>
        </div>
        
        {/* Content */}
        <div className="container-fluid mx-auto pt-16 pb-12 px-4 md:px-8 lg:px-12 relative z-10">
          <div className="max-w-[1440px] mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-center text-gray-900 dark:text-white mb-2 glow-text">
              Financial Market Assistant
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-12">
              AI-powered real-time financial analysis, market insights, comparisons, and portfolio guidance.
            </p>
            
            <div className="flex flex-col lg:flex-row gap-8 min-h-[650px]">
              {/* Chat Interface (widened) */}
              <div className="flex-1 bg-white/95 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 flex flex-col">
                 {/* ... (Chat header/title could be added here) ... */}
                 <div 
                   className="flex-1 overflow-y-auto p-6 h-[550px]" 
                   ref={chatContainerRef}
                   onScroll={handleScroll}
                 >
                   {/* User Preferences Component */}
                   <UserPreferences 
                     onSave={handleSavePreferences}
                     initialPreferences={userPreferences || undefined}
                   />
                   
                   {/* ... (Chat message rendering logic remains the same) ... */}
                   {messages.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                       <div className="bg-primary-500/10 p-4 rounded-full mb-4">
                         <CircleDollarSign size={40} className="text-primary-500" />
                       </div>
                       <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Financial Assistant</h3>
                       <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                         Ask about market trends, stock analysis (e.g., AAPL), crypto (e.g., BTC-USD), comparisons, or strategies.
                       </p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {messages.map((message, index) => (
                         <div
                           key={index}
                           className={`flex mb-6 ${
                             message.role === "assistant" ? "justify-start" : "justify-end"
                           }`}
                         >
                           <div 
                             className={`p-4 max-w-[90%] chat-message ${
                               message.role === "assistant"
                                 ? "bg-gray-200 dark:bg-gray-800 rounded-tl-none shadow-md border border-gray-300 dark:border-gray-700 chat-message-assistant"
                                 : "bg-primary-600 rounded-tr-none shadow-md border border-primary-700 chat-message-user"
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
                                 {/* Enhanced prose settings for markdown, tables, etc. */}
                                 <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:text-xs prose-thead:bg-gray-100 dark:prose-thead:bg-gray-700 prose-td:px-2 prose-td:py-1 prose-th:px-2 prose-th:py-1 chat-message-content">
                                   {message.content}</div>
                                 <div className="text-xs mt-1 opacity-80">
                                   {formatTime(message.timestamp)}
                                 </div>
                               </>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                   <div ref={messagesEndRef} />
                </div>
                
                {/* --- Input form RESTORED --- */}
                <form 
                  onSubmit={handleSubmit} 
                  className="border-t border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={handleInputFocus} // Re-add focus handler if needed
                      disabled={loading}
                      placeholder="Ask about stocks (AAPL), crypto (BTC-USD), comparisons..."
                      className="flex-1 rounded-lg border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-md"
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className={`rounded-lg px-6 py-2 text-white font-medium transition-colors shadow-lg min-w-[80px] send-button ${
                        loading || !input.trim() 
                          ? "bg-gray-400 dark:bg-gray-500 opacity-90 cursor-not-allowed" 
                          : "bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 border border-primary-700 dark:border-primary-600"
                      }`}
                    >
                      <span className="flex items-center justify-center">
                        Send
                      </span>
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
                            onClick={() => handleSuggestionClick(suggestion)} // Ensure correct handler call
                            className="text-xs rounded-full bg-gray-200 dark:bg-gray-800 px-2 py-0.5 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700 shadow-sm mr-1 mb-1"
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  )}
                </form>
                {/* --- End Input Form --- */}
              </div>
              
              {/* === Market Data Sidebar === */}
              <div className="lg:w-[28rem] bg-white/95 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 flex flex-col max-h-[650px]"> {/* Increased width from 96 to 28rem */}
                {/* Sidebar Header & Controls */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 shrink-0"> {/* Added shrink-0 */} 
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                       <ChartBarIcon className="w-5 h-5 text-primary-500 mr-2" />
                       <h3 className="font-medium text-gray-900 dark:text-white">Market Data</h3>
                    </div>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded ${
                       isSimulated 
                         ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' 
                         : 'bg-green-500/10 text-green-600 dark:text-green-400'
                     }`}>
                      {isSimulated ? 'Simulated' : 'Live'}
                    </span>
                  </div>
                  {/* Filter Buttons */}
                  <div className="flex gap-1 mb-2">
                     {(['all', 'stocks', 'indices', 'crypto'] as FilterType[]).map(f => (
                        <button 
                           key={f}
                           onClick={() => setFilter(f)}
                           className={`flex-1 text-xs px-2 py-1 rounded transition-colors border ${ 
                             filter === f 
                               ? 'bg-primary-600 text-white border-primary-700' 
                               : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                           }`}
                        >
                           {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                     ))}
                  </div>
                   {/* API Error Display */}
                   {apiError && (
                     <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-1 rounded border border-red-500/20">
                        ⚠️ {apiError}
                     </div>
                   )}
                </div>
                 
                {/* Sidebar Data Table - Make this div scrollable */}
                <div className="flex-1 overflow-y-auto"> {/* Changed from h-[550px] to flex-1 overflow-y-auto */}
                   <table className="w-full text-xs text-left table-fixed">
                     <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 z-10">
                        <tr>
                           {/* Symbol/Name Column */}
                           <th 
                             className="p-2 w-[35%] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" 
                             onClick={() => handleSortChange('symbol')}
                           >
                              <div className="flex items-center">
                                 {filter === 'indices' ? 'Index' : 'Symbol'}
                                 {sortBy === 'symbol' && (
                                    sortDirection === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />
                                 )}
                              </div>
                           </th>
                           {/* Price/Value Column */}
                           <th 
                             className="p-2 w-[30%] text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" 
                             onClick={() => handleSortChange('price')}
                            >
                              <div className="flex items-center justify-end">
                                {filter === 'indices' ? 'Value' : 'Price'}
                                {sortBy === 'price' && (
                                   sortDirection === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />
                                )}
                             </div>
                           </th>
                           {/* Change Column */}
                           <th 
                             className="p-2 w-[35%] text-right cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" 
                             onClick={() => handleSortChange('changePercent')}
                            >
                              <div className="flex items-center justify-end">
                                Change %
                                {sortBy === 'changePercent' && (
                                   sortDirection === 'asc' ? <ChevronUpIcon className="w-3 h-3 ml-1" /> : <ChevronDownIcon className="w-3 h-3 ml-1" />
                                )}
                             </div>
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredData.map((item, index) => (
                           <tr key={item.type + '-' + (item.type === 'index' ? item.name : item.symbol) + '-' + index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              {/* Symbol/Name Cell */}
                              <td className="p-2 truncate">
                                 <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {item.type === 'index' ? item.name : item.symbol}
                                 </div>
                                 {item.type !== 'index' && (
                                    <div className="text-gray-500 dark:text-gray-400 truncate text-[11px]">
                                      {item.name}
                                    </div>
                                 )}
                              </td>
                              {/* Price/Value Cell */}
                              <td className="p-2 text-right">
                                 <div className="font-mono font-medium text-gray-900 dark:text-gray-100">
                                    {(item.type === 'index' ? item.value : item.price).toFixed(2)}
                                 </div>
                              </td>
                              {/* Change Cell */}
                              <td className="p-2 text-right">
                                 <div className={`font-medium flex items-center justify-end ${ 
                                   (item.type === 'index' ? item.change : item.changePercent) >= 0 
                                     ? "text-green-600 dark:text-green-400" 
                                     : "text-red-600 dark:text-red-400"
                                 }`}>
                                    {(item.type === 'index' ? item.change : item.changePercent) >= 0 ? (
                                       <TrendingUp className="w-3 h-3 mr-0.5" />
                                    ) : (
                                       <TrendingDown className="w-3 h-3 mr-0.5" />
                                    )}
                                    {(item.type === 'index' ? item.change : item.changePercent) >= 0 ? "+" : ""}
                                    {(item.type === 'index' ? item.change : item.changePercent).toFixed(2)}%
                                 </div>
                                 {(item.type === 'stock' || item.type === 'crypto') && (
                                    <div className={`text-[11px] ${item.change >= 0 ? "text-green-600/80 dark:text-green-400/80" : "text-red-600/80 dark:text-red-400/80"}`}>
                                       {item.change >= 0 ? "+" : ""}
                                       {item.change.toFixed(2)}
                                    </div>
                                 )}
                              </td>
                           </tr>
                        ))}
                        {/* Show loading or no data message */} 
                        {sortedAndFilteredData.length === 0 && (
                           <tr>
                              <td colSpan={3} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                 {loading ? 'Loading data...' : 'No data available for this filter.'}
                              </td>
                           </tr>
                        )}
                     </tbody>
                   </table>
                </div>

                {/* Sector Performance Footer (Optional) */}
                {/* 
                <div className="p-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-xs">Sector Performance</h4>
                   <ul className="text-xs space-y-1">
                      {sectorData.slice(0, 5).map(sector => (
                         <li key={sector.name} className="flex justify-between">
                           <span className="text-gray-600 dark:text-gray-400 truncate pr-2">• {sector.name}</span>
                           <span className={`${parseFloat(sector.performance) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {parseFloat(sector.performance) >= 0 ? '+' : ''}{sector.performance}%
                           </span>
                         </li>
                      ))}
                   </ul>
                </div>
                */} 
              </div>
            </div>
            
            {/* Volatility Analysis Section */}
            <div className="mt-10 mb-8 bg-white/90 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="text-primary-500" size={24} />
                  Market Volatility Analysis
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Analyze market volatility across different regimes
                </div>
              </div>
              
              <div className="mb-8">
                <VolatilityChart 
                  symbol={sortedAndFilteredData.length > 0 ? 
                    (sortedAndFilteredData[0].type === 'index' ? 
                      sortedAndFilteredData[0].name : 
                      sortedAndFilteredData[0].symbol) : 
                    "SPY"}
                  showHistoricalVol={true}
                  showImpliedVol={true}
                  showVix={true}
                  timeRange="3m"
                  height={400} /* Increased height from default */
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-4">Compare Volatility Regimes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {/* Grid for all volatility examples */}
                <div className="overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium p-4 pb-2">Low Volatility Example</h4>
                    <div className="px-4 pb-2">
                      <div className="mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <Activity size={14} />
                        Low Volatility
                      </div>
                    </div>
                  </div>
                  <div className="checkbox-container px-4 pb-2 flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Historical Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={false}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Implied Volatility
                    </label>
                  </div>
                  <div className="px-1 py-1">
                    <VolatilityChart 
                      symbol="LOW-VOL-DEMO" 
                      title=""
                      height={280}
                      showHistoricalVol={true}
                      showImpliedVol={false}
                      timeRange="3m"
                    />
                  </div>
                </div>
                
                <div className="overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium p-4 pb-2">High Volatility Example</h4>
                    <div className="px-4 pb-2">
                      <div className="mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Activity size={14} />
                        High Volatility
                      </div>
                    </div>
                  </div>
                  <div className="checkbox-container px-4 pb-2 flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Historical Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Implied Volatility
                    </label>
                  </div>
                  <div className="px-1 py-1">
                    <VolatilityChart 
                      symbol="HIGH-VOL-DEMO" 
                      title=""
                      height={280}
                      showHistoricalVol={true}
                      showImpliedVol={true}
                      timeRange="3m"
                    />
                  </div>
                </div>
                
                <div className="overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-medium p-4 pb-2">Market Crisis Example</h4>
                    <div className="px-4 pb-2">
                      <div className="mb-2 px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap w-fit bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <Activity size={14} />
                        Extreme Volatility
                      </div>
                    </div>
                  </div>
                  <div className="checkbox-container px-4 pb-2 flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Historical Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      Implied Volatility
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      VIX Volatility
                    </label>
                  </div>
                  <div className="px-1 py-1">
                    <VolatilityChart 
                      symbol="EXTREME-VOL-DEMO" 
                      title=""
                      height={280}
                      showHistoricalVol={true}
                      showImpliedVol={true}
                      showVix={true}
                      timeRange="3m"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial News Reel Section */}
            <div className="mt-8 bg-white/90 dark:bg-[#1e293b]/80 rounded-xl overflow-hidden backdrop-blur-lg shadow-xl border border-gray-300 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Financial News & Insights
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Latest market updates and economic developments
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* News Item 1 */}
                <div 
                  className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNewsItemClick(sampleNewsData[0])}
                >
                  <div className="flex items-start gap-2">
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                      Markets
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </div>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">
                    S&P 500 reaches new highs amid strong earnings reports
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Major indices continue upward trend as quarterly results exceed analyst expectations in tech and financial sectors.
                  </p>
                </div>
                
                {/* News Item 2 */}
                <div 
                  className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNewsItemClick(sampleNewsData[1])}
                >
                  <div className="flex items-start gap-2">
                    <div className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">
                      Economy
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      5 hours ago
                    </div>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">
                    Federal Reserve signals potential pause in rate hikes
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Central bank officials indicate inflation pressures may be easing, suggesting a shift in monetary policy approach.
                  </p>
                </div>
                
                {/* News Item 3 */}
                <div 
                  className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNewsItemClick(sampleNewsData[2])}
                >
                  <div className="flex items-start gap-2">
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-xs font-medium">
                      Commodities
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Yesterday
                    </div>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">
                    Oil prices stabilize after recent volatility
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Crude markets find balance following supply concerns, with production adjustments offsetting geopolitical tensions.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Updated every 30 minutes
                </div>
              </div>
            </div>
            
            {/* Disclaimer */}
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

      {/* News Article Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  {selectedNewsItem && (
                    <div>
                      <div className="flex items-start gap-2 mb-4">
                        <div className={`px-2 py-1 rounded text-xs font-medium
                          ${selectedNewsItem?.category === 'Markets' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                           selectedNewsItem?.category === 'Economy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {selectedNewsItem?.category}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedNewsItem?.timestamp}
                        </div>
                        {selectedNewsItem?.source && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                            Source: {selectedNewsItem?.source}
                          </div>
                        )}
                      </div>
                      
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                        {selectedNewsItem?.title}
                      </Dialog.Title>
                      
                      <div className="mt-2 space-y-4">
                        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-line">
                          {selectedNewsItem?.fullContent || selectedNewsItem?.summary}
                        </p>
                      </div>
                      
                      <div className="mt-5 sm:mt-6">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
} 
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Preload } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { GraphState } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { UIOverlay } from './UIOverlay';
import { SimplifiedGraph } from './SimplifiedGraph';
import { SafePerformanceMonitor } from './SafePerformanceMonitor';
import { OptimizedSceneContent } from './OptimizedSceneContent';

export function SafeOptimizedGraphScene() {
  const [graphState, setGraphState] = useState<GraphState>({
    selectedNode: null,
    hoveredNode: null,
    focusedNode: null,
    filter: {
      categories: [],
      techStack: [],
      searchTerm: ''
    },
    viewMode: 'default'
  });
  
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [enableEffects, setEnableEffects] = useState(true);

  useEffect(() => {
    // Enhanced device capability detection
    const checkDeviceCapabilities = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        setIsLowEndDevice(true);
        return;
      }

      // Check for mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check memory (if available)
      const memory = (performance as any).memory;
      const lowMemory = memory && memory.totalJSHeapSize > memory.jsHeapSizeLimit * 0.8;
      
      // Check GPU
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      const isLowEndGPU = /Intel|Mobile|Integrated/i.test(renderer);

      // Check max texture size
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const hasSmallTextures = maxTextureSize < 4096;

      const lowEnd = isMobile || lowMemory || isLowEndGPU || hasSmallTextures;
      setIsLowEndDevice(lowEnd);
      setEnableEffects(!lowEnd && !isMobile);
    };

    checkDeviceCapabilities();
  }, []);

  // Use simplified graph for low-end devices
  if (isLowEndDevice) {
    return <SimplifiedGraph />;
  }

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas
        camera={{ 
          position: [10, 10, 10], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: !isLowEndDevice,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        shadows={!isLowEndDevice}
        dpr={[1, 2]}
      >
        {/* Optimized lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={0.7} 
          castShadow={!isLowEndDevice}
          shadow-mapSize={[1024, 1024]}
        />

        {/* Reduced star count for performance */}
        <Stars 
          radius={100} 
          depth={50} 
          count={isLowEndDevice ? 1000 : 3000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.5}
        />

        {/* Controls with reduced damping for responsiveness */}
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={5}
          maxDistance={50}
          autoRotate={!graphState.selectedNode}
          autoRotateSpeed={0.3}
          makeDefault
        />

        {/* Main Content with performance optimizations */}
        <Suspense fallback={<LoadingSpinner />}>
          <OptimizedSceneContent
            graphState={graphState}
            onStateChange={setGraphState}
            enableEffects={enableEffects}
          />
        </Suspense>

        <Preload all />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="p-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Portfolio Knowledge Graph
          </h1>
          <p className="text-gray-300 flex items-center gap-2">
            Interactive 3D visualization of AI demo connections
            {!enableEffects && (
              <span className="text-xs bg-yellow-600/20 px-2 py-1 rounded">
                Performance Mode
              </span>
            )}
          </p>
        </div>
        
        <UIOverlay 
          graphState={graphState} 
          onStateChange={setGraphState} 
        />
        
        <SafePerformanceMonitor />

        {/* Performance toggle */}
        <button
          className="absolute bottom-6 right-6 px-3 py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded text-white text-sm hover:bg-gray-700/80 transition-colors pointer-events-auto"
          onClick={() => setEnableEffects(!enableEffects)}
        >
          Effects: {enableEffects ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
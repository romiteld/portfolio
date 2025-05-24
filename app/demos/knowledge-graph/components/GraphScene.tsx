'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Preload } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField, Vignette } from '@react-three/postprocessing';
import { GraphState } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { UIOverlay } from './UIOverlay';
import { SimplifiedGraph } from './SimplifiedGraph';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SceneContent } from './SceneContent';

export function GraphScene() {
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

  useEffect(() => {
    // Detect device capabilities
    const checkDeviceCapabilities = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
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

      setIsLowEndDevice(isMobile || lowMemory || isLowEndGPU);
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
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FF00FF" />
        <spotLight
          position={[0, 20, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
        />

        {/* Environment */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
        <Environment preset="night" />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={5}
          maxDistance={50}
          autoRotate={!graphState.selectedNode}
          autoRotateSpeed={0.5}
        />

        {/* Main Content */}
        <Suspense fallback={<LoadingSpinner />}>
          <SceneContent
            graphState={graphState}
            onStateChange={setGraphState}
          />
        </Suspense>

        {/* Post-processing Effects */}
        <EffectComposer>
          <Bloom 
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            height={300}
          />
          <DepthOfField 
            focusDistance={0}
            focalLength={0.02}
            bokehScale={2}
            height={480}
          />
          <ChromaticAberration
            offset={[0.002, 0.002]}
          />
          <Vignette 
            offset={0.1}
            darkness={0.4}
          />
        </EffectComposer>

        <Preload all />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="p-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Portfolio Knowledge Graph
          </h1>
          <p className="text-gray-300">
            Interactive 3D visualization of AI demo connections
          </p>
        </div>
        
        <UIOverlay 
          graphState={graphState} 
          onStateChange={setGraphState} 
        />
        
        <PerformanceMonitor />
      </div>
    </div>
  );
}
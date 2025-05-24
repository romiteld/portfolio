'use client';

import { useEffect, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/three';
import { demoNodes } from '../utils/demoData';

interface LoadSequenceProps {
  onComplete: () => void;
  children: React.ReactNode;
}

export function LoadSequence({ onComplete, children }: LoadSequenceProps) {
  const [phase, setPhase] = useState(0);
  const [nodesLoaded, setNodesLoaded] = useState(0);

  // Overall scene fade in
  const { opacity, scale } = useSpring({
    opacity: phase >= 1 ? 1 : 0,
    scale: phase >= 1 ? 1 : 0.8,
    config: config.molasses
  });

  useEffect(() => {
    const sequence = async () => {
      // Phase 1: Initial delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setPhase(1);

      // Phase 2: Load nodes sequentially
      await new Promise(resolve => setTimeout(resolve, 300));
      setPhase(2);

      // Animate nodes appearing
      for (let i = 0; i < demoNodes.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setNodesLoaded(i + 1);
      }

      // Phase 3: Show connections
      await new Promise(resolve => setTimeout(resolve, 500));
      setPhase(3);

      // Phase 4: Activate interactions
      await new Promise(resolve => setTimeout(resolve, 500));
      setPhase(4);
      onComplete();
    };

    sequence();
  }, [onComplete]);

  return (
    <animated.group scale={scale} opacity={opacity}>
      {children}
    </animated.group>
  );
}

// Loading overlay component
export function LoadingOverlay({ progress }: { progress: number }) {
  const { opacity } = useSpring({
    opacity: progress < 100 ? 1 : 0,
    config: config.slow
  });

  return (
    <animated.div
      style={{ opacity }}
      className="absolute inset-0 bg-black flex items-center justify-center pointer-events-none z-50"
    >
      <div className="text-center">
        <div className="mb-8">
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Initializing Knowledge Graph
        </h2>
        
        <p className="text-gray-400">
          {progress < 20 && 'Loading environment...'}
          {progress >= 20 && progress < 60 && 'Creating nodes...'}
          {progress >= 60 && progress < 80 && 'Establishing connections...'}
          {progress >= 80 && progress < 100 && 'Finalizing visualization...'}
          {progress >= 100 && 'Ready!'}
        </p>
      </div>
    </animated.div>
  );
}
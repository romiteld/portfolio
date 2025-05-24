'use client';

import { useRef, useMemo } from 'react';
import { useCameraAnimation } from '../hooks/useCameraAnimation';
import { OptimizedGraphNodes } from './OptimizedGraphNodes';
import { OptimizedGraphConnections } from './OptimizedGraphConnections';
import { CameraController } from './CameraController';
import { GraphState } from '../types';
import { useFrame } from '@react-three/fiber';
import { demoNodes } from '../utils/demoData';

interface OptimizedSceneContentProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
  enableEffects: boolean;
}

export function OptimizedSceneContent({ graphState, onStateChange, enableEffects }: OptimizedSceneContentProps) {
  const { focusOnNode } = useCameraAnimation();
  const nodeFocusRef = useRef<((position: [number, number, number]) => void) | null>(null);
  const performanceRef = useRef({ fps: 60, frameCount: 0, lastTime: performance.now() });

  const handleNodeFocus = (position: [number, number, number]) => {
    focusOnNode(position, { duration: 1500 });
  };

  // Monitor performance and adjust quality
  useFrame(() => {
    performanceRef.current.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - performanceRef.current.lastTime >= 1000) {
      performanceRef.current.fps = performanceRef.current.frameCount;
      performanceRef.current.frameCount = 0;
      performanceRef.current.lastTime = currentTime;
    }
  });

  // Filter nodes based on current filters
  const filteredNodes = useMemo(() => {
    return demoNodes.filter(node => {
      // Category filter
      if (graphState.filter.categories.length > 0 && 
          !graphState.filter.categories.includes(node.category)) {
        return false;
      }

      // Tech stack filter
      if (graphState.filter.techStack.length > 0) {
        const hasMatchingTech = node.techStack.some(tech => 
          graphState.filter.techStack.includes(tech)
        );
        if (!hasMatchingTech) return false;
      }

      // Search term filter
      if (graphState.filter.searchTerm) {
        const searchLower = graphState.filter.searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.techStack.some(tech => tech.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [graphState.filter]);

  return (
    <>
      <CameraController 
        selectedNode={graphState.selectedNode}
        onNodePosition={(handler) => { nodeFocusRef.current = handler; }}
      />
      
      <OptimizedGraphConnections 
        graphState={graphState} 
        onStateChange={onStateChange}
        filteredNodes={filteredNodes}
        enableEffects={enableEffects}
      />
      
      <OptimizedGraphNodes 
        graphState={graphState} 
        onStateChange={onStateChange}
        onNodeFocus={handleNodeFocus}
        filteredNodes={filteredNodes}
        enableEffects={enableEffects}
      />
    </>
  );
}
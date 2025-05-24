'use client';

import { useRef } from 'react';
import { useCameraAnimation } from '../hooks/useCameraAnimation';
import { GraphNodes } from './GraphNodes';
import { GraphConnections } from './GraphConnections';
import { CameraController } from './CameraController';
import { GraphState } from '../types';

interface SceneContentProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
}

export function SceneContent({ graphState, onStateChange }: SceneContentProps) {
  const { focusOnNode } = useCameraAnimation();
  const nodeFocusRef = useRef<((position: [number, number, number]) => void) | null>(null);

  const handleNodeFocus = (position: [number, number, number]) => {
    focusOnNode(position, { duration: 1500 });
  };

  return (
    <>
      <CameraController 
        selectedNode={graphState.selectedNode}
        onNodePosition={(handler) => { nodeFocusRef.current = handler; }}
      />
      
      <GraphConnections 
        graphState={graphState} 
        onStateChange={onStateChange}
      />
      
      <GraphNodes 
        graphState={graphState} 
        onStateChange={onStateChange}
        onNodeFocus={handleNodeFocus}
      />
    </>
  );
}
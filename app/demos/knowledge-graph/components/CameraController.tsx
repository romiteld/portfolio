'use client';

import { useEffect } from 'react';
import { useCameraAnimation } from '../hooks/useCameraAnimation';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

interface CameraControllerProps {
  selectedNode: string | null;
  onNodePosition?: (position: [number, number, number]) => void;
}

export function CameraController({ selectedNode, onNodePosition }: CameraControllerProps) {
  const { focusOnNode, resetCamera, orbitAroundGraph, shake } = useCameraAnimation();
  const { camera } = useThree();

  // Auto-orbit when no node is selected
  useEffect(() => {
    if (!selectedNode) {
      const animate = orbitAroundGraph();
      let animationId: number;
      
      const tick = (time: number) => {
        animate(time);
        animationId = requestAnimationFrame(tick);
      };
      
      // Start after a delay
      const timeout = setTimeout(() => {
        animationId = requestAnimationFrame(tick);
      }, 2000);

      return () => {
        clearTimeout(timeout);
        if (animationId) cancelAnimationFrame(animationId);
      };
    }
  }, [selectedNode, orbitAroundGraph]);

  // Focus on selected node
  useEffect(() => {
    if (onNodePosition) {
      const handleFocus = (position: [number, number, number]) => {
        focusOnNode(position, {
          duration: 1500,
          onComplete: () => {
            // Small shake effect when arriving
            shake(0.05, 200);
          }
        });
      };
      
      onNodePosition(handleFocus);
    }
  }, [onNodePosition, focusOnNode, shake]);

  // Reset camera on escape key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetCamera();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetCamera]);

  return null;
}
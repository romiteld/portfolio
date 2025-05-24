'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Frustum, Matrix4, Vector3 } from 'three';
import { DemoNode } from './DemoNode';
import { demoNodes } from '../utils/demoData';
import { GraphState } from '../types';

interface GraphNodesProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
  onNodeFocus?: (position: [number, number, number]) => void;
}

export function GraphNodes({ graphState, onStateChange, onNodeFocus }: GraphNodesProps) {
  const { camera } = useThree();
  const frustum = useRef(new Frustum());
  const matrix = useRef(new Matrix4());
  const visibleNodes = useRef<Set<string>>(new Set());

  // Update frustum culling
  useFrame(() => {
    matrix.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.current.setFromProjectionMatrix(matrix.current);

    // Check which nodes are visible
    const newVisibleNodes = new Set<string>();
    demoNodes.forEach(node => {
      const position = new Vector3(...node.position);
      if (frustum.current.containsPoint(position)) {
        newVisibleNodes.add(node.id);
      }
    });
    visibleNodes.current = newVisibleNodes;
  });

  const handleNodeHover = (nodeId: string | null) => {
    onStateChange({
      ...graphState,
      hoveredNode: nodeId
    });
  };

  const handleNodeClick = (nodeId: string) => {
    const node = demoNodes.find(n => n.id === nodeId);
    if (node && onNodeFocus && nodeId !== graphState.selectedNode) {
      onNodeFocus(node.position);
    }
    
    onStateChange({
      ...graphState,
      selectedNode: nodeId === graphState.selectedNode ? null : nodeId
    });
  };

  // Filter nodes based on search/filters
  const filteredNodes = demoNodes.filter(node => {
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

  return (
    <group>
      {filteredNodes.map(node => {
        // Only render nodes that are visible in the frustum
        // Always render selected or hovered nodes regardless of frustum
        const shouldRender = 
          visibleNodes.current.has(node.id) ||
          graphState.selectedNode === node.id ||
          graphState.hoveredNode === node.id;

        if (!shouldRender) return null;

        return (
          <DemoNode
            key={node.id}
            node={node}
            isSelected={graphState.selectedNode === node.id}
            isHovered={graphState.hoveredNode === node.id}
            onHover={handleNodeHover}
            onClick={handleNodeClick}
            loadDelay={filteredNodes.indexOf(node) * 150}
          />
        );
      })}
    </group>
  );
}
'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, LineBasicMaterial, Vector3, BufferAttribute, LineSegments, Color } from 'three';
import { ConnectionLine } from './ConnectionLine';
import { connections } from '../utils/demoData';
import { GraphState } from '../types';
import { DemoNode } from '../types';

interface OptimizedGraphConnectionsProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
  filteredNodes: DemoNode[];
  enableEffects: boolean;
}

export function OptimizedGraphConnections({ 
  graphState, 
  filteredNodes,
  enableEffects 
}: OptimizedGraphConnectionsProps) {
  const lineSegmentsRef = useRef<LineSegments>(null);
  
  // Create a map of node positions for quick lookup
  const nodePositions = useMemo(() => {
    return filteredNodes.reduce((acc, node) => {
      acc[node.id] = node.position;
      return acc;
    }, {} as Record<string, [number, number, number]>);
  }, [filteredNodes]);

  // Separate connections into highlighted and background
  const { highlightedConnections, backgroundConnections } = useMemo(() => {
    const highlighted: typeof connections = [];
    const background: typeof connections = [];

    connections.forEach(conn => {
      // Skip if nodes aren't in filtered set
      if (!nodePositions[conn.source] || !nodePositions[conn.target]) {
        return;
      }

      // Check if connection should be highlighted
      const isHighlighted = 
        conn.source === graphState.selectedNode || 
        conn.target === graphState.selectedNode ||
        conn.source === graphState.hoveredNode || 
        conn.target === graphState.hoveredNode;

      if (isHighlighted) {
        highlighted.push(conn);
      } else if (!graphState.selectedNode && !graphState.hoveredNode) {
        // Show all connections when nothing is selected
        background.push(conn);
      }
    });

    return { highlightedConnections: highlighted, backgroundConnections: background };
  }, [connections, nodePositions, graphState.selectedNode, graphState.hoveredNode]);

  // Create geometry for background connections (batched for performance)
  const backgroundGeometry = useMemo(() => {
    if (!enableEffects || backgroundConnections.length === 0) return null;

    const positions: number[] = [];
    const colors: number[] = [];
    const color = new Color();

    backgroundConnections.forEach(conn => {
      const sourcePos = nodePositions[conn.source];
      const targetPos = nodePositions[conn.target];
      
      if (sourcePos && targetPos) {
        // Add line segment
        positions.push(...sourcePos, ...targetPos);
        
        // Add colors based on connection type
        const connColor = conn.type === 'data' ? '#00D9FF' : 
                         conn.type === 'api' ? '#FFD700' :
                         conn.type === 'model' ? '#FF00FF' : '#00FF00';
        color.set(connColor);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
      }
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
    
    return geometry;
  }, [backgroundConnections, nodePositions, enableEffects]);

  // Animate connection opacity
  useFrame((state) => {
    if (lineSegmentsRef.current && lineSegmentsRef.current.material) {
      const material = lineSegmentsRef.current.material as LineBasicMaterial;
      const opacity = graphState.selectedNode || graphState.hoveredNode ? 0.2 : 0.4;
      material.opacity = opacity;
    }
  });

  return (
    <group>
      {/* Batched background connections for performance */}
      {backgroundGeometry && (
        <lineSegments ref={lineSegmentsRef} geometry={backgroundGeometry}>
          <lineBasicMaterial 
            vertexColors
            transparent
            opacity={0.4}
            linewidth={1}
            depthWrite={false}
          />
        </lineSegments>
      )}

      {/* Individual highlighted connections with animations */}
      {highlightedConnections.map(connection => {
        const sourcePos = nodePositions[connection.source];
        const targetPos = nodePositions[connection.target];

        if (!sourcePos || !targetPos) return null;

        return (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            sourcePos={sourcePos}
            targetPos={targetPos}
            isHighlighted={true}
          />
        );
      })}
    </group>
  );
}
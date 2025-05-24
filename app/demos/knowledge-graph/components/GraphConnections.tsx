'use client';

import { ConnectionLine } from './ConnectionLine';
import { connections, demoNodes } from '../utils/demoData';
import { GraphState } from '../types';

interface GraphConnectionsProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
}

export function GraphConnections({ graphState }: GraphConnectionsProps) {
  // Create a map of node positions for quick lookup
  const nodePositions = demoNodes.reduce((acc, node) => {
    acc[node.id] = node.position;
    return acc;
  }, {} as Record<string, [number, number, number]>);

  // Filter connections based on selected/hovered nodes
  const visibleConnections = connections.filter(conn => {
    if (!nodePositions[conn.source] || !nodePositions[conn.target]) {
      return false;
    }

    // Always show connections for selected or hovered nodes
    if (graphState.selectedNode || graphState.hoveredNode) {
      return (
        conn.source === graphState.selectedNode || 
        conn.target === graphState.selectedNode ||
        conn.source === graphState.hoveredNode || 
        conn.target === graphState.hoveredNode
      );
    }

    return true;
  });

  return (
    <group>
      {visibleConnections.map(connection => {
        const sourcePos = nodePositions[connection.source];
        const targetPos = nodePositions[connection.target];

        if (!sourcePos || !targetPos) return null;

        const isHighlighted = 
          connection.source === graphState.selectedNode ||
          connection.target === graphState.selectedNode ||
          connection.source === graphState.hoveredNode ||
          connection.target === graphState.hoveredNode;

        return (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            sourcePos={sourcePos}
            targetPos={targetPos}
            isHighlighted={isHighlighted}
          />
        );
      })}
    </group>
  );
}
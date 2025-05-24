'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Frustum, Matrix4, Vector3, InstancedMesh, Object3D, Color, SphereGeometry, MeshPhongMaterial } from 'three';
import { OptimizedDemoNode } from './OptimizedDemoNode';
import { DemoNode as DemoNodeType } from '../types';
import { GraphState } from '../types';

interface OptimizedGraphNodesProps {
  graphState: GraphState;
  onStateChange: (state: GraphState) => void;
  onNodeFocus?: (position: [number, number, number]) => void;
  filteredNodes: DemoNodeType[];
  enableEffects: boolean;
}

export function OptimizedGraphNodes({ 
  graphState, 
  onStateChange, 
  onNodeFocus, 
  filteredNodes,
  enableEffects 
}: OptimizedGraphNodesProps) {
  const { camera, gl } = useThree();
  const frustum = useRef(new Frustum());
  const matrix = useRef(new Matrix4());
  const visibleNodes = useRef<Set<string>>(new Set());
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  // Group nodes by category for instanced rendering
  const nodesByCategory = useMemo(() => {
    const grouped = filteredNodes.reduce((acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    }, {} as Record<string, DemoNodeType[]>);

    return grouped;
  }, [filteredNodes]);

  // Update frustum culling
  useFrame(() => {
    matrix.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.current.setFromProjectionMatrix(matrix.current);

    // Check which nodes are visible
    const newVisibleNodes = new Set<string>();
    const cameraPos = new Vector3();
    camera.getWorldPosition(cameraPos);

    filteredNodes.forEach(node => {
      const position = new Vector3(...node.position);
      const distance = position.distanceTo(cameraPos);
      
      // Frustum culling with distance-based optimization
      if (distance < 100 && frustum.current.containsPoint(position)) {
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
    const node = filteredNodes.find(n => n.id === nodeId);
    if (node && onNodeFocus && nodeId !== graphState.selectedNode) {
      onNodeFocus(node.position);
    }
    
    onStateChange({
      ...graphState,
      selectedNode: nodeId === graphState.selectedNode ? null : nodeId
    });
  };

  // Render instanced meshes for background nodes (non-interactive)
  const instancedNodes = useMemo(() => {
    if (!enableEffects) return null;

    return Object.entries(nodesByCategory).map(([category, nodes]) => {
      const count = nodes.filter(node => 
        !visibleNodes.current.has(node.id) && 
        node.id !== graphState.selectedNode && 
        node.id !== graphState.hoveredNode
      ).length;

      if (count === 0) return null;

      const geometry = new SphereGeometry(0.3, 8, 8);
      const material = new MeshPhongMaterial({
        color: nodes[0].color,
        emissive: nodes[0].color,
        emissiveIntensity: 0.2,
      });

      return (
        <instancedMesh
          key={category}
          ref={instancedMeshRef}
          args={[geometry, material, count]}
          frustumCulled={false}
        >
          {nodes.filter(node => 
            !visibleNodes.current.has(node.id) && 
            node.id !== graphState.selectedNode && 
            node.id !== graphState.hoveredNode
          ).map((node, i) => {
            dummy.position.set(...node.position);
            dummy.scale.setScalar(node.size * 0.3);
            dummy.updateMatrix();
            
            if (instancedMeshRef.current) {
              instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
              instancedMeshRef.current.instanceMatrix.needsUpdate = true;
            }
            
            return null;
          })}
        </instancedMesh>
      );
    });
  }, [nodesByCategory, visibleNodes.current, graphState.selectedNode, graphState.hoveredNode, enableEffects]);

  // Render interactive nodes
  const interactiveNodes = filteredNodes.filter(node => {
    // Always render selected or hovered nodes
    if (graphState.selectedNode === node.id || graphState.hoveredNode === node.id) {
      return true;
    }
    
    // Render visible nodes
    return visibleNodes.current.has(node.id);
  });

  return (
    <group>
      {/* Instanced background nodes */}
      {instancedNodes}

      {/* Interactive foreground nodes */}
      {interactiveNodes.map((node, index) => (
        <OptimizedDemoNode
          key={node.id}
          node={node}
          isSelected={graphState.selectedNode === node.id}
          isHovered={graphState.hoveredNode === node.id}
          onHover={handleNodeHover}
          onClick={handleNodeClick}
          loadDelay={index * 50} // Reduced delay for faster loading
        />
      ))}
    </group>
  );
}
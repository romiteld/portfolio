'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { LOD, Mesh, SphereGeometry, BoxGeometry, MeshBasicMaterial } from 'three';
import { DemoNode as DemoNodeType } from '../types';

interface LODNodeProps {
  node: DemoNodeType;
  children: React.ReactNode;
}

export function LODNode({ node, children }: LODNodeProps) {
  const lodRef = useRef<LOD>(null);
  const { camera } = useThree();

  // Create different levels of detail
  const lods = useMemo(() => {
    // High detail - original geometry (closest)
    const highDetail = children;

    // Medium detail - simplified geometry
    const mediumGeometry = new SphereGeometry(node.size, 16, 16);
    const mediumMaterial = new MeshBasicMaterial({ 
      color: node.color,
      wireframe: false 
    });
    const mediumMesh = new Mesh(mediumGeometry, mediumMaterial);

    // Low detail - very simple geometry (farthest)
    const lowGeometry = new BoxGeometry(node.size, node.size, node.size);
    const lowMaterial = new MeshBasicMaterial({ 
      color: node.color,
      transparent: true,
      opacity: 0.8
    });
    const lowMesh = new Mesh(lowGeometry, lowMaterial);

    // Billboard/sprite for very far distances
    const billboardGeometry = new SphereGeometry(node.size * 0.5, 4, 4);
    const billboardMaterial = new MeshBasicMaterial({ 
      color: node.color,
      transparent: true,
      opacity: 0.5
    });
    const billboardMesh = new Mesh(billboardGeometry, billboardMaterial);

    return {
      high: { object: highDetail, distance: 10 },
      medium: { object: mediumMesh, distance: 20 },
      low: { object: lowMesh, distance: 30 },
      billboard: { object: billboardMesh, distance: 50 }
    };
  }, [node, children]);

  useFrame(() => {
    if (lodRef.current) {
      lodRef.current.update(camera);
    }
  });

  return (
    <lod ref={lodRef}>
      {lods.high.object}
      <primitive object={lods.medium.object} />
      <primitive object={lods.low.object} />
      <primitive object={lods.billboard.object} />
    </lod>
  );
}
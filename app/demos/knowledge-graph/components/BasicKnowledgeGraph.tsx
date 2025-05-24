'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Simple node component
function GraphNode({ position, color, size, label }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <Sphere
        args={[size, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? 'hotpink' : color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </Sphere>
    </group>
  );
}

// Basic connection line
function Connection({ start, end }: any) {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ];
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#666666" />
    </line>
  );
}

export function BasicKnowledgeGraph() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Simple demo data
  const nodes = [
    { id: 'ai', position: [0, 0, 0], color: '#FFD700', size: 1, label: 'AI Core' },
    { id: 'vision', position: [3, 2, 0], color: '#FF00FF', size: 0.8, label: 'Computer Vision' },
    { id: 'finance', position: [-3, 2, 0], color: '#00D9FF', size: 0.8, label: 'Financial' },
    { id: 'agents', position: [0, -3, 0], color: '#00FF00', size: 0.8, label: 'Agents' },
  ];

  const connections = [
    { from: [0, 0, 0], to: [3, 2, 0] },
    { from: [0, 0, 0], to: [-3, 2, 0] },
    { from: [0, 0, 0], to: [0, -3, 0] },
  ];

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 60 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <OrbitControls enableDamping dampingFactor={0.05} />

        {/* Render nodes */}
        {nodes.map(node => (
          <GraphNode
            key={node.id}
            position={node.position}
            color={node.color}
            size={node.size}
            label={node.label}
          />
        ))}

        {/* Render connections */}
        {connections.map((conn, i) => (
          <Connection
            key={i}
            start={conn.from}
            end={conn.to}
          />
        ))}
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Portfolio Knowledge Graph
        </h1>
        <p className="text-gray-300">
          Basic 3D visualization
        </p>
      </div>
    </div>
  );
}
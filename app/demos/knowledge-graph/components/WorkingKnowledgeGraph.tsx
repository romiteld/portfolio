'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Line } from '@react-three/drei';
import { useState, Suspense } from 'react';
import { demoNodes, connections } from '../utils/demoData';

function Node({ node, isSelected, onSelect }: any) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group
      position={node.position}
      onClick={() => onSelect(node.id)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Sphere args={[node.size, 32, 32]}>
        <meshStandardMaterial
          color={hovered ? '#ffffff' : node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.2}
        />
      </Sphere>
      {(isSelected || hovered) && (
        <Text
          position={[0, node.size + 1, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {node.name}
        </Text>
      )}
    </group>
  );
}

function Connection({ source, target, nodeMap }: any) {
  const sourceNode = nodeMap[source];
  const targetNode = nodeMap[target];
  
  if (!sourceNode || !targetNode) return null;
  
  const points = [sourceNode.position, targetNode.position];
  
  return (
    <Line
      points={points}
      color="#666666"
      lineWidth={1}
      opacity={0.5}
      transparent
    />
  );
}

export function WorkingKnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const nodeMap = demoNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as any);

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          autoRotate={!selectedNode}
          autoRotateSpeed={0.3}
        />
        
        <Suspense fallback={null}>
          {/* Render connections */}
          {connections.map(conn => (
            <Connection
              key={conn.id}
              source={conn.source}
              target={conn.target}
              nodeMap={nodeMap}
            />
          ))}
          
          {/* Render nodes */}
          {demoNodes.map(node => (
            <Node
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              onSelect={setSelectedNode}
            />
          ))}
        </Suspense>
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6 pointer-events-none">
        <h1 className="text-4xl font-bold text-white mb-2">
          AI Portfolio Knowledge Graph
        </h1>
        <p className="text-gray-300">
          Interactive 3D visualization of AI demo connections
        </p>
      </div>
      
      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-6 right-6 p-4 bg-gray-800/90 backdrop-blur-sm rounded-lg max-w-sm pointer-events-none">
          <h3 className="text-white font-bold text-lg mb-2">
            {nodeMap[selectedNode].name}
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            {nodeMap[selectedNode].description}
          </p>
          <div className="flex flex-wrap gap-2">
            {nodeMap[selectedNode].techStack.slice(0, 3).map((tech: string) => (
              <span key={tech} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
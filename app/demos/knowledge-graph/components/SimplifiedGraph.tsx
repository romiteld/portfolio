'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { demoNodes, connections } from '../utils/demoData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Simple node component without complex effects
function SimpleNode({ node, onClick }: { node: any; onClick: (id: string) => void }) {
  return (
    <mesh
      position={node.position}
      onClick={() => onClick(node.id)}
    >
      <sphereGeometry args={[node.size * 0.8, 16, 16]} />
      <meshBasicMaterial color={node.color} />
    </mesh>
  );
}

// Simple connection line
function SimpleConnection({ source, target }: { source: any; target: any }) {
  const points = [source, target];
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...source, ...target])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#666666" />
    </line>
  );
}

export function SimplifiedGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const selected = selectedNode ? demoNodes.find(n => n.id === selectedNode) : null;

  const nodePositions = demoNodes.reduce((acc, node) => {
    acc[node.id] = node.position;
    return acc;
  }, {} as Record<string, [number, number, number]>);

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <OrbitControls
          enableDamping={false}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />

        {/* Simple connections */}
        {connections.map(conn => {
          const source = nodePositions[conn.source];
          const target = nodePositions[conn.target];
          if (!source || !target) return null;
          
          return (
            <SimpleConnection
              key={conn.id}
              source={source}
              target={target}
            />
          );
        })}

        {/* Simple nodes */}
        {demoNodes.map(node => (
          <SimpleNode
            key={node.id}
            node={node}
            onClick={setSelectedNode}
          />
        ))}
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Portfolio Knowledge Graph
        </h1>
        <p className="text-gray-300 text-sm">
          Simplified view for optimal performance
        </p>
      </div>

      {/* Selected Node Info */}
      {selected && (
        <Card className="absolute bottom-6 right-6 p-4 max-w-sm bg-gray-800 text-white">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span>{selected.icon}</span>
            {selected.name}
          </h3>
          <p className="text-gray-300 text-sm mb-3">{selected.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.techStack.slice(0, 3).map(tech => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
          {selected.route && (
            <Link href={selected.route}>
              <button className="w-full py-2 px-4 bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                View Demo
              </button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}
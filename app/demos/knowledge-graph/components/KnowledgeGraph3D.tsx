'use client';

import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Box, MeshDistortMaterial, Float, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { demoNodes, connections } from '../utils/demoData';
import { DemoNode } from '../types';

interface Node3DProps {
  node: DemoNode;
  isSelected: boolean;
  isHovered: boolean;
  isConnected: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function Node3D({ node, isSelected, isHovered, isConnected, onSelect, onHover }: Node3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [localHovered, setLocalHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current && node.position) {
      // Gentle floating animation
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1;
      
      // Scale animation on hover/select
      const targetScale = isSelected ? 1.5 : (isHovered || localHovered) ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // Rotation animation
      if (isSelected || isHovered) {
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  const opacity = isConnected || isSelected || !onSelect ? 1 : 0.3;
  
  if (!node.position) return null;
  
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={node.position}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setLocalHovered(true);
            onHover(node.id);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setLocalHovered(false);
            onHover(null);
          }}
        >
          <sphereGeometry args={[node.size * 0.8, 32, 32]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={isSelected ? 0.8 : isHovered || localHovered ? 0.5 : 0.2}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={opacity}
          />
        </mesh>
        
        {/* Outer glow ring */}
        {(isSelected || isHovered || localHovered) && (
          <mesh scale={[1.3, 1.3, 1.3]}>
            <torusGeometry args={[node.size * 0.8, 0.1, 16, 100]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Icon */}
        <Html center distanceFactor={8}>
          <div className="pointer-events-none select-none">
            <span className="text-2xl filter drop-shadow-lg">{node.icon}</span>
          </div>
        </Html>
        
        {/* Label */}
        {(isSelected || isHovered || localHovered) && (
          <Text
            position={[0, -node.size - 0.5, 0]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="top"
          >
            {node.name}
          </Text>
        )}
        
        {/* Status indicator */}
        <mesh position={[node.size * 0.7, node.size * 0.7, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial
            color={
              node.status === 'active' ? '#10B981' : 
              node.status === 'beta' ? '#F59E0B' : '#EF4444'
            }
          />
        </mesh>
      </group>
    </Float>
  );
}

function Connection3D({ 
  source, 
  target, 
  type, 
  isHighlighted 
}: { 
  source: [number, number, number]; 
  target: [number, number, number]; 
  type: string;
  isHighlighted: boolean;
}) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...source);
    const end = new THREE.Vector3(...target);
    const middle = new THREE.Vector3().lerpVectors(start, end, 0.5);
    middle.y += 0.5; // Add curve to the connection
    
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
    return curve.getPoints(50);
  }, [source, target]);

  const color = type === 'data' ? '#00D9FF' : 
                type === 'api' ? '#FFD700' :
                type === 'model' ? '#FF00FF' : '#00FF00';

  return (
    <Line
      points={points}
      color={color}
      lineWidth={isHighlighted ? 3 : 1}
      opacity={isHighlighted ? 0.9 : 0.4}
      transparent
    />
  );
}

function Scene({
  selectedNode,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  searchTerm,
  selectedCategory
}: {
  selectedNode: string | null;
  hoveredNode: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  searchTerm: string;
  selectedCategory: string;
}) {
  // Filter nodes based on search and category
  const filteredNodes = useMemo(() => {
    return demoNodes.filter(node => {
      const matchesSearch = searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.techStack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Get connected nodes
  const connectedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    
    const connected = new Set<string>();
    connections.forEach(conn => {
      if (conn.source === selectedNode) connected.add(conn.target);
      if (conn.target === selectedNode) connected.add(conn.source);
    });
    return connected;
  }, [selectedNode]);

  // Map node IDs to nodes for quick lookup
  const nodeMap = useMemo(() => {
    const map: { [key: string]: DemoNode } = {};
    demoNodes.forEach(node => {
      map[node.id] = node;
    });
    return map;
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#00D9FF" />
      
      {/* Background */}
      <color attach="background" args={['#000510']} />
      
      {/* Stars for background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Orbit controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        autoRotate={!selectedNode}
        autoRotateSpeed={0.5}
        maxDistance={20}
        minDistance={5}
      />
      
      {/* Grid helper */}
      <gridHelper args={[20, 20, '#1a1a2e', '#0f0f1e']} position={[0, -5, 0]} />
      
      {/* Render connections */}
      {connections.map(conn => {
        const sourceNode = nodeMap[conn.source];
        const targetNode = nodeMap[conn.target];
        
        if (!sourceNode || !targetNode || 
            !sourceNode.position || !targetNode.position ||
            !filteredNodes.some(n => n.id === conn.source) || 
            !filteredNodes.some(n => n.id === conn.target)) {
          return null;
        }
        
        const isHighlighted = selectedNode === conn.source || selectedNode === conn.target;
        
        return (
          <Connection3D
            key={conn.id}
            source={sourceNode.position}
            target={targetNode.position}
            type={conn.type}
            isHighlighted={isHighlighted}
          />
        );
      })}
      
      {/* Render nodes */}
      {filteredNodes.map(node => (
        <Node3D
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          isHovered={hoveredNode === node.id}
          isConnected={connectedNodes.has(node.id)}
          onSelect={onSelectNode}
          onHover={onHoverNode}
        />
      ))}
    </>
  );
}

interface KnowledgeGraph3DProps {
  selectedNode: string | null;
  hoveredNode: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  searchTerm: string;
  selectedCategory: string;
}

export function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [10, 8, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard, Sphere, Box } from '@react-three/drei';
import { Group, Vector3, Mesh, Color } from 'three';
import { DemoNode as DemoNodeType } from '../types';
import { animated, useSpring } from '@react-spring/three';

interface OptimizedDemoNodeProps {
  node: DemoNodeType;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  loadDelay?: number;
  distanceFromCamera?: number;
}

export function OptimizedDemoNode({
  node,
  isSelected,
  isHovered,
  onHover,
  onClick,
  loadDelay = 0,
  distanceFromCamera = 0
}: OptimizedDemoNodeProps) {
  const meshRef = useRef<Group>(null);
  const textRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const { camera } = useThree();
  const [lodLevel, setLodLevel] = useState<'high' | 'medium' | 'low'>('high');

  // Delayed loading for staggered appearance
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), loadDelay);
    return () => clearTimeout(timer);
  }, [loadDelay]);

  // Update LOD based on distance
  useFrame(() => {
    if (meshRef.current) {
      const distance = meshRef.current.position.distanceTo(camera.position);
      
      if (distance < 10) {
        setLodLevel('high');
      } else if (distance < 20) {
        setLodLevel('medium');
      } else {
        setLodLevel('low');
      }
    }
  });

  // Spring animations
  const { scale, emissiveIntensity, opacity } = useSpring({
    scale: loaded ? (isSelected ? 1.3 : isHovered ? 1.15 : 1) : 0,
    emissiveIntensity: isSelected ? 0.8 : isHovered ? 0.5 : 0.2,
    opacity: loaded ? 1 : 0,
    config: { mass: 1, tension: 180, friction: 12 }
  });

  // Memoize color to prevent recreating
  const nodeColor = useMemo(() => new Color(node.color), [node.color]);

  const handlePointerOver = () => onHover(node.id);
  const handlePointerOut = () => onHover(null);
  const handleClick = () => onClick(node.id);

  // Render different quality based on LOD
  const renderNode = () => {
    switch (lodLevel) {
      case 'high':
        return (
          <>
            {/* High quality sphere with more segments */}
            <Sphere args={[node.size, 32, 32]}>
              <animated.meshPhongMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={emissiveIntensity}
                opacity={opacity}
                transparent
              />
            </Sphere>
            
            {/* Icon */}
            <Billboard position={[0, node.size + 0.5, 0]}>
              <Text
                fontSize={0.8}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {node.icon}
              </Text>
            </Billboard>

            {/* Label */}
            {(isSelected || isHovered) && (
              <Billboard position={[0, -node.size - 0.8, 0]}>
                <Text
                  ref={textRef}
                  fontSize={0.3}
                  color="white"
                  anchorX="center"
                  anchorY="top"
                  maxWidth={4}
                >
                  {node.name}
                </Text>
              </Billboard>
            )}
          </>
        );

      case 'medium':
        return (
          <>
            {/* Medium quality sphere */}
            <Sphere args={[node.size, 16, 16]}>
              <animated.meshPhongMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={emissiveIntensity}
                opacity={opacity}
                transparent
              />
            </Sphere>
            
            {/* Icon only when close */}
            {(isSelected || isHovered) && (
              <Billboard position={[0, node.size + 0.5, 0]}>
                <Text
                  fontSize={0.8}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                >
                  {node.icon}
                </Text>
              </Billboard>
            )}
          </>
        );

      case 'low':
        return (
          // Low quality box
          <Box args={[node.size, node.size, node.size]}>
            <animated.meshBasicMaterial
              color={nodeColor}
              opacity={opacity}
              transparent
            />
          </Box>
        );
    }
  };

  return (
    <animated.group
      ref={meshRef}
      position={node.position}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {renderNode()}
      
      {/* Outer glow for selected nodes */}
      {isSelected && lodLevel !== 'low' && (
        <Sphere args={[node.size * 1.2, 16, 16]}>
          <meshBasicMaterial
            color={nodeColor}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </Sphere>
      )}
    </animated.group>
  );
}
'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Billboard, Sphere, Box, Octahedron, Torus, Cone } from '@react-three/drei';
import { DemoNode as DemoNodeType } from '../types';
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';
import { InstancedParticles } from './InstancedParticles';

interface DemoNodeProps {
  node: DemoNodeType;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  loadDelay?: number;
}

export function DemoNode({ node, isSelected, isHovered, onHover, onClick, loadDelay = 0 }: DemoNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [distanceToCamera, setDistanceToCamera] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), loadDelay);
    return () => clearTimeout(timer);
  }, [loadDelay]);

  // Animation springs
  const { scale, intensity, rotation, loadScale, loadOpacity } = useSpring({
    scale: isHovered ? 1.2 : isSelected ? 1.1 : 1,
    intensity: isHovered ? 2 : isSelected ? 1.5 : 1,
    rotation: isSelected ? Math.PI * 2 : 0,
    loadScale: isLoaded ? 1 : 0,
    loadOpacity: isLoaded ? 1 : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Geometry based on category
  const geometry = useMemo(() => {
    switch (node.category) {
      case 'ai':
        return <Octahedron args={[node.size, 0]} />;
      case 'vision':
        return <Box args={[node.size, node.size, node.size]} />;
      case 'analysis':
        return <Cone args={[node.size * 0.8, node.size * 1.5, 6]} />;
      case 'generation':
        return <Torus args={[node.size * 0.8, node.size * 0.3, 16, 100]} />;
      case 'agent':
        return <Sphere args={[node.size, 32, 32]} />;
      default:
        return <Sphere args={[node.size, 32, 32]} />;
    }
  }, [node]);

  // Custom shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(node.color) },
        uIntensity: { value: 1 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 light = normalize(vec3(1.0, 1.0, 1.0));
          float dProd = max(0.0, dot(vNormal, light));
          
          vec3 color = uColor * (dProd + 0.3);
          float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
          
          gl_FragColor = vec4(color * pulse * uIntensity, 1.0);
        }
      `,
      transparent: true
    });
  }, [node.color]);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;

    // Calculate distance to camera for LOD
    const distance = camera.position.distanceTo(groupRef.current.position);
    setDistanceToCamera(distance);

    // Update shader uniforms
    if (material.uniforms) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uIntensity.value = intensity.get();
    }

    // Idle rotation (reduce rotation speed for distant objects)
    if (!isSelected && distance < 30) {
      meshRef.current.rotation.x += 0.005 * (1 - distance / 30);
      meshRef.current.rotation.y += 0.01 * (1 - distance / 30);
    }

    // Floating animation (only for close objects)
    if (distance < 20) {
      meshRef.current.position.y = 
        node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1;
    }
  });

  return (
    <animated.group ref={groupRef} position={node.position} scale={loadScale} opacity={loadOpacity}>
      <animated.mesh
        ref={meshRef}
        scale={scale}
        rotation-y={rotation}
        onPointerOver={() => onHover(node.id)}
        onPointerOut={() => onHover(null)}
        onClick={() => onClick(node.id)}
        castShadow
        receiveShadow
      >
        {geometry}
        <primitive object={material} attach="material" />
      </animated.mesh>

      {/* Glow effect */}
      <mesh scale={[node.size * 2, node.size * 2, node.size * 2]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isHovered ? 0.3 : isSelected ? 0.2 : 0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Instanced Particles - only render for close objects */}
      {distanceToCamera < 15 && (
        <InstancedParticles
          count={Math.floor(node.size * 30)}
          color={node.color}
          size={0.02}
          radius={node.size}
        />
      )}

      {/* Label */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html
          position={[0, node.size + 1, 0]}
          center
          style={{
            transition: 'all 0.2s',
            opacity: isHovered || isSelected ? 1 : 0.7,
            transform: `scale(${isHovered ? 1.1 : 1})`
          }}
        >
          <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20">
            <div className="text-white text-sm font-semibold whitespace-nowrap">
              {node.icon} {node.name}
            </div>
            {isHovered && (
              <div className="text-gray-300 text-xs mt-1 max-w-[200px]">
                {node.description}
              </div>
            )}
          </div>
        </Html>
      </Billboard>

      {/* Status indicator - only render for close objects */}
      {distanceToCamera < 20 && (
        <mesh position={[node.size * 0.8, node.size * 0.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial
            color={
              node.status === 'active' ? '#00FF00' :
              node.status === 'beta' ? '#FFD700' : '#FF0000'
            }
          />
        </mesh>
      )}
    </animated.group>
  );
}
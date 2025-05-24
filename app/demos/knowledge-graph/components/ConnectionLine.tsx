'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3, BufferGeometry } from 'three';
import { Connection } from '../types';
import { connectionColors } from '../utils/demoData';

interface ConnectionLineProps {
  connection: Connection;
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
  isHighlighted: boolean;
}

export function ConnectionLine({ 
  connection, 
  sourcePos, 
  targetPos, 
  isHighlighted 
}: ConnectionLineProps) {
  const lineRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Create curved path
  const curve = useMemo(() => {
    const start = new Vector3(...sourcePos);
    const end = new Vector3(...targetPos);
    const middle = start.clone().add(end).divideScalar(2);
    middle.y += 2; // Arc height

    return new CatmullRomCurve3([start, middle, end], false, 'chordal');
  }, [sourcePos, targetPos]);

  // Create tube geometry for the connection
  const tubeGeometry = useMemo(() => {
    const points = curve.getPoints(50);
    const geometry = new BufferGeometry().setFromPoints(points);
    return geometry;
  }, [curve]);

  // Create particles along the path
  const particles = useMemo(() => {
    const count = 20;
    const positions = new Float32Array(count * 3);
    const times = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      times[i] = Math.random();
    }

    return { positions, times, count };
  }, []);

  // Animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Animate particles along the path
    if (particlesRef.current && particles) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particles.count; i++) {
        const t = (particles.times[i] + time * 0.1 * connection.strength) % 1;
        const point = curve.getPoint(connection.bidirectional ? t : Math.min(t * 2, 1));
        
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Pulse effect when highlighted
    if (lineRef.current && isHighlighted) {
      const material = lineRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(time * 3) * 0.2;
    }
  });

  const lineColor = connectionColors[connection.type] || '#FFFFFF';
  const lineWidth = connection.strength * 0.05;

  return (
    <group>
      {/* Main connection line */}
      <line ref={lineRef}>
        <bufferGeometry attach="geometry" {...tubeGeometry} />
        <lineBasicMaterial
          color={lineColor}
          transparent
          opacity={isHighlighted ? 0.8 : 0.3}
          linewidth={lineWidth}
        />
      </line>

      {/* Particle flow */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.count}
            array={particles.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color={lineColor}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Bidirectional indicator */}
      {connection.bidirectional && (
        <>
          <mesh position={sourcePos}>
            <coneGeometry args={[0.1, 0.2, 4]} />
            <meshBasicMaterial color={lineColor} />
          </mesh>
          <mesh position={targetPos} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.1, 0.2, 4]} />
            <meshBasicMaterial color={lineColor} />
          </mesh>
        </>
      )}
    </group>
  );
}
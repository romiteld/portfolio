'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InstancedParticlesProps {
  count: number;
  color: string;
  size: number;
  radius: number;
}

export function InstancedParticles({ count, color, size, radius }: InstancedParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesData = useRef<{ velocity: THREE.Vector3; offset: number }[]>([]);

  // Create particle positions and velocities
  const particles = useMemo(() => {
    const tempObject = new THREE.Object3D();
    const data: { velocity: THREE.Vector3; offset: number }[] = [];

    for (let i = 0; i < count; i++) {
      // Random position on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = radius + Math.random() * 0.5;

      tempObject.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      tempObject.scale.setScalar(Math.random() * 0.5 + 0.5);
      tempObject.updateMatrix();

      // Store velocity and offset for animation
      data.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        offset: Math.random() * Math.PI * 2
      });
    }

    particlesData.current = data;
    return tempObject;
  }, [count, radius]);

  // Create instanced mesh geometry and material
  const geometry = useMemo(() => new THREE.SphereGeometry(size, 8, 8), [size]);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
  }), [color]);

  // Initialize instance matrices
  useMemo(() => {
    if (meshRef.current) {
      const tempObject = new THREE.Object3D();
      
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = radius + Math.random() * 0.5;

        tempObject.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        
        tempObject.scale.setScalar(Math.random() * 0.5 + 0.5);
        tempObject.updateMatrix();
        
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, radius]);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return;

    const tempObject = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, tempObject.matrix);
      tempObject.matrix.decompose(
        tempObject.position,
        tempObject.quaternion,
        tempObject.scale
      );

      // Floating animation
      const data = particlesData.current[i];
      tempObject.position.x += data.velocity.x;
      tempObject.position.y += data.velocity.y + Math.sin(time + data.offset) * 0.001;
      tempObject.position.z += data.velocity.z;

      // Keep particles within bounds
      const distance = tempObject.position.length();
      if (distance > radius * 2 || distance < radius * 0.5) {
        data.velocity.multiplyScalar(-1);
      }

      // Pulse effect
      const scale = 0.5 + Math.sin(time * 2 + data.offset) * 0.1;
      tempObject.scale.setScalar(scale);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
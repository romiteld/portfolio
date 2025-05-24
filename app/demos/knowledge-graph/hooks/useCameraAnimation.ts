import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Spherical, MathUtils } from 'three';

interface CameraAnimationOptions {
  target?: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export function useCameraAnimation() {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const startPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());
  const startLookAt = useRef(new Vector3());
  const animationProgress = useRef(0);
  const isAnimating = useRef(false);
  const duration = useRef(1000);
  const onCompleteCallback = useRef<(() => void) | null>(null);

  // Smooth camera focus on node
  const focusOnNode = (nodePosition: [number, number, number], options: CameraAnimationOptions = {}) => {
    const nodeVec = new Vector3(...nodePosition);
    const distance = 8; // Optimal viewing distance
    
    // Calculate camera position using spherical coordinates
    const spherical = new Spherical(
      distance,
      Math.PI / 4, // Elevation angle (45 degrees)
      Math.atan2(nodeVec.x, nodeVec.z) + Math.PI / 6 // Azimuth with slight offset
    );
    
    const newCameraPosition = new Vector3().setFromSpherical(spherical).add(nodeVec);

    // Start animation
    startPosition.current.copy(camera.position);
    targetPosition.current.copy(newCameraPosition);
    startLookAt.current.copy(camera.position).add(camera.getWorldDirection(new Vector3()));
    targetLookAt.current.copy(nodeVec);
    
    animationProgress.current = 0;
    isAnimating.current = true;
    duration.current = options.duration || 1500;
    onCompleteCallback.current = options.onComplete || null;
  };

  // Orbit around all nodes
  const orbitAroundGraph = (center: Vector3 = new Vector3(0, 0, 0), radius: number = 15) => {
    const startAngle = Math.atan2(
      camera.position.x - center.x,
      camera.position.z - center.z
    );

    // Animate camera in a circle
    const animate = (time: number) => {
      const angle = startAngle + time * 0.0005;
      const x = center.x + Math.sin(angle) * radius;
      const z = center.z + Math.cos(angle) * radius;
      const y = center.y + 8; // Keep consistent height

      camera.position.set(x, y, z);
      camera.lookAt(center);
    };

    return animate;
  };

  // Smooth zoom
  const smoothZoom = (zoomFactor: number, duration: number = 500) => {
    const startFov = camera.fov;
    const targetFov = MathUtils.clamp(startFov / zoomFactor, 20, 100);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      
      camera.fov = MathUtils.lerp(startFov, targetFov, eased);
      camera.updateProjectionMatrix();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  // Reset camera to default position
  const resetCamera = (duration: number = 1000) => {
    const defaultPosition = new Vector3(10, 10, 10);
    const defaultLookAt = new Vector3(0, 0, 0);

    startPosition.current.copy(camera.position);
    targetPosition.current.copy(defaultPosition);
    startLookAt.current.copy(camera.position).add(camera.getWorldDirection(new Vector3()));
    targetLookAt.current.copy(defaultLookAt);
    
    animationProgress.current = 0;
    isAnimating.current = true;
    duration.current = duration;
    onCompleteCallback.current = null;
  };

  // Camera shake effect
  const shake = (intensity: number = 0.1, duration: number = 300) => {
    const originalPosition = camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const shakeIntensity = intensity * (1 - progress);
        camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
        camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
        camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
        
        requestAnimationFrame(animate);
      } else {
        camera.position.copy(originalPosition);
      }
    };

    animate();
  };

  // Cinematic camera path
  const followPath = (waypoints: Vector3[], lookAtPoints: Vector3[], totalDuration: number = 5000) => {
    if (waypoints.length < 2) return;

    const segmentDuration = totalDuration / (waypoints.length - 1);
    let currentSegment = 0;
    let segmentProgress = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const totalProgress = elapsed / totalDuration;

      if (totalProgress >= 1 || currentSegment >= waypoints.length - 1) {
        camera.position.copy(waypoints[waypoints.length - 1]);
        camera.lookAt(lookAtPoints[lookAtPoints.length - 1]);
        return;
      }

      // Calculate current segment and progress
      currentSegment = Math.floor(totalProgress * (waypoints.length - 1));
      segmentProgress = (totalProgress * (waypoints.length - 1)) % 1;

      // Interpolate position and look-at
      const from = waypoints[currentSegment];
      const to = waypoints[currentSegment + 1];
      const lookFrom = lookAtPoints[currentSegment];
      const lookTo = lookAtPoints[currentSegment + 1];

      const eased = easeInOutCubic(segmentProgress);
      camera.position.lerpVectors(from, to, eased);
      
      const lookAt = new Vector3().lerpVectors(lookFrom, lookTo, eased);
      camera.lookAt(lookAt);

      requestAnimationFrame(animate);
    };

    animate();
  };

  // Animation frame update
  useFrame((state, delta) => {
    if (!isAnimating.current) return;

    animationProgress.current += delta * 1000 / duration.current;
    
    if (animationProgress.current >= 1) {
      animationProgress.current = 1;
      isAnimating.current = false;
      
      if (onCompleteCallback.current) {
        onCompleteCallback.current();
        onCompleteCallback.current = null;
      }
    }

    const eased = easeInOutCubic(animationProgress.current);
    
    // Interpolate camera position
    camera.position.lerpVectors(
      startPosition.current,
      targetPosition.current,
      eased
    );

    // Interpolate look-at target
    const currentLookAt = new Vector3().lerpVectors(
      startLookAt.current,
      targetLookAt.current,
      eased
    );
    
    camera.lookAt(currentLookAt);
  });

  return {
    focusOnNode,
    orbitAroundGraph,
    smoothZoom,
    resetCamera,
    shake,
    followPath,
    isAnimating: isAnimating.current
  };
}

// Easing function
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
import * as THREE from 'three';

// Optimized vertex shader with LOD support
export const nodeVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistance;
  
  uniform float uTime;
  uniform float uHover;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Calculate distance to camera for LOD
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDistance = -mvPosition.z;
    
    // Simple floating animation
    vec3 pos = position;
    pos.y += sin(uTime * 2.0 + position.x * 0.5) * 0.05 * (1.0 - smoothstep(10.0, 30.0, vDistance));
    
    // Hover scale
    pos *= 1.0 + uHover * 0.1;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Optimized fragment shader with distance-based quality
export const nodeFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uSelected;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistance;
  
  // Simple noise function for performance
  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    // Basic lighting
    vec3 light = normalize(vec3(0.5, 1.0, 0.5));
    float dProd = max(0.0, dot(vNormal, light));
    
    // Distance-based quality reduction
    float lodFactor = smoothstep(30.0, 10.0, vDistance);
    
    // Base color with lighting
    vec3 color = uColor * (dProd + 0.4);
    
    // Pulse effect (only for close objects)
    if (lodFactor > 0.5) {
      float pulse = sin(uTime * 3.0) * 0.1 + 0.9;
      color *= pulse * uIntensity;
    }
    
    // Edge glow (simplified for performance)
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    color += uColor * fresnel * 0.3 * lodFactor;
    
    // Selection highlight
    if (uSelected > 0.5) {
      color += vec3(0.2, 0.3, 0.5) * fresnel;
    }
    
    // Output with alpha
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Simplified shader for distant objects
export const simplifiedVertexShader = `
  varying vec3 vNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const simplifiedFragmentShader = `
  uniform vec3 uColor;
  varying vec3 vNormal;
  
  void main() {
    vec3 light = normalize(vec3(0.5, 1.0, 0.5));
    float dProd = max(0.0, dot(vNormal, light));
    vec3 color = uColor * (dProd + 0.4);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Create optimized material with LOD support
export function createOptimizedNodeMaterial(
  color: string,
  isSimplified: boolean = false
): THREE.ShaderMaterial {
  if (isSimplified) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) }
      },
      vertexShader: simplifiedVertexShader,
      fragmentShader: simplifiedFragmentShader,
      side: THREE.FrontSide
    });
  }

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 1 },
      uHover: { value: 0 },
      uSelected: { value: 0 }
    },
    vertexShader: nodeVertexShader,
    fragmentShader: nodeFragmentShader,
    side: THREE.FrontSide
  });
}

// Particle shader for optimized rendering
export const particleVertexShader = `
  attribute float aOffset;
  attribute float aSpeed;
  
  uniform float uTime;
  uniform float uRadius;
  
  varying float vAlpha;
  
  void main() {
    float progress = fract(uTime * aSpeed + aOffset);
    
    // Circular motion
    float angle = progress * 6.28318;
    vec3 pos = position;
    pos.x = cos(angle) * uRadius * (0.8 + progress * 0.4);
    pos.z = sin(angle) * uRadius * (0.8 + progress * 0.4);
    pos.y += sin(progress * 3.14159) * 0.5;
    
    // Fade in and out
    vAlpha = sin(progress * 3.14159);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (1.0 / -mvPosition.z) * 100.0 * (0.5 + vAlpha * 0.5);
  }
`;

export const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft edges
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;
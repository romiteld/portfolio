import * as THREE from 'three';

// Icon sprite positions in the atlas
export const iconAtlasMap = {
  financial: { x: 0, y: 0, size: 128 },
  vision: { x: 128, y: 0, size: 128 },
  ai: { x: 256, y: 0, size: 128 },
  generation: { x: 384, y: 0, size: 128 },
  agent: { x: 0, y: 128, size: 128 },
  tools: { x: 128, y: 128, size: 128 },
  analysis: { x: 256, y: 128, size: 128 },
  default: { x: 384, y: 128, size: 128 }
};

// Generate texture atlas with icons
export async function generateTextureAtlas(): Promise<THREE.Texture> {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw icons for each category
  const icons = {
    financial: '📈',
    vision: '👁️',
    ai: '🤖',
    generation: '🎨',
    agent: '💼',
    tools: '🔧',
    analysis: '📊',
    default: '💡'
  };

  // Set up text rendering
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw each icon
  Object.entries(icons).forEach(([key, icon]) => {
    const pos = iconAtlasMap[key as keyof typeof iconAtlasMap];
    
    // Draw background circle
    ctx.fillStyle = getCategoryColor(key);
    ctx.beginPath();
    ctx.arc(pos.x + pos.size / 2, pos.y + pos.size / 2, pos.size / 2 - 10, 0, Math.PI * 2);
    ctx.fill();

    // Draw icon
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(icon, pos.x + pos.size / 2, pos.y + pos.size / 2);
  });

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return texture;
}

// Get UV coordinates for a specific icon
export function getIconUV(category: string): { offset: THREE.Vector2; repeat: THREE.Vector2 } {
  const map = iconAtlasMap[category as keyof typeof iconAtlasMap] || iconAtlasMap.default;
  
  return {
    offset: new THREE.Vector2(map.x / 512, map.y / 256),
    repeat: new THREE.Vector2(map.size / 512, map.size / 256)
  };
}

// Category color mapping
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    financial: '#00D9FF',
    vision: '#FF00FF',
    ai: '#FFD700',
    generation: '#FF6B6B',
    agent: '#4ECDC4',
    tools: '#FF0000',
    analysis: '#6C5CE7',
    default: '#888888'
  };
  
  return colors[category] || colors.default;
}

// Create sprite material with atlas
export function createSpriteMaterial(
  atlas: THREE.Texture,
  category: string
): THREE.SpriteMaterial {
  const uv = getIconUV(category);
  
  const material = new THREE.SpriteMaterial({
    map: atlas,
    color: 0xffffff,
    fog: true,
    depthTest: true,
    depthWrite: false
  });

  // Set UV coordinates
  material.map!.offset.copy(uv.offset);
  material.map!.repeat.copy(uv.repeat);

  return material;
}

// Batch geometry for multiple sprites
export class SpriteBatch {
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private atlas: THREE.Texture;
  
  constructor(atlas: THREE.Texture, maxSprites: number = 100) {
    this.atlas = atlas;
    
    // Create instanced buffer geometry
    const positions = new Float32Array(maxSprites * 3);
    const uvOffsets = new Float32Array(maxSprites * 2);
    const scales = new Float32Array(maxSprites);
    const colors = new Float32Array(maxSprites * 3);
    
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.instanceCount = 0;
    
    // Base quad
    const quad = new THREE.PlaneGeometry(1, 1);
    this.geometry.attributes.position = quad.attributes.position;
    this.geometry.attributes.uv = quad.attributes.uv;
    this.geometry.index = quad.index;
    
    // Instance attributes
    this.geometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(positions, 3));
    this.geometry.setAttribute('instanceUV', new THREE.InstancedBufferAttribute(uvOffsets, 2));
    this.geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));
    this.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
    
    // Custom shader for batched sprites
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: atlas },
        fogColor: { value: new THREE.Color(0x000000) },
        fogNear: { value: 10 },
        fogFar: { value: 100 }
      },
      vertexShader: `
        attribute vec3 instancePosition;
        attribute vec2 instanceUV;
        attribute float instanceScale;
        attribute vec3 instanceColor;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vFogDepth;
        
        void main() {
          vUv = uv * 0.25 + instanceUV; // Atlas is 4x2
          vColor = instanceColor;
          
          vec3 transformed = position * instanceScale + instancePosition;
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          
          vFogDepth = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vFogDepth;
        
        void main() {
          vec4 texColor = texture2D(map, vUv);
          if (texColor.a < 0.5) discard;
          
          vec3 color = texColor.rgb * vColor;
          
          // Apply fog
          float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
          color = mix(color, fogColor, fogFactor);
          
          gl_FragColor = vec4(color, texColor.a);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }
  
  addSprite(position: THREE.Vector3, category: string, scale: number = 1, color: THREE.Color = new THREE.Color(1, 1, 1)) {
    const index = this.geometry.instanceCount;
    const uv = getIconUV(category);
    
    // Set instance data
    this.geometry.attributes.instancePosition.setXYZ(index, position.x, position.y, position.z);
    this.geometry.attributes.instanceUV.setXY(index, uv.offset.x, uv.offset.y);
    this.geometry.attributes.instanceScale.setX(index, scale);
    this.geometry.attributes.instanceColor.setXYZ(index, color.r, color.g, color.b);
    
    this.geometry.instanceCount++;
    this.geometry.attributes.instancePosition.needsUpdate = true;
    this.geometry.attributes.instanceUV.needsUpdate = true;
    this.geometry.attributes.instanceScale.needsUpdate = true;
    this.geometry.attributes.instanceColor.needsUpdate = true;
  }
  
  getMesh(): THREE.Mesh {
    return this.mesh;
  }
  
  clear() {
    this.geometry.instanceCount = 0;
  }
}
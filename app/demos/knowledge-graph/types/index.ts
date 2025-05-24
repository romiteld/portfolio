import { Vector3 } from 'three';

export interface DemoNode {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'vision' | 'analysis' | 'generation' | 'agent' | 'tools';
  position: [number, number, number];
  color: string;
  icon: string;
  size: number;
  techStack: string[];
  features: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'beta' | 'development';
  route?: string;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  type: 'data' | 'api' | 'model' | 'concept';
  strength: number;
  bidirectional: boolean;
  description: string;
}

export interface GraphState {
  selectedNode: string | null;
  hoveredNode: string | null;
  focusedNode: string | null;
  filter: {
    categories: string[];
    techStack: string[];
    searchTerm: string;
  };
  viewMode: 'default' | 'matrix' | 'timeline' | 'cluster';
}

export interface NodeAnimation {
  idle: {
    rotation: number;
    scale: number;
    intensity: number;
  };
  hover: {
    scale: number;
    glow: number;
  };
  selected: {
    scale: number;
    orbitRadius: number;
  };
}
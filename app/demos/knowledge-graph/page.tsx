import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const GraphScene = dynamic(
  () => import('./components/GraphScene').then(mod => ({ default: mod.GraphScene })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading Knowledge Graph...</div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: 'AI Portfolio Knowledge Graph | Interactive 3D Visualization',
  description: 'Explore the interconnected world of AI demos in this stunning 3D knowledge graph visualization. Discover relationships between financial analysis, computer vision, AI agents, and more.',
  keywords: ['AI', 'knowledge graph', '3D visualization', 'portfolio', 'interactive', 'Three.js', 'React Three Fiber'],
};

export default function KnowledgeGraphPage() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <GraphScene />
    </div>
  );
}
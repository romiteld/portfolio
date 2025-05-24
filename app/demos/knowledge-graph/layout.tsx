import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'AI Portfolio Knowledge Graph',
    template: '%s | Knowledge Graph'
  },
  description: 'Interactive 3D visualization showcasing AI demo connections and relationships',
  openGraph: {
    title: 'AI Portfolio Knowledge Graph',
    description: 'Explore the interconnected world of AI demos in 3D',
    type: 'website',
  },
};

export default function KnowledgeGraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="knowledge-graph-demo">
      {children}
    </div>
  );
}
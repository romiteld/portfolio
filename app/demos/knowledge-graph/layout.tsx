import { Metadata, Viewport } from 'next';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover'
};

export default function KnowledgeGraphLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="knowledge-graph-demo overflow-hidden touch-manipulation">
      <style jsx global>{`
        body {
          overflow: hidden;
          touch-action: none;
          -webkit-overflow-scrolling: touch;
        }
        .knowledge-graph-demo * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        .knowledge-graph-demo button,
        .knowledge-graph-demo input,
        .knowledge-graph-demo select {
          -webkit-user-select: auto;
          user-select: auto;
          touch-action: manipulation;
        }
      `}</style>
      {children}
    </div>
  );
}
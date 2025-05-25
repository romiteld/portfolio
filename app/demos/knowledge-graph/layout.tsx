import { Metadata, Viewport } from 'next';
import KnowledgeGraphLayoutClient from './layout-client';

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
    <KnowledgeGraphLayoutClient>
      {children}
    </KnowledgeGraphLayoutClient>
  );
}
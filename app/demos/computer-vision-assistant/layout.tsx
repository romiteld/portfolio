import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'CV Demo v4 – Hugging Face Pro',
    template: '%s | CV Demo v4'
  },
  description: 'Advanced computer vision playground powered by Hugging Face Pro endpoints with Vercel AI SDK integration.',
  keywords: [
    'computer vision',
    'AI',
    'machine learning', 
    'image analysis',
    'Hugging Face',
    'BLIP-2',
    'SAM 2.1',
    'LLaVA',
    'Grounding DINO',
    'SDXL-Turbo',
    'object detection',
    'image segmentation',
    'image captioning',
    'visual chat',
    'inpainting',
    'Vercel AI SDK',
    'Next.js',
    'TypeScript'
  ],
  authors: [{ name: 'Daniel Romitelli' }],
  openGraph: {
    title: 'CV Demo v4 – Hugging Face Pro',
    description: 'Advanced computer vision playground with 5 AI-powered vision tasks',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ComputerVisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="computer-vision-demo">
      {children}
    </div>
  );
}
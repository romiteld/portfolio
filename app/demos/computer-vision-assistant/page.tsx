import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from './components/ImageUploader';
import { VisionTabs } from './components/VisionTabs';

export const metadata: Metadata = {
  title: 'CV Demo v4 – Hugging Face Pro | AI Portfolio',
  description: 'Advanced computer vision playground powered by Hugging Face Pro endpoints with Vercel AI SDK integration.',
  keywords: ['computer vision', 'AI', 'machine learning', 'image analysis', 'Hugging Face', 'BLIP-2', 'SAM', 'LLaVA'],
};

export default function ComputerVisionAssistantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            CV Demo v4 – Hugging Face Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced computer vision playground powered by Hugging Face Pro endpoints with streaming support, 
            custom models, and Pro-tier rate limits.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Caption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">BLIP-2 with streaming</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Grounding DINO 1.5</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">SAM 2.1 + variants</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">LLaVA-1.6-34B</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Inpaint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">SDXL-Turbo Pro</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Computer Vision Playground
            </CardTitle>
            <CardDescription>
              Upload an image and explore different AI vision capabilities. Pro endpoints provide higher rate limits 
              and access to premium models.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VisionTabs />
          </CardContent>
        </Card>

        {/* Technical Details */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Technical Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Pro-Tier Benefits:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Higher rate limits</li>
                    <li>• Custom endpoint support</li>
                    <li>• Private model access</li>
                    <li>• Streaming responses</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Edge Runtime:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Fast cold starts</li>
                    <li>• Global deployment</li>
                    <li>• Vercel AI SDK integration</li>
                    <li>• TypeScript support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
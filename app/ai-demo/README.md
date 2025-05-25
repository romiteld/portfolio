# AI Vision Demo

A comprehensive computer vision AI demo showcasing multiple providers and capabilities.

## Features

### Multi-Provider Support
- **OpenAI GPT-4o**: Advanced reasoning and detailed image analysis
- **Google Gemini 2.0**: Multimodal understanding and context
- **Anthropic Claude 3.5**: Detailed explanations and insights

### Demo Modes
1. **Vision Analysis**: Detailed image understanding and description
2. **Object Detection**: Identify and locate objects in images
3. **Segmentation**: Interactive image segmentation with SAM
4. **AI Generation**: Create images from text prompts
5. **Inpainting**: Smart image editing and completion
6. **Compare Models**: Side-by-side comparison of all providers

### UI Features
- Stunning glassmorphism design
- Interactive particle background
- Smooth Framer Motion animations
- Real-time performance metrics
- Cost tracking and budget monitoring
- Mobile-responsive design

## Technical Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Animations**: Framer Motion
- **Charts**: Chart.js with react-chartjs-2
- **AI Services**: 
  - Vercel AI SDK
  - Replicate API for computer vision
  - Multiple LLM providers

## API Endpoints

- `/api/vision/analyze` - Multi-provider image analysis
- `/api/vision/detect` - Object detection using Replicate
- `/api/vision/segment` - Image segmentation
- `/api/vision/generate` - AI image generation
- `/api/vision/inpaint` - Smart image editing
- `/api/vision/chat` - Interactive vision chat

## Environment Variables

Required in `.env.local`:
```
OPENAI_API_KEY=
GEMINI_API_KEY=
REPLICATE_API_TOKEN=
```

## Usage

1. Navigate to `/ai-demo`
2. Upload an image or select a demo mode
3. Choose your preferred AI provider
4. Click "Run Analysis" to see results
5. Explore different features and compare providers

## Performance

- Edge runtime for optimal performance
- Streaming responses where supported
- Efficient image processing
- Real-time performance tracking
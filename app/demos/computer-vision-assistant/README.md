# CV Demo v4 – Hugging Face Pro

Advanced Next.js 13 computer vision playground that integrates with Hugging Face Pro endpoints using the Vercel AI SDK. Features 5 core vision tasks with streaming support, custom endpoints, and Pro-tier rate limits.

## 🎯 Features

### Vision Tasks
- **Caption** - Image captioning with BLIP-2 (streaming support)
- **Detect** - Object detection with Grounding DINO 1.5
- **Segment** - Image segmentation with SAM 2.1 + variants (HQ-SAM, FastSAM)
- **Chat** - Visual conversation with LLaVA-1.6-34B (streaming support)
- **Inpaint** - Image inpainting with SDXL-Turbo (Pro-only feature)

### Technical Highlights
- **Edge Runtime** - All API routes use Edge Runtime for global deployment
- **Streaming Responses** - Real-time text generation for caption and chat
- **Custom Endpoints** - Support for private HF deployments via environment variables
- **Pro API Features** - Higher rate limits, private models, X-Wait-For-Model header
- **Interactive UI** - Canvas-based drawing, overlays, real-time results
- **TypeScript** - Full type safety with proper model response types

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Hugging Face Pro account with API token
- Next.js 13+ project with App Router

### Installation

1. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

2. **Configure your HF Pro API key:**
```env
HUGGING_FACE_API_KEY=hf_xxx # From https://huggingface.co/settings/tokens
```

3. **Install dependencies:**
```bash
npm install @vercel/ai lucide-react
```

4. **Start development server:**
```bash
npm run dev
```

5. **Visit the demo:**
Navigate to `/demos/computer-vision-assistant`

## 📁 Project Structure

```
app/demos/computer-vision-assistant/
├── components/
│   ├── ImageUploader.tsx      # Drag-and-drop image upload
│   ├── VisionTabs.tsx         # Main UI with 5 vision tasks
│   ├── DetectionOverlay.tsx   # Bounding box overlays
│   ├── SegmentationOverlay.tsx # Segmentation mask overlays
│   ├── InpaintBrush.tsx       # Canvas drawing for masks
│   └── Loader.tsx             # Loading states
├── hooks/
│   └── useImage.ts            # Image management hook
├── page.tsx                   # Main demo page
├── layout.tsx                 # Demo layout
└── README.md                  # This file

app/api/
├── caption/route.ts           # BLIP-2 image captioning
├── detect/route.ts            # Grounding DINO object detection
├── segment/route.ts           # SAM 2.1 segmentation
├── chat/route.ts              # LLaVA visual chat
└── inpaint/route.ts           # SDXL-Turbo inpainting

lib/
└── hf.ts                      # Hugging Face Pro integration
```

## 🤖 Models & Endpoints

### Caption Task
- **Model**: `Salesforce/blip2-flan-t5-xl`
- **Features**: Streaming text generation, customizable temperature
- **Input**: Base64 image
- **Output**: Streaming text description

### Detection Task  
- **Model**: `IDEA-Research/grounding-dino-1.5`
- **Features**: Text-guided object detection, confidence thresholds
- **Input**: Image + text prompt
- **Output**: Bounding boxes with labels and scores

### Segmentation Task
- **Models**: 
  - `facebook/sam2.1-hiera-large` (default)
  - `facebook/sam-hq` (high quality)
  - `CIDAS/clipseg-rd64-refined` (FastSAM)
- **Features**: Interactive segmentation, multiple modes
- **Input**: Image + points/boxes (optional)
- **Output**: Segmentation masks

### Chat Task
- **Model**: `llava-hf/llava-1.6-34b-hf`
- **Features**: Visual conversation, streaming responses, context history
- **Input**: Image + conversation history
- **Output**: Streaming text responses

### Inpaint Task
- **Model**: `stabilityai/sdxl-turbo`
- **Features**: High-quality inpainting, canvas-based mask drawing
- **Input**: Image + mask + prompt
- **Output**: Inpainted image

## ⚙️ Configuration

### Environment Variables

```env
# Required
HUGGING_FACE_API_KEY=hf_xxx

# Optional: Custom endpoints for Pro users
HF_ENDPOINT_CAPTION=https://your-endpoint.com/models/Salesforce/blip2-flan-t5-xl
HF_ENDPOINT_DETECT=https://your-endpoint.com/models/IDEA-Research/grounding-dino-1.5
HF_ENDPOINT_SEGMENT=https://your-endpoint.com/models/facebook/sam2.1-hiera-large
HF_ENDPOINT_CHAT=https://your-endpoint.com/models/llava-hf/llava-1.6-34b-hf
HF_ENDPOINT_INPAINT=https://your-endpoint.com/models/stabilityai/sdxl-turbo
```

### Custom Endpoints
Pro users can deploy models to custom endpoints and configure them via environment variables. The system automatically detects custom endpoints and uses appropriate headers.

## 🔧 API Usage

### Caption API
```typescript
const response = await fetch('/api/caption', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64Image,
    stream: true,
    temperature: 0.7
  })
});
```

### Detection API
```typescript
const response = await fetch('/api/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64Image,
    query: "detect all objects",
    threshold: 0.3
  })
});
```

### Segmentation API
```typescript
const response = await fetch('/api/segment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64Image,
    mode: "sam2.1", // "sam2.1" | "hq" | "fast"
    points: [[100, 200]], // Optional
    boxes: [[50, 50, 150, 150]] // Optional
  })
});
```

## 🎨 UI Components

### ImageUploader
Drag-and-drop file upload with validation and preview:
```tsx
<ImageUploader
  onImageLoad={(file, dataUrl) => setImage(dataUrl)}
  className="mb-4"
/>
```

### VisionTabs
Main interface with tabbed vision tasks:
```tsx
<VisionTabs />
```

### DetectionOverlay
Display bounding boxes over detected objects:
```tsx
<DetectionOverlay
  imageUrl={imageUrl}
  results={detectionResults}
  className="rounded-lg"
/>
```

### SegmentationOverlay
Render segmentation masks with opacity control:
```tsx
<SegmentationOverlay
  imageUrl={imageUrl}
  results={segmentationResults}
  opacity={0.6}
/>
```

### InpaintBrush
Canvas-based mask drawing for inpainting:
```tsx
<InpaintBrush
  imageUrl={imageUrl}
  onMaskChange={(maskDataUrl) => setMask(maskDataUrl)}
/>
```

## 🔒 Security & Rate Limits

### Pro Benefits
- **Higher Rate Limits**: 1000 requests/day vs 100 for free tier
- **Private Models**: Access to gated/private Hugging Face models
- **Custom Endpoints**: Deploy to your own infrastructure
- **Priority Processing**: Reduced wait times during peak usage

### Headers
All requests include:
- `Authorization: Bearer ${HUGGING_FACE_API_KEY}`
- `X-Wait-For-Model: true` (for cold start handling)
- `Content-Type: application/json`

## 📱 Responsive Design

The interface adapts to different screen sizes:
- **Desktop**: Full-width layout with side-by-side panels
- **Tablet**: Stacked layout with optimized controls
- **Mobile**: Single-column layout with touch-friendly interactions

## 🧪 Testing

Create test scripts to validate functionality:

```bash
# Test all vision tasks
npm run test:cv

# Test specific task
npm run test:caption
npm run test:detect
npm run test:segment
npm run test:chat
npm run test:inpaint
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Custom Deployment
Ensure your deployment platform supports:
- Edge Runtime
- Environment variables
- File upload limits (10MB+)

## 🐛 Troubleshooting

### Common Issues

**Model Loading Errors**
- Check API key validity
- Verify model availability
- Use X-Wait-For-Model header

**Image Upload Failures**
- Ensure image size < 10MB
- Check base64 encoding
- Validate image format (JPG, PNG, WebP)

**Streaming Issues**
- Verify Edge Runtime compatibility
- Check network connectivity
- Monitor response headers

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
DEBUG=cv-demo:*
```

## 📄 License

This project is part of the AI Portfolio and follows the same licensing terms.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check the troubleshooting section
- Review Hugging Face Pro documentation
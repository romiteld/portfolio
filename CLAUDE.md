# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Photo Management Scripts
```bash
# Upload woodworking photos to Supabase
npm run upload-photos

# Cleanup duplicate photos
npm run cleanup-photos

# Convert photos to WebP format
npm run convert-photos

# Convert photos to JPEG format
npm run convert-to-jpeg

# Enhance photos (AI-powered)
npm run enhance-photos

# Schedule content updates
npm run schedule-updates
```

## Architecture Overview

### Next.js 15 App Router Structure
This portfolio uses Next.js 15's app directory structure with:
- Server and client component separation (`layout.tsx` + `layout-client.tsx`)
- Route-based API endpoints in `app/api/`
- Dynamic routes for demo pages

### Key Architectural Patterns

1. **API Organization**: APIs are grouped by feature:
   - `/api/chess-ai/` - Chess AI with move generation and diagnostics
   - `/api/financial-assistant/` - Financial data queries and real-time updates
   - `/api/market/` - Market data with chat, historical data, and indices
   - Integration APIs for YouTube, voice assistant, sales agent, etc.

2. **Rate Limiting**: Middleware enforces:
   - 60 requests/minute for general API routes
   - 30 requests/minute for market data APIs
   - In-memory storage (production should use Redis)

3. **AI Integration Stack**:
   - OpenAI API for language models
   - Google Gemini for computer vision and voice
   - LangChain for RAG and agent orchestration
   - Supabase with pgvector for vector storage and data persistence
   - ONNX Runtime for client-side neural networks

4. **Component Architecture**:
   - Shared UI components based on shadcn/ui in `/components/ui/`
   - Feature components organized by demo in `/app/demos/[demo]/components/`
   - Global components for navigation, chat widget, and animations
   - Extensive use of Framer Motion and GSAP for animations

5. **3D Visualization**:
   - Three.js with React Three Fiber for 3D scenes
   - Used in Chess AI demo and financial visualization
   - Custom 3D components for interactive experiences

### Environment Configuration

Required environment variables in `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
OPENAI_API_KEY=
GEMINI_API_KEY=
FIRECRAWL_API_KEY= (optional)

# Email
SENDGRID_API_KEY=
EMAIL_FROM=
EMAIL_TO=

# Market Data (optional)
ALPHA_VANTAGE_API_KEY=
```

### Demo Pages

The portfolio showcases 10 AI demos:
- Chess AI Magnus - Neural network chess with 3D board
- Financial Assistant - Real-time market analysis
- Computer Vision Assistant - Image analysis with voice
- Enhanced RAG with LangChain - Document Q&A using Supabase pgvector
- AI Sales Agent - Company research assistant
- Data Analyst Assistant - CSV/Excel analysis
- Interactive AI Agents - Multi-agent collaboration
- YouTube Summarizer - Video content analysis
- Generative AI Demo - Content generation
- 3D Gallery - Interactive woodworking showcase

Each demo has dedicated components, custom layouts, and specific API integrations.

### Vector Storage with Supabase

The Enhanced RAG demo uses Supabase with pgvector extension for vector similarity search:
- Vector embeddings stored in `embeddings` table
- Documents stored in `documents` table
- OpenAI text-embedding-ada-002 for generating embeddings
- Cosine similarity search with ivfflat index
- Helper functions in `lib/supabaseVectorStorage.ts`

To set up vector storage:
1. Run the migration script: `lib/supabase-migrations/002_vector_storage.sql`
2. Ensure pgvector extension is enabled in your Supabase project
3. Use the provided API endpoints for document upload and search

### Important Patterns

1. **TypeScript Usage**: The codebase uses TypeScript throughout with some build errors ignored via `// @ts-ignore`

2. **State Management**: React hooks and context for local state, Supabase for persistence

3. **Styling**: Tailwind CSS with custom animations, theme support via next-themes

4. **Image Handling**: Next.js Image component with Supabase storage for photos

5. **Error Handling**: Try-catch blocks in API routes with proper error responses

6. **Security**: API keys in environment variables, rate limiting middleware, no committed secrets
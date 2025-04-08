# System Patterns

## Architecture Overview
The project follows a modern Next.js 14 architecture with:
- App Router for routing and layouts
- Server and Client Components
- API Routes for backend functionality
- Supabase for data storage
- SendGrid for email handling
- Vercel for deployment and analytics

## Design Patterns
1. Component Architecture:
   - Atomic design principles
   - Radix UI for base components
   - Custom hooks for reusable logic
   - Context providers for global state

2. Data Flow:
   - Server-side rendering where possible
   - Client-side interactivity where needed
   - API routes for backend operations
   - Form handling with React Hook Form

3. State Management:
   - React hooks for local state
   - Context API for global state
   - Server state with Next.js data fetching

## Component Relationships
1. Layout Structure:
   ```
   RootLayout
   ├── LayoutClient
   │   ├── Header
   │   ├── Main Content
   │   └── Footer
   └── Analytics
   ```

2. Feature Organization:
   - Pages grouped by feature (woodworking, contact, about)
   - Shared components in app/components
   - Utilities in app/utils
   - API routes in app/api

## Technical Decisions
1. Framework Choices:
   - Next.js 14 for SSR and routing
   - TypeScript for type safety
   - Tailwind CSS for styling
   - Radix UI for accessible components

2. Performance Optimizations:
   - Image optimization with next/image
   - Font optimization
   - Code splitting
   - Cache strategies

3. Development Patterns:
   - ESLint for code quality
   - TypeScript for type checking
   - Component-driven development
   - Responsive design first

## Integration Points
1. External Services:
   - Supabase for data
   - SendGrid for email
   - Vercel Analytics
   - Three.js for 3D
   - Firecrawl API (Financial Assistant Chat via `/api/financial-assistant/firecrawl`)
   - Alpaca API (Market Data Ticker via `/api/market/data`)

2. Internal Systems:
   - Image processing pipeline
   - Form validation system
   - Admin authentication
   - API route handlers

## Demo Architecture
1. Core Demo Structure:
   ```
   demos/
   ├── [demo]/
   │   ├── page.tsx (Demo UI)
   │   ├── components/ (Demo-specific components)
   │   ├── hooks/ (Custom demo hooks)
   │   └── api/ (Demo backend endpoints)
   └── page.tsx (Demo gallery)
   ```

2. Demo Integration Patterns:
   - Lazy loading for performance
   - Isolated state management
   - Shared UI components
   - Error boundary protection
   - Analytics integration

3. Demo Data Flow:
   ```mermaid
   flowchart TD
     subgraph Financial Assistant Demo
       FA_UI[Financial Assistant UI]
       MarketTicker[Market Ticker UI]

       FA_UI -- Chat Query --> RateLimiter{Rate Limit Check (IP)}
       RateLimiter -- Allowed --> FA_Firecrawl_API[API Route: /api/financial-assistant/firecrawl]
       RateLimiter -- Denied --> FA_UI(429 Error)
       FA_Firecrawl_API -- Check Market Status --> MarketStatus[Market Status Check (Simulated/Alpaca)]
       MarketStatus -- Status --> FA_Firecrawl_API
       FA_Firecrawl_API -- Scrape Request --> Firecrawl[Firecrawl Scrape/Extract]
       Firecrawl -- Extracted Data --> FA_Firecrawl_API
       FA_Firecrawl_API -- Formatted Response (with Status) --> FA_UI

       MarketTicker -- Request Data --> FA_Alpaca_API[API Route: /api/market/data]
       FA_Alpaca_API -- Market Data Request --> Alpaca[Alpaca API]
       Alpaca -- Market Data --> FA_Alpaca_API
       FA_Alpaca_API -- Ticker Data --> MarketTicker
     end

     subgraph Other Demos
       UI[Demo UI] --> State[Local State]
       State --> API[API Layer]
       API --> External[External Services]
       External --> API
       API --> State
       State --> UI
     end
   ```

4. Common Demo Features:
   - Authentication handling
   - Error management
   - Loading states
   - Progress tracking
   - Result caching
   - Analytics events

5. Demo Security:
   - Rate limiting
   - Input validation
   - API key protection
   - User session management
   - Error sanitization

## Performance Patterns
1. Loading Strategies:
   - Route-based code splitting
   - Component lazy loading
   - Image lazy loading
   - Font optimization
   - Resource prioritization

2. Caching:
   - Static page caching
   - API response caching
   - Image caching
   - Font caching
   - State persistence

3. Optimization:
   - Bundle size analysis
   - Tree shaking
   - Dead code elimination
   - Resource minification
   - Compression

## Error Handling
1. Client-side:
   - React error boundaries
   - Form validation
   - Network error handling
   - State recovery
   - Retry mechanisms

2. Server-side:
   - API error handling
   - Database error management
   - Service unavailability
   - Rate limit handling
   - Validation errors

3. Monitoring:
   - Error tracking
   - Performance monitoring
   - User behavior analytics
   - API usage metrics
   - System health checks

## API Route Security
- **Authentication:** Admin routes protected (details TBD).
- **Input Validation:** Zod used for form validation, Next.js API routes validate inputs.
- **Rate Limiting:** IP-based rate limiting implemented using `@upstash/ratelimit` and Vercel KV on demo API endpoints (e.g., `/api/financial-assistant/firecrawl`). The `/api/financial-assistant/firecrawl` endpoint is limited to 3 requests per 60 seconds per IP. Limits for other demo APIs (e.g., `/api/market/data`) TBD.
- **Error Handling:** Sensitive error details are not exposed to the client; generic messages are returned while detailed errors are logged server-side.
- **API Key Management:** Keys (e.g., Firecrawl, SendGrid, Alpaca) are managed via environment variables (`.env.local`, Vercel environment settings).

## UI Patterns & Animations
- **Layout:** Primarily uses Tailwind CSS utility classes for layout (Flexbox, Grid).
- **Component Library:** Radix UI for accessible base components, styled with Tailwind.
- **Motion:** Framer Motion used for page transitions and hover/tap effects on interactive elements (buttons, cards).
- **Complex Animations:** GSAP with ScrollTrigger used for more intricate scroll-based animations, such as:
    - Demo page card animations: Initial staggered fade-in on load, followed by opacity changes based on scroll position (fading out near viewport edges, fully opaque in the center) using `scrub`. 
    - (Add other specific GSAP animations here as implemented)
- **Responsiveness:** Mobile-first approach using Tailwind's responsive modifiers. 
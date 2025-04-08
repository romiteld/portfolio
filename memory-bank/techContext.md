# Technical Context

## Technology Stack
1. Frontend:
   - Next.js 14.2.16
   - React 18.2.0
   - TypeScript 5.4.2
   - Tailwind CSS 3.4.17
   - Radix UI Components
   - Three.js 0.161.0
   - Framer Motion 11.0.14

2. Backend:
   - Next.js API Routes
   - Supabase
   - SendGrid Mail 8.1.4
   - Node.js
   - Firecrawl API (for Financial Assistant chat)
   - Alpaca API (for Market Data ticker)

3. Development:
   - ESLint
   - TypeScript
   - PostCSS
   - Sharp for image processing

4. Deployment:
   - Vercel
   - Vercel Analytics

## Development Setup
1. Environment Requirements:
   - Node.js
   - npm/yarn
   - TypeScript
   - Environment variables (.env.local)

2. Key Dependencies:
   ```json
   {
     "next": "14.2.16",
     "react": "18.2.0",
     "typescript": "5.4.2",
     "tailwindcss": "3.4.17",
     "@sendgrid/mail": "8.1.4",
     "@supabase/supabase-js": "2.49.1",
     "three": "0.161.0"
   }
   ```

3. Scripts:
   - `npm run dev`: Development server
   - `npm run build`: Production build
   - `npm run start`: Production server
   - Various image processing scripts

## Technical Constraints
1. Performance:
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3.5s
   - Optimized image loading
   - Code splitting

2. Browser Support:
   - Modern browsers
   - Progressive enhancement
   - Responsive design

3. Security:
   - Environment variables
   - API route protection
   - Form validation
   - Admin authentication

## Dependencies
1. Core Dependencies:
   - Next.js ecosystem
   - React ecosystem
   - TypeScript
   - Tailwind CSS

2. UI Components:
   - Radix UI
   - Framer Motion
   - Three.js

3. Backend Services:
   - Supabase
   - SendGrid
   - Vercel
   - Alpaca
   - Firecrawl

4. Development Tools:
   - ESLint
   - PostCSS
   - Sharp
   - TypeScript compiler 
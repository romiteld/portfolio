# Next.js Portfolio Development Guidelines

## Brief overview
This set of guidelines is specific to the Next.js portfolio project, outlining the architecture, code standards, and development patterns to follow when working on any aspect of this portfolio.

## Project structure
- Use the App Router structure with root layout in app/layout.tsx
- Place page components in app/[feature]/page.tsx
- Keep global components in app/components/
- Feature-specific components belong in app/[feature]/components/
- API routes should be placed in app/api/[feature]/route.ts
- Demo projects should be self-contained within app/demos/[demo-name]/
- Use the lib/ directory for utilities, types, and service clients

## Component architecture
- Default to server components when possible
- Move client-side interactivity to dedicated client components
- Use the shadcn/ui component library for UI elements
- Implement layout components in layout.tsx files
- Create custom hooks in hooks/ directory for reusable logic
- Utilize the components/ui/ directory for shared UI elements

## Naming conventions
- React components: PascalCase.tsx
- Utility functions: camelCase.ts
- Constant files: UPPER_CASE.ts
- Type definitions: PascalCase.types.ts
- API handler functions: verbNoun (e.g., fetchData, processImage)
- Hooks: useNoun (e.g., useMobile, useToast)
- CSS Modules: component-name.module.css

## Styling approach
- Use Tailwind CSS as the primary styling method
- Follow mobile-first responsive design
- Avoid duplicate/conflicting Tailwind responsive variants
- Use CSS modules for complex component-specific styles
- Prefer Tailwind's arbitrary value syntax (w-[85%]) over inline styles
- Remove redundant classes that are overridden at the same breakpoint
- Follow BEM naming convention for custom CSS classes

## TypeScript best practices
- Enable strict mode in TypeScript configuration
- Provide explicit return types for functions
- Prefer interfaces over types for object definitions
- Use proper type imports
- Create comprehensive type definitions in the types/ directory
- Use TypeScript generics for reusable components and functions

## API implementation
- Implement Next.js Route Handlers in app/api/[feature]/route.ts
- Include thorough input validation for all API endpoints
- Implement proper error handling with appropriate status codes
- Use rate limiting for public-facing endpoints
- Secure API routes with appropriate authentication when needed

## Demo standards
- Keep demos self-contained in their respective directories
- Include proper loading states and error boundaries
- Optimize assets and implement lazy loading
- Document demo functionality in a README.md within the demo folder
- Implement analytics events where appropriate

## Performance considerations
- Optimize images using next/image component
- Implement lazy loading for off-screen content
- Use proper caching strategies for API responses
- Minimize JavaScript bundle size
- Address all performance issues identified in known challenges list

## Known challenges
- Pay special attention to large image optimization
- Address demo loading times
- Manage proper font loading
- Avoid Tailwind class conflicts, especially with responsive variants
- Prevent unwanted auto-scrolling behaviors in interactive components
- Eliminate inline styles causing linting warnings

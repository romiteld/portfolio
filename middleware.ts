import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory store for rate limiting
// In production, use Redis or another persistent store
const ipRequestCounts: Record<string, { timestamp: number; count: number }> = {}

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute
const API_RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests per minute for API endpoints

export function middleware(request: NextRequest) {
  // Get client IP - in production with proper reverse proxy setup
  // this would come from X-Forwarded-For or similar header
  const ip = request.ip || 'unknown'
  
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Determine if this is a market data API call
  const isMarketApi = request.nextUrl.pathname.startsWith('/api/market/')
  const maxRequests = isMarketApi ? API_RATE_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS
  
  // Get current timestamp
  const now = Date.now()
  
  // Initialize or reset counter if it's a new window
  if (!ipRequestCounts[ip] || now - ipRequestCounts[ip].timestamp >= RATE_LIMIT_WINDOW) {
    ipRequestCounts[ip] = { timestamp: now, count: 1 }
    return NextResponse.next()
  }
  
  // If within the window, increment count
  ipRequestCounts[ip].count += 1
  
  // Check if rate limit exceeded
  if (ipRequestCounts[ip].count > maxRequests) {
    // Calculate remaining time in the current window
    const remainingMs = RATE_LIMIT_WINDOW - (now - ipRequestCounts[ip].timestamp)
    const remainingSecs = Math.ceil(remainingMs / 1000)
    
    console.log(`Rate limit exceeded for ${ip}: ${ipRequestCounts[ip].count}/${maxRequests} requests`)
    
    // Return rate limit response
    return new NextResponse(
      JSON.stringify({
        error: `Rate limit exceeded. Try again in ${remainingSecs} seconds.`,
        rateLimited: true,
        waitTime: remainingSecs
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Math.floor(now / 1000) + remainingSecs).toString(),
          'Retry-After': remainingSecs.toString()
        }
      }
    )
  }
  
  // Add rate limit headers to response
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', (maxRequests - ipRequestCounts[ip].count).toString())
  
  return response
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*'
} 
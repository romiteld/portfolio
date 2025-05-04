// Simple in-memory cache for API data
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class DataCache<T> {
  private cache: Record<string, CacheEntry<T>> = {};
  private readonly ttl: number; // Time-to-live in milliseconds

  constructor(ttlInSeconds: number = 60) {
    this.ttl = ttlInSeconds * 1000;
  }

  set(key: string, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  get(key: string): T | null {
    const entry = this.cache[key];
    if (!entry) return null;

    // Check if the cache entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      delete this.cache[key];
      return null;
    }

    return entry.data;
  }

  // Get remaining TTL in seconds
  getRemainingTtl(key: string): number {
    const entry = this.cache[key];
    if (!entry) return 0;

    const elapsedMs = Date.now() - entry.timestamp;
    const remainingMs = Math.max(0, this.ttl - elapsedMs);
    return Math.floor(remainingMs / 1000);
  }

  // Clear the entire cache
  clear(): void {
    this.cache = {};
  }
}

// Rate limiter for API calls
export class RateLimiter {
  private requests: Record<string, number[]> = {};
  private readonly limit: number;
  private readonly window: number; // Time window in milliseconds

  constructor(requestsPerMinute: number = 60) {
    this.limit = requestsPerMinute;
    this.window = 60 * 1000; // 1 minute in milliseconds
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    
    // Initialize if this is the first request for this key
    if (!this.requests[key]) {
      this.requests[key] = [];
    }

    // Filter out timestamps that are outside the window
    this.requests[key] = this.requests[key].filter(
      timestamp => now - timestamp < this.window
    );

    // Check if we're under the limit
    return this.requests[key].length < this.limit;
  }

  trackRequest(key: string): void {
    if (!this.requests[key]) {
      this.requests[key] = [];
    }
    this.requests[key].push(Date.now());
  }

  // Get remaining requests in the current window
  getRemainingRequests(key: string): number {
    if (!this.requests[key]) return this.limit;
    
    const now = Date.now();
    this.requests[key] = this.requests[key].filter(
      timestamp => now - timestamp < this.window
    );

    return Math.max(0, this.limit - this.requests[key].length);
  }

  // Check remaining time until next available request slot (in seconds)
  getTimeUntilNextSlot(key: string): number {
    if (!this.requests[key] || this.requests[key].length === 0) return 0;
    if (this.requests[key].length < this.limit) return 0;

    const now = Date.now();
    const earliestTimestamp = Math.min(...this.requests[key]);
    const timeUntilNextSlot = (earliestTimestamp + this.window) - now;
    
    return Math.ceil(Math.max(0, timeUntilNextSlot) / 1000);
  }
}

// Market data cache instance (cache for 30 seconds)
export const marketDataCache = new DataCache<any>(30);

// Rate limiter instances
export const yahooFinanceRateLimiter = new RateLimiter(10); // 10 requests per minute to Yahoo Finance
export const chatRateLimiter = new RateLimiter(30); // 30 chat requests per minute 
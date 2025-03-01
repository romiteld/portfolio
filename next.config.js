/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Add this new configuration for local images
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/photos/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        pathname: '/photos/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600, // 1 hour for local images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
    // Enable if using large number of images
    workerThreads: true,
    cpus: 4,
    // Add these settings to fix revalidation URL issues
    runtime: 'nodejs',
    disableOptimizedLoading: true,
    isrMemoryCacheSize: 0, // Disable ISR cache
  },
  // Add these configurations to fix the revalidation URL issue
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000'
  },
  // Add this to disable automatic static optimization for pages with getServerSideProps
  reactStrictMode: false,
  // Set this to false for better build performance during development
  swcMinify: true
}

module.exports = nextConfig 
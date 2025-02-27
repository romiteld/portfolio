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
    cpus: 4
  },
}

module.exports = nextConfig 
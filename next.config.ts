import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during build for now
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors during build for now
    ignoreBuildErrors: false,
  },

  // Enable experimental features for better performance and SEO
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'framer-motion', 'web-vitals'],
  },

  // Image optimization for better Core Web Vitals
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Compression for better performance
  compress: true,

  // Power optimizations
  poweredByHeader: false,

  // Redirect configuration for SEO
  async redirects() {
    return [
      // Old language-specific auth routes to new auth structure
      {
        source: '/vn/(login|register|forgot-password)',
        destination: '/auth/vn/$1',
        permanent: true,
      },
      {
        source: '/jp/(login|register|forgot-password)',
        destination: '/auth/jp/$1',
        permanent: true,
      },
      {
        source: '/en/(login|register|forgot-password)',
        destination: '/auth/en/$1',
        permanent: true,
      }
    ]
  },

  // Headers for International SEO and performance
  async headers() {
    return [
      // Global headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Vary',
            value: 'Accept-Language, Accept-Encoding'
          }
        ],
      },
      // Language-specific headers for Vietnamese content
      {
        source: '/auth/vn/:path*',
        headers: [
          {
            key: 'Content-Language',
            value: 'vi-VN'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'
          }
        ],
      },
      // Language-specific headers for Japanese content
      {
        source: '/auth/jp/:path*',
        headers: [
          {
            key: 'Content-Language',
            value: 'ja-JP'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'
          }
        ],
      },
      // Language-specific headers for English content
      {
        source: '/auth/en/:path*',
        headers: [
          {
            key: 'Content-Language',
            value: 'en-US'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'
          }
        ],
      },
      // Static assets caching
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/(.*).svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ]
  }
};

export default nextConfig;

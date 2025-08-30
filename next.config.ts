import type { NextConfig } from "next";

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ESLint configuration
  eslint: {
    // Do not fail production build on ESLint warnings
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors during build for now
    ignoreBuildErrors: false,
  },

  // Output configuration for better performance
  output: 'standalone',

  // Webpack configuration for better build performance
  webpack: (config, { dev, isServer }) => {
    // Optimize for production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module: any) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.nameForCondition() || '');
              },
              name(module: any) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.nameForCondition() || '');
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    // Ignore specific warnings that don't affect functionality
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ]

    return config
  },

  // Enable experimental features for better performance and SEO
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'framer-motion', 'web-vitals'],
    // Enable server components optimization
    optimizeServerReact: true,
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
      // More specific patterns to avoid $1 issues
      {
        source: '/vn/login',
        destination: '/auth/vn/login',
        permanent: true,
      },
      {
        source: '/vn/register',
        destination: '/auth/vn/register',
        permanent: true,
      },
      {
        source: '/vn/forgot-password',
        destination: '/auth/vn/forgot-password',
        permanent: true,
      },
      {
        source: '/jp/login',
        destination: '/auth/jp/login',
        permanent: true,
      },
      {
        source: '/jp/register',
        destination: '/auth/jp/register',
        permanent: true,
      },
      {
        source: '/jp/forgot-password',
        destination: '/auth/jp/forgot-password',
        permanent: true,
      },
      {
        source: '/en/login',
        destination: '/auth/en/login',
        permanent: true,
      },
      {
        source: '/en/register',
        destination: '/auth/en/register',
        permanent: true,
      },
      {
        source: '/en/forgot-password',
        destination: '/auth/en/forgot-password',
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
      // API routes caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400'
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

export default withBundleAnalyzer(nextConfig);

/**
 * Dynamic Sitemap Generation for JLPT4You
 * SEO-optimized sitemap with multilingual support
 */

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://jlpt4you.com'
  const currentDate = new Date()
  
  // Base routes
  const baseRoutes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    }
  ]

  // Auth routes for each language with alternates
  const authRoutes = [
    // Landing pages - High priority for SEO
    {
      url: `${baseUrl}/vn/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'vi-VN': `${baseUrl}/vn/landing`,
          'ja-JP': `${baseUrl}/jp/landing`,
          'en-US': `${baseUrl}/en/landing`,
          'x-default': `${baseUrl}/vn/landing`
        }
      }
    },
    {
      url: `${baseUrl}/jp/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'vi-VN': `${baseUrl}/vn/landing`,
          'ja-JP': `${baseUrl}/jp/landing`,
          'en-US': `${baseUrl}/en/landing`,
          'x-default': `${baseUrl}/vn/landing`
        }
      }
    },
    {
      url: `${baseUrl}/en/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'vi-VN': `${baseUrl}/vn/landing`,
          'ja-JP': `${baseUrl}/jp/landing`,
          'en-US': `${baseUrl}/en/landing`,
          'x-default': `${baseUrl}/vn/landing`
        }
      }
    },
    // Login pages
    {
      url: `${baseUrl}/auth/vn/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/jp/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/en/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Register pages
    {
      url: `${baseUrl}/auth/vn/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/jp/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/en/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  ]

  // Note: Protected routes (JLPT, Challenge, Driving, etc.) are removed from sitemap
  // as they require authentication and should not be indexed by search engines

  // Combine all public routes (only landing and auth routes for SEO)
  return [
    ...baseRoutes,
    ...authRoutes
  ]
}

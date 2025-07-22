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
      url: `${baseUrl}/auth/vn/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'vi-VN': `${baseUrl}/auth/vn/landing`,
          'ja-JP': `${baseUrl}/auth/jp/landing`,
          'en-US': `${baseUrl}/auth/en/landing`,
          'x-default': `${baseUrl}/auth/vn/landing`
        }
      }
    },
    {
      url: `${baseUrl}/auth/jp/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'vi-VN': `${baseUrl}/auth/vn/landing`,
          'ja-JP': `${baseUrl}/auth/jp/landing`,
          'en-US': `${baseUrl}/auth/en/landing`,
          'x-default': `${baseUrl}/auth/vn/landing`
        }
      }
    },
    {
      url: `${baseUrl}/auth/en/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          'vi-VN': `${baseUrl}/auth/vn/landing`,
          'ja-JP': `${baseUrl}/auth/jp/landing`,
          'en-US': `${baseUrl}/auth/en/landing`,
          'x-default': `${baseUrl}/auth/vn/landing`
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

  // JLPT practice routes
  const jlptLevels = ['n1', 'n2', 'n3', 'n4', 'n5']
  const jlptTypes = ['custom', 'official']
  
  const jlptRoutes = jlptLevels.flatMap(level => 
    jlptTypes.map(type => ({
      url: `${baseUrl}/jlpt/${type}/${level}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  // JLPT test setup routes
  const jlptTestSetupRoutes = jlptLevels.flatMap(level => 
    jlptTypes.map(type => ({
      url: `${baseUrl}/jlpt/${type}/${level}/test-setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )

  // Challenge routes
  const challengeRoutes = jlptLevels.map(level => ({
    url: `${baseUrl}/challenge/${level}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Driving test routes
  const drivingRoutes = [
    {
      url: `${baseUrl}/driving`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/driving/honmen`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/driving/karimen`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/driving/honmen/test-setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/driving/karimen/test-setup`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }
  ]

  // Utility routes
  const utilityRoutes = [
    {
      url: `${baseUrl}/exam-results`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/review-answers`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    }
  ]

  // Combine all routes
  return [
    ...baseRoutes,
    ...authRoutes,
    ...jlptRoutes,
    ...jlptTestSetupRoutes,
    ...challengeRoutes,
    ...drivingRoutes,
    ...utilityRoutes
  ]
}

/**
 * Robots.txt Configuration for JLPT4You
 * SEO-optimized crawler directives
 */

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jlpt4you.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/auth/vn/',
          '/auth/jp/',
          '/auth/en/',
          '/vn/landing',
          '/jp/landing',
          '/en/landing',
          '/sitemap.xml'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
          '/home',
          '/jlpt/',
          '/challenge/',
          '/driving/',
          '/study/',
          '/library/',
          '/exam-results',
          '/review-answers',
          '/settings'
        ],
        crawlDelay: 1
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/auth/vn/',
          '/auth/jp/',
          '/auth/en/',
          '/vn/landing',
          '/jp/landing',
          '/en/landing',
          '/sitemap.xml'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
          '/home',
          '/jlpt/',
          '/challenge/',
          '/driving/',
          '/study/',
          '/library/',
          '/exam-results',
          '/review-answers',
          '/settings'
        ]
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/auth/vn/',
          '/auth/jp/',
          '/auth/en/',
          '/vn/landing',
          '/jp/landing',
          '/en/landing',
          '/sitemap.xml'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
          '/home',
          '/jlpt/',
          '/challenge/',
          '/driving/',
          '/study/',
          '/library/',
          '/exam-results',
          '/review-answers',
          '/settings'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}

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
          '/jlpt/',
          '/challenge/',
          '/driving/',
          '/sitemap.xml'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
          '/auth/*/test',
          '/jlpt/*/test',
          '/challenge/*/test',
          '/driving/*/test',
          '/exam-results',
          '/review-answers'
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
          '/jlpt/',
          '/challenge/',
          '/driving/',
          '/sitemap.xml'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
          '/auth/*/test',
          '/jlpt/*/test', 
          '/challenge/*/test',
          '/driving/*/test'
        ]
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/auth/vn/',
          '/auth/jp/',
          '/auth/en/',
          '/jlpt/',
          '/challenge/',
          '/driving/',
          '/sitemap.xml'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
          '*.json',
          '/auth/*/test',
          '/jlpt/*/test',
          '/challenge/*/test', 
          '/driving/*/test'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}

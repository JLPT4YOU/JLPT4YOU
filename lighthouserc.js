module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/home',
        'http://localhost:3000/jlpt',
        'http://localhost:3000/challenge',
        'http://localhost:3000/study',
        'http://localhost:3000/dict'
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu --headless',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: [
          'canonical',
          'robots-txt',
          'tap-targets',
          'content-width'
        ]
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Performance metrics
        'interactive': ['warn', { maxNumericValue: 5000 }],
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
        
        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'render-blocking-resources': ['warn', { maxLength: 0 }],
        'unminified-css': ['error', { maxLength: 0 }],
        'unminified-javascript': ['error', { maxLength: 0 }],
        
        // Image optimization
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'uses-optimized-images': ['warn', { maxLength: 0 }],
        'uses-responsive-images': ['warn', { maxLength: 0 }],
        
        // Accessibility
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'link-name': ['error', { minScore: 1 }],
        
        // Best practices
        'uses-https': ['error', { minScore: 1 }],
        'is-on-https': ['error', { minScore: 1 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports'
    }
  }
};

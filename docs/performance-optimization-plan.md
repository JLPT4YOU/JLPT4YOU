# JLPT4YOU Performance Optimization Plan

## 🎯 PRIORITY 1: SERVER RESPONSE TIME (1.16s → <600ms)

### Current Issues:
- TTFB: 1.16s (Target: <600ms)
- Server processing time too high
- Database queries may be unoptimized

### Solutions:

#### A. Database Optimization
```sql
-- Add indexes for frequently queried tables
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_exam_results_user_date ON exam_results(user_id, created_at);

-- Optimize slow queries
EXPLAIN ANALYZE SELECT * FROM questions WHERE level = 'N1';
```

#### B. Caching Implementation
```typescript
// Redis caching for API responses
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedData(key: string, fetcher: () => Promise<any>, ttl = 3600) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage in API routes
export async function GET() {
  return getCachedData('jlpt-questions-n1', async () => {
    return await db.questions.findMany({ where: { level: 'N1' } });
  });
}
```

#### C. Next.js Optimization
```typescript
// next.config.ts - Enable compression and caching
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Enable static optimization
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600' }
        ]
      }
    ];
  }
};
```

## 🎯 PRIORITY 2: ELIMINATE RENDER-BLOCKING RESOURCES (142ms savings)

### Current Issues:
- CSS and JS blocking initial render
- Critical resources not prioritized
- Non-critical resources loading synchronously

### Solutions:

#### A. Critical CSS Inlining
```typescript
// components/critical-css.tsx
export function CriticalCSS() {
  return (
    <style jsx>{`
      /* Inline critical CSS for above-the-fold content */
      .header { background: #000; color: #fff; }
      .hero { min-height: 60vh; }
      .loading { display: flex; justify-content: center; }
    `}</style>
  );
}

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <CriticalCSS />
        {/* Defer non-critical CSS */}
        <link 
          rel="preload" 
          href="/styles/non-critical.css" 
          as="style" 
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### B. JavaScript Optimization
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <div>Loading...</div>,
  ssr: false // Client-side only if needed
});

// Defer non-critical scripts
export default function Layout() {
  useEffect(() => {
    // Load analytics after page load
    const script = document.createElement('script');
    script.src = '/analytics.js';
    script.defer = true;
    document.head.appendChild(script);
  }, []);
}
```

#### C. Resource Prioritization
```html
<!-- In app/layout.tsx head section -->
<head>
  {/* Preload critical resources */}
  <link rel="preload" href="/fonts/noto-sans-jp.woff2" as="font" type="font/woff2" crossOrigin="" />
  <link rel="preload" href="/api/user" as="fetch" crossOrigin="" />
  
  {/* Preconnect to external domains */}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://api.jlpt4you.com" />
</head>
```

## 🎯 PRIORITY 3: IMAGE OPTIMIZATION (70ms savings)

### Current Issues:
- Images not in next-gen formats (WebP/AVIF)
- Missing responsive images
- Suboptimal compression

### Solutions:

#### A. Next.js Image Component
```typescript
// Replace all <img> with Next.js Image
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      quality={85}
      format="webp"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}
```

#### B. Image Conversion Script
```javascript
// scripts/convert-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertImages() {
  const inputDir = './public/images';
  const outputDir = './public/images/optimized';
  
  const files = fs.readdirSync(inputDir);
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      await sharp(path.join(inputDir, file))
        .webp({ quality: 85 })
        .toFile(path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp')));
      
      await sharp(path.join(inputDir, file))
        .avif({ quality: 80 })
        .toFile(path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.avif')));
    }
  }
}

convertImages();
```

#### C. Responsive Images
```typescript
// components/responsive-image.tsx
export function ResponsiveImage({ src, alt, sizes }) {
  return (
    <picture>
      <source 
        srcSet={`${src}.avif`} 
        type="image/avif" 
        sizes={sizes}
      />
      <source 
        srcSet={`${src}.webp`} 
        type="image/webp" 
        sizes={sizes}
      />
      <Image
        src={`${src}.jpg`}
        alt={alt}
        sizes={sizes}
        quality={85}
      />
    </picture>
  );
}
```

## 🎯 PRIORITY 4: FIX ROUTING ISSUES (404 Errors)

### Current Issues:
- /home → 404
- /jlpt → 404  
- /challenge → 404
- /study → 404

### Solutions:

#### A. Create Missing Routes
```typescript
// app/home/page.tsx
export default function HomePage() {
  return <div>Home Page Content</div>;
}

// app/jlpt/page.tsx  
export default function JLPTPage() {
  return <div>JLPT Page Content</div>;
}

// Or redirect to existing routes
// app/home/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/');
}
```

#### B. Route Configuration
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Redirect old routes to new ones
  if (pathname === '/home') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (pathname === '/jlpt') {
    return NextResponse.redirect(new URL('/jlpt/page', request.url));
  }
}

export const config = {
  matcher: ['/home', '/jlpt', '/challenge', '/study']
};
```

## 🎯 PRIORITY 5: ACCESSIBILITY IMPROVEMENTS (93 → 95+)

### Current Issues:
- Missing ARIA labels
- Color contrast issues
- Keyboard navigation gaps

### Solutions:

#### A. ARIA Improvements
```typescript
// components/accessible-button.tsx
export function AccessibleButton({ children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      aria-label={props['aria-label'] || children}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(e);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### B. Color Contrast Fix
```css
/* Update CSS variables for better contrast */
:root {
  --text-primary: #1a1a1a; /* Darker text */
  --text-secondary: #4a4a4a; /* Better contrast */
  --background: #ffffff;
  --accent: #0066cc; /* Higher contrast blue */
}

/* Ensure minimum 4.5:1 contrast ratio */
.text-muted {
  color: #666666; /* Instead of #999999 */
}
```

## 📊 IMPLEMENTATION TIMELINE

### Week 1: Quick Wins
- [ ] Fix 404 routes
- [ ] Add Redis caching
- [ ] Implement critical CSS inlining
- [ ] Convert key images to WebP

### Week 2: Server Optimization  
- [ ] Database query optimization
- [ ] Add database indexes
- [ ] Implement API response caching
- [ ] Configure CDN

### Week 3: Advanced Optimization
- [ ] JavaScript code splitting
- [ ] Implement service worker
- [ ] Advanced image optimization
- [ ] Accessibility improvements

### Week 4: Monitoring & Testing
- [ ] Set up performance budgets
- [ ] Implement RUM (Real User Monitoring)
- [ ] A/B test optimizations
- [ ] Document best practices

## 🎯 EXPECTED RESULTS

After implementing all optimizations:

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| TTFB | 1.16s | <600ms | 48% faster |
| Performance Score | 100 | 100 | Maintain |
| LCP | 1.23s | <1.0s | 19% faster |
| Accessibility | 93 | 95+ | 2+ points |
| Overall Load Time | ~2.8s | <2.0s | 29% faster |

## 🛠️ MONITORING PLAN

### Continuous Monitoring
```javascript
// Performance budget in lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'server-response-time': ['error', { maxNumericValue: 600 }],
        'categories:performance': ['error', { minScore: 0.95 }]
      }
    }
  }
};
```

### Real User Monitoring
```typescript
// lib/rum.ts
export function trackRealUserMetrics() {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB }) => {
      onLCP((metric) => {
        // Send to analytics
        gtag('event', 'web_vitals', {
          metric_name: 'LCP',
          metric_value: metric.value,
          metric_id: metric.id
        });
      });
      // ... other metrics
    });
  }
}
```

Bạn muốn tôi bắt đầu implement từ priority nào trước?

# LIGHTHOUSE PERFORMANCE REPORT

**Generated:** 14:53:05 16/8/2025
**URLs Tested:** 5

## SUMMARY

**Overall Status:** ❌ FAILED

| URL | Performance | Accessibility | Best Practices | SEO | Status |
|-----|-------------|---------------|----------------|-----|--------|
| http://localhost:3000/ | 71 | 92 | 96 | 100 | ❌ |
| http://localhost:3000/home | 81 | 93 | 96 | 66 | ❌ |
| http://localhost:3000/jlpt | 81 | 93 | 96 | 100 | ✅ |
| http://localhost:3000/challenge | N/A | N/A | N/A | N/A | ❌ |
| http://localhost:3000/study | 81 | 93 | 96 | 100 | ✅ |

## DETAILED RESULTS

### 1. http://localhost:3000/

**Scores:**
- performance: 71/100 ❌
- accessibility: 92/100 ✅
- best-practices: 96/100 ✅
- seo: 100/100 ✅

**Key Metrics:**
- first-contentful-paint: 1.81s
- largest-contentful-paint: 7.49s
- first-input-delay: 123ms
- cumulative-layout-shift: 0.107
- speed-index: 1810ms
- time-to-interactive: 7.49s
- total-blocking-time: 0.11s

**Top Opportunities:**
- Reduce unused JavaScript: 1.05s potential savings
- Reduce unused CSS: 160ms potential savings
- Initial server response time was short: 18ms potential savings

**Critical Issues:**
- Largest Contentful Paint
- Time to Interactive
- Minimize main-thread work
- Largest Contentful Paint element
- Avoid large layout shifts
- Reduce unused CSS
- Reduce unused JavaScript
- Layout shift culprits
- Network dependency tree
- Render blocking requests

---

### 2. http://localhost:3000/home

**Scores:**
- performance: 81/100 ✅
- accessibility: 93/100 ✅
- best-practices: 96/100 ✅
- seo: 66/100 ❌

**Key Metrics:**
- first-contentful-paint: 1.81s
- largest-contentful-paint: 4.83s
- first-input-delay: 50ms
- cumulative-layout-shift: 0.000
- speed-index: 1809ms
- time-to-interactive: 4.83s
- total-blocking-time: 0.00s

**Top Opportunities:**
- Reduce unused CSS: 440ms potential savings
- Reduce unused JavaScript: 290ms potential savings
- Avoid serving legacy JavaScript to modern browsers: 10ms potential savings
- Initial server response time was short: 4ms potential savings

**Critical Issues:**
- Largest Contentful Paint
- Largest Contentful Paint element
- Reduce unused CSS
- Reduce unused JavaScript
- Network dependency tree
- Render blocking requests

---

### 3. http://localhost:3000/jlpt

**Scores:**
- performance: 81/100 ✅
- accessibility: 93/100 ✅
- best-practices: 96/100 ✅
- seo: 100/100 ✅

**Key Metrics:**
- first-contentful-paint: 1.81s
- largest-contentful-paint: 4.88s
- first-input-delay: 48ms
- cumulative-layout-shift: 0.000
- speed-index: 1808ms
- time-to-interactive: 4.88s
- total-blocking-time: 0.00s

**Top Opportunities:**
- Reduce unused CSS: 590ms potential savings
- Reduce unused JavaScript: 440ms potential savings
- Avoid serving legacy JavaScript to modern browsers: 60ms potential savings
- Initial server response time was short: 3ms potential savings

**Critical Issues:**
- Largest Contentful Paint
- Largest Contentful Paint element
- Reduce unused CSS
- Reduce unused JavaScript
- Avoid serving legacy JavaScript to modern browsers
- Network dependency tree
- Render blocking requests

---

### 4. http://localhost:3000/challenge

**Scores:**
- performance: 0/100 ❌
- accessibility: 0/100 ❌
- best-practices: 0/100 ❌
- seo: 0/100 ❌

**Key Metrics:**

---

### 5. http://localhost:3000/study

**Scores:**
- performance: 81/100 ✅
- accessibility: 93/100 ✅
- best-practices: 96/100 ✅
- seo: 100/100 ✅

**Key Metrics:**
- first-contentful-paint: 1.81s
- largest-contentful-paint: 4.89s
- first-input-delay: 48ms
- cumulative-layout-shift: 0.000
- speed-index: 1809ms
- time-to-interactive: 4.89s
- total-blocking-time: 0.00s

**Top Opportunities:**
- Reduce unused CSS: 590ms potential savings
- Reduce unused JavaScript: 440ms potential savings
- Avoid serving legacy JavaScript to modern browsers: 60ms potential savings
- Initial server response time was short: 4ms potential savings

**Critical Issues:**
- Largest Contentful Paint
- Largest Contentful Paint element
- Reduce unused CSS
- Reduce unused JavaScript
- Avoid serving legacy JavaScript to modern browsers
- Network dependency tree
- Render blocking requests

---

## RECOMMENDATIONS

**Priority Actions:**
1. Reduce unused JavaScript (affects 4/5 pages, avg savings: 555ms)
2. Reduce unused CSS (affects 4/5 pages, avg savings: 445ms)
3. Avoid serving legacy JavaScript to modern browsers (affects 3/5 pages, avg savings: 43ms)
4. Initial server response time was short (affects 4/5 pages, avg savings: 7ms)

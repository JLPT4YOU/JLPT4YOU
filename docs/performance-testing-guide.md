# Hướng dẫn đánh giá tốc độ trang web JLPT4YOU

## Tổng quan

Hệ thống đánh giá performance của JLPT4YOU bao gồm nhiều công cụ để theo dõi và cải thiện hiệu suất trang web:

1. **Performance Dashboard** - Theo dõi real-time Core Web Vitals
2. **Performance Testing Tools** - Test tốc độ trang web tự động và manual
3. **User Interaction Tracker** - Theo dõi tương tác người dùng
4. **Performance Report Generator** - Tạo báo cáo chi tiết với khuyến nghị
5. **Lighthouse CI Integration** - Đánh giá tự động với Lighthouse

## Truy cập Performance Dashboard

### Qua Admin Panel
```
http://localhost:3000/admin/performance
```

**Lưu ý:** Cần quyền admin để truy cập. Trong development mode, dashboard sẽ tự động cho phép truy cập.

### Các tab chính:

#### 1. Dashboard
- Hiển thị Core Web Vitals real-time
- Theo dõi memory usage, connection quality
- Lịch sử tương tác người dùng

#### 2. Performance Testing
- **Single Page Test**: Test một trang cụ thể
- **Load Testing**: Mô phỏng nhiều user đồng thời
- Xuất kết quả dạng JSON

#### 3. User Interactions
- Theo dõi thời gian phản hồi UI
- Phân tích các loại tương tác (click, scroll, keyboard)
- Cảnh báo tương tác chậm (>100ms)

#### 4. Reports
- Tạo báo cáo performance toàn diện
- Khuyến nghị cải thiện cụ thể
- Xuất báo cáo dạng Markdown

## Sử dụng Lighthouse Testing

### Chạy test cơ bản
```bash
npm run lighthouse
```

### Chạy Lighthouse CI (toàn bộ pipeline)
```bash
npm run performance:ci
```

### Test URLs tùy chỉnh
```bash
node scripts/lighthouse-performance-test.js http://localhost:3000/custom-page
```

### Khởi động Lighthouse server
```bash
npm run lighthouse:server
```

## Cấu hình Performance Monitoring

### 1. Trong Layout chính
Performance monitoring đã được tích hợp trong `src/app/layout.tsx`:

```tsx
{process.env.NODE_ENV === 'production' && <ComprehensivePerformanceMonitor />}
```

### 2. Cấu hình Lighthouse
File `lighthouserc.js` chứa cấu hình cho Lighthouse CI:

- **URLs được test**: Home, JLPT, Challenge, Study, Dict
- **Thresholds**: Performance ≥80, Accessibility ≥90
- **Core Web Vitals**: LCP ≤2.5s, CLS ≤0.1, FCP ≤2s

### 3. Tùy chỉnh thresholds
Chỉnh sửa trong `lighthouserc.js`:

```javascript
assert: {
  assertions: {
    'categories:performance': ['error', { minScore: 0.8 }],
    'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
    // ...
  }
}
```

## Metrics quan trọng

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: ≤2.5s (Tốt), ≤4s (Chấp nhận)
- **FID (First Input Delay)**: ≤100ms (Tốt), ≤300ms (Chấp nhận)
- **CLS (Cumulative Layout Shift)**: ≤0.1 (Tốt), ≤0.25 (Chấp nhận)

### Loading Performance
- **FCP (First Contentful Paint)**: ≤1.8s
- **TTI (Time to Interactive)**: ≤5s
- **TBT (Total Blocking Time)**: ≤300ms

### User Experience
- **Response Time**: ≤50ms (Tốt), ≤100ms (Chấp nhận)
- **Memory Usage**: ≤80% heap limit
- **Resource Count**: ≤50 requests
- **Total Size**: ≤2MB

## Workflow đánh giá Performance

### 1. Development
```bash
# Khởi động dev server
npm run dev

# Mở performance dashboard
# http://localhost:3000/admin/performance

# Theo dõi real-time metrics trong tab Dashboard
# Test tương tác trong tab User Interactions
```

### 2. Pre-deployment
```bash
# Build production
npm run build

# Chạy performance test
npm run performance:test

# Review báo cáo trong lighthouse-reports/
```

### 3. CI/CD Integration
```bash
# Trong GitHub Actions hoặc CI pipeline
npm run performance:ci

# Fail build nếu performance < threshold
```

### 4. Production Monitoring
- Performance Monitor tự động chạy trong production
- Dữ liệu được gửi đến Google Analytics (nếu có)
- Theo dõi qua Admin Dashboard

## Khắc phục sự cố Performance

### LCP chậm (>2.5s)
- Tối ưu hóa hình ảnh (WebP, lazy loading)
- Minify CSS/JS
- Sử dụng CDN
- Preload critical resources

### FID cao (>100ms)
- Giảm JavaScript blocking
- Code splitting
- Web Workers cho heavy tasks
- Optimize event handlers

### CLS cao (>0.1)
- Set dimensions cho images/videos
- Avoid inserting content above existing content
- Use transform animations instead of layout changes

### Memory leaks
- Check component cleanup
- Remove event listeners
- Clear intervals/timeouts
- Optimize large data structures

## Báo cáo và Monitoring

### Tự động tạo báo cáo
```bash
npm run performance:report
```

### Xem báo cáo
- **JSON**: `lighthouse-reports/lighthouse-results-YYYY-MM-DD.json`
- **Markdown**: `lighthouse-reports/lighthouse-report-YYYY-MM-DD.md`

### Dashboard metrics
- Real-time Core Web Vitals
- User interaction analytics
- Memory và connection monitoring
- Performance score tracking

## Best Practices

### 1. Regular Testing
- Chạy performance test trước mỗi release
- Monitor production metrics hàng tuần
- Set up alerts cho performance degradation

### 2. Optimization Priorities
1. Core Web Vitals (LCP, FID, CLS)
2. Loading performance (FCP, TTI)
3. User experience (response time, memory)
4. SEO và accessibility

### 3. Development Workflow
- Enable performance monitoring trong development
- Test trên nhiều devices và connection types
- Profile performance với React DevTools
- Use Lighthouse CI trong pull requests

## Troubleshooting

### Dashboard không hiển thị data
- Kiểm tra quyền admin access
- Verify performance monitoring enabled
- Check browser console for errors

### Lighthouse test fails
- Ensure server đang chạy trên port 3000
- Check Chrome installation
- Verify network connectivity

### Memory usage cao
- Check for memory leaks trong components
- Optimize large data structures
- Use React.memo() và useMemo()
- Clear unused event listeners

## Liên hệ

Nếu có vấn đề với performance testing, vui lòng:
1. Check logs trong `lighthouse-reports/`
2. Review browser console errors
3. Contact development team với chi tiết lỗi

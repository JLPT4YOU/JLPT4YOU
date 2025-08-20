# 🍎 Safari Google Translate Proxy Setup

## Vấn đề
Safari có chính sách CORS và User-Agent khắt khe hơn Chrome, khiến Google Translate API không hoạt động trực tiếp từ browser.

## Giải pháp
Sử dụng Python proxy server để bypass Safari restrictions và cho phép Google Translate hoạt động bình thường.

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies
```bash
pip3 install flask flask-cors requests
```

### 2. Chạy proxy server
```bash
# Cách 1: Sử dụng script tự động
./start-proxy.sh

# Cách 2: Chạy trực tiếp
python3 proxy_server.py
```

### 3. Kiểm tra proxy server
- Mở browser và truy cập: http://localhost:8080
- Test API: http://localhost:8080/test-safari
- Health check: http://localhost:8080/health

### 4. Chạy JLPT4YOU
```bash
npm run dev
```

## 🔧 Cách hoạt động

### Enhanced Translate Service Logic:
1. **Detect Safari**: Kiểm tra User-Agent để xác định browser
2. **Check Proxy**: Kiểm tra proxy server có sẵn không (port 8080)
3. **Route Request**:
   - **Safari + Proxy Available**: Sử dụng proxy server
   - **Chrome/Firefox**: Sử dụng direct API
   - **Fallback**: Sử dụng server-side API

### Proxy Server Features:
- ✅ **CORS bypass**: Cho phép cross-origin requests
- ✅ **User-Agent rotation**: Tránh bị detect
- ✅ **Multiple endpoints**: Fallback khi một endpoint fail
- ✅ **Rate limiting**: Tránh bị block
- ✅ **Mazii/JDict methods**: Tương thích với các dictionary site

## 📊 Test Results

### Chrome (Direct API):
- ✅ Google Translate: Hoạt động
- ✅ Dictionary popup: Hoạt động
- ✅ /dict page: Hoạt động

### Safari (Without Proxy):
- ❌ Google Translate: CORS error
- ❌ Dictionary popup: Không dịch được
- ❌ /dict page: Không dịch được

### Safari (With Proxy):
- ✅ Google Translate: Hoạt động qua proxy
- ✅ Dictionary popup: Hoạt động
- ✅ /dict page: Hoạt động

## 🛠️ Troubleshooting

### Proxy server không start:
```bash
# Kiểm tra port 8080 có bị chiếm không
lsof -i :8080

# Kill process nếu cần
kill -9 <PID>
```

### Safari vẫn không dịch được:
1. Kiểm tra proxy server đang chạy: http://localhost:8080/health
2. Kiểm tra console log trong Safari Developer Tools
3. Restart cả proxy server và Next.js dev server

### Performance issues:
- Proxy server có cache 5 phút
- Rate limiting 0.1-0.5s delay giữa các request
- Fallback tự động khi proxy fail

## 📁 Files liên quan

- `proxy_server.py`: Python proxy server
- `start-proxy.sh`: Script tự động start proxy
- `src/lib/translate/enhanced-translate-service.ts`: Client-side service
- `src/app/api/translate/route.ts`: Server-side API

## 🔄 Workflow

```
Safari Request → Enhanced Service → Detect Safari → Check Proxy → Proxy Server → Google API → Response
Chrome Request → Enhanced Service → Direct API → Google API → Response
```

## ⚡ Performance

- **Cache**: 5 phút cho mỗi translation
- **Fallback**: 3 levels (Proxy → Server API → Direct API)
- **Rate Limiting**: Tránh bị Google block
- **Error Handling**: Graceful degradation

Proxy server giúp Safari users có trải nghiệm tương tự Chrome users! 🎯

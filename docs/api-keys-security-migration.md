# API Keys Security Migration

## Tổng quan
Đã thực hiện migration để ẩn API keys của TracAu và JDict khỏi client-side code và đưa chúng vào environment variables để bảo mật hơn.

## Thay đổi thực hiện

### 1. Environment Variables (.env.local)
Đã thêm các biến môi trường mới:
```bash
# Dictionary APIs (Server-side only)
TRACAU_API_KEY=WBBcwnwQpV89
JDICT_API_BASE=https://api.jdict.net/api/v1
JDICT_STATIC_BASE=https://jdict.net
```

### 2. TracAu Proxy Route (src/app/api/tracau/dj/route.ts)
**Trước:**
- Hardcode API key: `const DEFAULT_API_KEY = 'WBBcwnwQpV89'`
- API key có thể được truyền từ client

**Sau:**
- Sử dụng environment variable: `process.env.TRACAU_API_KEY`
- Thêm error handling khi thiếu environment variable
- API key hoàn toàn ẩn khỏi client

### 3. JDict Proxy Route (src/app/api/dict/[...path]/route.ts)
**Trước:**
- Hardcode base URLs: 
  ```ts
  const JDICT_API_BASE = 'https://api.jdict.net/api/v1';
  const JDICT_STATIC_BASE = 'https://jdict.net';
  ```

**Sau:**
- Sử dụng environment variables với function `getJDictConfig()`
- Thêm validation cho environment variables
- Tăng cường bảo mật

### 4. Dictionary Service (src/components/dictionary/service.ts)
**Trước:**
- Có fallback để gọi trực tiếp API từ server-side
- Cho phép truyền API key từ client

**Sau:**
- Luôn sử dụng proxy route để ẩn API keys
- Loại bỏ tham số `apiKey` từ các functions
- Đơn giản hóa logic

## Lợi ích bảo mật

1. **API Keys ẩn hoàn toàn**: Không còn xuất hiện trong client-side code
2. **Centralized configuration**: Tất cả API keys được quản lý tại một nơi
3. **Environment-based**: Dễ dàng thay đổi keys cho các môi trường khác nhau
4. **Proxy pattern**: Client chỉ gọi internal APIs, không trực tiếp gọi external APIs

## Backup
Các file gốc đã được backup tại:
```
backup/api-keys-migration-YYYYMMDD-HHMMSS/
├── route.ts (TracAu)
├── route.ts (JDict)  
└── service.ts (Dictionary)
```

## Testing
- ✅ Build thành công
- ✅ Không có TypeScript errors
- ✅ API routes vẫn hoạt động bình thường

## Rollback Instructions
Nếu cần rollback:
1. Copy các file từ backup folder
2. Remove các environment variables mới từ .env.local
3. Rebuild project

## Next Steps
- Test dictionary functionality trong development
- Test dictionary functionality trong production
- Monitor API usage và performance
- Xem xét thêm rate limiting cho proxy routes

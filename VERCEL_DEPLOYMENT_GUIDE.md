# 🚀 Hướng dẫn Deploy JLPT4YOU lên Vercel

## 🔧 Cấu hình Environment Variables trên Vercel

### Bước 1: Truy cập Vercel Dashboard
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project **JLPT4YOU**
3. Vào tab **Settings** → **Environment Variables**

### Bước 2: Thêm các Environment Variables bắt buộc

#### 🔑 **SUPABASE (BẮT BUỘC)**
```
NEXT_PUBLIC_SUPABASE_URL = https://prrizpzrdepnjjkyrimh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycml6cHpyZGVwbmpqa3lyaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTU1MjIsImV4cCI6MjA2ODg5MTUyMn0.fuV8_STGu2AE0gyFWwgT68nyn4Il7Fb112bBAX741aU
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycml6cHpyZGVwbmpqa3lyaW1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMxNTUyMiwiZXhwIjoyMDY4ODkxNTIyfQ._7XRuH7UQKcF0n7nzvBj1UOi4oJGhcaFjmWrKC5mWos
```

#### 🔐 **ENCRYPTION (BẮT BUỘC)**
```
APP_ENCRYPT_SECRET = J4Y2025_aK9mX7nP3qR8sT1vW6zE4bN5
```

#### 🤖 **AI SERVICES (TÙY CHỌN)**
```
MISTRAL_API_KEY = PuN1Vx4uMfW9FSfosITv0jM4Lo8HZD0t
```

#### 🚩 **FEATURE FLAGS (TÙY CHỌN)**
```
NEXT_PUBLIC_USE_NEW_AUTH = true
NEXT_PUBLIC_USE_NEW_MIDDLEWARE = false
NEXT_PUBLIC_USE_NEW_API_AUTH = true
NEXT_PUBLIC_USE_NEW_AUTH_CONTEXT = true
NEXT_PUBLIC_USE_RBAC = false
NEXT_PUBLIC_ROLLOUT_PERCENTAGE = 100
```

#### 📊 **MONITORING (TÙY CHỌN)**
```
NEXT_PUBLIC_ENABLE_MONITORING = true
NEXT_PUBLIC_ENABLE_DEBUG_LOGS = false
NEXT_PUBLIC_LOG_LEVEL = info
```

#### 📚 **JLPT API (TÙY CHỌN)**
```
NEXT_PUBLIC_JLPT_API_URL = https://jlpt-vocabulary-api-6jmc.vercel.app
NEXT_PUBLIC_JLPT_API_KEY = jlpt_web_806352_6f1eb4cc85d7fbb9
```

#### 📖 **DICTIONARY APIs (TÙY CHỌN)**
```
TRACAU_API_KEY = WBBcwnwQpV89
JDICT_API_BASE = https://api.jdict.net/api/v1
JDICT_STATIC_BASE = https://jdict.net
```

### Bước 3: Cấu hình Build Settings
1. **Framework Preset:** Next.js
2. **Build Command:** `npm run build`
3. **Output Directory:** `.next`
4. **Install Command:** `npm install`

### Bước 4: Deploy
1. Sau khi thêm tất cả environment variables
2. Vào tab **Deployments**
3. Click **Redeploy** để build lại với cấu hình mới

## 🔍 Troubleshooting

### Lỗi "supabaseUrl is required"
- ✅ Đảm bảo đã thêm `NEXT_PUBLIC_SUPABASE_URL`
- ✅ Đảm bảo đã thêm `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Kiểm tra không có khoảng trắng thừa trong values

### Lỗi Build Timeout
- ✅ Kiểm tra dependencies trong package.json
- ✅ Xóa node_modules và reinstall
- ✅ Kiểm tra circular imports

### Lỗi Runtime
- ✅ Kiểm tra logs trong Vercel Functions tab
- ✅ Đảm bảo tất cả API routes có error handling
- ✅ Kiểm tra Supabase connection

## 📞 Support
Nếu gặp vấn đề, hãy kiểm tra:
1. Vercel build logs
2. Browser console errors  
3. Supabase dashboard logs

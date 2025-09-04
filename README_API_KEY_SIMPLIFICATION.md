# API Key Management Simplification

## Tổng quan (Overview)

Dự án này đang loại bỏ hệ thống mã hóa/giải mã phức tạp cho API keys của Groq và Gemini để đơn giản hóa codebase và cải thiện hiệu suất.

This project is removing the complex encryption/decryption system for Groq and Gemini API keys to simplify the codebase and improve performance.

## Vấn đề hiện tại (Current Issues)

### Hệ thống mã hóa phức tạp
- **Double encryption**: Mã hóa ở client + server
- **Performance overhead**: Nhiều lần encrypt/decrypt
- **Maintenance burden**: Code crypto phức tạp cần bảo trì
- **Limited security benefit**: API key vẫn là plaintext sau khi decrypt
- **Browser compatibility**: Phụ thuộc Web Crypto API

### Files liên quan
```
src/lib/client-crypto-utils.ts        (217 dòng)
src/lib/crypto-utils.ts               (29 dòng)  
src/lib/api-key-service.ts            (118 dòng)
src/app/api/user/keys/[provider]/route.ts
src/app/api/user/keys/[provider]/decrypt/route.ts
src/components/chat/UnifiedSettings.tsx
```

## Giải pháp đơn giản (Simplified Solution)

### Luồng mới (New Flow)
1. **Client**: User nhập API key → gửi trực tiếp lên server (qua HTTPS)
2. **Server**: Lưu API key dạng plaintext trong database
3. **Retrieval**: Server trả về plaintext API key cho client đã xác thực

### Bảo mật (Security)
- **HTTPS encryption**: Tất cả data đã được mã hóa khi truyền
- **Database security**: Supabase cung cấp bảo mật enterprise-grade
- **Authentication**: JWT-based auth đảm bảo chỉ user được phép truy cập key của họ
- **Environment isolation**: API keys được phân tách theo user account

## Kế hoạch triển khai (Implementation Plan)

### Phase 1: Database Migration
```sql
-- Thêm cột plaintext mới
ALTER TABLE user_api_keys ADD COLUMN key_plaintext TEXT;

-- Migration script sẽ decrypt các key hiện tại
-- Sau đó drop cột key_encrypted
```

### Phase 2: API Endpoints
- **Simplify PUT `/api/user/keys/[provider]`**: Nhận plaintext keys
- **Simplify GET `/api/user/keys/[provider]/decrypt`**: Trả về stored keys trực tiếp
- **Remove**: Tất cả logic encrypt/decrypt

### Phase 3: Service Layer
- **Update `ApiKeyService`**: Làm việc với plaintext keys
- **Remove caching**: Không cần cache vì không có decrypt overhead
- **Simplify error handling**

### Phase 4: Frontend
- **Update `UnifiedSettings.tsx`**: Gửi plaintext API keys
- **Remove client-side encryption**: Không dùng `createSecureApiPayload`
- **Simplify form logic**

### Phase 5: Cleanup
- **Remove files**:
  - `src/lib/client-crypto-utils.ts`
  - `src/lib/crypto-utils.ts`
- **Update tests**
- **Update documentation**

## Files cần thay đổi (Files to Change)

### Cần cập nhật (Update)
1. **`/src/app/api/user/keys/[provider]/route.ts`**
   ```typescript
   // Trước (Before)
   const apiKey = await decryptClientEncryptedKey(body.encryptedKey, user.id, user.email)
   const encrypted = encrypt(apiKey, SECRET)
   
   // Sau (After)  
   const apiKey = body.key.trim()
   // Lưu trực tiếp vào database
   ```

2. **`/src/lib/api-key-service.ts`**
   ```typescript
   // Trước (Before)
   const decryptedKey = decrypt(data.key_encrypted, SECRET)
   
   // Sau (After)
   const plainKey = data.key_plaintext
   ```

3. **`/src/components/chat/UnifiedSettings.tsx`**
   ```typescript
   // Trước (Before)
   const payload = await createSecureApiPayload(apiKey, provider, user.id, user.email)
   
   // Sau (After)
   const payload = { key: apiKey, provider }
   ```

### Cần xóa (Remove)
- `src/lib/client-crypto-utils.ts`
- `src/lib/crypto-utils.ts`

## Lợi ích (Benefits)

### Performance
- ⚡ **Faster API responses**: Không có encrypt/decrypt overhead
- 🚀 **Reduced server load**: Pipeline xử lý đơn giản hơn
- 😊 **Better UX**: Settings save/load nhanh hơn

### Maintenance  
- 🧹 **Simplified codebase**: Loại bỏ ~400 dòng crypto code
- 📦 **Reduced dependencies**: Ít thư viện crypto cần maintain
- 🐛 **Easier debugging**: Data flow đơn giản hơn

### Security
- 🔒 **Reduced attack surface**: Ít crypto implementation cần bảo mật
- 🛡️ **Clearer security model**: Dựa vào HTTPS + database security đã được chứng minh
- 🎯 **Less complexity**: Ít cơ hội cho implementation bugs

## Testing Strategy

### Unit Tests
- [ ] Test API endpoints với plaintext keys
- [ ] Test service layer key retrieval  
- [ ] Test client-side form submission

### Integration Tests
- [ ] Test complete key save/retrieve flow
- [ ] Test authentication và authorization
- [ ] Test error handling scenarios

### User Testing
- [ ] Test key management trong settings UI
- [ ] Test AI provider functionality với keys mới
- [ ] Test migration của existing users

## Migration Script Example

```javascript
// scripts/migrate-api-keys.js
const { supabaseAdmin } = require('./utils/supabase/admin')
const { decrypt } = require('./src/lib/crypto-utils')

async function migrateApiKeys() {
  const SECRET = process.env.APP_ENCRYPT_SECRET
  
  // Get all encrypted keys
  const { data: encryptedKeys } = await supabaseAdmin
    .from('user_api_keys')
    .select('*')
    .not('key_encrypted', 'is', null)
  
  for (const row of encryptedKeys) {
    try {
      // Decrypt existing key
      const plainKey = decrypt(row.key_encrypted, SECRET)
      
      // Update with plaintext
      await supabaseAdmin
        .from('user_api_keys')
        .update({ key_plaintext: plainKey })
        .eq('id', row.id)
        
      console.log(`Migrated key for user ${row.user_id}, provider ${row.provider}`)
    } catch (error) {
      console.error(`Failed to migrate key ${row.id}:`, error)
    }
  }
}
```

## Rollback Plan

Nếu có vấn đề:
1. **Immediate rollback**: Revert về deployment trước
2. **Database rollback**: Restore encrypted columns nếu cần
3. **Gradual migration**: Cho phép cả encrypted và plaintext keys tạm thời

## Timeline

- **Week 1**: Database migration + API endpoints
- **Week 2**: Service layer + Frontend updates  
- **Week 3**: Testing + Cleanup + Deployment

## Success Criteria

- [ ] Tất cả existing API keys được migrate thành công
- [ ] Không có degradation trong AI provider functionality
- [ ] Improved performance metrics
- [ ] Reduced codebase complexity
- [ ] Không có security incidents

---

**Kết luận**: Việc loại bỏ encryption system sẽ đơn giản hóa đáng kể codebase trong khi vẫn duy trì bảo mật thông qua các cơ chế đã được chứng minh (HTTPS, database security, authentication).

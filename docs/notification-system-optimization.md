# Notification System Optimization

## Vấn đề trước đây

Hệ thống notification cũ gây quá tải server do:
- Check notification mỗi 30 giây liên tục
- Không có caching mechanism
- Tất cả notification đều được poll với tần suất cao
- Gây ra hàng nghìn request không cần thiết mỗi ngày

## Giải pháp mới

### 1. Polling Strategy Tối ưu

**Regular Notifications (Thông báo thường):**
- Check mỗi 12 tiếng 1 lần
- Sử dụng localStorage để cache kết quả (5 phút)
- Chỉ gọi API khi thực sự cần thiết

**Important Notifications (Thông báo quan trọng):**
- Real-time delivery qua Supabase subscriptions
- Bao gồm: `admin_message`, `system`, `premium_upgrade`, và notifications có `is_important = true`
- Được gửi ngay lập tức không cần chờ polling

**Manual Refresh (Cập nhật thủ công):**
- User có thể click nút "Cập nhật thông báo" trong inbox
- Bypass cache và fetch data mới ngay lập tức
- Cập nhật cả inbox và notification count
- Có tooltip hướng dẫn user

### 2. Caching System

```typescript
// Cache notification count trong 5 phút
const cacheKey = `unread_count_${userId}`;
const cached = localStorage.getItem(cacheKey);
const cacheTime = localStorage.getItem(`${cacheKey}_time`);

if (cached && cacheTime) {
  const cacheAge = Date.now() - parseInt(cacheTime);
  const fiveMinutes = 5 * 60 * 1000;
  
  if (cacheAge < fiveMinutes) {
    return parseInt(cached); // Sử dụng cache
  }
}
```

### 3. Database Optimization

**Indexes mới:**
```sql
-- Composite index cho unread count queries
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Index cho important notifications
CREATE INDEX idx_notifications_important 
ON notifications(user_id, is_important, created_at DESC) 
WHERE is_important = TRUE;

-- Index cho priority notification types
CREATE INDEX idx_notifications_priority_types 
ON notifications(user_id, type, created_at DESC) 
WHERE type IN ('admin_message', 'system', 'premium_upgrade');
```

**Function tối ưu:**
```sql
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM notifications
    WHERE user_id = p_user_id
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 4. Real-time Subscriptions

```typescript
// Chỉ subscribe cho important notifications
const channel = supabase
  .channel(`important_notifications_${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    const notification = payload.new;
    
    // Chỉ trigger cho important notifications
    if (notification.is_important || 
        ['admin_message', 'system', 'premium_upgrade'].includes(notification.type)) {
      callback(notification);
    }
  })
  .subscribe();
```

## Các Components Mới

### 1. NotificationPollingManager
- Quản lý polling intervals
- Cache management
- Real-time subscription management
- Statistics tracking

### 2. Admin Monitoring Dashboard
- Monitor notification system health
- View polling statistics
- Track notification delivery rates
- Server load monitoring

### 3. Cleanup Scripts
- Tự động xóa notifications cũ
- Database maintenance
- Performance optimization

## Cách sử dụng

### 1. Client-side Implementation

```typescript
import { NotificationPollingManager, createPollingConfig } from '@/utils/notification-polling';

const pollingManager = NotificationPollingManager.getInstance();
const config = createPollingConfig(userId);

// Start optimized polling
pollingManager.startPolling(config, () => {
  // Load notifications
});

// Setup real-time for important notifications
const channel = notificationService.subscribeToImportantNotifications(userId, (notification) => {
  // Handle important notification immediately
});
```

### 2. Admin Monitoring

```typescript
import NotificationMonitoring from '@/components/admin/notification-monitoring';

// Trong admin dashboard
<NotificationMonitoring />
```

### 3. Database Maintenance

```bash
# Chạy cleanup script
npm run cleanup-notifications

# Hoặc trong code
import { cleanupNotifications } from '@/scripts/cleanup-notifications';
await cleanupNotifications();
```

## Kết quả mong đợi

### Performance Improvements
- **Giảm 99% API calls**: Từ mỗi 30 giây → mỗi 12 tiếng
- **Faster response**: Cache hits trả về ngay lập tức
- **Real-time important notifications**: Admin messages được gửi ngay

### Server Load Reduction
- Trước: ~2,880 requests/user/day (mỗi 30s)
- Sau: ~2 requests/user/day (mỗi 12h) + real-time subscriptions
- Giảm ~99.9% server load cho notification polling

### User Experience
- Important notifications (admin, upgrade) vẫn real-time
- Regular notifications vẫn được cập nhật đều đặn
- **Manual refresh**: User có thể cập nhật ngay khi muốn
- Faster app loading do cache
- Reduced battery usage trên mobile
- Intuitive UI với tooltip hướng dẫn

## Monitoring & Maintenance

### 1. Admin Dashboard
- `/admin/notifications/monitoring` - View system health
- Real-time statistics
- Performance metrics

### 2. Database Cleanup
- Tự động cleanup mỗi ngày
- Xóa notifications cũ đã đọc (>30 ngày)
- Xóa expired notifications
- Maintain database performance

### 3. Alerts
- Monitor notification delivery rates
- Track server load
- Alert on system issues

## Migration Plan

1. ✅ **Phase 1**: Implement new polling system
2. ✅ **Phase 2**: Add caching layer
3. ✅ **Phase 3**: Setup real-time subscriptions
4. ✅ **Phase 4**: Database optimization
5. ✅ **Phase 5**: Admin monitoring tools
6. 🔄 **Phase 6**: Deploy and monitor
7. 📋 **Phase 7**: Cleanup old code after verification

## Configuration

```typescript
// Default config
export const DEFAULT_POLLING_CONFIG = {
  regularCheckInterval: 12 * 60 * 60 * 1000, // 12 hours
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// Important notification types
const IMPORTANT_TYPES = ['admin_message', 'system', 'premium_upgrade'];
```

## Testing

1. **Unit Tests**: Test polling logic và caching
2. **Integration Tests**: Test real-time subscriptions
3. **Load Tests**: Verify server load reduction
4. **User Tests**: Verify notification delivery

## Rollback Plan

Nếu có vấn đề, có thể rollback bằng cách:
1. Revert `NotificationButton.tsx` về version cũ
2. Disable real-time subscriptions
3. Restore old polling interval (30s)
4. Remove new database indexes nếu cần

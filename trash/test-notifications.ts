import { NotificationService } from './src/services/notification-service';

async function testNotifications() {
  const notificationService = new NotificationService();
  
  // Test user ID - replace with an actual user ID from your database
  const testUserId = 'YOUR_USER_ID_HERE'; // You need to replace this
  
  console.log('🧪 Testing Notification System...\n');
  
  try {
    // Test 1: Top-up notification
    console.log('1. Testing top-up notification...');
    await notificationService.sendTopUpNotification(testUserId, 10.00, 50.00);
    console.log('✅ Top-up notification sent successfully\n');
    
    // Test 2: Premium upgrade notification
    console.log('2. Testing premium upgrade notification...');
    await notificationService.sendPremiumUpgradeNotification(testUserId, 'monthly', new Date('2025-02-09'));
    console.log('✅ Premium upgrade notification sent successfully\n');
    
    // Test 3: Redeem code notification
    console.log('3. Testing redeem code notification...');
    await notificationService.sendRedeemCodeNotification(testUserId, 'TEST2025', 5.00);
    console.log('✅ Redeem code notification sent successfully\n');
    
    // Test 4: Admin message notification
    console.log('4. Testing admin message notification...');
    await notificationService.sendAdminMessage(
      testUserId,
      'Thông báo bảo trì hệ thống',
      'Hệ thống sẽ bảo trì vào lúc 2:00 AM ngày mai. Vui lòng lưu lại công việc của bạn.'
    );
    console.log('✅ Admin message notification sent successfully\n');
    
    // Test 5: Fetch notifications
    console.log('5. Fetching all notifications for user...');
    const notifications = await notificationService.getNotifications(testUserId);
    console.log(`📬 Found ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type}] ${notif.title} - Read: ${notif.is_read}`);
    });
    
    // Test 6: Get unread count
    console.log('\n6. Getting unread count...');
    const unreadCount = await notificationService.getUnreadCount(testUserId);
    console.log(`📨 Unread notifications: ${unreadCount}\n`);
    
    // Test 7: Mark a notification as read (if any exist)
    if (notifications.length > 0) {
      console.log('7. Marking first notification as read...');
      await notificationService.markAsRead(notifications[0].id, testUserId);
      console.log('✅ Notification marked as read\n');
      
      // Verify unread count decreased
      const newUnreadCount = await notificationService.getUnreadCount(testUserId);
      console.log(`📨 New unread count: ${newUnreadCount}\n`);
    }
    
    // Test 8: Mark all as read
    console.log('8. Marking all notifications as read...');
    await notificationService.markAllAsRead(testUserId);
    console.log('✅ All notifications marked as read\n');
    
    // Final unread count
    const finalUnreadCount = await notificationService.getUnreadCount(testUserId);
    console.log(`📨 Final unread count: ${finalUnreadCount}\n`);
    
    console.log('🎉 All notification tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testNotifications();

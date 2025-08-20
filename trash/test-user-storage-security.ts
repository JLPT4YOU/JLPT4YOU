/**
 * Test script để kiểm tra bảo mật localStorage giữa các user
 * Chạy script này để đảm bảo user A logout, user B login không thấy dữ liệu của user A
 */

import { UserStorage } from '@/lib/user-storage';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
}

class UserStorageSecurityTest {
  private results: TestResult[] = [];

  private addResult(testName: string, passed: boolean, details: string) {
    this.results.push({ testName, passed, details });
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${details}`);
  }

  /**
   * Test 1: Kiểm tra user isolation
   */
  testUserIsolation() {
    console.log('\n🔍 Test 1: User Isolation');
    
    // Simulate user A
    const userA = 'user-a-123';
    const userB = 'user-b-456';
    
    // User A sets data
    UserStorage.setCurrentUser(userA);
    UserStorage.setItem('test_data', 'user-a-secret-data');
    UserStorage.setJSON('test_chat', { messages: ['Hello from User A'] });
    
    const userAData = UserStorage.getItem('test_data');
    const userAChat = UserStorage.getJSON('test_chat');
    
    this.addResult(
      'User A can save and retrieve data',
      userAData === 'user-a-secret-data' && userAChat?.messages?.[0] === 'Hello from User A',
      `Data: ${userAData}, Chat: ${JSON.stringify(userAChat)}`
    );
    
    // Switch to user B
    UserStorage.setCurrentUser(userB);
    UserStorage.setItem('test_data', 'user-b-secret-data');
    UserStorage.setJSON('test_chat', { messages: ['Hello from User B'] });
    
    const userBData = UserStorage.getItem('test_data');
    const userBChat = UserStorage.getJSON('test_chat');
    
    this.addResult(
      'User B can save and retrieve own data',
      userBData === 'user-b-secret-data' && userBChat?.messages?.[0] === 'Hello from User B',
      `Data: ${userBData}, Chat: ${JSON.stringify(userBChat)}`
    );
    
    // Critical test: User B should NOT see User A's data
    const userBSeesUserAData = UserStorage.getItem('test_data') === 'user-a-secret-data';
    this.addResult(
      'User B cannot see User A data',
      !userBSeesUserAData,
      userBSeesUserAData ? 'SECURITY BREACH: User B can see User A data!' : 'Data properly isolated'
    );
    
    // Switch back to user A and verify data is still there
    UserStorage.setCurrentUser(userA);
    const userADataAfterSwitch = UserStorage.getItem('test_data');
    const userAChatAfterSwitch = UserStorage.getJSON('test_chat');
    
    this.addResult(
      'User A data persists after user switch',
      userADataAfterSwitch === 'user-a-secret-data' && userAChatAfterSwitch?.messages?.[0] === 'Hello from User A',
      `Data: ${userADataAfterSwitch}, Chat: ${JSON.stringify(userAChatAfterSwitch)}`
    );
  }

  /**
   * Test 2: Kiểm tra localStorage keys có user prefix
   */
  testLocalStorageKeys() {
    console.log('\n🔍 Test 2: LocalStorage Keys Structure');
    
    const userA = 'user-test-789';
    UserStorage.setCurrentUser(userA);
    UserStorage.setItem('security_test', 'test-value');
    
    // Check if key exists with user prefix
    const expectedKey = `security_test_user_${userA}`;
    const actualValue = localStorage.getItem(expectedKey);
    
    this.addResult(
      'Keys are properly prefixed with user ID',
      actualValue === 'test-value',
      `Expected key: ${expectedKey}, Value: ${actualValue}`
    );
    
    // Check that unprefixed key doesn't exist
    const unprefixedValue = localStorage.getItem('security_test');
    this.addResult(
      'Unprefixed keys do not exist',
      unprefixedValue === null,
      `Unprefixed value: ${unprefixedValue}`
    );
  }

  /**
   * Test 3: Kiểm tra clearCurrentUser
   */
  testClearCurrentUser() {
    console.log('\n🔍 Test 3: Clear Current User');
    
    const userA = 'user-clear-test';
    UserStorage.setCurrentUser(userA);
    UserStorage.setItem('clear_test', 'should-be-cleared');
    
    // Verify data exists
    const beforeClear = UserStorage.getItem('clear_test');
    this.addResult(
      'Data exists before clear',
      beforeClear === 'should-be-cleared',
      `Value: ${beforeClear}`
    );
    
    // Clear current user
    UserStorage.clearCurrentUser();
    
    // Try to access data (should fallback to global key)
    const afterClear = UserStorage.getItem('clear_test');
    this.addResult(
      'Data access changes after clearCurrentUser',
      afterClear === null, // Should be null because global key doesn't exist
      `Value after clear: ${afterClear}`
    );
  }

  /**
   * Test 4: Kiểm tra clearUserData
   */
  testClearUserData() {
    console.log('\n🔍 Test 4: Clear User Data');
    
    const userA = 'user-clear-data-test';
    UserStorage.setCurrentUser(userA);
    UserStorage.setItem('data1', 'value1');
    UserStorage.setItem('data2', 'value2');
    UserStorage.setJSON('chat_data', { messages: ['test'] });
    
    // Verify data exists
    const data1Before = UserStorage.getItem('data1');
    const data2Before = UserStorage.getItem('data2');
    const chatBefore = UserStorage.getJSON('chat_data');
    
    this.addResult(
      'Multiple data items exist before clear',
      data1Before === 'value1' && data2Before === 'value2' && chatBefore?.messages?.[0] === 'test',
      `Data1: ${data1Before}, Data2: ${data2Before}, Chat: ${JSON.stringify(chatBefore)}`
    );
    
    // Clear user data
    UserStorage.clearUserData();
    
    // Verify data is cleared
    const data1After = UserStorage.getItem('data1');
    const data2After = UserStorage.getItem('data2');
    const chatAfter = UserStorage.getJSON('chat_data');
    
    this.addResult(
      'All user data cleared',
      data1After === null && data2After === null && chatAfter === null,
      `Data1: ${data1After}, Data2: ${data2After}, Chat: ${JSON.stringify(chatAfter)}`
    );
  }

  /**
   * Test 5: Kiểm tra storage info
   */
  testStorageInfo() {
    console.log('\n🔍 Test 5: Storage Info');
    
    const userA = 'user-info-test';
    UserStorage.setCurrentUser(userA);
    UserStorage.setItem('info_test1', 'value1');
    UserStorage.setItem('info_test2', 'value2');
    
    const info = UserStorage.getStorageInfo();
    
    this.addResult(
      'Storage info returns correct structure',
      typeof info.totalKeys === 'number' && typeof info.userKeys === 'number',
      `Total: ${info.totalKeys}, User: ${info.userKeys}, App: ${info.appKeys}, Other: ${info.otherKeys}`
    );
    
    this.addResult(
      'User keys are counted correctly',
      info.userKeys >= 2, // At least our 2 test keys
      `User keys: ${info.userKeys}`
    );
  }

  /**
   * Chạy tất cả tests
   */
  runAllTests() {
    console.log('🚀 Starting User Storage Security Tests...\n');
    
    try {
      this.testUserIsolation();
      this.testLocalStorageKeys();
      this.testClearCurrentUser();
      this.testClearUserData();
      this.testStorageInfo();
      
      // Cleanup
      UserStorage.clearCurrentUser();
      
      // Summary
      const passed = this.results.filter(r => r.passed).length;
      const total = this.results.length;
      
      console.log('\n📊 Test Summary:');
      console.log(`✅ Passed: ${passed}/${total}`);
      console.log(`❌ Failed: ${total - passed}/${total}`);
      
      if (passed === total) {
        console.log('\n🎉 All tests passed! User storage is secure.');
      } else {
        console.log('\n⚠️  Some tests failed. Please review the security implementation.');
        console.log('\nFailed tests:');
        this.results.filter(r => !r.passed).forEach(r => {
          console.log(`  - ${r.testName}: ${r.details}`);
        });
      }
      
      return passed === total;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      return false;
    }
  }
}

// Export for use in other files
export { UserStorageSecurityTest };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  const tester = new UserStorageSecurityTest();
  tester.runAllTests();
}

'use client';

import React, { useState } from 'react';
import { UserStorageSecurityTest } from '@/scripts/test-user-storage-security';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
}

export default function UserStorageSecurityTestComponent() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ passed: number; total: number } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      // Capture console output
      const originalLog = console.log;
      const logs: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      const tester = new UserStorageSecurityTest();
      const allPassed = tester.runAllTests();

      // Restore console.log
      console.log = originalLog;

      // Parse results from logs
      const testResults: TestResult[] = [];
      logs.forEach(log => {
        if (log.startsWith('✅') || log.startsWith('❌')) {
          const passed = log.startsWith('✅');
          const parts = log.split(': ');
          if (parts.length >= 2) {
            const testName = parts[0].substring(2); // Remove ✅ or ❌
            const details = parts.slice(1).join(': ');
            testResults.push({ testName, passed, details });
          }
        }
      });

      setResults(testResults);
      setSummary({
        passed: testResults.filter(r => r.passed).length,
        total: testResults.length
      });

    } catch (error) {
      console.error('Test execution failed:', error);
      setResults([{
        testName: 'Test Execution',
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-background rounded-2xl p-6 border">
        <h1 className="text-2xl font-bold mb-4">🔒 User Storage Security Test</h1>
        <p className="text-muted-foreground mb-6">
          Test này kiểm tra xem localStorage có được phân chia đúng cách giữa các user hay không.
          Đảm bảo user A logout, user B login sẽ không thấy dữ liệu của user A.
        </p>
        
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isRunning ? '🔄 Đang chạy test...' : '🚀 Chạy Security Test'}
        </button>
      </div>

      {summary && (
        <div className={`bg-background rounded-2xl p-6 border ${
          summary.passed === summary.total ? 'border-green-500' : 'border-red-500'
        }`}>
          <h2 className="text-xl font-semibold mb-4">📊 Kết quả Test</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.total - summary.passed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
          
          {summary.passed === summary.total ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🎉</span>
                <div>
                  <h3 className="font-semibold text-green-800">Tất cả test đều PASS!</h3>
                  <p className="text-green-700">User storage đã được bảo mật đúng cách.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-2">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800">Có test FAIL!</h3>
                  <p className="text-red-700">Cần xem xét lại implementation bảo mật.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-background rounded-2xl p-6 border">
          <h2 className="text-xl font-semibold mb-4">📋 Chi tiết Test</h2>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start">
                  <span className="text-xl mr-3">
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      result.passed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.testName}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      result.passed ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.details}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-background rounded-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4">ℹ️ Thông tin Test</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Test 1:</strong> User Isolation - Kiểm tra user A và user B có dữ liệu riêng biệt</p>
          <p><strong>Test 2:</strong> LocalStorage Keys - Kiểm tra keys có user prefix đúng cách</p>
          <p><strong>Test 3:</strong> Clear Current User - Kiểm tra clearCurrentUser() hoạt động</p>
          <p><strong>Test 4:</strong> Clear User Data - Kiểm tra clearUserData() xóa hết dữ liệu user</p>
          <p><strong>Test 5:</strong> Storage Info - Kiểm tra getStorageInfo() trả về đúng thông tin</p>
        </div>
      </div>
    </div>
  );
}

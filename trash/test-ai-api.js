/**
 * Test script để kiểm tra AI API với authentication
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://prrizpzrdepnjjkyrimh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycml6cHpyZGVwbmpqa3lyaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTU1MjIsImV4cCI6MjA2ODg5MTUyMn0.fuV8_STGu2AE0gyFWwgT68nyn4Il7Fb112bBAX741aU';

async function testAIAPI() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Đăng nhập với user có API key
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'jlpt4you.owner@gmail.com',
      password: 'password123' // Thay bằng password thực
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful:', authData.user.email);
    
    // Test API với access token
    const response = await fetch('http://localhost:3001/api/study/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({
        level: 'n5',
        type: 'vocabulary',
        count: 3,
        difficulty: 'easy'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ AI API successful:', {
        success: result.success,
        questionCount: result.data?.questions?.length,
        setId: result.data?.setId
      });
    } else {
      console.error('❌ AI API failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIAPI();

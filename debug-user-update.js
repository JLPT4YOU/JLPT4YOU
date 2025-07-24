/**
 * Debug Script - Test User Profile Update
 * Chạy script này để kiểm tra lỗi cụ thể khi update user profile
 */

// 1. Mở Developer Tools (F12) trong browser
// 2. Vào tab Console
// 3. Copy và paste đoạn code này vào console
// 4. Nhấn Enter để chạy

async function debugUserUpdate() {
  console.log('🔍 Starting user update debug...')
  
  try {
    // Lấy user hiện tại
    const { data: { user }, error: userError } = await window.supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Cannot get current user:', userError)
      return
    }
    
    if (!user) {
      console.error('❌ No user logged in')
      return
    }
    
    console.log('👤 Current user:', {
      id: user.id,
      email: user.email
    })
    
    // Test 1: Kiểm tra user có tồn tại trong bảng users không
    console.log('\n📋 Test 1: Check if user exists in users table...')
    const { data: existingUser, error: selectError } = await window.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (selectError) {
      console.error('❌ SELECT Error:', selectError)
      console.error('Error details:', {
        code: selectError.code,
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint
      })
    } else {
      console.log('✅ User exists:', existingUser)
    }
    
    // Test 2: Thử update với dữ liệu đơn giản
    console.log('\n📋 Test 2: Try simple update...')
    const testUpdate = {
      display_name: 'Test Update ' + new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Update data:', testUpdate)
    
    const { data: updateResult, error: updateError } = await window.supabase
      .from('users')
      .update(testUpdate)
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ UPDATE Error:', updateError)
      console.error('Error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        stack: updateError.stack
      })
      
      // Phân tích lỗi phổ biến
      if (updateError.message?.includes('permission')) {
        console.log('🔍 Diagnosis: RLS Permission issue - user không có quyền UPDATE')
      } else if (updateError.message?.includes('does not exist')) {
        console.log('🔍 Diagnosis: Column/Table không tồn tại - cần chạy migration')
      } else if (updateError.message?.includes('policy')) {
        console.log('🔍 Diagnosis: RLS Policy issue - policy chưa đúng')
      }
    } else {
      console.log('✅ Update successful:', updateResult)
    }
    
    // Test 3: Kiểm tra RLS policies (nếu có quyền admin)
    console.log('\n📋 Test 3: Check RLS policies...')
    try {
      const { data: policies, error: policyError } = await window.supabase
        .rpc('get_policies_for_table', { table_name: 'users' })
      
      if (policyError) {
        console.log('⚠️ Cannot check policies (normal for non-admin users)')
      } else {
        console.log('📋 Current policies:', policies)
      }
    } catch (e) {
      console.log('⚠️ Policy check not available')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Chạy debug
debugUserUpdate()

console.log(`
📋 DEBUG INSTRUCTIONS:
1. Copy toàn bộ output từ console này
2. Gửi lại cho developer để phân tích
3. Đặc biệt chú ý phần "UPDATE Error" nếu có

🔧 QUICK FIXES to try:
- Nếu lỗi "permission denied": Chạy lại FIX_RLS_POLICIES.sql
- Nếu lỗi "column does not exist": Chạy migration script
- Nếu lỗi "policy": Kiểm tra RLS policies trong Supabase dashboard
`)

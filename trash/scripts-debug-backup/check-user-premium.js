require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificUser() {
  console.log('🔍 Checking user: chaulenba02@gmail.com');
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'chaulenba02@gmail.com')
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('📊 User details:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Name:', user.name);
  console.log('  Role:', user.role);
  console.log('  Subscription expires at:', user.subscription_expires_at);
  console.log('  Created at:', user.created_at);
  console.log('  Updated at:', user.updated_at);
  
  if (user.subscription_expires_at) {
    const expiry = new Date(user.subscription_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('\n🗓️ Premium calculation:');
    console.log('  Expiry date:', expiry.toISOString());
    console.log('  Current date:', now.toISOString());
    console.log('  Days left:', daysLeft);
    console.log('  Status:', daysLeft > 0 ? 'ACTIVE' : 'EXPIRED');
    console.log('  Formatted expiry:', expiry.toLocaleDateString('vi-VN'));
    
    // Test với các functions từ app
    console.log('\n🧪 Testing utility functions:');
    
    // Test getDaysRemaining logic
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, diffDays);
    console.log('  getDaysRemaining result:', daysRemaining);
    
    // Test getExpiryDisplayText logic
    if (user.role === 'Premium') {
      if (daysRemaining <= 0) {
        console.log('  getExpiryDisplayText result: Premium đã hết hạn');
      } else {
        const formatted = expiry.toLocaleDateString('vi-VN');
        console.log('  getExpiryDisplayText result: Hạn sử dụng:', formatted);
      }
    }
  } else {
    console.log('\n❌ No subscription expiry date found');
    
    if (user.role === 'Premium') {
      console.log('⚠️  WARNING: User has Premium role but no expiry date!');
      console.log('   This will cause "Premium không xác định hạn" to display');
    }
  }
  
  // Test adding premium to this user
  console.log('\n🔧 To add 30 days premium to this user, run:');
  console.log(`UPDATE users SET role = 'Premium', subscription_expires_at = NOW() + INTERVAL '30 days' WHERE email = 'chaulenba02@gmail.com';`);
}

checkSpecificUser().catch(console.error);

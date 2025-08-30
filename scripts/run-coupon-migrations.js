/**
 * Script to run coupon migrations directly on Supabase
 * This creates the coupons and coupon_usage tables
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://zcnkdvlmwrdrqunpxmih.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  try {
    console.log('🚀 Starting coupon migrations...')

    // Read migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations')
    
    const couponMigration = fs.readFileSync(
      path.join(migrationsDir, 'create_coupons_table.sql'), 
      'utf8'
    )
    
    const couponUsageMigration = fs.readFileSync(
      path.join(migrationsDir, '20240101000003_create_coupon_usage_table.sql'), 
      'utf8'
    )

    // Run coupons table migration
    console.log('📦 Creating coupons table...')
    const { error: couponError } = await supabase.rpc('exec_sql', {
      sql: couponMigration
    })

    if (couponError) {
      console.error('❌ Error creating coupons table:', couponError)
      return
    }

    console.log('✅ Coupons table created successfully')

    // Run coupon_usage table migration
    console.log('📦 Creating coupon_usage table...')
    const { error: usageError } = await supabase.rpc('exec_sql', {
      sql: couponUsageMigration
    })

    if (usageError) {
      console.error('❌ Error creating coupon_usage table:', usageError)
      return
    }

    console.log('✅ Coupon_usage table created successfully')

    // Insert some sample coupons for testing
    console.log('📝 Inserting sample coupons...')
    const sampleCoupons = [
      {
        code: 'WELCOME10',
        description: 'Chào mừng người dùng mới - Giảm 10%',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        max_uses: 100,
        used_count: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      },
      {
        code: 'SAVE15',
        description: 'Tiết kiệm 15% cho đơn hàng',
        discount_type: 'percentage',
        discount_value: 15,
        is_active: true,
        max_uses: 50,
        used_count: 0,
        min_amount: 5.00,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      },
      {
        code: 'FIXED5',
        description: 'Giảm cố định $5',
        discount_type: 'fixed',
        discount_value: 5.00,
        is_active: true,
        max_uses: 25,
        used_count: 0,
        min_amount: 10.00,
        expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days from now
      }
    ]

    const { error: insertError } = await supabase
      .from('coupons')
      .insert(sampleCoupons)

    if (insertError) {
      console.error('❌ Error inserting sample coupons:', insertError)
      return
    }

    console.log('✅ Sample coupons inserted successfully')
    console.log('🎉 All migrations completed successfully!')
    
    // List created coupons
    const { data: coupons, error: listError } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (!listError && coupons) {
      console.log('\n📋 Created coupons:')
      coupons.forEach(coupon => {
        console.log(`  - ${coupon.code}: ${coupon.description} (${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '$' + coupon.discount_value})`)
      })
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migrations
runMigrations()

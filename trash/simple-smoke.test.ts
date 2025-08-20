/**
 * Simple Smoke Test for API Configuration
 * Tests that our test setup works correctly
 */

describe('API Smoke Test Setup', () => {
  it('should have correct environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-key')
  })

  it('should have NextResponse mock available', () => {
    const { NextResponse } = require('next/server')
    expect(NextResponse.json).toBeDefined()
    expect(typeof NextResponse.json).toBe('function')
  })

  it('should be able to create mock responses', () => {
    const { NextResponse } = require('next/server')
    const response = NextResponse.json({ success: true }, { status: 200 })
    
    expect(response.status).toBe(200)
    expect(response.json).toBeDefined()
  })

  it('should have console mocks working', () => {
    console.log('test message')
    console.error('test error')
    
    expect(console.log).toHaveBeenCalledWith('test message')
    expect(console.error).toHaveBeenCalledWith('test error')
  })
})

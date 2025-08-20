/**
 * 🧪 MOCK - Supabase SSR
 * Mock implementation for testing
 */

export const createServerClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    signInWithOAuth: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}))

export const createBrowserClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    signInWithOAuth: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}))

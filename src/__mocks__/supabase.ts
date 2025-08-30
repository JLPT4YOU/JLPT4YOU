/**
 * Mock Supabase Client for Testing
 * Provides mocks for authentication and database operations
 */

// Type definitions for mock data
type MockCredentials = { email: string; password: string; options?: Record<string, unknown> }
type MockAuthCallback = (event: string, session: Record<string, unknown> | null) => void
type MockDatabaseRecord = Record<string, unknown>

// Mock user data
export const MOCK_USER = {
  id: 'mock-user-id-123',
  email: 'test@jlpt4you.com',
  name: 'Test User',
  role: 'Free' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Mock auth session
export const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER
}

// Mock exam result
export const MOCK_EXAM_RESULT = {
  id: 'mock-exam-result-id',
  user_id: MOCK_USER.id,
  exam_type: 'JLPT' as const,
  exam_level: 'N3',
  exam_mode: 'practice' as const,
  score: 85.5,
  total_questions: 100,
  correct_answers: 85,
  time_spent: 3600,
  answers: [],
  created_at: '2024-01-01T00:00:00Z'
}

// Mock Supabase Auth
export class MockSupabaseAuth {
  private currentUser = MOCK_USER
  private currentSession = MOCK_SESSION

  async signInWithPassword(credentials: { email: string; password: string }) {
    // Mock successful login for valid test emails
    if (credentials.email.includes('@example.com') || credentials.email.includes('@jlpt4you.com')) {
      if (credentials.password === 'password123' || credentials.password === 'password') {
        return {
          data: { user: this.currentUser, session: this.currentSession },
          error: null
        }
      }
    }
    return {
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    }
  }

  async signInWithOAuth(options: { provider: string }) {
    return {
      data: { url: `https://mock-oauth-url.com/${options.provider}` },
      error: null
    }
  }

  async signUp(credentials: MockCredentials) {
    // Mock email already registered error
    if (credentials.email === 'existing@example.com') {
      return {
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      }
    }

    // Mock email confirmation required
    if (credentials.email === 'confirm@example.com') {
      return {
        data: { user: this.currentUser, session: null },
        error: null
      }
    }

    // Default successful registration
    return {
      data: { user: this.currentUser, session: this.currentSession },
      error: null
    }
  }

  async signOut() {
    this.currentUser = null as typeof MOCK_USER | null
    this.currentSession = null as typeof MOCK_SESSION | null
    return { error: null }
  }

  async getUser() {
    return {
      data: { user: this.currentUser },
      error: null
    }
  }

  async refreshSession() {
    return {
      data: { session: this.currentSession },
      error: null
    }
  }

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    return { error: null }
  }

  async getSession() {
    return {
      data: { session: this.currentSession },
      error: null
    }
  }

  onAuthStateChange(_callback: MockAuthCallback) {
    // Mock subscription - callback parameter marked as unused for testing
    return {
      data: { subscription: { unsubscribe: jest.fn() } }
    }
  }
}

// Mock Supabase Database
export class MockSupabaseDatabase {
  private mockData: Record<string, MockDatabaseRecord[]> = {
    users: [MOCK_USER],
    exam_results: [MOCK_EXAM_RESULT],
    user_progress: []
  }

  from(table: string) {
    return {
      select: (_columns?: string) => ({
        eq: (_column: string, _value: unknown) => ({
          single: () => ({
            data: this.mockData[table]?.[0] || null,
            error: null
          }),
          data: this.mockData[table] || [],
          error: null
        }),
        data: this.mockData[table] || [],
        error: null
      }),
      insert: (data: MockDatabaseRecord) => ({
        select: () => ({
          single: () => ({
            data: { ...data, id: `mock-id-${Date.now()}` },
            error: null
          })
        })
      }),
      update: (data: MockDatabaseRecord) => ({
        eq: (_column: string, _value: unknown) => ({
          select: () => ({
            single: () => ({
              data: { ...data, updated_at: new Date().toISOString() },
              error: null
            })
          })
        })
      }),
      delete: () => ({
        eq: (_column: string, _value: unknown) => ({
          data: null,
          error: null
        })
      })
    }
  }
}

// Mock Supabase Client
export class MockSupabaseClient {
  public auth = new MockSupabaseAuth()
  private db = new MockSupabaseDatabase()

  from(table: string) {
    return this.db.from(table)
  }
}

// Export mock instance
export const mockSupabase = new MockSupabaseClient()

// Test helpers
export function createMockUser(overrides: Partial<typeof MOCK_USER> = {}) {
  return { ...MOCK_USER, ...overrides }
}

export function createMockExamResult(overrides: Partial<typeof MOCK_EXAM_RESULT> = {}) {
  return { ...MOCK_EXAM_RESULT, ...overrides }
}

// Mock createClient function for @supabase/supabase-js
export function createClient(url: string, key: string, options?: Record<string, unknown>) {
  return new MockSupabaseClient()
}

/**
 * Mock Next.js Server Components for Testing
 * Provides mocks for NextRequest, NextResponse, and middleware testing
 */

// Type definitions for mock objects
type MockCookieOptions = Record<string, unknown>
// type MockRequestOptions = { // Currently unused
//   method?: string
//   url?: string
//   origin?: string
//   cookies?: Record<string, string>
//   headers?: Record<string, string>
//   searchParams?: URLSearchParams
// }

// Mock NextRequest
export class MockNextRequest {
  public nextUrl: {
    pathname: string
    origin: string
    searchParams: URLSearchParams
  }
  public cookies: Map<string, { value: string }>
  public headers: Map<string, string>

  constructor(urlOrOptions: string | {
    pathname?: string
    origin?: string
    cookies?: Record<string, string>
    headers?: Record<string, string>
    searchParams?: URLSearchParams
  } = {}) {
    // Support both URL string and options object
    if (typeof urlOrOptions === 'string') {
      const urlObj = new URL(urlOrOptions)
      this.nextUrl = {
        pathname: urlObj.pathname,
        origin: urlObj.origin,
        searchParams: urlObj.searchParams
      }
    } else {
      this.nextUrl = {
        pathname: urlOrOptions.pathname || '/',
        origin: urlOrOptions.origin || 'https://jlpt4you.com',
        searchParams: urlOrOptions.searchParams || new URLSearchParams()
      }
    }

    this.cookies = new Map()
    const cookiesObj = typeof urlOrOptions === 'object' ? urlOrOptions.cookies : undefined
    if (cookiesObj) {
      Object.entries(cookiesObj).forEach(([name, value]) => {
        this.cookies.set(name, { value })
      })
    }

    this.headers = new Map()
    const headersObj = typeof urlOrOptions === 'object' ? urlOrOptions.headers : undefined
    if (headersObj) {
      Object.entries(headersObj).forEach(([name, value]) => {
        this.headers.set(name, value)
      })
    }
  }

  // Mock cookies API
  getCookie(name: string) {
    return this.cookies.get(name)
  }

  getHeader(name: string) {
    return this.headers.get(name)
  }
}

// Mock NextResponse
export class MockNextResponse {
  public status: number = 200
  private _headers: Map<string, string> = new Map()
  public cookies: Map<string, MockCookieOptions> = new Map()
  public redirectUrl?: string
  public body?: any

  static next() {
    return new MockNextResponse()
  }

  static redirect(url: string | URL, status: number = 302) {
    const response = new MockNextResponse()
    response.status = status
    const urlString = url instanceof URL ? url.toString() : url
    response.redirectUrl = urlString
    response._headers.set('location', urlString)
    return response
  }

  static json(data: any, init?: { status?: number; headers?: Record<string, string> }) {
    const response = new MockNextResponse()
    if (init?.status) response.status = init.status
    response._headers.set('content-type', 'application/json')
    if (init?.headers) {
      Object.entries(init.headers).forEach(([k, v]) => response._headers.set(k.toLowerCase(), v))
    }
    response.body = data
    return response
  }

  // Mock cookies API
  setCookie(name: string, value: string, options?: MockCookieOptions) {
    this.cookies.set(name, { value, ...options })
  }

  setHeader(name: string, value: string) {
    this._headers.set(name, value)
  }

  getHeader(name: string) {
    return this._headers.get(name)
  }

  // Add headers object with get method for compatibility
  get headers() {
    return {
      get: (name: string) => this._headers.get(name),
      set: (name: string, value: string) => this._headers.set(name, value)
    }
  }
}

// Helper to create test requests
export function createTestRequest(options: {
  pathname?: string
  origin?: string
  cookies?: Record<string, string>
  headers?: Record<string, string>
  searchParams?: URLSearchParams
} = {}) {
  return new MockNextRequest(options) as unknown as Request
}

// Helper to create test responses
export function createTestResponse() {
  return new MockNextResponse() as unknown as Response
}

// Mock middleware context
export function createMiddlewareContext(options: {
  pathname?: string
  isAuthenticated?: boolean
  language?: string
  cookies?: Record<string, string>
  headers?: Record<string, string>
} = {}) {
  const request = createTestRequest({
    pathname: options.pathname,
    cookies: options.cookies,
    headers: options.headers
  })

  return {
    request,
    pathname: options.pathname || '/',
    isAuthenticated: options.isAuthenticated || false,
    language: options.language || 'vn'
  }
}

// Export as NextRequest and NextResponse for compatibility
export { MockNextRequest as NextRequest, MockNextResponse as NextResponse }

/**
 * Admin API Helper Functions
 * Provides authenticated API calls for admin operations
 */

import { createClient } from '@/utils/supabase/client'

/**
 * Get authenticated headers for admin API calls
 */
async function getAuthHeaders(): Promise<HeadersInit | null> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.access_token) {
      console.error('Failed to get session for admin API:', error?.message || 'No access token')
      return null
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  } catch (error) {
    console.error('Error getting auth headers:', error)
    return null
  }
}

/**
 * Make authenticated admin API request
 */
export async function adminApiRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response | null> {
  try {
    const headers = await getAuthHeaders()
    if (!headers) {
      throw new Error('Failed to get authentication headers')
    }
    
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers,
      },
    })
    
    return response
  } catch (error) {
    console.error('Admin API request failed:', error)
    return null
  }
}

/**
 * Fetch all users (admin only)
 */
export async function fetchUsers() {
  const response = await adminApiRequest('/api/admin/users')
  if (!response || !response.ok) {
    throw new Error(`Failed to fetch users: ${response?.status || 'Network error'}`)
  }
  
  const data = await response.json()
  return data.users
}

/**
 * Update user (admin only)
 */
export async function updateUser(userId: string, updates: any) {
  const response = await adminApiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  
  if (!response || !response.ok) {
    const errorData = await response?.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to update user: ${response?.status || 'Network error'}`)
  }
  
  const data = await response.json()
  return data.user
}

/**
 * Fetch monitoring data (admin only)
 */
export async function fetchMonitoringData() {
  const response = await adminApiRequest('/api/admin/monitoring')
  if (!response || !response.ok) {
    throw new Error(`Failed to fetch monitoring data: ${response?.status || 'Network error'}`)
  }

  const data = await response.json()
  return data
}

/**
 * Fetch user balance (admin only)
 */
export async function fetchUserBalance(userId: string, adminUserId?: string) {
  const response = await adminApiRequest(`/api/admin/balance?userId=${userId}`)
  if (!response || !response.ok) {
    const errorData = await response?.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch user balance: ${response?.status || 'Network error'}`)
  }

  const data = await response.json()
  return data.balance || 0
}

/**
 * Top up user balance (admin only)
 */
export async function topupUserBalance(userId: string, amount: number, description?: string) {
  const response = await adminApiRequest('/api/admin/topup', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amount,
      description: description || `Admin top-up: $${amount}`
    }),
  })

  if (!response || !response.ok) {
    const errorData = await response?.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to top up user balance: ${response?.status || 'Network error'}`)
  }

  const data = await response.json()
  return data.newBalance
}

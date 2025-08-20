"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { topupUserBalance, fetchUserBalance } from '@/lib/admin-api'
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route'

export default function TestTopupPage() {
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testFetchBalance = async () => {
    if (!userId) {
      setError('Please enter a user ID')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    addLog(`Fetching balance for user: ${userId}`)

    try {
      const userBalance = await fetchUserBalance(userId)
      setBalance(userBalance)
      setSuccess(`Balance fetched successfully: $${userBalance}`)
      addLog(`✅ Success: Balance = $${userBalance}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch balance: ${errorMsg}`)
      addLog(`❌ Error: ${errorMsg}`)
      console.error('Fetch balance error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testTopup = async () => {
    if (!userId || !amount) {
      setError('Please enter both user ID and amount')
      return
    }

    const topupAmount = parseFloat(amount)
    if (isNaN(topupAmount) || topupAmount <= 0) {
      setError('Please enter a valid positive amount')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    addLog(`Starting top-up: User=${userId}, Amount=$${topupAmount}`)

    try {
      // First, try to fetch current balance
      addLog('Step 1: Fetching current balance...')
      const currentBalance = await fetchUserBalance(userId)
      addLog(`Current balance: $${currentBalance}`)

      // Then perform top-up
      addLog('Step 2: Performing top-up...')
      const newBalance = await topupUserBalance(
        userId,
        topupAmount,
        `Test top-up: $${topupAmount}`
      )
      
      setBalance(newBalance)
      setSuccess(`Top-up successful! New balance: $${newBalance}`)
      addLog(`✅ Success: New balance = $${newBalance}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Top-up failed: ${errorMsg}`)
      addLog(`❌ Error: ${errorMsg}`)
      console.error('Top-up error:', err)
      
      // Log full error details
      if (err instanceof Error) {
        addLog(`Error stack: ${err.stack}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const testApiDirectly = async () => {
    if (!userId || !amount) {
      setError('Please enter both user ID and amount')
      return
    }

    const topupAmount = parseFloat(amount)
    setLoading(true)
    setError(null)
    setSuccess(null)
    addLog('Testing API directly with fetch...')

    try {
      // Get auth token
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      addLog(`Auth token obtained: ${session.access_token.substring(0, 20)}...`)

      // Make direct API call
      const response = await fetch('/api/admin/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          amount: topupAmount,
          description: `Direct API test: $${topupAmount}`
        }),
      })

      const responseText = await response.text()
      addLog(`Response status: ${response.status}`)
      addLog(`Response text: ${responseText}`)

      if (!response.ok) {
        throw new Error(`API error: ${responseText}`)
      }

      const data = JSON.parse(responseText)
      setBalance(data.newBalance)
      setSuccess(`Direct API call successful! New balance: $${data.newBalance}`)
      addLog(`✅ Success: ${JSON.stringify(data)}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(`Direct API call failed: ${errorMsg}`)
      addLog(`❌ Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminProtectedRoute>
      <div className="container mx-auto py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Test Admin Top-up Functionality</h1>

        <div className="grid gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Test Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID (e.g., UUID)"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Tip: You can find user IDs in the admin dashboard or database
                </p>
              </div>

              <div>
                <Label htmlFor="amount">Top-up Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (e.g., 10.00)"
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
              </div>

              {balance !== null && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Current Balance:</p>
                  <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={testFetchBalance}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Testing...' : 'Test Fetch Balance'}
                </Button>
                <Button
                  onClick={testTopup}
                  disabled={loading}
                  variant="default"
                >
                  {loading ? 'Testing...' : 'Test Top-up'}
                </Button>
                <Button
                  onClick={testApiDirectly}
                  disabled={loading}
                  variant="secondary"
                >
                  {loading ? 'Testing...' : 'Test API Directly'}
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                  <p className="font-medium">Error:</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                  <p className="font-medium">Success:</p>
                  <p className="text-sm mt-1">{success}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-1 font-mono text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className={
                      log.includes('✅') ? 'text-green-600 dark:text-green-400' :
                      log.includes('❌') ? 'text-red-600 dark:text-red-400' :
                      'text-muted-foreground'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No logs yet. Perform an action to see debug information.</p>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Enter a valid user ID from your database</p>
              <p>2. Test &quot;Fetch Balance&quot; first to verify the user exists</p>
              <p>3. Enter an amount and test &quot;Top-up&quot; to add balance</p>
              <p>4. If top-up fails, try &quot;Test API Directly&quot; for more detailed debugging</p>
              <p>5. Check the debug logs for detailed error information</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}

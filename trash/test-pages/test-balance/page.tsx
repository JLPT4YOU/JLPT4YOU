"use client"

import { useState } from 'react'
import { fetchUserBalance, topupUserBalance } from '@/lib/admin-api'

export default function TestBalancePage() {
  const [userId, setUserId] = useState('9d5e3846-ac74-47d0-b8be-f22eacf87b70') // Admin user ID
  const [balance, setBalance] = useState<number | null>(null)
  const [topupAmount, setTopupAmount] = useState('10')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const testFetchBalance = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const fetchedBalance = await fetchUserBalance(userId)
      setBalance(fetchedBalance)
      setSuccess(`Balance fetched successfully: $${fetchedBalance}`)
    } catch (err) {
      setError(`Error fetching balance: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testTopup = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const newBalance = await topupUserBalance(userId, parseFloat(topupAmount), 'Test topup')
      setBalance(newBalance)
      setSuccess(`Topup successful! New balance: $${newBalance}`)
    } catch (err) {
      setError(`Error during topup: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Test Balance API</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">User ID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter user ID"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={testFetchBalance}
            disabled={loading || !userId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Balance'}
          </button>

          <div className="flex gap-2">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="w-24 p-2 border rounded"
              placeholder="Amount"
              step="0.01"
            />
            <button
              onClick={testTopup}
              disabled={loading || !userId || !topupAmount}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Topup'}
            </button>
          </div>
        </div>

        {balance !== null && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <strong>Current Balance:</strong> ${balance}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success:</strong> {success}
          </div>
        )}
      </div>
    </div>
  )
}

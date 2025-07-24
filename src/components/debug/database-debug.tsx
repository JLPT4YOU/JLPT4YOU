/**
 * Database Debug Component
 * Component để debug database schema và user updates
 */

"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, User, AlertCircle, CheckCircle } from 'lucide-react'

export function DatabaseDebug() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [schemaResult, setSchemaResult] = useState<any>(null)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  const checkSchema = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/schema')
      const result = await response.json()
      setSchemaResult(result)
    } catch (error) {
      console.error('Schema check error:', error)
      setSchemaResult({ error: 'Failed to check schema' })
    } finally {
      setIsLoading(false)
    }
  }

  const runMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/run-migration', {
        method: 'POST'
      })
      const result = await response.json()
      setMigrationResult(result)
    } catch (error) {
      console.error('Migration error:', error)
      setMigrationResult({ error: 'Failed to run migration' })
    } finally {
      setIsLoading(false)
    }
  }

  const testUserUpdate = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const testUpdates = {
        display_name: `Test Name ${Date.now()}`,
        avatar_icon: 'Star'
      }

      const response = await fetch('/api/debug/user-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          updates: testUpdates,
          useAdmin: false
        })
      })

      const result = await response.json()
      setUpdateResult(result)
    } catch (error) {
      console.error('User update test error:', error)
      setUpdateResult({ error: 'Failed to test user update' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Debug Tools
          </CardTitle>
          <CardDescription>
            Debug tools để kiểm tra database schema và user updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={checkSchema}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Check Schema
            </Button>

            <Button
              onClick={runMigration}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Run Migration
            </Button>

            <Button
              onClick={testUserUpdate}
              disabled={isLoading || !user}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
              Test User Update
            </Button>
          </div>

          {user && (
            <div className="p-3 bg-muted/20 rounded-lg">
              <p className="text-sm font-medium">Current User:</p>
              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
              <p className="text-xs text-muted-foreground">Email: {user.email}</p>
              <p className="text-xs text-muted-foreground">Name: {user.name}</p>
              <p className="text-xs text-muted-foreground">Avatar Icon: {user.avatarIcon}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Results */}
      {schemaResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {schemaResult.error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              Schema Check Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schemaResult.error ? (
              <div className="text-red-600">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{schemaResult.error}</p>
                {schemaResult.details && (
                  <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                    {JSON.stringify(schemaResult.details, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Schema Status:</p>
                  <Badge variant={schemaResult.data?.schemaStatus === 'complete' ? 'default' : 'destructive'}>
                    {schemaResult.data?.schemaStatus}
                  </Badge>
                </div>

                {schemaResult.data?.missingFields?.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600">Missing Fields:</p>
                    <div className="flex gap-1 flex-wrap">
                      {schemaResult.data.missingFields.map((field: string) => (
                        <Badge key={field} variant="destructive">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="font-medium">User Count: {schemaResult.data?.userCount}</p>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Table Columns</summary>
                  <pre className="mt-2 bg-muted/20 p-2 rounded overflow-auto">
                    {JSON.stringify(schemaResult.data?.tableColumns, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationResult.error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              Migration Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {migrationResult.error ? (
              <div className="text-red-600">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{migrationResult.error}</p>
                {migrationResult.details && (
                  <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                    {JSON.stringify(migrationResult.details, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-green-600">✅ Migration Successful</p>
                  <p className="text-sm">{migrationResult.message}</p>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Migration Details</summary>
                  <pre className="mt-2 bg-muted/20 p-2 rounded overflow-auto">
                    {JSON.stringify(migrationResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Update Results */}
      {updateResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {updateResult.error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              User Update Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {updateResult.error ? (
              <div className="text-red-600 space-y-3">
                <div>
                  <p className="font-medium">Error:</p>
                  <p className="text-sm">{updateResult.error}</p>
                </div>

                {updateResult.errorMessage && (
                  <div>
                    <p className="font-medium">Database Error:</p>
                    <p className="text-sm font-mono bg-red-50 p-2 rounded">{updateResult.errorMessage}</p>
                  </div>
                )}

                {updateResult.diagnosis && (
                  <div>
                    <p className="font-medium">Diagnosis:</p>
                    <p className="text-sm">{updateResult.diagnosis}</p>
                    {updateResult.diagnosis.includes('migration') && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-medium text-yellow-800">🔧 Solution:</p>
                        <p className="text-sm text-yellow-700">
                          Run the migration script in Supabase SQL Editor:
                        </p>
                        <p className="text-xs font-mono mt-1 text-yellow-600">
                          database/QUICK_MIGRATION.sql
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Full Error Details</summary>
                  <pre className="mt-2 bg-red-50 p-2 rounded overflow-auto">
                    {JSON.stringify(updateResult, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-green-600">✅ Update Successful</p>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Direct Update Result</summary>
                  <pre className="mt-2 bg-muted/20 p-2 rounded overflow-auto">
                    {JSON.stringify(updateResult.data?.directUpdate, null, 2)}
                  </pre>
                </details>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Service Result</summary>
                  <pre className="mt-2 bg-muted/20 p-2 rounded overflow-auto">
                    {JSON.stringify(updateResult.data?.serviceResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

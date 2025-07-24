/**
 * Debug Page
 * Trang debug để kiểm tra database và user updates
 */

"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { DatabaseDebug } from "@/components/debug/database-debug"
import { Settings, Bug } from "lucide-react"

export default function DebugPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Bug className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  Debug Tools
                </h1>
              </div>
              <p className="text-muted-foreground">
                Tools để debug database schema và user settings
              </p>
            </div>

            {/* Debug Tools */}
            <DatabaseDebug />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

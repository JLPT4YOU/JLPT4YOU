"use client";

import { useAuth } from '@/contexts/auth-context-simple';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Test page for Global Chat Bubble
 * This page is only for testing the chat bubble functionality
 * Remove this file after testing is complete
 */
export default function TestChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/auth/vn');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Global Chat Bubble Test</h1>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Look for the chat bubble in the bottom-right corner</li>
              <li>• Click to open the chat interface</li>
              <li>• Test sending messages to iRIN</li>
              <li>• Try minimizing and maximizing</li>
              <li>• Test "Open in full chat" button</li>
              <li>• Check responsive behavior on mobile</li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ Chat bubble appears only when authenticated</li>
              <li>✅ Same AI responses as /irin page</li>
              <li>✅ Chat history syncs with /irin</li>
              <li>✅ Bubble hides on /irin route</li>
              <li>✅ Responsive design works</li>
              <li>✅ Smooth animations</li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
            <div className="space-x-4">
              <a 
                href="/irin" 
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              >
                Go to /irin (bubble should hide)
              </a>
              <a 
                href="/home" 
                className="inline-block bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90"
              >
                Go to /home (bubble should show)
              </a>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <div className="text-sm text-muted-foreground">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Chat storage will be scoped to this user</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

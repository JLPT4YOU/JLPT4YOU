"use client"

import { useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/auth-context';
import { getLoginUrl } from '@/lib/auth-utils';

// Dynamic import for ChatLayout to reduce initial bundle size
const ChatLayout = lazy(() => import("@/components/chat/ChatLayout").then(module => ({
  default: module.ChatLayout
})));

// Loading fallback component for ChatLayout
function ChatLoadingFallback() {
  return (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
        <div className="text-foreground text-sm">Loading iRIN Sensei Chat...</div>
      </div>
    </div>
  );
}

export default function IrinPage() {
  const { user, loading } = useAuth(); // ✅ FIXED: Use correct property names

  // ✅ FIXED: Derive authentication state from user
  const isAuthenticated = !!user;
  const isLoading = loading;
  const router = useRouter();

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!isLoading && !isAuthenticated) {
      router.push(getLoginUrl()); // Use dynamic language-aware auth URL
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading iRIN Sensei...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render the modern white theme chat interface
  return (
    <div className="h-screen bg-background overflow-hidden">
      <Suspense fallback={<ChatLoadingFallback />}>
        <ChatLayout />
      </Suspense>
    </div>
  );
}
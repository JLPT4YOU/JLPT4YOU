"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { detectClientLanguage, generateLanguageRedirectUrl } from "@/lib/language-detection";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If user is authenticated, redirect to home
        router.replace('/home');
      } else {
        // Detect user's preferred language and redirect accordingly
        const preferredLanguage = detectClientLanguage();
        const redirectUrl = generateLanguageRedirectUrl('login', preferredLanguage);
        router.replace(redirectUrl);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}



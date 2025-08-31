"use client"

import Link from "next/link";
import {
  GraduationCap,
  Car,
  BookOpen,
  Library,
  Bot,
  Crown,
  CreditCard,
  Settings,
  Trophy,
  Infinity,
  Book
} from "lucide-react";
import { useAuth } from '@/contexts/auth-context-simple';
import { useUserData } from '@/hooks/use-user-data'; // ✅ ADDED: Import user data hook
import { getIconComponent } from "@/components/settings/icon-selector"
import { getRoleClasses, getExpiryDisplayText, getExpiryTextColor } from "@/lib/role-utils";
import { Language } from "@/lib/i18n";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";
import { routes } from "@/shared/constants/routes";

interface HomePageContentProps extends BasePageContentProps {
  isAuthenticated?: boolean;
}

export const HomePageContent = createPageContent<{ isAuthenticated?: boolean }>(
  function HomePageContentInner({ language, translations }: HomePageContentProps) {
    const t = (key: string) => {
      const keys = key.split('.');
      let value: any = translations;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    };

    return <HomeContent t={t} language={language} />;
  }
);

interface HomeContentProps {
  t: (key: string) => string;
  language: Language;
}

function HomeContent({ t, language }: HomeContentProps) {
  const { user } = useAuth();
  const { userData, loading: userDataLoading } = useUserData(); // ✅ ADDED: Get user data with profile info

  // If no user (shouldn't happen due to ProtectedRoute), show loading
  if (!user || userDataLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  // ✅ FIXED: Use userData for profile information, fallback to user for basic info
  const displayUser = {
    id: user.id,
    email: user.email,
    name: userData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: userData?.role || 'Free',
    balance: userData?.balance || 0,
    expiryDate: userData?.subscription_expires_at || null,
    avatarIcon: userData?.avatar_icon || 'User'
  };

  const practiceItems = [
    {
      id: 1,
      key: "jlpt",
      icon: GraduationCap,
      href: "/jlpt", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 2,
      key: "challenge",
      icon: Trophy,
      href: "/challenge", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 3,
      key: "driving",
      icon: Car,
      href: "/driving", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 4,
      key: "dict",
      icon: Book,
      href: routes.dict(),
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 5,
      key: "study",
      icon: BookOpen,
      href: "/study",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 6,
      key: "library",
      icon: Library,
      href: "/library",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 7,
      key: "irin",
      icon: Bot,
      href: "/irin",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 8,
      key: "upgrade",
      icon: Crown,
      href: "/premium",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 9,
      key: "topup",
      icon: CreditCard,
      href: "/top-up",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 10,
      key: "settings",
      icon: Settings,
      href: "/settings",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },

  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main container with improved spacing */}
      <div className="app-container pt-6 sm:pt-8 lg:pt-12">
        <div className="app-content app-space-xl">

          {/* User Info Section with enhanced spacing */}
          <div className="border border-border bg-muted/30 rounded-2xl app-p-lg">
            <div className="flex items-center app-gap-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                {(() => {
                  const AvatarIcon = getIconComponent(displayUser.avatarIcon || undefined) // ✅ FIXED
                  return <AvatarIcon className="w-6 h-6 text-primary" />
                })()}
              </div>
              <div className="app-space-xs">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {t('home.userGreeting').replace('{{name}}', displayUser.name)} {/* ✅ FIXED */}
                </h2>
                <div className="flex items-center app-gap-xs mt-1">
                  <span className={getRoleClasses(displayUser.role as any)}> {/* ✅ FIXED */}
                    {displayUser.role} {/* ✅ FIXED */}
                  </span>
                  {(() => {
                    const expiryText = getExpiryDisplayText(displayUser.role as any, displayUser.expiryDate || undefined) // ✅ FIXED
                    const expiryColor = getExpiryTextColor(displayUser.role as any, displayUser.expiryDate || undefined) // ✅ FIXED

                    if (expiryText === 'unlimited') {
                      return (
                        <div className={`flex items-center gap-2 text-sm ${expiryColor}`}>
                          <span>{t('header.userMenu.expiryDate')}:</span>
                          <Infinity className="w-5 h-5 flex-shrink-0 mt-1" />
                        </div>
                      )
                    }

                    if (expiryText) {
                      return (
                        <span className={`text-sm ${expiryColor}`}>
                          {expiryText}
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Practice Grid Section with improved spacing */}
          <div className="app-space-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {practiceItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block"
                  >
                    <div className="group cursor-pointer bg-muted/10 rounded-2xl p-3 sm:p-4 md:p-6 h-full text-center transition-all duration-200 hover:bg-muted/30 border border-border/20">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-2 sm:mb-3 md:mb-4 ${item.bgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                        <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${item.textColor}`} />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="font-semibold text-xs sm:text-sm md:text-base line-clamp-1 text-foreground">
                          {t(`home.practiceItems.${item.key}.title`)}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                          {t(`home.practiceItems.${item.key}.description`)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}



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
  User,
  TestTube,
  Trophy
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getIconComponent } from "@/components/settings/icon-selector";
import { Language, TranslationData, createTranslationFunction } from "@/lib/i18n";

interface HomePageContentProps {
  language: Language;
  translations: TranslationData;
}

export function HomePageContent({ language, translations }: HomePageContentProps) {
  const t = createTranslationFunction(translations);

  return <HomeContent t={t} language={language} />;
}

interface HomeContentProps {
  t: (key: string) => any;
  language: Language;
}

function HomeContent({ t, language }: HomeContentProps) {
  const { user } = useAuth();

  // If no user (shouldn't happen due to ProtectedRoute), show loading
  if (!user) {
    return <div className="min-h-screen bg-background" />;
  }

  const practiceItems = [
    {
      id: 1,
      key: "jlpt",
      icon: GraduationCap,
      href: "/jlpt", // Clean URL for authenticated users
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 2,
      key: "challenge",
      icon: Trophy,
      href: "/challenge", // Clean URL for authenticated users
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 3,
      key: "driving",
      icon: Car,
      href: "/driving", // Clean URL for authenticated users
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 4,
      key: "study",
      icon: BookOpen,
      href: "/study",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 5,
      key: "library",
      icon: Library,
      href: "/library",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 6,
      key: "irin",
      icon: Bot,
      href: "/irin",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 7,
      key: "upgrade",
      icon: Crown,
      href: "/upgrade",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 8,
      key: "payment",
      icon: CreditCard,
      href: "/payment",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 9,
      key: "settings",
      icon: Settings,
      href: "/settings",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 10,
      key: "resultsDemo",
      icon: TestTube,
      href: "/results-demo",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 11,
      key: "reviewDemo",
      icon: BookOpen,
      href: "/review-demo",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: 12,
      key: "landing",
      icon: GraduationCap,
      href: `/${language}/landing`,
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    }
  ];

  return (
    <div className="app-content">
      {/* User Info Section */}
      <div className="border-b bg-gradient-to-r from-muted/50 to-accent/30 -mx-6 px-6 mb-6">
        <div className="py-6">
            <div className="flex items-center app-gap-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                {(() => {
                  const AvatarIcon = getIconComponent(user.avatarIcon || undefined)
                  return <AvatarIcon className="w-6 h-6 text-primary" />
                })()}
              </div>
              <div className="app-space-xs">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
{t('home.userGreeting').replace('{{name}}', user.name)}
                </h2>
                <div className="flex items-center app-gap-xs mt-1">
                  <span className="inline-flex items-center app-px-xs app-py-xs rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {user.role}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {t('home.userInfo.expiryDate').replace('{{date}}', user.expiryDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Practice Grid Section */}
      <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 app-gap-md sm:app-gap-lg">
            {practiceItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block"
                >
                  <div className="group cursor-pointer bg-muted/10 rounded-2xl p-6 md:p-8 h-full text-center transition-all duration-200 hover:bg-muted/30 border border-border/20">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 ${item.bgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                      <IconComponent className={`w-7 h-7 sm:w-8 sm:h-8 ${item.textColor}`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-1 text-foreground">
                        {t(`home.practiceItems.${item.key}.title`)}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
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
  );
}

// Loading skeleton for home page
function HomePageSkeleton() {
  return (
    <div className="app-content animate-pulse">
      {/* Welcome section skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-muted rounded w-1/3 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>

      {/* Practice items skeleton */}
      <div className="mb-8">
            <div className="h-6 bg-muted rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="mb-8">
        <div className="h-6 bg-muted rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

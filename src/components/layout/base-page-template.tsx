"use client"

import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TranslationData, Language } from "@/lib/i18n";

export interface CardItem {
  id: string;
  title: string;
  description: string;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  bgColor: string;
  textColor: string;
}

export interface BasePageTemplateProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  cards: CardItem[];
  translations: TranslationData;
  language: Language;
  t: (key: string) => any;
}

/**
 * Reusable template for pages that display a grid of navigation cards
 * Eliminates duplicate layouts across JLPT, Driving, Challenge pages
 */
export function BasePageTemplate({
  title,
  subtitle,
  backHref,
  backLabel,
  cards,
  translations,
  language,
  t
}: BasePageTemplateProps) {
  // Calculate grid columns based on item count
  const itemCount = cards.length;
  const getGridCols = () => {
    if (itemCount <= 1) return 'grid-cols-1';
    if (itemCount <= 2) return 'grid-cols-1 sm:grid-cols-2';
    if (itemCount <= 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    if (itemCount <= 4) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center relative app-container">
      {/* Back button positioned absolutely */}
      {backHref && (
        <Link href={backHref} className="absolute left-4 top-8 z-10">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {backLabel || t('common.back')}
          </Button>
        </Link>
      )}
      
      {/* Main content container - perfectly centered */}
      <div className="w-full max-w-7xl mx-auto app-px-md app-py-lg sm:app-px-lg lg:app-px-xl">
        <div className="flex flex-col items-center justify-center app-space-lg sm:app-space-xl">
          {/* Header - centered */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h1>
          </div>

          {/* Card grid - perfectly centered */}
          <div className="w-full flex justify-center">
            <div className={`grid ${getGridCols()} app-gap-md sm:app-gap-lg lg:app-gap-xl place-items-center w-max`}>
              {cards.map((card) => {
                const IconComponent = card.icon;
                
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="group block w-full max-w-[280px] min-w-[200px]"
                  >
                    <div className={`
                      relative app-p-lg sm:app-p-xl rounded-2xl border-2 border-transparent
                      transition-all duration-300 hover:scale-[1.05] hover:shadow-xl
                      h-full flex flex-col backdrop-blur-sm
                      ${card.bgColor}
                    `}>
                      {/* Icon */}
                      <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 app-space-md mx-auto shadow-lg">
                        <IconComponent className={`h-8 w-8 sm:h-10 sm:w-10 ${card.textColor}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="app-space-sm text-center flex-1">
                        <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${card.textColor}`}>
                          {card.title}
                        </h3>
                        {card.subtitle && (
                          <p className={`text-xs sm:text-sm font-medium ${card.textColor}/80`}>
                            {card.subtitle}
                          </p>
                        )}
                        <p className={`text-xs sm:text-sm ${card.textColor}/70 leading-relaxed`}>
                          {card.description}
                        </p>
                      </div>

                      {/* Hover arrow indicator */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/25 flex items-center justify-center shadow-md`}>
                          <ArrowLeft className={`h-3 w-3 sm:h-4 sm:w-4 ${card.textColor} rotate-180`} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Description section - centered */}
          <div className="w-full max-w-3xl mx-auto app-px-md">
            <div className="bg-muted/60 backdrop-blur-sm rounded-2xl app-p-lg sm:app-p-xl border border-border/50 shadow-lg">
              <div className="text-center app-space-sm">
                <div className={`text-base sm:text-lg font-semibold text-foreground`}>
                  {subtitle}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {t('common.instruction') || 'Chọn một tùy chọn phía trên để bắt đầu'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

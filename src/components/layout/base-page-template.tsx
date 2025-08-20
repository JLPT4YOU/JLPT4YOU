"use client"

import { LoadingLink } from "@/components/ui/loading-link";
import { ArrowLeft, LucideIcon } from "lucide-react";
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
  cards,
  translations,
  language,
  t
}: BasePageTemplateProps) {
  // Calculate grid columns based on item count
  const itemCount = cards.length;
  const getGridCols = () => {
    if (itemCount <= 1) return 'grid-cols-1';
    if (itemCount <= 2) return 'grid-cols-2';
    if (itemCount <= 3) return 'grid-cols-2 md:grid-cols-3';
    if (itemCount <= 4) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main content container with improved spacing */}
      <div className="app-container pt-8 sm:pt-12 lg:pt-16 pb-8">
        <div className="app-content">
          <div className="max-w-7xl mx-auto app-space-2xl">

            {/* Header section with better spacing */}
            <div className="text-center app-space-lg">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h1>
            </div>

            {/* Card grid section with enhanced spacing */}
            <div className="flex justify-center app-space-xl">
              <div className={`grid ${getGridCols()} gap-4 sm:gap-6 md:gap-8 place-items-center w-max`}>
                {cards.map((card) => {
                  const IconComponent = card.icon;

                  return (
                    <LoadingLink
                      key={card.id}
                      href={card.href}
                      className="group block w-full max-w-[280px] min-w-[160px]"
                    >
                      <div className={`
                        relative p-4 sm:p-6 md:p-8 rounded-2xl border-2 border-transparent
                        hover-lift
                        h-full flex flex-col backdrop-blur-sm
                        ${card.bgColor}
                      `}>
                        {/* Icon */}
                        <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-muted/30 mb-4 sm:mb-6 mx-auto shadow-lg">
                          <IconComponent className={`h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 ${card.textColor}`} />
                        </div>

                        {/* Content */}
                        <div className="space-y-3 text-center flex-1">
                          <h3 className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-bold ${card.textColor}`}>
                            {card.title}
                          </h3>
                          {card.subtitle && (
                            <p className={`text-sm sm:text-base font-medium ${card.textColor}/80`}>
                              {card.subtitle}
                            </p>
                          )}
                          <p className={`text-sm sm:text-base ${card.textColor}/70 leading-relaxed`}>
                            {card.description}
                          </p>
                        </div>

                        {/* Hover arrow indicator */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/25 flex items-center justify-center shadow-md`}>
                            <ArrowLeft className={`h-4 w-4 sm:h-5 sm:w-5 ${card.textColor} rotate-180`} />
                          </div>
                        </div>
                      </div>
                    </LoadingLink>
                  );
                })}
              </div>
            </div>

            {/* Description section with improved spacing */}
            <div className="max-w-4xl mx-auto app-space-xl">
              <div className="bg-muted/60 backdrop-blur-sm rounded-2xl app-p-xl border border-border/50 shadow-lg">
                <div className="text-center app-space-md">
                  <div className={`text-lg sm:text-xl font-semibold text-foreground`}>
                    {subtitle}
                  </div>
                  <div className="text-base sm:text-lg text-muted-foreground">
                    {t('common.instruction') || 'Chọn một tùy chọn phía trên để bắt đầu'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

"use client"

import { Upload, BookOpen, Plus } from "lucide-react";
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n/";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";

interface OtherLibraryPageContentProps extends BasePageContentProps {
  isAuthenticated: boolean;
}

export const OtherLibraryPageContent = createPageContent<{ isAuthenticated: boolean }>(
  function OtherLibraryPageContentInner({ translations, language, isAuthenticated }: OtherLibraryPageContentProps) {
  const t = createTranslationFunction(translations);
  


  return (
    <div className="min-h-screen bg-background">
      {/* Main content container with improved spacing */}
      <div className="app-container pt-8 sm:pt-12 lg:pt-16 pb-8">
        <div className="app-content">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Header section with better spacing */}
            <div className="text-center space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {t('library.other.page.title')}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-4">
                {t('library.other.page.subtitle')}
              </p>
            </div>

            {/* Coming Soon Section */}
            <div className="flex justify-center space-y-8">
              <div className="max-w-2xl w-full">
                <div className="bg-muted/60 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-lg text-center">
                  
                  {/* Icon */}
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {t('library.other.upload.title')}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {t('library.other.upload.description')}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 rounded-full text-primary font-medium">
                      <Plus className="h-4 w-4" />
                      <span>{t('library.other.upload.subtitle')}</span>
                    </div>
                  </div>

                  {/* Features Preview */}
                  <div className="mt-8 pt-8 border-t border-border/30">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Tính năng sắp tới:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>Upload PDF, EPUB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>Phân loại tự động</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>Tìm kiếm nội dung</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span>Đồng bộ đám mây</span>
                      </div>
                    </div>
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
);

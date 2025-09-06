"use client"

import { Book, FileText, Search, Loader2, AlertCircle } from "lucide-react";
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n/";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Book as BookType, BookCategory } from "@/types/books";

interface BookSelectionPageContentProps extends BasePageContentProps {
  isAuthenticated: boolean;
  category?: BookCategory; // 'n1', 'n2', 'n3', 'n4', 'n5', 'other'
}

export const BookSelectionPageContent = createPageContent<{ isAuthenticated: boolean; category?: BookCategory }>(
  function BookSelectionPageContentInner({ translations, language, isAuthenticated, category }: BookSelectionPageContentProps) {
  const t = createTranslationFunction(translations);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books from API
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('status', 'published'); // Only show published books to users
      if (category) params.append('category', category);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/books?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data.books || []);
    } catch (err) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching books:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  // Load books on component mount and when filters change
  useEffect(() => {
    fetchBooks();
  }, [category, searchTerm]);

  // Filter books (client-side for immediate response)
  const filteredBooks = books.filter(book => {
    const matchesCategory = !category || book.category === category;
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get page title based on category
  const getPageTitle = () => {
    if (!category) return t('library.books.title');
    if (category === 'other') return t('library.other.books.title');
    return `${t('library.jlpt.books.title')} ${category.toUpperCase()}`;
  };

  const getPageSubtitle = () => {
    if (!category) return t('library.books.subtitle');
    if (category === 'other') return t('library.other.books.subtitle');
    return `${t('library.jlpt.books.subtitle')} ${category.toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main content container */}
      <div className="app-container pt-8 sm:pt-12 lg:pt-16 pb-8">
        <div className="app-content">
          <div className="max-w-7xl mx-auto space-y-12">

            {/* Header section */}
            <div className="text-center space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-4">
                {getPageSubtitle()}
              </p>
            </div>

            {/* Search section */}
            <div className="space-y-8">
              <div className="flex justify-center">
                {/* Search input */}
                <div className="w-full max-w-2xl relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder={t('library.books.search.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md mb-6">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Đóng
                </Button>
              </div>
            )}

            {/* Books grid */}
            <div className="space-y-8">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Đang tải sách...</span>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-16">
                  <Book className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {searchTerm ? 'Không tìm thấy sách' : 'Chưa có sách nào'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'Thử thay đổi từ khóa tìm kiếm'
                      : 'Hiện tại chưa có sách nào trong danh mục này'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="group bg-muted/20 rounded-xl p-4 border border-border/20 hover:bg-muted/40 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      onClick={() => {
                        // Use clean URL for authenticated users (no language prefix)
                        router.push(`/library/book/${book.id}`)
                      }}
                    >
                      {/* Book info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                            {book.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {book.description || book.author}
                          </p>
                        </div>

                        {/* Pages info */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{book.pages} {t('library.books.pages')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
  }
);

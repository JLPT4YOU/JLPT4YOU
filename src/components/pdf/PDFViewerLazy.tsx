import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the actual PDFViewer
const PDFViewer = lazy(() => 
  import('./pdf-viewer').then(mod => ({ 
    default: mod.PDFViewer 
  }))
);

export function PDFViewerLazy(props: any) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading PDF viewer...</p>
          </div>
        </div>
      }
    >
      <PDFViewer {...props} />
    </Suspense>
  );
}

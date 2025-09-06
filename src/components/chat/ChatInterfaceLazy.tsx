import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the actual ChatInterface
const ChatInterface = lazy(() => 
  import('./ChatInterface').then(mod => ({ 
    default: mod.ChatInterface 
  }))
);

export function ChatInterfaceLazy(props: any) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChatInterface {...props} />
    </Suspense>
  );
}

import { ThinkingDisplay } from '@/components/chat/ThinkingDisplay';

export default function ThinkingDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <ThinkingDisplay thinking="Demo thinking content..." isVisible={true} />
      </div>
    </div>
  );
}

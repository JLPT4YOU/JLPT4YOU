"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PulsingDotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  className,
  size = 'md',
  color = 'currentColor'
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn(
      "flex items-center justify-center",
      className
    )}>
      <div
        className={cn(
          "rounded-full animate-smooth-pulse",
          sizeClasses[size]
        )}
        style={{
          backgroundColor: color
        }}
      />
    </div>
  );
};

// Message bubble version with AI styling
export const MessagePulsingDot: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  className,
  size = 'md'
}) => {
  return (
    <div className={cn(
      "flex items-start gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-300",
      className
    )}>
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-primary/60 animate-pulse" />
      </div>

      {/* Message Bubble with Pulsing Dot */}
      <div className="flex-1 max-w-[85%]">
        <div
          className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
          style={{
            backgroundColor: 'var(--chat-assistant-bg, hsl(var(--muted)))',
            color: 'var(--chat-assistant-text, hsl(var(--foreground)))'
          }}
        >
          <PulsingDot
            size={size}
            color="var(--chat-assistant-text, hsl(var(--foreground)))"
          />
        </div>
      </div>
    </div>
  );
};

// Inline version for use inside existing message bubbles
export const InlinePulsingDot: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  className,
  size = 'sm'
}) => {
  return (
    <div className={cn("inline-flex items-center py-1", className)}>
      <PulsingDot size={size} />
    </div>
  );
};

// Legacy exports for backward compatibility
export const ThreeDots = PulsingDot;
export const MessageThreeDots = MessagePulsingDot;
export const InlineThreeDots = InlinePulsingDot;

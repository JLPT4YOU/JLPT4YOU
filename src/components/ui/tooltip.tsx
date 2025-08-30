'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  side = 'top',
  className 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = (event: React.MouseEvent) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = 0;
      let y = 0;

      switch (side) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 8;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 8;
          break;
        case 'left':
          x = rect.left - 8;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 8;
          y = rect.top + rect.height / 2;
          break;
      }

      setPosition({ x, y });
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={() => showTooltip({} as React.MouseEvent)}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            'fixed z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none',
            'animate-in fade-in-0 zoom-in-95',
            side === 'top' && 'mb-2 -translate-x-1/2 -translate-y-full',
            side === 'bottom' && 'mt-2 -translate-x-1/2',
            side === 'left' && 'mr-2 -translate-x-full -translate-y-1/2',
            side === 'right' && 'ml-2 -translate-y-1/2',
            className
          )}
          style={{
            left: side === 'left' || side === 'right' ? position.x : position.x,
            top: side === 'top' || side === 'bottom' ? position.y : position.y,
            transform: 
              side === 'top' ? 'translate(-50%, -100%)' :
              side === 'bottom' ? 'translate(-50%, 0%)' :
              side === 'left' ? 'translate(-100%, -50%)' :
              'translate(0%, -50%)'
          }}
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 rotate-45',
              side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
              side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
              side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
              side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
            )}
          />
        </div>
      )}
    </>
  );
};

// Provider component (for compatibility with shadcn/ui patterns)
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Trigger component (for compatibility with shadcn/ui patterns)
const TooltipTrigger: React.FC<{ 
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  if (asChild) {
    return <>{children}</>;
  }
  return <div className="inline-block">{children}</div>;
};

// Content component (for compatibility with shadcn/ui patterns)
const TooltipContent: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

// Simple tooltip hook for programmatic usage
export const useTooltip = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev)
  };
};

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };

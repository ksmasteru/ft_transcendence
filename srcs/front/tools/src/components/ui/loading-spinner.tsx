import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-muted border-t-primary",
      sizeClasses[size],
      className
    )} />
  );
};

interface LoadingOverlayProps {
  children?: React.ReactNode;
  text?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  children,
  text = "Loading..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <LoadingSpinner size="lg" />
      {children || <p className="text-muted-foreground">{text}</p>}
    </div>
  );
};
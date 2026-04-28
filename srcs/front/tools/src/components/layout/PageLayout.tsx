import React from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { useUserData } from '@/hooks/useUserData';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  showHeader = true,
  showSidebar = true
}) => {
  const { userData, loading, error } = useUserData();

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <LoadingOverlay text="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-destructive text-lg text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-background via-card to-muted text-foreground font-sans min-h-screen",
      className
    )}>
      <div className="flex h-full min-h-screen">
        {showSidebar && <Sidebar avatar={userData?.avatar} />}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showHeader && <Header currentUser={userData} />}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
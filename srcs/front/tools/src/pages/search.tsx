import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { AdvancedSearch } from '../components/search/AdvancedSearch';

export default function SearchPage() {
  return (
    <PageLayout>
      <div className="ping-pong-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold mb-2 text-gaming-primary">
              Advanced Search
            </h1>
            <p className="text-muted-foreground text-lg">
              Find players, games, and tournaments to level up your game
            </p>
          </div>
          
          <AdvancedSearch />
        </div>
      </div>
    </PageLayout>
  );
}
import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { NotificationCenter } from '../components/notifications/NotificationCenter';

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="ping-pong-bg min-h-screen">
        <div className="max-w-4xl mx-auto">
          <NotificationCenter />
        </div>
      </div>
    </PageLayout>
  );
}
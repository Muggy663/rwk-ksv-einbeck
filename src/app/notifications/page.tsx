"use client";

import React from 'react';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Benachrichtigungen
        </h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Ihre Push-Benachrichtigungen für die RWK App Einbeck.
        </p>
      </div>

      <NotificationSettings />
    </div>
  );
}

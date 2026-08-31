"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationService } from "@/lib/services/notification-service";
import { useAuth } from "@/hooks/use-auth";

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Aktualisiere alle 30 Sekunden
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const notifications = await NotificationService.getUserNotifications(user.uid);
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      logError('Fehler beim Laden der Benachrichtigungen:', error);
    }
  };

  if (!user) return null;

  return (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

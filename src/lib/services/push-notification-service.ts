import { logDebug, logError } from '@/lib/utils/secure-logger';

export class PushNotificationService {
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  async subscribe(email?: string, types: string[] = []): Promise<void> {
    if (!this.isNotificationSupported()) {
      throw new Error('Notifications not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied by user');
      }

      logDebug('Subscribed:', { email, types });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during subscription';
      logError('Fehler beim Abonnieren von Benachrichtigungen:', error);
      throw new Error(`Failed to subscribe to notifications: ${errorMessage}`);
    }
  }

  async unsubscribe(email?: string): Promise<void> {
    try {
      if (!email) {
        throw new Error('Email is required for unsubscribe');
      }
      
      logDebug('Unsubscribed:', email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during unsubscribe';
      logError('Fehler beim Abbestellen von Benachrichtigungen:', error);
      throw new Error(`Failed to unsubscribe from notifications: ${errorMessage}`);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
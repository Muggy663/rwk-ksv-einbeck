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

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission denied');
    }

    // TODO: Implement actual subscription logic
    console.log('Subscribed:', { email, types });
  }

  async unsubscribe(email?: string): Promise<void> {
    // TODO: Implement actual unsubscription logic
    console.log('Unsubscribed:', email);
  }
}

export const pushNotificationService = new PushNotificationService();

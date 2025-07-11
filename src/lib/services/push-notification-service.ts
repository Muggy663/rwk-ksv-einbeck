import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export interface NotificationSubscription {
  id?: string;
  token: string;
  userId?: string;
  userEmail?: string;
  subscriptionTypes: string[];
  createdAt: Date;
  lastUsed: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: 'result' | 'event' | 'news' | 'protest';
  url?: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  private messaging: any = null;
  private isSupported = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMessaging();
    }
  }

  private async initializeMessaging() {
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Push notifications not supported');
        return;
      }

      // Register service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const { getMessaging } = await import('firebase/messaging');
      this.messaging = getMessaging();
      this.isSupported = true;
      
      console.log('Push notifications initialized');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission(): Promise<string | null> {
    if (!this.isSupported || !this.messaging) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: 'BP-nYBdzeYMeejstpMcgeyKO15zj6c2DriBTNq0IDhJP5vSvkeiunNky1cfTxRDTQF3tPDiAif-K-vB0Ab85mr8'
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(userEmail?: string, subscriptionTypes: string[] = ['all']): Promise<void> {
    try {
      const token = await this.requestPermission();
      if (!token) return;

      // Check if subscription already exists
      const existingQuery = query(
        collection(db, 'notification_subscriptions'),
        where('token', '==', token)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        console.log('Subscription already exists');
        return;
      }

      // Save subscription to Firestore
      const subscription: Omit<NotificationSubscription, 'id'> = {
        token,
        userEmail,
        subscriptionTypes,
        createdAt: new Date(),
        lastUsed: new Date()
      };

      await addDoc(collection(db, 'notification_subscriptions'), subscription);
      console.log('Push notification subscription saved');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userEmail?: string): Promise<void> {
    try {
      const token = await this.requestPermission();
      if (!token) return;

      // Find and delete subscription
      const subscriptionQuery = query(
        collection(db, 'notification_subscriptions'),
        where('token', '==', token)
      );
      
      const subscriptionDocs = await getDocs(subscriptionQuery);
      
      for (const subscriptionDoc of subscriptionDocs.docs) {
        await deleteDoc(doc(db, 'notification_subscriptions', subscriptionDoc.id));
      }

      console.log('Push notification subscription removed');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      // Ignoriere Berechtigungsfehler - Subscription ist trotzdem entfernt
      if (error instanceof Error && error.message.includes('permissions')) {
        console.log('Subscription removed despite permission error');
        return;
      }
      throw error;
    }
  }

  /**
   * Listen for foreground messages
   */
  onMessage(callback: (payload: any) => void): void {
    if (!this.isSupported || !this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission | null {
    if (!('Notification' in window)) return null;
    return Notification.permission;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

/**
 * Send push notification to all subscribers (server-side function)
 * This would typically be called from a Cloud Function or API route
 */
export async function sendPushNotification(
  payload: PushNotificationPayload,
  targetUsers?: string[]
): Promise<void> {
  try {
    // Get all subscriptions or filter by target users
    let subscriptionsQuery = collection(db, 'notification_subscriptions');
    
    if (targetUsers && targetUsers.length > 0) {
      subscriptionsQuery = query(
        collection(db, 'notification_subscriptions'),
        where('userEmail', 'in', targetUsers)
      ) as any;
    }

    const subscriptions = await getDocs(subscriptionsQuery);
    
    if (subscriptions.empty) {
      console.log('No notification subscriptions found');
      return;
    }

    // This would typically be done server-side with Firebase Admin SDK
    console.log(`Would send notification to ${subscriptions.size} subscribers:`, payload);
    
    // Store notification in database for history
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      sentAt: new Date(),
      recipientCount: subscriptions.size
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}
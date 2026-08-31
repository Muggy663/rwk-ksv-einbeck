import { db } from '@/lib/firebase/config';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, updateDoc, orderBy, limit } from 'firebase/firestore';

export interface NotificationPreferences {
  // E-Mail Benachrichtigungen (Opt-in)
  emailGroupInvites: boolean;
  emailCompetitionInvites: boolean;
  emailCompetitionResults: boolean;
  emailWeeklyDigest: boolean;
  
  // Browser Push-Benachrichtigungen (Opt-in)
  pushGroupActivity: boolean;
  pushCompetitionUpdates: boolean;
  pushDirectMessages: boolean;
  
  // In-App Benachrichtigungen (Standard aktiviert)
  inAppAll: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'group_invite' | 'competition_invite' | 'competition_started' | 'competition_finished' | 'group_joined' | 'result_achieved';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export class NotificationService {
  
  // Notification-Einstellungen speichern
  static async savePreferences(userId: string, preferences: NotificationPreferences) {
    const preferencesRef = doc(db, 'user_permissions', userId);
    
    await updateDoc(preferencesRef, {
      notificationPreferences: preferences,
      updatedAt: new Date()
    });
  }
  
  // Notification-Einstellungen laden
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    const preferencesRef = doc(db, 'user_permissions', userId);
    const preferencesDoc = await getDoc(preferencesRef);
    
    if (!preferencesDoc.exists()) {
      // Standard-Einstellungen (Opt-in Prinzip)
      return {
        emailGroupInvites: false,
        emailCompetitionInvites: false,
        emailCompetitionResults: false,
        emailWeeklyDigest: false,
        pushGroupActivity: false,
        pushCompetitionUpdates: false,
        pushDirectMessages: false,
        inAppAll: true // Nur In-App standardmäßig aktiviert
      };
    }
    
    const userData = preferencesDoc.data();
    return userData.notificationPreferences || {
      emailGroupInvites: false,
      emailCompetitionInvites: false,
      emailCompetitionResults: false,
      emailWeeklyDigest: false,
      pushGroupActivity: false,
      pushCompetitionUpdates: false,
      pushDirectMessages: false,
      inAppAll: true
    };
  }
  
  // In-App Notification erstellen
  static async createNotification(notification: Omit<Notification, 'id'>) {
    // Prüfe ob User In-App Notifications aktiviert hat
    const preferences = await this.getPreferences(notification.userId);
    if (!preferences.inAppAll) {
      return; // User hat In-App Notifications deaktiviert
    }
    
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      createdAt: new Date()
    });
    
    return notificationRef.id;
  }
  
  // E-Mail-Benachrichtigung senden (nur mit Opt-in)
  static async sendEmailNotification(userId: string, type: keyof NotificationPreferences, emailData: {
    subject: string;
    template: string;
    data: any;
  }) {
    const preferences = await this.getPreferences(userId);
    
    // Prüfe ob User diese Art von E-Mail-Benachrichtigung aktiviert hat
    if (!preferences[type]) {
      logDebug(`User ${userId} hat ${type} E-Mail-Benachrichtigungen deaktiviert`);
      return;
    }
    
    // Lade User-E-Mail
    const userRef = doc(db, 'user_permissions', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User nicht gefunden');
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    if (!userEmail) {
      throw new Error('User hat keine E-Mail-Adresse');
    }
    
    // Sende E-Mail über bestehende API
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          subject: emailData.subject,
          template: emailData.template,
          data: {
            ...emailData.data,
            userName: userData.displayName || 'Schütze',
            unsubscribeUrl: `/notifications/unsubscribe?userId=${userId}&type=${type}`
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('E-Mail konnte nicht gesendet werden');
      }
      
      logDebug(`E-Mail-Benachrichtigung ${type} an ${userEmail} gesendet`);
    } catch (error) {
      logError('Fehler beim Senden der E-Mail:', error);
      throw error;
    }
  }
  
  // Browser Push-Notification senden (nur mit Opt-in)
  static async sendPushNotification(userId: string, type: keyof NotificationPreferences, pushData: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }) {
    const preferences = await this.getPreferences(userId);
    
    // Prüfe ob User diese Art von Push-Benachrichtigung aktiviert hat
    if (!preferences[type]) {
      logDebug(`User ${userId} hat ${type} Push-Benachrichtigungen deaktiviert`);
      return;
    }
    
    // TODO: Implementiere Browser Push API
    // Hier würde die Service Worker Push API verwendet werden
    logDebug(`Push-Benachrichtigung ${type} für User ${userId}:`, pushData);
  }
  
  // Gruppen-Einladung senden (mit allen aktivierten Kanälen)
  static async sendGroupInvitation(invitedUserId: string, groupName: string, inviterName: string, groupId: string) {
    // In-App Notification
    await this.createNotification({
      userId: invitedUserId,
      type: 'group_invite',
      title: 'Gruppen-Einladung',
      message: `${inviterName} hat Sie zur Trainingsgruppe "${groupName}" eingeladen.`,
      data: { groupId, inviterName },
      read: false
    });
    
    // E-Mail (nur wenn aktiviert)
    try {
      await this.sendEmailNotification(invitedUserId, 'emailGroupInvites', {
        subject: `Einladung zur Trainingsgruppe "${groupName}"`,
        template: 'group-invitation',
        data: {
          groupName,
          inviterName,
          groupId,
          acceptUrl: `/training-groups/join?code=${groupId}` // TODO: Join-Code verwenden
        }
      });
    } catch (error) {
      logError('E-Mail-Benachrichtigung fehlgeschlagen:', error);
    }
    
    // Push-Notification (nur wenn aktiviert)
    try {
      await this.sendPushNotification(invitedUserId, 'pushDirectMessages', {
        title: 'Gruppen-Einladung',
        body: `${inviterName} hat Sie zu "${groupName}" eingeladen`,
        data: { groupId }
      });
    } catch (error) {
      logError('Push-Benachrichtigung fehlgeschlagen:', error);
    }
  }
  
  // Wettkampf-Start Benachrichtigung
  static async sendCompetitionStarted(participantIds: string[], competitionName: string, competitionId: string) {
    for (const userId of participantIds) {
      try {
        await this.createNotification({
          userId,
          type: 'competition_started',
          title: 'Wettkampf gestartet',
          message: `Der Live-Wettkampf "${competitionName}" hat begonnen!`,
          data: { competitionId },
          read: false
        });
      } catch (error) {
        logError('In-App-Benachrichtigung fehlgeschlagen:', error);
      }
      
      try {
        await this.sendPushNotification(userId, 'pushCompetitionUpdates', {
          title: 'Wettkampf gestartet!',
          body: `"${competitionName}" hat begonnen`,
          data: { competitionId }
        });
      } catch (error) {
        logError('Push-Benachrichtigung fehlgeschlagen:', error);
      }
    }
  }
  
  // Wettkampf-Ergebnis Benachrichtigung
  static async sendCompetitionResult(userId: string, competitionName: string, position: number, totalParticipants: number) {
    const positionText = position === 1 ? '🥇 1. Platz' : 
                        position === 2 ? '🥈 2. Platz' : 
                        position === 3 ? '🥉 3. Platz' : 
                        `${position}. Platz`;
    
    try {
      await this.createNotification({
        userId,
        type: 'result_achieved',
        title: 'Wettkampf-Ergebnis',
        message: `Sie haben ${positionText} von ${totalParticipants} Teilnehmern in "${competitionName}" erreicht!`,
        data: { competitionName, position, totalParticipants },
        read: false
      });
    } catch (error) {
      logError('In-App-Benachrichtigung fehlgeschlagen:', error);
    }
    
    try {
      await this.sendEmailNotification(userId, 'emailCompetitionResults', {
        subject: `Ihr Wettkampf-Ergebnis: ${positionText}`,
        template: 'competition-result',
        data: {
          competitionName,
          position,
          positionText,
          totalParticipants
        }
      });
    } catch (error) {
      logError('E-Mail-Benachrichtigung fehlgeschlagen:', error);
    }
  }
  
  // User-Notifications laden
  static async getUserNotifications(userId: string, limitCount: number = 20): Promise<Notification[]> {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  }
  
  // Notification als gelesen markieren
  static async markAsRead(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  }
  
  // Alle Notifications als gelesen markieren
  static async markAllAsRead(userId: string) {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
  }
}

import { doc, getDoc } from 'firebase/firestore';
import { logError } from '@/lib/utils/secure-logger';
import { db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
}

export class UserService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'user_permissions', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: userId,
          displayName: data.displayName,
          email: data.email
        };
      }
      return null;
    } catch (error) {
      logError('Error loading user profile:', error);
      return null;
    }
  }

  static async getUserProfiles(userIds: string[]): Promise<{ [userId: string]: UserProfile }> {
    const profiles: { [userId: string]: UserProfile } = {};
    
    try {
      const { getDocsFromServer } = await import('firebase/firestore');
      const { collection, query, where, documentId } = await import('firebase/firestore');
      
      if (userIds.length === 0) return profiles;
      
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const q = query(collection(db, 'user_permissions'), where(documentId(), 'in', batch));
        const snapshot = await getDocsFromServer(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          profiles[doc.id] = {
            uid: doc.id,
            displayName: data.displayName,
            email: data.email
          };
        });
      }
    } catch (error) {
      logError('Error loading user profiles:', error);
    }
    
    return profiles;
  }
}
import { doc, getDoc } from 'firebase/firestore';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
    
    await Promise.all(
      userIds.map(async (userId) => {
        const profile = await this.getUserProfile(userId);
        if (profile) {
          profiles[userId] = profile;
        }
      })
    );
    
    return profiles;
  }
}
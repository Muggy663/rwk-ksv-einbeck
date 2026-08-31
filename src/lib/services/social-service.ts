import { db } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/secure-logger';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile } from '@/types/social';

export class SocialService {
  
  // Profil-Freigabe verwalten
  static async updateProfileSettings(userId: string, settings: {
    isPublic: boolean;
    shareResults: boolean;
    availableForCompetitions: boolean;
    showClubAffiliation: boolean;
  }) {
    const userPermissionsRef = doc(db, 'user_permissions', userId);
    
    await updateDoc(userPermissionsRef, {
      'socialSettings': settings,
      updatedAt: new Date()
    });
    
    // Wenn öffentlich, erstelle public_profile
    if (settings.isPublic) {
      await this.createPublicProfile(userId);
    } else {
      await this.removePublicProfile(userId);
    }
  }
  
  // Öffentliches Profil erstellen
  static async createPublicProfile(userId: string) {
    const userPermissionsRef = doc(db, 'user_permissions', userId);
    const userPermissions = await getDoc(userPermissionsRef);
    
    if (!userPermissions.exists()) return;
    
    const userData = userPermissions.data();
    
    // Statistiken aus schiessnachweis_data berechnen
    const stats = await this.calculateUserStatistics(userId);
    
    const publicProfile: Partial<UserProfile> = {
      uid: userId,
      displayName: userData.displayName || 'Unbekannt',
      email: userData.email,
      clubId: userData.clubId,
      isPublic: true,
      shareResults: userData.socialSettings?.shareResults || false,
      availableForCompetitions: userData.socialSettings?.availableForCompetitions || false,
      showClubAffiliation: userData.socialSettings?.showClubAffiliation || false,
      statistics: userData.socialSettings?.shareResults ? stats : undefined,
      lastActive: new Date()
    };
    
    const publicProfileRef = doc(db, 'public_profiles', userId);
    await setDoc(publicProfileRef, publicProfile);
  }
  
  // Statistiken aus bestehenden Schießnachweis-Daten berechnen
  static async calculateUserStatistics(userId: string) {
    try {
      const schiessnachweisDatenRef = doc(db, 'schiessnachweis_data', userId);
      const schiessnachweisDaten = await getDoc(schiessnachweisDatenRef);
      
      if (!schiessnachweisDaten.exists()) {
        return {
          totalTrainings: 0,
          totalCompetitions: 0,
          favoriteDiscipline: '',
          bestResult: { discipline: '', score: 0, date: new Date() },
          recentActivity: new Date()
        };
      }
      
      const data = schiessnachweisDaten.data();
      const einträge = data.einträge || [];
      
      const trainings = einträge.filter((e: any) => e.typ === 'training');
      const wettkämpfe = einträge.filter((e: any) => e.typ === 'wettkampf' || e.typ === 'meisterschaft');
      
      // Lieblingsdisziplin ermitteln
      const disziplinCount: { [key: string]: number } = {};
      einträge.forEach((eintrag: any) => {
        disziplinCount[eintrag.disziplin] = (disziplinCount[eintrag.disziplin] || 0) + 1;
      });
      
      const favoriteDiscipline = Object.keys(disziplinCount).reduce((a, b) => 
        disziplinCount[a] > disziplinCount[b] ? a : b, ''
      );
      
      // Bestes Ergebnis ermitteln
      const bestResult = einträge.reduce((best: any, current: any) => {
        return current.ergebnis > best.ergebnis ? current : best;
      }, { ergebnis: 0, disziplin: '', datum: new Date() });
      
      // Letzte Aktivität
      const recentActivity = einträge.length > 0 
        ? new Date(Math.max(...einträge.map((e: any) => new Date(e.datum.seconds * 1000).getTime())))
        : new Date();
      
      return {
        totalTrainings: trainings.length,
        totalCompetitions: wettkämpfe.length,
        favoriteDiscipline,
        bestResult: {
          discipline: bestResult.disziplin,
          score: bestResult.ergebnis,
          date: new Date(bestResult.datum.seconds * 1000)
        },
        recentActivity
      };
    } catch (error) {
      logError('Error calculating user statistics:', error);
      return {
        totalTrainings: 0,
        totalCompetitions: 0,
        favoriteDiscipline: '',
        bestResult: { discipline: '', score: 0, date: new Date() },
        recentActivity: new Date()
      };
    }
  }
  
  // Öffentliches Profil entfernen
  static async removePublicProfile(userId: string) {
    const publicProfileRef = doc(db, 'public_profiles', userId);
    await setDoc(publicProfileRef, { deleted: true });
  }
  
  // Öffentliche Profile suchen
  static async searchPublicProfiles(searchTerm: string = '') {
    const publicProfilesRef = collection(db, 'public_profiles');
    let q = query(publicProfilesRef, where('isPublic', '==', true));
    
    const snapshot = await getDocs(q);
    let profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Client-seitige Filterung nach Suchbegriff
    if (searchTerm) {
      profiles = profiles.filter(profile => 
        profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.clubName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return profiles;
  }
  
  // Prüfe ob User Premium hat (für Live-Wettkämpfe)
  static async checkPremiumStatus(userId: string): Promise<boolean> {
    const userPermissionsRef = doc(db, 'user_permissions', userId);
    const userPermissions = await getDoc(userPermissionsRef);
    
    if (!userPermissions.exists()) return false;
    
    const userData = userPermissions.data();
    return userData.isPremium === true;
  }
}

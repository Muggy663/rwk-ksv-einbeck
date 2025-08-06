// src/lib/services/km-auth-service.ts
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import type { KMUserPermission } from '@/types/km-auth';

export const kmAuthService = {
  async checkKMPermission(uid: string) {
    try {

      
      // VEREINFACHT: Admin hat immer Vollzugriff
      if (uid === 'nr4qSNvqUoZvtD9tUSPhhiQmMWj2') {

        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const allClubIds = clubsSnapshot.docs.map(doc => doc.id);
        
        return {
          hasAccess: true,
          isActive: true,
          clubIds: allClubIds,
          role: 'admin'
        };
      }
      
      // Prüfe RWK-Berechtigung für andere Benutzer
      const rwkPermissionDoc = await getDoc(doc(db, 'user_permissions', uid));
      
      if (!rwkPermissionDoc.exists()) {

        return { hasAccess: false, isActive: false, clubIds: [], role: '' };
      }
      
      const rwkPermission = rwkPermissionDoc.data();

      
      // Admin hat vollen Zugriff
      if (rwkPermission.role === 'superadmin') {
        // Lade alle Club-IDs für Admin
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const allClubIds = clubsSnapshot.docs.map(doc => doc.id);
        
        return {
          hasAccess: true,
          isActive: true,
          clubIds: allClubIds,
          role: 'admin'
        };
      }
      
      // KM-Organisator hat vollen Zugriff (ohne Admin-Buttons)
      if (rwkPermission.role === 'km_organisator') {
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const allClubIds = clubsSnapshot.docs.map(doc => doc.id);
        
        return {
          hasAccess: true,
          isActive: true,
          clubIds: allClubIds,
          role: 'km_organisator'
        };
      }
      
      // Prüfe ob Benutzer Vereinsvertreter ist
      if (rwkPermission.role !== 'vereinsvertreter') {

        return { hasAccess: false, isActive: false, clubIds: [], role: rwkPermission.role };
      }
      
      // Sammle Club-IDs für Vereinsvertreter
      const clubIds = [];
      
      // Haupt-Club-ID
      if (rwkPermission.clubId) {
        clubIds.push(rwkPermission.clubId);
      }
      
      // Zusätzliche Clubs aus representedClubs
      if (rwkPermission.representedClubs && Array.isArray(rwkPermission.representedClubs)) {
        clubIds.push(...rwkPermission.representedClubs);
      }
      
      // Duplikate entfernen
      const uniqueClubIds = [...new Set(clubIds)];

      
      return {
        hasAccess: true,
        isActive: true,
        clubIds: uniqueClubIds,
        role: 'vereinsvertreter'
      };
      
    } catch (error) {
      console.error('Error checking KM permission:', error);
      return { hasAccess: false, isActive: false, clubIds: [], role: '' };
    }
  }
};

export async function getKMUserPermission(uid: string): Promise<KMUserPermission | null> {
  const permission = await kmAuthService.checkKMPermission(uid);
  if (!permission.hasAccess) return null;
  
  return {
    uid,
    email: '',
    displayName: '',
    role: permission.role as any,
    clubIds: permission.clubIds,
    isActive: permission.isActive,
    createdAt: new Date(),
    lastLogin: new Date()
  };
}

export function hasKMAdminAccess(permission: KMUserPermission | null): boolean {
  return permission?.role === 'km_admin' && permission.isActive;
}

export function hasKMOrganizerAccess(permission: KMUserPermission | null): boolean {
  return (permission?.role === 'km_admin' || permission?.role === 'km_organizer') && 
         permission.isActive;
}

export function hasVereinAccess(permission: KMUserPermission | null, clubId: string): boolean {
  return permission?.role === 'verein_vertreter' && 
         (permission.clubIds?.includes(clubId) || permission.clubId === clubId) && 
         permission.isActive;
}

// src/lib/services/km-auth-service.ts
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { KMUserPermission } from '@/types/km-auth';

export async function getKMUserPermission(uid: string): Promise<KMUserPermission | null> {
  try {
    console.log('Loading KM permission for UID:', uid);
    
    // SuperAdmin-Check
    if (uid === 'nr4qSNvqUoZvtD9tUSPhhiQmMWj2') {
      console.log('SuperAdmin detected, granting KM admin access');
      return {
        uid,
        email: 'admin@rwk-einbeck.de',
        displayName: 'Super Admin',
        role: 'km_admin',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };
    }
    
    // Direkt RWK-Berechtigung verwenden
    const rwkDocRef = doc(db, 'user_permissions', uid);
    const rwkDocSnap = await getDoc(rwkDocRef);
    
    if (rwkDocSnap.exists()) {
      const rwkPermission = rwkDocSnap.data();
      console.log('RWK Permission found:', rwkPermission);
      
      // Nur Vereinsvertreter bekommen KM-Zugang (keine Mannschaftsführer)
      if (rwkPermission.role === 'admin' || rwkPermission.role === 'superadmin') {
        return {
          uid,
          email: rwkPermission.email,
          displayName: rwkPermission.displayName,
          role: 'km_admin',
          clubIds: rwkPermission.clubIds || (rwkPermission.clubId ? [rwkPermission.clubId] : []),
          isActive: true, // KM-Zugang ist aktiv für RWK-Admins
          createdAt: rwkPermission.createdAt || new Date(),
          lastLogin: rwkPermission.lastLogin
        };
      } else if (rwkPermission.role === 'vereinsvertreter') {
        // Multi-Verein-Support: representedClubs Array verwenden
        const clubIds = rwkPermission.representedClubs || 
                       rwkPermission.clubIds || 
                       (rwkPermission.clubId ? [rwkPermission.clubId] : []);
        
        console.log('Club IDs for KM:', clubIds);
        
        return {
          uid,
          email: rwkPermission.email,
          displayName: rwkPermission.displayName,
          role: 'verein_vertreter',
          clubIds: clubIds,
          isActive: true, // KM-Zugang ist aktiv für RWK-Vereinsvertreter
          createdAt: rwkPermission.createdAt || new Date(),
          lastLogin: rwkPermission.lastLogin
        };
      }
      
      console.log('No KM access for role:', rwkPermission.role);
      return null;
    }
    
    console.log('No RWK permissions found for UID:', uid);
    return null;
  } catch (error) {
    console.error('Fehler beim Laden der KM-Berechtigung:', error);
    return null;
  }
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
// src/lib/services/cloud-sync-service.ts
"use client";

import { SchießEintrag } from "@/types/schiessnachweis";
import { PremiumService } from "./premium-service";

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

export interface CloudData {
  einträge: SchießEintrag[];
  lastModified: Date;
  deviceId: string;
}

export class CloudSyncService {
  private static CLOUD_STORAGE_KEY = 'schiessnachweis_cloud_data';
  private static SYNC_STATUS_KEY = 'schiessnachweis_sync_status';
  private static DEVICE_ID_KEY = 'schiessnachweis_device_id';

  static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  static getSyncStatus(): SyncStatus {
    if (typeof window === 'undefined') {
      return {
        isOnline: false,
        lastSync: null,
        pendingChanges: 0,
        syncInProgress: false
      };
    }

    try {
      const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (!stored) {
        return {
          isOnline: navigator.onLine,
          lastSync: null,
          pendingChanges: 0,
          syncInProgress: false
        };
      }

      const status = JSON.parse(stored);
      return {
        ...status,
        isOnline: navigator.onLine,
        lastSync: status.lastSync ? new Date(status.lastSync) : null
      };
    } catch (error) {
      console.error('Fehler beim Laden des Sync-Status:', error);
      return {
        isOnline: navigator.onLine,
        lastSync: null,
        pendingChanges: 0,
        syncInProgress: false
      };
    }
  }

  static updateSyncStatus(updates: Partial<SyncStatus>): void {
    if (typeof window === 'undefined') return;

    const current = this.getSyncStatus();
    const updated = { ...current, ...updates };
    
    localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(updated));
    
    // Event für UI-Updates
    window.dispatchEvent(new CustomEvent('syncStatusChanged', { 
      detail: updated 
    }));
  }

  static async syncToCloud(einträge: SchießEintrag[]): Promise<boolean> {
    if (!(await PremiumService.isPremium())) {
      throw new Error('Cloud-Sync ist nur für Premium-Nutzer verfügbar');
    }

    if (!navigator.onLine) {
      throw new Error('Keine Internetverbindung');
    }

    this.updateSyncStatus({ syncInProgress: true });

    try {
      console.log('Speichere in Firebase:', einträge.length, 'Einträge');
      
      // Firebase-Imports
      const { doc, setDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase/config');
      
      if (!auth.currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }
      
      const cloudData: CloudData = {
        einträge,
        lastModified: new Date(),
        deviceId: this.getDeviceId()
      };
      
      // In Firebase speichern
      await setDoc(doc(db, 'schiessnachweis_data', auth.currentUser.uid), cloudData);
      console.log('✅ Firebase gespeichert:', auth.currentUser.uid, '- Einträge:', einträge.length);

      // Auch lokal als Backup speichern
      localStorage.setItem(this.CLOUD_STORAGE_KEY, JSON.stringify(cloudData));
      
      this.updateSyncStatus({
        lastSync: new Date(),
        pendingChanges: 0,
        syncInProgress: false
      });

      return true;
    } catch (error) {
      console.error('Cloud-Sync fehlgeschlagen:', error);
      this.updateSyncStatus({ syncInProgress: false });
      throw error;
    }
  }

  static async syncFromCloud(): Promise<SchießEintrag[]> {
    if (!(await PremiumService.isPremium())) {
      throw new Error('Cloud-Sync ist nur für Premium-Nutzer verfügbar');
    }

    if (!navigator.onLine) {
      throw new Error('Keine Internetverbindung');
    }

    this.updateSyncStatus({ syncInProgress: true });

    try {
      console.log('Lade Daten aus Firebase...');
      
      // Firebase-Imports
      const { doc, getDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase/config');
      
      if (!auth.currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }
      
      const docRef = doc(db, 'schiessnachweis_data', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('Keine Cloud-Daten für User:', auth.currentUser.uid);
        this.updateSyncStatus({ syncInProgress: false });
        return [];
      }
      
      const cloudData = docSnap.data() as CloudData;
      console.log('✅ Firebase geladen:', auth.currentUser.uid, '- Einträge:', cloudData.einträge.length);
      
      // Konvertiere Datum-Strings zurück zu Date-Objekten
      const einträge = cloudData.einträge.map(eintrag => ({
        ...eintrag,
        datum: new Date(eintrag.datum),
        createdAt: new Date(eintrag.createdAt)
      }));

      this.updateSyncStatus({
        lastSync: new Date(),
        syncInProgress: false
      });

      return einträge;
    } catch (error) {
      console.error('Cloud-Download fehlgeschlagen:', error);
      this.updateSyncStatus({ syncInProgress: false });
      throw error;
    }
  }

  static async autoSync(einträge: SchießEintrag[]): Promise<void> {
    if (!(await PremiumService.isPremium()) || !navigator.onLine) {
      return;
    }

    const status = this.getSyncStatus();
    
    // Auto-Sync nur wenn letzte Sync älter als 30 Sekunden (für bessere UX)
    if (status.lastSync && (Date.now() - status.lastSync.getTime()) < 30 * 1000) {
      return;
    }

    try {
      await this.syncToCloud(einträge);
      console.log('✅ Auto-Sync erfolgreich');
    } catch (error) {
      console.warn('Auto-Sync fehlgeschlagen:', error);
    }
  }

  static markPendingChanges(count: number = 1): void {
    const status = this.getSyncStatus();
    this.updateSyncStatus({
      pendingChanges: status.pendingChanges + count
    });
    
    // Event für UI-Updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('syncStatusChanged', { 
        detail: this.getSyncStatus() 
      }));
    }
  }

  static getCloudInfo(): { hasCloudData: boolean; lastModified: Date | null; deviceId: string | null } {
    if (typeof window === 'undefined') {
      return { hasCloudData: false, lastModified: null, deviceId: null };
    }

    try {
      const stored = localStorage.getItem(this.CLOUD_STORAGE_KEY);
      if (!stored) {
        return { hasCloudData: false, lastModified: null, deviceId: null };
      }

      const cloudData: CloudData = JSON.parse(stored);
      return {
        hasCloudData: true,
        lastModified: new Date(cloudData.lastModified),
        deviceId: cloudData.deviceId
      };
    } catch (error) {
      return { hasCloudData: false, lastModified: null, deviceId: null };
    }
  }
}
// src/lib/services/cloud-sync-service.ts
"use client";

import { SchießEintrag } from "@/types/schiessnachweis";
import { logError, logWarn, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';

// Premium-Check: aktuell immer true (kein separates Premium-Modul)
const isPremium = async (): Promise<boolean> => true;

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
      return { isOnline: false, lastSync: null, pendingChanges: 0, syncInProgress: false };
    }
    try {
      const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (!stored) {
        return { isOnline: navigator.onLine, lastSync: null, pendingChanges: 0, syncInProgress: false };
      }
      const status = JSON.parse(stored);
      return { ...status, isOnline: navigator.onLine, lastSync: status.lastSync ? new Date(status.lastSync) : null };
    } catch (error) {
      logError('Fehler beim Laden des Sync-Status:', error);
      return { isOnline: navigator.onLine, lastSync: null, pendingChanges: 0, syncInProgress: false };
    }
  }

  static updateSyncStatus(updates: Partial<SyncStatus>): void {
    if (typeof window === 'undefined') return;
    const current = this.getSyncStatus();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: updated }));
  }

  static async syncToCloud(einträge: SchießEintrag[]): Promise<boolean> {
    logDebug('Cloud-Sync gestartet');

    if (!(await isPremium())) {
      throw new Error('Cloud-Sync ist nur für Premium-Nutzer verfügbar');
    }

    if (!navigator.onLine) {
      throw new Error('Keine Internetverbindung');
    }

    this.updateSyncStatus({ syncInProgress: true });

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase/config');

      if (!auth.currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }

      const cleanedEinträge = einträge.map(eintrag => {
        const cleaned: Record<string, unknown> = {};
        Object.keys(eintrag).forEach(key => {
          const value = (eintrag as unknown as Record<string, unknown>)[key];
          if (value !== undefined) cleaned[key] = value;
        });
        return cleaned;
      });

      const cloudData: CloudData = {
        einträge: cleanedEinträge as unknown as SchießEintrag[],
        lastModified: new Date(),
        deviceId: this.getDeviceId()
      };

      await setDoc(doc(db, 'schiessnachweis_data', auth.currentUser.uid), cloudData);
      localStorage.setItem(this.CLOUD_STORAGE_KEY, JSON.stringify(cloudData));

      this.updateSyncStatus({ lastSync: new Date(), pendingChanges: 0, syncInProgress: false });
      return true;
    } catch (error) {
      logError('Cloud-Sync fehlgeschlagen:', error);
      this.updateSyncStatus({ syncInProgress: false });
      throw error;
    }
  }

  static async syncFromCloud(): Promise<SchießEintrag[]> {
    if (!(await isPremium())) throw new Error('Cloud-Sync ist nur für Premium-Nutzer verfügbar');
    if (!navigator.onLine) throw new Error('Keine Internetverbindung');

    this.updateSyncStatus({ syncInProgress: true });

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase/config');

      if (!auth.currentUser) throw new Error('Benutzer nicht angemeldet');

      const docRef = doc(db, 'schiessnachweis_data', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        this.updateSyncStatus({ syncInProgress: false });
        return [];
      }

      const cloudData = docSnap.data() as CloudData;
      const einträge = cloudData.einträge.map(eintrag => ({
        ...eintrag,
        datum: (eintrag.datum as any)?.toDate ? (eintrag.datum as any).toDate() : new Date(eintrag.datum as any),
        createdAt: (eintrag.createdAt as any)?.toDate ? (eintrag.createdAt as any).toDate() : new Date(eintrag.createdAt as any)
      }));

      this.updateSyncStatus({ lastSync: new Date(), syncInProgress: false });
      return einträge;
    } catch (error) {
      logError('Cloud-Download fehlgeschlagen:', error);
      this.updateSyncStatus({ syncInProgress: false });
      throw error;
    }
  }

  static async autoSync(einträge: SchießEintrag[]): Promise<void> {
    if (!(await isPremium()) || !navigator.onLine) return;

    const status = this.getSyncStatus();
    if (status.lastSync && (Date.now() - status.lastSync.getTime()) < 30 * 1000) return;

    try {
      await this.syncToCloud(einträge);
    } catch (error) {
      logWarn('Auto-Sync fehlgeschlagen:', getErrorMessage(error));
    }
  }

  static markPendingChanges(count: number = 1): void {
    const status = this.getSyncStatus();
    this.updateSyncStatus({ pendingChanges: status.pendingChanges + count });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: this.getSyncStatus() }));
    }
  }

  static getCloudInfo(): { hasCloudData: boolean; lastModified: Date | null; deviceId: string | null } {
    if (typeof window === 'undefined') return { hasCloudData: false, lastModified: null, deviceId: null };
    try {
      const stored = localStorage.getItem(this.CLOUD_STORAGE_KEY);
      if (!stored) return { hasCloudData: false, lastModified: null, deviceId: null };
      const cloudData: CloudData = JSON.parse(stored);
      return { hasCloudData: true, lastModified: new Date(cloudData.lastModified), deviceId: cloudData.deviceId };
    } catch {
      return { hasCloudData: false, lastModified: null, deviceId: null };
    }
  }
}

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
  }

  static async syncToCloud(einträge: SchießEintrag[]): Promise<boolean> {
    if (!PremiumService.isPremium()) {
      throw new Error('Cloud-Sync ist nur für Premium-Nutzer verfügbar');
    }

    if (!navigator.onLine) {
      throw new Error('Keine Internetverbindung');
    }

    this.updateSyncStatus({ syncInProgress: true });

    try {
      // Simuliere Cloud-Upload (später durch echte API ersetzen)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cloudData: CloudData = {
        einträge,
        lastModified: new Date(),
        deviceId: this.getDeviceId()
      };

      // Simuliere Cloud-Speicherung
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
    if (!PremiumService.isPremium()) {
      throw new Error('Cloud-Sync ist nur für Premium-Nutzer verfügbar');
    }

    if (!navigator.onLine) {
      throw new Error('Keine Internetverbindung');
    }

    this.updateSyncStatus({ syncInProgress: true });

    try {
      // Simuliere Cloud-Download (später durch echte API ersetzen)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const stored = localStorage.getItem(this.CLOUD_STORAGE_KEY);
      if (!stored) {
        this.updateSyncStatus({ syncInProgress: false });
        return [];
      }

      const cloudData: CloudData = JSON.parse(stored);
      
      // Konvertiere Datum-Strings zurück zu Date-Objekten
      const einträge = cloudData.einträge.map(eintrag => ({
        ...eintrag,
        datum: new Date(eintrag.datum)
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
    if (!PremiumService.isPremium() || !navigator.onLine) {
      return;
    }

    const status = this.getSyncStatus();
    
    // Auto-Sync nur wenn letzte Sync älter als 5 Minuten
    if (status.lastSync && (Date.now() - status.lastSync.getTime()) < 5 * 60 * 1000) {
      return;
    }

    try {
      await this.syncToCloud(einträge);
    } catch (error) {
      console.warn('Auto-Sync fehlgeschlagen:', error);
    }
  }

  static markPendingChanges(count: number = 1): void {
    const status = this.getSyncStatus();
    this.updateSyncStatus({
      pendingChanges: status.pendingChanges + count
    });
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
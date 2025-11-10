import { SchießEintrag, SchießStatistik } from '@/types/schiessnachweis';
import { CloudSyncService } from './cloud-sync-service';
import { PremiumService } from './premium-service';

const STORAGE_KEY = 'rwk_schiessnachweis';
const BACKUP_KEY = 'rwk_schiessnachweis_backup';

export class SchießnachweisService {
  static getEinträge(): SchießEintrag[] {
    if (typeof window === 'undefined') return [];
    
    try {
      // Versuche localStorage
      let data = localStorage.getItem(STORAGE_KEY);
      
      // Fallback zu sessionStorage
      if (!data) {
        data = sessionStorage.getItem(STORAGE_KEY);
      }
      
      // Fallback zu Backup
      if (!data) {
        data = localStorage.getItem(BACKUP_KEY);
      }
      
      if (!data) {
        // Fallback zu IndexedDB (Cache-sicher)
        this.loadFromIndexedDB().then(indexedData => {
          if (indexedData.length > 0) {
            console.log('💾 Daten aus IndexedDB wiederhergestellt');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(indexedData));
          }
        });
        return [];
      }
      
      const einträge = JSON.parse(data);
      return einträge.map((eintrag: any) => ({
        ...eintrag,
        datum: new Date(eintrag.datum),
        createdAt: new Date(eintrag.createdAt)
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
      return [];
    }
  }

  static saveEintrag(eintrag: Omit<SchießEintrag, 'id' | 'createdAt'>): SchießEintrag {
    const neuerEintrag: SchießEintrag = {
      ...eintrag,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    const einträge = this.getEinträge();
    einträge.push(neuerEintrag);
    
    this.saveToStorage(einträge);
    
    // Cloud-Sync für Premium-Nutzer
    if (PremiumService.isPremium()) {
      CloudSyncService.markPendingChanges();
      CloudSyncService.autoSync(einträge).catch(console.warn);
    }
    
    return neuerEintrag;
  }

  static deleteEintrag(id: string): void {
    const einträge = this.getEinträge().filter(e => e.id !== id);
    this.saveToStorage(einträge);
    
    // Cloud-Sync für Premium-Nutzer
    if (PremiumService.isPremium()) {
      CloudSyncService.markPendingChanges();
      CloudSyncService.autoSync(einträge).catch(console.warn);
    }
  }
  
  private static saveToStorage(einträge: SchießEintrag[]): void {
    const data = JSON.stringify(einträge);
    
    try {
      // Haupt-Speicherung
      localStorage.setItem(STORAGE_KEY, data);
      
      // Backup-Speicherung
      localStorage.setItem(BACKUP_KEY, data);
      
      // Session-Backup
      sessionStorage.setItem(STORAGE_KEY, data);
      
      // IndexedDB für persistente Speicherung (Cache-sicher)
      this.saveToIndexedDB(einträge);
      
      console.log(`💾 ${einträge.length} Einträge gespeichert`);
    } catch (error) {
      console.error('Speichern fehlgeschlagen:', error);
      // Fallback zu sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEY, data);
      } catch (sessionError) {
        console.error('Auch sessionStorage fehlgeschlagen:', sessionError);
      }
    }
  }
  
  private static async saveToIndexedDB(einträge: SchießEintrag[]): Promise<void> {
    try {
      const request = indexedDB.open('SchiessnachweisDB', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('eintraege')) {
          db.createObjectStore('eintraege', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['eintraege'], 'readwrite');
        const store = transaction.objectStore('eintraege');
        store.put({ key: 'schiessnachweis', data: einträge, timestamp: Date.now() });
      };
    } catch (error) {
      console.warn('IndexedDB Speicherung fehlgeschlagen:', error);
    }
  }
  
  private static async loadFromIndexedDB(): Promise<SchießEintrag[]> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('SchiessnachweisDB', 1);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['eintraege'], 'readonly');
          const store = transaction.objectStore('eintraege');
          const getRequest = store.get('schiessnachweis');
          
          getRequest.onsuccess = () => {
            if (getRequest.result && getRequest.result.data) {
              resolve(getRequest.result.data.map((eintrag: any) => ({
                ...eintrag,
                datum: new Date(eintrag.datum),
                createdAt: new Date(eintrag.createdAt)
              })));
            } else {
              resolve([]);
            }
          };
          
          getRequest.onerror = () => resolve([]);
        };
        
        request.onerror = () => resolve([]);
      } catch (error) {
        resolve([]);
      }
    });
  }

  static getStatistik(): SchießStatistik {
    const einträge = this.getEinträge();
    
    if (einträge.length === 0) {
      return {
        totalSchüsse: 0,
        totalTrainings: 0,
        totalWettkämpfe: 0,
        durchschnittErgebnis: 0,
        bestesErgebnis: 0,
        letzteAktivität: null
      };
    }

    const totalSchüsse = einträge.reduce((sum, e) => sum + e.schussAnzahl, 0);
    const totalTrainings = einträge.filter(e => e.typ === 'training').length;
    const totalWettkämpfe = einträge.filter(e => e.typ === 'wettkampf').length;
    // Durchschnitt pro Schuss (nicht pro Eintrag)
    const durchschnittProSchuss = totalSchüsse > 0 ? 
      einträge.reduce((sum, e) => sum + e.ergebnis, 0) / totalSchüsse : 0;
    
    // Durchschnitt pro Eintrag (für Vergleichbarkeit)
    const ergebnisse = einträge.map(e => e.ergebnis / e.schussAnzahl); // Ringe pro Schuss
    const durchschnittErgebnis = ergebnisse.reduce((sum, e) => sum + e, 0) / ergebnisse.length;
    const bestesErgebnis = Math.max(...ergebnisse);
    const letzteAktivität = new Date(Math.max(...einträge.map(e => e.datum.getTime())));

    return {
      totalSchüsse,
      totalTrainings,
      totalWettkämpfe,
      durchschnittErgebnis: Math.round(durchschnittErgebnis * 10) / 10,
      bestesErgebnis,
      letzteAktivität
    };
  }

  static exportData(): string {
    const einträge = this.getEinträge();
    return JSON.stringify(einträge, null, 2);
  }

  static importData(jsonData: string): number {
    try {
      const importedEinträge = JSON.parse(jsonData);
      const existingEinträge = this.getEinträge();
      
      // Merge und Duplikate vermeiden
      const allEinträge = [...existingEinträge];
      let importCount = 0;
      
      importedEinträge.forEach((imported: any) => {
        const exists = allEinträge.some(existing => 
          existing.datum.getTime() === new Date(imported.datum).getTime() &&
          existing.disziplin === imported.disziplin &&
          existing.ergebnis === imported.ergebnis
        );
        
        if (!exists) {
          allEinträge.push({
            ...imported,
            id: Date.now().toString() + Math.random(),
            datum: new Date(imported.datum),
            createdAt: new Date(imported.createdAt || imported.datum)
          });
          importCount++;
        }
      });
      
      this.saveToStorage(allEinträge);
      return importCount;
    } catch (error) {
      throw new Error('Ungültiges Datenformat');
    }
  }
  
  static async syncToCloud(): Promise<void> {
    const einträge = this.getEinträge();
    await CloudSyncService.syncToCloud(einträge);
  }
  
  static async syncFromCloud(): Promise<void> {
    const cloudEinträge = await CloudSyncService.syncFromCloud();
    if (cloudEinträge.length > 0) {
      this.saveToStorage(cloudEinträge);
    }
  }
  
  static getSyncStatus() {
    return CloudSyncService.getSyncStatus();
  }
  
  static getCloudInfo() {
    return CloudSyncService.getCloudInfo();
  }
}
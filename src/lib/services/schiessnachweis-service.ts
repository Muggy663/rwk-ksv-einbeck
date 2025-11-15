import { SchießEintrag, SchießStatistik } from '@/types/schiessnachweis';
import { CloudSyncService } from './cloud-sync-service';
import { PremiumService } from './premium-service';

const STORAGE_KEY = 'rwk_schiessnachweis';
const BACKUP_KEY = 'rwk_schiessnachweis_backup';

// Cache für bessere Performance
let cachedEinträge: SchießEintrag[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5000; // 5 Sekunden Cache

export class SchießnachweisService {
  static getEinträge(): SchießEintrag[] {
    if (typeof window === 'undefined') return [];
    
    // Cache prüfen
    const now = Date.now();
    if (cachedEinträge && (now - lastCacheTime) < CACHE_DURATION) {
      return cachedEinträge;
    }
    
    // Versuche zuerst Cloud-Daten zu laden
    this.loadFromCloudSync();
    
    try {
      // 1. Versuche localStorage
      let data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        console.log('🔍 Keine Daten gefunden, lade aus Backup...');
      }
      
      // 2. Fallback zu sessionStorage
      if (!data) {
        data = sessionStorage.getItem(STORAGE_KEY);
        console.log('sessionStorage:', data ? `${data.length} Zeichen` : 'leer');
      }
      
      // 3. Fallback zu Backup
      if (!data) {
        data = localStorage.getItem(BACKUP_KEY);
        console.log('localStorage (backup):', data ? `${data.length} Zeichen` : 'leer');
      }
      
      // 4. Suche nach anderen möglichen Keys
      if (!data) {
        const allKeys = Object.keys(localStorage);
        console.log('Alle localStorage Keys:', allKeys);
        
        // Suche nach ähnlichen Keys
        const possibleKeys = allKeys.filter(key => 
          key.includes('schiess') || key.includes('nachweis') || key.includes('rwk')
        );
        console.log('Mögliche Schießnachweis Keys:', possibleKeys);
        
        for (const key of possibleKeys) {
          const testData = localStorage.getItem(key);
          if (testData) {
            try {
              const parsed = JSON.parse(testData);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].disziplin) {
                console.log(`✅ Daten gefunden in Key: ${key}`);
                data = testData;
                break;
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }
      
      if (!data) {
        console.log('⚠️ Keine Daten in localStorage/sessionStorage gefunden');
        // Fallback zu IndexedDB (Cache-sicher)
        this.loadFromIndexedDB().then(indexedData => {
          if (indexedData.length > 0) {
            console.log('💾 Daten aus IndexedDB wiederhergestellt:', indexedData.length);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(indexedData));
          }
        });
        return [];
      }
      
      const einträge = JSON.parse(data).map((eintrag: any) => {
        // Robuste Datum-Konvertierung
        let datum;
        let createdAt;
        
        // Firebase Timestamp oder ISO String
        if (eintrag.datum && typeof eintrag.datum === 'object' && eintrag.datum.seconds) {
          // Firebase Timestamp
          datum = new Date(eintrag.datum.seconds * 1000);
        } else {
          // ISO String oder Date
          datum = new Date(eintrag.datum);
        }
        
        if (eintrag.createdAt && typeof eintrag.createdAt === 'object' && eintrag.createdAt.seconds) {
          createdAt = new Date(eintrag.createdAt.seconds * 1000);
        } else {
          createdAt = new Date(eintrag.createdAt || eintrag.datum);
        }
        
        // Fallback für ungültige Daten
        if (isNaN(datum.getTime())) {
          datum = new Date();
        }
        
        if (isNaN(createdAt.getTime())) {
          createdAt = datum;
        }
        
        return {
          ...eintrag,
          datum,
          createdAt
        };
      });
      
      // Cache aktualisieren
      cachedEinträge = einträge;
      lastCacheTime = now;
      
      console.log(`✅ ${einträge.length} Einträge geladen`);
      return einträge;
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
      return [];
    }
  }

  static saveEintrag(eintrag: Omit<SchießEintrag, 'id' | 'createdAt'>): SchießEintrag {
    const neuerEintrag: SchießEintrag = {
      ...eintrag,
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };

    const einträge = this.getEinträge();
    einträge.push(neuerEintrag);
    
    // Cache aktualisieren
    cachedEinträge = einträge;
    lastCacheTime = Date.now();
    
    this.saveToStorage(einträge);
    
    // Automatische Cloud-Sync für Premium-Nutzer
    if (PremiumService.isPremiumSync()) {
      CloudSyncService.autoSync(einträge);
    }
    
    return neuerEintrag;
  }

  static updateEintrag(id: string, updates: Partial<Omit<SchießEintrag, 'id' | 'createdAt'>>): SchießEintrag | null {
    const einträge = this.getEinträge();
    const index = einträge.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    einträge[index] = { ...einträge[index], ...updates };
    
    // Cache aktualisieren
    cachedEinträge = einträge;
    lastCacheTime = Date.now();
    
    this.saveToStorage(einträge);
    
    // Automatische Cloud-Sync für Premium-Nutzer
    if (PremiumService.isPremiumSync()) {
      CloudSyncService.autoSync(einträge);
    }
    
    return einträge[index];
  }

  static deleteEintrag(id: string): void {
    const einträge = this.getEinträge().filter(e => e.id !== id);
    
    // Cache aktualisieren
    cachedEinträge = einträge;
    lastCacheTime = Date.now();
    
    this.saveToStorage(einträge);
    
    // Automatische Cloud-Sync für Premium-Nutzer
    if (PremiumService.isPremiumSync()) {
      CloudSyncService.autoSync(einträge);
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
      
      console.log(`💾 ${einträge.length} Einträge gespeichert (Cache aktualisiert)`);
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
        
        // Prüfe ob Object Store existiert
        if (!db.objectStoreNames.contains('eintraege')) {
          return;
        }
        
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
          
          // Prüfe ob Object Store existiert
          if (!db.objectStoreNames.contains('eintraege')) {
            resolve([]);
            return;
          }
          
          const transaction = db.transaction(['eintraege'], 'readonly');
          const store = transaction.objectStore('eintraege');
          const getRequest = store.get('schiessnachweis');
          
          getRequest.onsuccess = () => {
            if (getRequest.result && getRequest.result.data) {
              resolve(getRequest.result.data.map((eintrag: any) => {
                let datum;
                let createdAt;
                
                // Firebase Timestamp oder ISO String
                if (eintrag.datum && typeof eintrag.datum === 'object' && eintrag.datum.seconds) {
                  datum = new Date(eintrag.datum.seconds * 1000);
                } else {
                  datum = new Date(eintrag.datum);
                }
                
                if (eintrag.createdAt && typeof eintrag.createdAt === 'object' && eintrag.createdAt.seconds) {
                  createdAt = new Date(eintrag.createdAt.seconds * 1000);
                } else {
                  createdAt = new Date(eintrag.createdAt || eintrag.datum);
                }
                
                if (isNaN(datum.getTime())) {
                  datum = new Date();
                }
                
                if (isNaN(createdAt.getTime())) {
                  createdAt = datum;
                }
                
                return {
                  ...eintrag,
                  datum,
                  createdAt
                };
              }));
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
      // Cache invalidieren bei Cloud-Sync
      cachedEinträge = null;
      lastCacheTime = 0;
      this.saveToStorage(cloudEinträge);
    }
  }
  
  static getSyncStatus() {
    return CloudSyncService.getSyncStatus();
  }
  
  static getCloudInfo() {
    return CloudSyncService.getCloudInfo();
  }
  
  static async loadFromCloudNow(): Promise<SchießEintrag[]> {
    try {
      console.log('🔄 Lade Daten aus Cloud...');
      const cloudEinträge = await CloudSyncService.syncFromCloud();
      if (cloudEinträge.length > 0) {
        console.log('☁️ Cloud-Daten geladen:', cloudEinträge.length);
        // Cache invalidieren bei Cloud-Sync
        cachedEinträge = null;
        lastCacheTime = 0;
        this.saveToStorage(cloudEinträge);
      }
      return cloudEinträge;
    } catch (error) {
      console.error('Cloud-Sync fehlgeschlagen:', error);
      throw error;
    }
  }
  
  // Notfall-Wiederherstellung
  // Einmalige Reparatur für 01.01.1970 Problem
  static repairDates(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        let repaired = false;
        
        const fixed = parsed.map((eintrag: any) => {
          let datum = new Date(eintrag.datum);
          
          // Repariere 01.01.1970 Daten
          if (datum.getFullYear() === 1970) {
            // Verwende createdAt als Fallback oder heutiges Datum
            const createdAt = new Date(eintrag.createdAt);
            if (createdAt.getFullYear() > 2020) {
              datum = createdAt;
            } else {
              datum = new Date(); // Heutiges Datum
            }
            repaired = true;
          }
          
          return {
            ...eintrag,
            datum: datum.toISOString()
          };
        });
        
        if (repaired) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
          localStorage.setItem(BACKUP_KEY, JSON.stringify(fixed));
          console.log('🔧 01.01.1970 Daten repariert');
          
          // Cache invalidieren
          cachedEinträge = null;
          lastCacheTime = 0;
        }
      }
    } catch (error) {
      console.error('Datum-Reparatur fehlgeschlagen:', error);
    }
  }
  
  // Debug-Funktion für Datum-Probleme
  static debugDates(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🔍 Debug: Überprüfe Datum-Formate in localStorage...');
    
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log('Raw data:', parsed);
        
        parsed.forEach((eintrag: any, index: number) => {
          console.log(`Eintrag ${index}:`, {
            originalDatum: eintrag.datum,
            datumType: typeof eintrag.datum,
            parsedDatum: new Date(eintrag.datum),
            isValidDate: !isNaN(new Date(eintrag.datum).getTime())
          });
        });
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
  }
  
  static recoverData(): { found: boolean; source: string; count: number } {
    if (typeof window === 'undefined') return { found: false, source: '', count: 0 };
    
    console.log('🚨 Starte Datenwiederherstellung...');
    
    // Durchsuche alle localStorage Keys
    const allKeys = Object.keys(localStorage);
    console.log('Alle verfügbaren Keys:', allKeys);
    
    for (const key of allKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // Prüfe ob es Schießnachweis-Daten sind
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstItem = parsed[0];
            if (firstItem && (firstItem.disziplin || firstItem.ergebnis || firstItem.schussAnzahl)) {
              console.log(`✅ Schießnachweis-Daten gefunden in Key: ${key}`);
              console.log('Daten:', parsed);
              
              // Wiederherstellen
              localStorage.setItem(STORAGE_KEY, data);
              localStorage.setItem(BACKUP_KEY, data);
              
              return { found: true, source: key, count: parsed.length };
            }
          }
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    }
    
    return { found: false, source: '', count: 0 };
  }
  
  // Synchrones Cloud-Laden
  private static loadFromCloudSync(): void {
    // Nur wenn Premium und angemeldet
    import('@/lib/services/premium-service').then(({ PremiumService }) => {
      import('@/lib/firebase/config').then(({ auth, db }) => {
        if (auth.currentUser && PremiumService.isPremium()) {
          import('firebase/firestore').then(({ doc, getDoc }) => {
            const docRef = doc(db, 'schiessnachweis_data', auth.currentUser!.uid);
            getDoc(docRef).then(docSnap => {
              if (docSnap.exists()) {
                const cloudData = docSnap.data();
                if (cloudData.einträge) {
                  const einträge = cloudData.einträge.map((eintrag: any) => ({
                    ...eintrag,
                    datum: eintrag.datum.toDate ? eintrag.datum.toDate() : new Date(eintrag.datum),
                    createdAt: eintrag.createdAt.toDate ? eintrag.createdAt.toDate() : new Date(eintrag.createdAt)
                  }));
                  
                  // Cache und localStorage aktualisieren
                  cachedEinträge = einträge;
                  lastCacheTime = Date.now();
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(einträge));
                  
                  console.log('☁️ Cloud-Daten geladen:', einträge.length);
                }
              }
            }).catch(console.error);
          });
        }
      });
    });
  }
}
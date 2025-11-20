import { SchießEintrag, SchießStatistik } from '@/types/schiessnachweis';

// Cache für bessere Performance
let cachedEinträge: SchießEintrag[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5000; // 5 Sekunden Cache
let isLoading = false; // Verhindere mehrfache gleichzeitige Ladevorgänge

export class SchießnachweisService {
  static async getEinträge(): Promise<SchießEintrag[]> {
    if (typeof window === 'undefined') return [];
    
    // Cache prüfen
    const now = Date.now();
    if (cachedEinträge && (now - lastCacheTime) < CACHE_DURATION) {
      return cachedEinträge;
    }
    
    // Verhindere mehrfache gleichzeitige Ladevorgänge
    if (isLoading) {
      return cachedEinträge || [];
    }
    
    isLoading = true;
    
    try {
      // Lade direkt aus Firebase - alle Daten werden in der Datenbank gespeichert
      const { auth, db } = await import('@/lib/firebase/config');
      
      if (!auth.currentUser) {
        console.log('⚠️ Benutzer nicht angemeldet - keine Daten verfügbar');
        isLoading = false;
        return [];
      }
      
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'schiessnachweis_data', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('📝 Keine Schießnachweis-Daten für User:', auth.currentUser.uid);
        isLoading = false;
        return [];
      }
      
      const data = docSnap.data();
      const einträge = (data.einträge || []).map((eintrag: any) => {
        // Robuste Datum-Konvertierung
        let datum;
        let createdAt;
        
        // Firebase Timestamp oder ISO String
        if (eintrag.datum && typeof eintrag.datum === 'object' && eintrag.datum.seconds) {
          datum = new Date(eintrag.datum.seconds * 1000);
        } else if (eintrag.datum && eintrag.datum.toDate) {
          datum = eintrag.datum.toDate();
        } else {
          datum = new Date(eintrag.datum);
        }
        
        if (eintrag.createdAt && typeof eintrag.createdAt === 'object' && eintrag.createdAt.seconds) {
          createdAt = new Date(eintrag.createdAt.seconds * 1000);
        } else if (eintrag.createdAt && eintrag.createdAt.toDate) {
          createdAt = eintrag.createdAt.toDate();
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
      isLoading = false;
      
      console.log(`✅ ${einträge.length} Einträge aus Datenbank geladen`);
      return einträge;
    } catch (error) {
      console.error('Fehler beim Laden der Einträge aus Datenbank:', error);
      isLoading = false;
      return [];
    }
  }

  static async saveEintrag(eintrag: Omit<SchießEintrag, 'id' | 'createdAt'>): Promise<SchießEintrag> {
    const neuerEintrag: SchießEintrag = {
      ...eintrag,
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };

    const einträge = await this.getEinträge();
    einträge.push(neuerEintrag);
    
    // Cache aktualisieren
    cachedEinträge = einträge;
    lastCacheTime = Date.now();
    
    await this.saveToDatabase(einträge);
    
    return neuerEintrag;
  }

  static async updateEintrag(id: string, updates: Partial<Omit<SchießEintrag, 'id' | 'createdAt'>>): Promise<SchießEintrag | null> {
    const einträge = await this.getEinträge();
    const index = einträge.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    einträge[index] = { ...einträge[index], ...updates };
    
    // Cache aktualisieren
    cachedEinträge = einträge;
    lastCacheTime = Date.now();
    
    await this.saveToDatabase(einträge);
    
    return einträge[index];
  }

  static async deleteEintrag(id: string): Promise<void> {
    const einträge = (await this.getEinträge()).filter(e => e.id !== id);
    
    // Cache aktualisieren
    cachedEinträge = einträge;
    lastCacheTime = Date.now();
    
    await this.saveToDatabase(einträge);
  }
  
  private static async saveToDatabase(einträge: SchießEintrag[]): Promise<void> {
    try {
      const { auth, db } = await import('@/lib/firebase/config');
      
      if (!auth.currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }
      
      const { doc, setDoc } = await import('firebase/firestore');
      
      // Entferne undefined Werte für Firebase
      const cleanedEinträge = einträge.map(eintrag => {
        const cleaned: any = {};
        Object.keys(eintrag).forEach(key => {
          const value = (eintrag as any)[key];
          if (value !== undefined) {
            cleaned[key] = value;
          }
        });
        return cleaned;
      });
      
      const cloudData = {
        einträge: cleanedEinträge,
        lastModified: new Date(),
        deviceId: this.getDeviceId()
      };
      
      await setDoc(doc(db, 'schiessnachweis_data', auth.currentUser.uid), cloudData);
      console.log(`💾 ${einträge.length} Einträge in Datenbank gespeichert`);
    } catch (error) {
      console.error('Speichern in Datenbank fehlgeschlagen:', error);
      throw error;
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

  static async getStatistik(): Promise<SchießStatistik> {
    const einträge = await this.getEinträge();
    
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

  static async exportData(): Promise<string> {
    const einträge = await this.getEinträge();
    return JSON.stringify(einträge, null, 2);
  }

  static async importData(jsonData: string): Promise<number> {
    try {
      const importedEinträge = JSON.parse(jsonData);
      const existingEinträge = await this.getEinträge();
      
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
      
      await this.saveToDatabase(allEinträge);
      return importCount;
    } catch (error) {
      throw new Error('Ungültiges Datenformat');
    }
  }
  
  // Daten sind bereits in der Datenbank - kein separater Cloud-Sync nötig
  static async refreshData(): Promise<SchießEintrag[]> {
    // Cache invalidieren und neu laden
    cachedEinträge = null;
    lastCacheTime = 0;
    return await this.getEinträge();
  }
  
  // Hilfsfunktion für Device-ID
  private static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem('schiessnachweis_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('schiessnachweis_device_id', deviceId);
    }
    return deviceId;
  }
  

}

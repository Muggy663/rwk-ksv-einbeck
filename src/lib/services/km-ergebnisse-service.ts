// src/lib/services/km-ergebnisse-service.ts
// Optimierter Service für KM-Ergebnisse

import { db } from '@/lib/firebase/config';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export interface KMErgebnis {
  id?: string;
  wettkampfId: string;
  startNummer: number;
  schuetzeId?: string;
  schuetzeName: string;
  vereinsNummer: number;
  vereinsName: string;
  disziplin: string;
  wettkampfklasse: string;
  ringe: number;
  zehntel: number;
  innerZehner: number;
  schussDetails?: string;
  bemerkung?: string;
  importDatum: Date;
  saison: string;
  status: 'importiert' | 'verifiziert' | 'korrigiert';
}

export class KMErgebnisseService {
  
  /**
   * Speichere David21 Ergebnisse in Firebase
   */
  static async saveErgebnisse(
    ergebnisse: any[], 
    wettkampfId: string, 
    saison: string = '2025'
  ): Promise<string[]> {
    const savedIds: string[] = [];
    
    try {
      // Batch-Import für bessere Performance
      const batch = ergebnisse.map(async (result) => {
        const ergebnis: Omit<KMErgebnis, 'id'> = {
          wettkampfId,
          startNummer: result.startNummer,
          schuetzeName: `${result.vorname} ${result.nachname}`.trim(),
          vereinsNummer: result.vereinsNummer,
          vereinsName: '', // Wird später aufgelöst
          disziplin: '', // Wird später aufgelöst
          wettkampfklasse: '', // Wird später aufgelöst
          ringe: result.ringe,
          zehntel: result.zehntel,
          innerZehner: result.innerZehner,
          schussDetails: result.schussDetails || '',
          bemerkung: result.bemerkung || '',
          importDatum: new Date(),
          saison,
          status: 'importiert'
        };
        
        const docRef = await addDoc(collection(db, 'km_ergebnisse'), ergebnis);
        return docRef.id;
      });
      
      const results = await Promise.all(batch);
      savedIds.push(...results);
      
      logDebug(`${savedIds.length} Ergebnisse erfolgreich gespeichert`);
      return savedIds;
      
    } catch (error) {
      logError('Fehler beim Speichern der Ergebnisse:', error);
      throw error;
    }
  }
  
  /**
   * Lade Ergebnisse für einen Wettkampf
   */
  static async getErgebnisse(wettkampfId: string): Promise<KMErgebnis[]> {
    try {
      const q = query(
        collection(db, 'km_ergebnisse'),
        where('wettkampfId', '==', wettkampfId),
        orderBy('ringe', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        importDatum: doc.data().importDatum?.toDate() || new Date()
      })) as KMErgebnis[];
      
    } catch (error) {
      logError('Fehler beim Laden der Ergebnisse:', error);
      throw error;
    }
  }
  
  /**
   * Verknüpfe Ergebnisse mit Schützen-IDs
   */
  static async linkErgebnisseToSchuetzen(ergebnisIds: string[]): Promise<void> {
    try {
      // Lade alle Schützen
      const schuetzenSnapshot = await getDocs(collection(db, 'shooters'));
      const schuetzenMap = new Map();
      
      schuetzenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        schuetzenMap.set(data.name.toLowerCase(), doc.id);
      });
      
      // Ergebnisse direkt per Dokument-Lookup laden (kein N+1 über Collection-Queries)
      // und parallel verarbeiten.
      await Promise.all(
        ergebnisIds.map(async (ergebnisId) => {
          const ergebnisSnap = await getDoc(doc(db, 'km_ergebnisse', ergebnisId));
          if (!ergebnisSnap.exists()) return;

          const ergebnis = ergebnisSnap.data();
          const name = ergebnis.schuetzeName;
          if (!name) return;

          const schuetzeId = schuetzenMap.get(String(name).toLowerCase());
          if (!schuetzeId) return;

          await updateDoc(doc(db, 'km_ergebnisse', ergebnisId), {
            schuetzeId,
            status: 'verifiziert',
          });
        })
      );
      
    } catch (error) {
      logError('Fehler beim Verknüpfen:', error);
      throw error;
    }
  }
  
  /**
   * Berechne Statistiken für Wettkampf
   */
  static calculateStatistics(ergebnisse: KMErgebnis[]) {
    if (ergebnisse.length === 0) return null;
    
    const ringe = ergebnisse.map(e => e.ringe);
    const durchschnitt = ringe.reduce((sum, r) => sum + r, 0) / ringe.length;
    
    return {
      teilnehmer: ergebnisse.length,
      durchschnitt: Math.round(durchschnitt * 10) / 10,
      besterSchuss: Math.max(...ringe),
      schlechtesterSchuss: Math.min(...ringe),
      ueber90: ringe.filter(r => r >= 90).length,
      ueber95: ringe.filter(r => r >= 95).length
    };
  }
}

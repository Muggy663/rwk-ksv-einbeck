// src/lib/services/club-migration-service.ts
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { getClubCollection, CLUB_COLLECTIONS } from '@/lib/utils/club-utils';

/**
 * Service für Migration von globalen zu club-spezifischen Collections
 */
export class ClubMigrationService {
  
  /**
   * Migriert alle Vereine auf einmal
   */
  static async migrateAllClubs(): Promise<{ totalMigrated: number; clubsProcessed: string[] }> {
    try {
      console.log('Starte Migration für alle Vereine...');
      
      // Lade alle Clubs
      const clubsSnapshot = await getDocs(collection(db, 'clubs'));
      console.log(`Gefunden: ${clubsSnapshot.docs.length} Vereine`);
      
      let totalMigrated = 0;
      const clubsProcessed = [];
      
      for (const clubDoc of clubsSnapshot.docs) {
        const clubId = clubDoc.id;
        const clubData = clubDoc.data();
        console.log(`Migriere Verein: ${clubData.name} (${clubId})`);
        
        try {
          const migrated = await this.migrateShootersToMembers(clubId);
          totalMigrated += migrated;
          clubsProcessed.push(`${clubData.name}: ${migrated} Mitglieder`);
        } catch (error) {
          console.error(`Fehler bei ${clubData.name}:`, error);
          clubsProcessed.push(`${clubData.name}: FEHLER - ${error.message}`);
        }
      }
      
      console.log(`Migration abgeschlossen: ${totalMigrated} Mitglieder aus ${clubsProcessed.length} Vereinen`);
      return { totalMigrated, clubsProcessed };
      
    } catch (error) {
      console.error('Fehler bei Gesamt-Migration:', error);
      throw error;
    }
  }

  /**
   * Migriert Shooter-Daten zu Mitglieder-Daten für einen Verein
   */
  static async migrateShootersToMembers(clubId: string): Promise<number> {
    try {
      console.log(`Starte Migration für Verein: ${clubId}`);
      
      // Lade alle Shooter des Vereins aus globaler Collection
      const shootersQuery = query(
        collection(db, 'shooters'),
        where('clubId', '==', clubId)
      );
      console.log('Searching for shooters with clubId:', clubId);
      const shootersSnapshot = await getDocs(shootersQuery);
      
      console.log(`Gefunden: ${shootersSnapshot.docs.length} Schützen für ${clubId}`);
      
      // Migriere jeden Shooter zu Mitglied
      const mitgliederCollection = getClubCollection(clubId, CLUB_COLLECTIONS.MITGLIEDER);
      
      for (const shooterDoc of shootersSnapshot.docs) {
        const shooterData = shooterDoc.data();
        
        // Erweitere Shooter-Daten zu vollständigen Mitglieder-Daten
        const mitgliedData = {
          // Basis-Daten aus Shooter
          name: shooterData.name || '',
          vorname: shooterData.vorname || '',
          geburtsdatum: shooterData.geburtsdatum || shooterData.geburtstag || null,
          geschlecht: shooterData.geschlecht || shooterData.gender || 'male',
          
          // Erweiterte Mitglieder-Daten
          adresse: {
            strasse: '',
            plz: '',
            ort: '',
            telefon: '',
            email: shooterData.email || ''
          },
          
          // Vereins-Daten
          eintrittsdatum: shooterData.eintrittsdatum || shooterData.vereinseintritt || null,
          mitgliedsnummer: shooterData.mitgliedsnummer || '',
          status: 'aktiv',
          
          // Finanzen
          sepa: {
            iban: '',
            bic: '',
            kontoinhaber: '',
            mandatsdatum: null,
            mandatsreferenz: ''
          },
          
          // Schießsport
          disziplinen: shooterData.disziplinen || [],
          lizenzen: [],
          
          // Meta-Daten
          originalShooterId: shooterDoc.id, // Referenz zum ursprünglichen Shooter
          clubId: clubId,
          erstelltAm: new Date(),
          aktualisiertAm: new Date(),
          migriert: true
        };
        
        // Entferne alle undefined Werte
        Object.keys(mitgliedData).forEach(key => {
          if (mitgliedData[key] === undefined) {
            delete mitgliedData[key];
          }
          // Bereinige auch verschachtelte Objekte
          if (typeof mitgliedData[key] === 'object' && mitgliedData[key] !== null) {
            Object.keys(mitgliedData[key]).forEach(subKey => {
              if (mitgliedData[key][subKey] === undefined) {
                mitgliedData[key][subKey] = null;
              }
            });
          }
        });
        
        // Speichere in club-spezifischer Collection
        await addDoc(collection(db, mitgliederCollection), mitgliedData);
      }
      
      const migratedCount = shootersSnapshot.docs.length;
      console.log(`Migration abgeschlossen für ${clubId}: ${migratedCount} Mitglieder`);
      return migratedCount;
      
    } catch (error) {
      console.error(`Fehler bei Migration für ${clubId}:`, error);
      throw error;
    }
  }
  
  /**
   * Migriert bestehende Vereinsrecht-Daten zu club-spezifischen Collections
   */
  static async migrateVereinsrechtData(clubId: string): Promise<void> {
    try {
      console.log(`Migriere Vereinsrecht-Daten für: ${clubId}`);
      
      // Migriere Protokolle
      await this.migrateCollection(
        'vereinsrecht_protokolle',
        getClubCollection(clubId, CLUB_COLLECTIONS.PROTOKOLLE),
        clubId
      );
      
      // Migriere Wahlen
      await this.migrateCollection(
        'vereinsrecht_wahlen',
        getClubCollection(clubId, CLUB_COLLECTIONS.WAHLEN),
        clubId
      );
      
      // Weitere Collections...
      
    } catch (error) {
      console.error(`Fehler bei Vereinsrecht-Migration für ${clubId}:`, error);
      throw error;
    }
  }
  
  /**
   * Hilfsfunktion für Collection-Migration
   */
  private static async migrateCollection(
    sourceCollection: string,
    targetCollection: string,
    clubId: string
  ): Promise<void> {
    const sourceQuery = query(
      collection(db, sourceCollection),
      where('clubId', '==', clubId)
    );
    
    const snapshot = await getDocs(sourceQuery);
    
    for (const doc of snapshot.docs) {
      const data = {
        ...doc.data(),
        migriert: true,
        originalId: doc.id,
        migrationDate: new Date()
      };
      
      await addDoc(collection(db, targetCollection), data);
    }
    
    console.log(`${snapshot.docs.length} Dokumente von ${sourceCollection} zu ${targetCollection} migriert`);
  }
  
  /**
   * Prüft ob Migration für einen Verein bereits durchgeführt wurde
   */
  static async isMigrationComplete(clubId: string): Promise<boolean> {
    try {
      const mitgliederCollection = getClubCollection(clubId, CLUB_COLLECTIONS.MITGLIEDER);
      const snapshot = await getDocs(collection(db, mitgliederCollection));
      return snapshot.docs.length > 0;
    } catch (error) {
      return false;
    }
  }
}
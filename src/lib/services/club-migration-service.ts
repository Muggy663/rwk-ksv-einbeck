// src/lib/services/club-migration-service.ts
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { getClubCollection, CLUB_COLLECTIONS } from '@/lib/utils/club-utils';
import { secureLogger } from '@/lib/utils/secure-logger';

/**
 * Service für Migration von globalen zu club-spezifischen Collections
 */
export class ClubMigrationService {
  
  /**
   * Migriert alle Vereine auf einmal
   */
  static async migrateAllClubs(): Promise<{ totalMigrated: number; clubsProcessed: string[] }> {
    try {
      secureLogger.info('Starte Migration für alle Vereine');
      
      // Lade alle Clubs
      const clubsSnapshot = await getDocs(collection(db, 'clubs'));
      secureLogger.info('Vereine gefunden', `Count: ${clubsSnapshot.docs.length}`);
      
      let totalMigrated = 0;
      const clubsProcessed = [];
      
      for (const clubDoc of clubsSnapshot.docs) {
        const clubId = clubDoc.id;
        secureLogger.info('Migriere Verein', `ClubId: ${clubId}`);
        
        try {
          const migrated = await this.migrateShootersToMembers(clubId);
          totalMigrated += migrated;
          clubsProcessed.push(`Club: ${migrated} Mitglieder`);
        } catch (error) {
          secureLogger.error(`Migration error for club: ${clubId}`, error instanceof Error ? error : new Error(String(error)));
          clubsProcessed.push(`Club: FEHLER`);
        }
      }
      
      secureLogger.info('Migration abgeschlossen', `Total: ${totalMigrated}, Clubs: ${clubsProcessed.length}`);
      return { totalMigrated, clubsProcessed };
      
    } catch (error) {
      secureLogger.error('Gesamt-Migration failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Migriert Shooter-Daten zu Mitglieder-Daten für einen Verein
   */
  static async migrateShootersToMembers(clubId: string): Promise<number> {
    try {
      secureLogger.info('Starte Migration für Verein', `ClubId: ${clubId}`);
      
      // Lade alle Shooter des Vereins aus globaler Collection
      const shootersQuery = query(
        collection(db, 'shooters'),
        where('clubId', '==', clubId)
      );
      secureLogger.debug('Searching for shooters', `ClubId: ${clubId}`);
      const shootersSnapshot = await getDocs(shootersQuery);
      
      secureLogger.info('Schützen gefunden', `Count: ${shootersSnapshot.docs.length}, ClubId: ${clubId}`);
      
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
        
        // Entferne alle undefined Werte (dynamischer Zugriff -> lokale any-Referenz)
        const cleanData = mitgliedData as Record<string, any>;
        Object.keys(cleanData).forEach(key => {
          if (cleanData[key] === undefined) {
            delete cleanData[key];
          }
          // Bereinige auch verschachtelte Objekte
          if (typeof cleanData[key] === 'object' && cleanData[key] !== null) {
            Object.keys(cleanData[key]).forEach(subKey => {
              if (cleanData[key][subKey] === undefined) {
                cleanData[key][subKey] = null;
              }
            });
          }
        });
        
        // Speichere in club-spezifischer Collection
        await addDoc(collection(db, mitgliederCollection), mitgliedData);
      }
      
      const migratedCount = shootersSnapshot.docs.length;
      secureLogger.info('Migration abgeschlossen', `ClubId: ${clubId}, Count: ${migratedCount}`);
      return migratedCount;
      
    } catch (error) {
      secureLogger.error(`Migration failed for club: ${clubId}`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Migriert bestehende Vereinsrecht-Daten zu club-spezifischen Collections
   */
  static async migrateVereinsrechtData(clubId: string): Promise<void> {
    try {
      secureLogger.info('Migriere Vereinsrecht-Daten', `ClubId: ${clubId}`);
      
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
      secureLogger.error(`Vereinsrecht-Migration failed for club: ${clubId}`, error instanceof Error ? error : new Error(String(error)));
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
    
    secureLogger.info('Collection migration completed', `Count: ${snapshot.docs.length}, Source: ${sourceCollection}`);
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
      secureLogger.error('Migration check failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const migrateShootersToClubs = async () => {
    setIsRunning(true);
    setMigrationStatus('Starte Migration...');
    
    try {
      // Lade alle Clubs
      const clubsSnapshot = await getDocs(collection(db, 'clubs'));
      
      for (const clubDoc of clubsSnapshot.docs) {
        const clubId = clubDoc.id;
        const clubData = clubDoc.data();
        
        setMigrationStatus(`Migriere Club: ${clubData.name}`);
        
        // Lade alle Shooters für diesen Club
        const shootersQuery = query(
          collection(db, 'shooters'),
          where('clubId', '==', clubId)
        );
        const shootersSnapshot = await getDocs(shootersQuery);
        
        setProgress({ current: 0, total: shootersSnapshot.docs.length });
        
        let migrated = 0;
        
        for (const shooterDoc of shootersSnapshot.docs) {
          const shooterData = shooterDoc.data();
          
          // Erstelle Mitglied in neuer Collection
          const memberData = {
            // Basis-Daten
            name: shooterData.name || '',
            vorname: shooterData.name?.split(' ')[0] || '',
            firstName: shooterData.name?.split(' ')[0] || '',
            lastName: shooterData.name?.split(' ').slice(1).join(' ') || '',
            
            // Mitgliedsdaten
            mitgliedsnummer: shooterData.memberNumber || '',
            
            // Adresse
            strasse: shooterData.address || '',
            plz: shooterData.zipCode || '',
            ort: shooterData.city || '',
            
            // Kontakt
            email: shooterData.email || '',
            telefon: shooterData.phone || '',
            mobil: shooterData.mobile || '',
            
            // Daten
            geburtstag: shooterData.geburtstag || shooterData.birthday || '',
            geburtsdatum: shooterData.geburtstag || shooterData.birthday || '',
            birthYear: shooterData.birthYear || null,
            
            // Vereinsdaten
            vereinseintritt: shooterData.vereinseintritt || shooterData.clubEntry || '',
            eintrittsdatum: shooterData.vereinseintritt || shooterData.clubEntry || '',
            dsbeintritt: shooterData.dsbeintritt || shooterData.dsbEntry || '',
            
            // Status
            isActive: shooterData.isActive !== false,
            status: shooterData.isActive !== false ? 'aktiv' : 'inaktiv',
            
            // Geschlecht
            gender: shooterData.gender || 'male',
            geschlecht: shooterData.gender || 'male',
            
            // Meta-Daten
            clubId: clubId,
            originalShooterId: shooterDoc.id,
            migriert: true,
            erstelltAm: new Date(),
            aktualisiertAm: new Date()
          };
          
          // Speichere in neue Collection
          const memberRef = doc(db, `clubs/${clubId}/mitglieder`, shooterDoc.id);
          await setDoc(memberRef, memberData);
          
          migrated++;
          setProgress({ current: migrated, total: shootersSnapshot.docs.length });
        }
        
        setMigrationStatus(`Club ${clubData.name}: ${migrated} Mitglieder migriert`);
      }
      
      setMigrationStatus('Migration erfolgreich abgeschlossen!');
      
    } catch (error) {
      console.error('Migration Fehler:', error);
      setMigrationStatus(`Fehler: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const updateMissingData = async () => {
    setIsRunning(true);
    setMigrationStatus('Aktualisiere fehlende Daten...');
    
    try {
      const clubId = '1icqJ91FFStTBn6ORukx'; // Einbeck Club ID
      
      // Lade alle Shooters
      const shootersQuery = query(
        collection(db, 'shooters'),
        where('clubId', '==', clubId)
      );
      const shootersSnapshot = await getDocs(shootersQuery);
      
      // Lade alle Mitglieder
      const membersSnapshot = await getDocs(collection(db, `clubs/${clubId}/mitglieder`));
      
      let updated = 0;
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const originalShooterId = memberData.originalShooterId;
        
        if (originalShooterId) {
          const shooterDoc = shootersSnapshot.docs.find(doc => doc.id === originalShooterId);
          
          if (shooterDoc) {
            const shooterData = shooterDoc.data();
            console.log('Checking member:', memberData.name);
            console.log('Shooter SEPA data:', shooterData.sepa);
            console.log('Member SEPA data:', memberData.sepa);
            const updates = {};
            
            // Fehlende Daten ergänzen mit tatsächlichen Shooter-Feldnamen
            if ((!memberData.vorname || memberData.vorname === '') && shooterData.firstName) {
              updates.vorname = shooterData.firstName;
            }
            if ((!memberData.firstName || memberData.firstName === '') && shooterData.firstName) {
              updates.firstName = shooterData.firstName;
            }
            if ((!memberData.lastName || memberData.lastName === '') && shooterData.lastName) {
              updates.lastName = shooterData.lastName;
            }
            if ((!memberData.mitgliedsnummer || memberData.mitgliedsnummer === '') && shooterData.mitgliedsnummer) {
              updates.mitgliedsnummer = shooterData.mitgliedsnummer;
            }
            if (shooterData.strasse && (!memberData.strasse || memberData.strasse === '')) {
              updates.strasse = shooterData.strasse;
            }
            if (shooterData.plz && (!memberData.plz || memberData.plz === '')) {
              updates.plz = shooterData.plz;
            }
            if (shooterData.ort && (!memberData.ort || memberData.ort === '')) {
              updates.ort = shooterData.ort;
            }
            if (shooterData.email && (!memberData.email || memberData.email === '')) {
              updates.email = shooterData.email;
            }
            if (shooterData.telefon && (!memberData.telefon || memberData.telefon === '')) {
              updates.telefon = shooterData.telefon;
            }
            if (shooterData.mobil && (!memberData.mobil || memberData.mobil === '')) {
              updates.mobil = shooterData.mobil;
            }
            if (shooterData.birthYear && (!memberData.birthYear || memberData.birthYear === null)) {
              updates.birthYear = shooterData.birthYear;
            }
            if (shooterData.gender && (!memberData.gender || memberData.gender === '')) {
              updates.gender = shooterData.gender;
              updates.geschlecht = shooterData.gender;
            }
            
            // SEPA-Daten aus Shooters migrieren (aus sepa Objekt) - nur wenn echte Daten vorhanden
            if (shooterData.sepa && (shooterData.sepa.iban && shooterData.sepa.iban !== '') && (!memberData.sepa?.iban || memberData.sepa?.iban === '')) {
              const currentSepa = memberData.sepa || {};
              updates.sepa = {
                ...currentSepa,
                iban: shooterData.sepa.iban || '',
                bic: shooterData.sepa.bic || '',
                kontoinhaber: shooterData.sepa.kontoinhaber || `${shooterData.firstName} ${shooterData.lastName}`,
                mandatsreferenz: shooterData.sepa.mandatsreferenz || `SGI-${shooterData.mitgliedsnummer || 'XXX'}-2025`,
                mandatsdatum: shooterData.sepa.mandatsdatum || new Date().toISOString().split('T')[0],
                verwendungszweck: 'Mitgliedsbeitrag'
              };
            }
            
            if (Object.keys(updates).length > 0) {
              updates.aktualisiertAm = new Date();
              
              const memberRef = doc(db, `clubs/${clubId}/mitglieder`, memberDoc.id);
              await updateDoc(memberRef, updates);
              updated++;
            }
          }
        }
      }
      
      setMigrationStatus(`${updated} Mitglieder aktualisiert!`);
      
    } catch (error) {
      console.error('Update Fehler:', error);
      setMigrationStatus(`Fehler: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">Daten-Migration</h1>
        <p className="text-lg text-muted-foreground">
          Migration von shooters Collection zu clubs/{'{clubId}'}/mitglieder
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🔄 Vollständige Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Migriert alle Shooter-Daten in die neue Multi-Tenant Struktur.
              Erstellt für jeden Club eine separate mitglieder Collection.
            </p>
            <Button 
              onClick={migrateShootersToClubs}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Migration läuft...' : 'Vollständige Migration starten'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 Fehlende Daten ergänzen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Ergänzt fehlende Daten in bereits migrierten Mitgliedern 
              aus der ursprünglichen shooters Collection.
            </p>
            <Button 
              onClick={updateMissingData}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? 'Update läuft...' : 'Fehlende Daten ergänzen'}
            </Button>
          </CardContent>
        </Card>

        {progress.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Fortschritt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>Fortschritt</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📋 Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded font-mono text-sm">
              {migrationStatus || 'Bereit für Migration...'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
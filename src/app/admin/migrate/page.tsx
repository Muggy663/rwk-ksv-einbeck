"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MigratePage() {
  const [status, setStatus] = useState('');
  const [migrating, setMigrating] = useState(false);

  const executeMigration = async () => {
    setMigrating(true);
    setStatus('🚀 Starte Migration...');

    try {
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');

      // 1. Alle rwk_shooters laden
      const shootersSnap = await getDocs(collection(db, 'rwk_shooters'));
      setStatus(`📊 Gefunden: ${shootersSnap.docs.length} Schützen`);

      const batch = writeBatch(db);
      let kmCount = 0;
      let rwkCount = 0;

      shootersSnap.docs.forEach((docSnap) => {
        const shooter = docSnap.data();

        // 1:1 Kopie aller Schützen nach km_shooters
        const kmShooterRef = doc(db, 'km_shooters', docSnap.id);
        batch.set(kmShooterRef, {
          firstName: shooter.firstName || '',
          lastName: shooter.lastName || '',
          title: shooter.title || '',
          name: shooter.name || '',
          kmClubId: shooter.kmClubId || null,
          clubId: shooter.clubId || null,
          rwkClubId: shooter.rwkClubId || null,
          gender: shooter.gender || '',
          birthYear: shooter.birthYear || null,
          mitgliedsnummer: shooter.mitgliedsnummer || '',
          teamIds: shooter.teamIds || [],
          isActive: shooter.isActive !== false,
          genderGuessed: shooter.genderGuessed || false,
          createdAt: shooter.createdAt || new Date(),
          importedAt: shooter.importedAt || null,
          migratedAt: new Date(),
          migratedFrom: 'rwk_shooters'
        });
        kmCount++;
        
        if (shooter.clubId) rwkCount++;
      });

      setStatus('💾 Schreibe km_shooters...');
      await batch.commit();

      setStatus(`✅ Migration abgeschlossen!\n📊 Alle Schützen kopiert: ${kmCount}\n📊 Davon RWK-Schützen: ${rwkCount}\n\n🔄 Sync-Functions werden aktiviert...`);
    } catch (error) {
      setStatus(`❌ Fehler: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>🔄 KM/RWK Migration</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={executeMigration} 
            disabled={migrating}
            className="mb-4"
          >
            {migrating ? 'Migriere...' : 'Migration starten'}
          </Button>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {status}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function MigrateRoles() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const migrateRoles = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const usersSnapshot = await getDocs(collection(db, 'user_permissions'));
      
      // KM-Organisatoren (haben vollen Zugang)
      const kmOrganisatoren = [
        'stephanie.buenger@gmx.de',
        'sportleitung-ksv-einbeck@web.de'
      ];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const email = userData.email;
        
        // KM-Organisatoren bekommen KV_WETTKAMPFLEITER
        if (kmOrganisatoren.includes(email)) {
          await updateDoc(doc(db, 'user_permissions', userDoc.id), {
            kvRoles: { einbeck: 'KV_WETTKAMPFLEITER' }
          });
          setResults(prev => [...prev, `✅ ${email} → KV_WETTKAMPFLEITER (KM-Orga)`]);
        }
        // Sportleiter bekommen nur KM-Zugang
        else if (userData.clubRoles && Object.values(userData.clubRoles).includes('SPORTLEITER')) {
          await updateDoc(doc(db, 'user_permissions', userDoc.id), {
            kvRoles: { einbeck: 'KV_KM_ORGA' }
          });
          setResults(prev => [...prev, `✅ ${email} → KV_KM_ORGA (Sportleiter)`]);
        }
        // Legacy: Alle mit vielen representedClubs sind vermutlich KM-Orgas
        else if (userData.representedClubs && userData.representedClubs.length > 10) {
          await updateDoc(doc(db, 'user_permissions', userDoc.id), {
            kvRoles: { einbeck: 'KV_WETTKAMPFLEITER' }
          });
          setResults(prev => [...prev, `✅ ${email} → KV_WETTKAMPFLEITER (${userData.representedClubs.length} Vereine)`]);
        }
      }
      
      setResults(prev => [...prev, '🎉 Migration abgeschlossen']);
    } catch (error) {
      setResults(prev => [...prev, `❌ Fehler: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Rollen-Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={migrateRoles} disabled={loading}>
            {loading ? 'Migriere...' : 'KV-Rollen setzen'}
          </Button>
          
          <div className="space-y-2">
            {results.map((result, i) => (
              <div key={i} className="text-sm font-mono">{result}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
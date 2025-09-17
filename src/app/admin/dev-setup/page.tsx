"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { useAuthContext } from '@/components/auth/AuthContext';
import Link from 'next/link';

export default function DevSetupPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createDevClub = async () => {
    if (!user || user.email !== 'admin@rwk-einbeck.de') {
      toast({
        title: 'Fehler',
        description: 'Nur Super-Admin kann Development-Club erstellen.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const devClubId = 'dev-test-club';
      await setDoc(doc(db, 'clubs', devClubId), {
        name: 'Development Test Verein',
        shortName: 'DEV',
        address: 'Teststraße 123',
        city: 'Teststadt',
        zipCode: '12345',
        email: 'dev@test.de',
        phone: '0123456789',
        website: 'https://dev-test.de',
        founded: '2020-01-01',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await setDoc(doc(db, 'user_permissions', user.uid), {
        email: 'admin@rwk-einbeck.de',
        platformRole: 'SUPER_ADMIN',
        devClubId: devClubId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }, { merge: true });

      const testMembers = [
        { firstName: 'Max', lastName: 'Mustermann', gender: 'male', birthYear: 1985 },
        { firstName: 'Anna', lastName: 'Schmidt', gender: 'female', birthYear: 1990 },
        { firstName: 'Peter', lastName: 'Müller', gender: 'male', birthYear: 1978 },
        { firstName: 'Lisa', lastName: 'Weber', gender: 'female', birthYear: 1995 },
        { firstName: 'Thomas', lastName: 'Wagner', gender: 'male', birthYear: 1982 },
        { firstName: 'Sarah', lastName: 'Becker', gender: 'female', birthYear: 1988 },
        { firstName: 'Michael', lastName: 'Schulz', gender: 'male', birthYear: 1975 },
        { firstName: 'Julia', lastName: 'Hoffmann', gender: 'female', birthYear: 1992 },
        { firstName: 'Andreas', lastName: 'Fischer', gender: 'male', birthYear: 1980 },
        { firstName: 'Stefanie', lastName: 'Meyer', gender: 'female', birthYear: 1987 },
        { firstName: 'Daniel', lastName: 'Koch', gender: 'male', birthYear: 1983 },
        { firstName: 'Nicole', lastName: 'Richter', gender: 'female', birthYear: 1991 },
        { firstName: 'Markus', lastName: 'Klein', gender: 'male', birthYear: 1979 },
        { firstName: 'Claudia', lastName: 'Wolf', gender: 'female', birthYear: 1986 },
        { firstName: 'Stefan', lastName: 'Schröder', gender: 'male', birthYear: 1984 },
        { firstName: 'Melanie', lastName: 'Neumann', gender: 'female', birthYear: 1993 },
        { firstName: 'Christian', lastName: 'Schwarz', gender: 'male', birthYear: 1981 },
        { firstName: 'Katrin', lastName: 'Zimmermann', gender: 'female', birthYear: 1989 },
        { firstName: 'Florian', lastName: 'Braun', gender: 'male', birthYear: 1977 },
        { firstName: 'Sabine', lastName: 'Hartmann', gender: 'female', birthYear: 1994 }
      ];

      for (let i = 0; i < testMembers.length; i++) {
        const member = testMembers[i];
        const memberData = {
          firstName: member.firstName,
          lastName: member.lastName,
          name: `${member.firstName} ${member.lastName}`,
          mitgliedsnummer: String(i + 1).padStart(3, '0'),
          strasse: `Teststraße ${i + 10}`,
          plz: '12345',
          ort: 'Teststadt',
          email: `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@test.de`,
          telefon: `0123${String(i + 100).padStart(6, '0')}`,
          mobil: `0171${String(i + 200).padStart(7, '0')}`,
          geburtstag: `${member.birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          geburtsdatum: `${member.birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          gender: member.gender,
          geschlecht: member.gender,
          vereinseintritt: `${2015 + Math.floor(Math.random() * 8)}-01-01`,
          eintrittsdatum: `${2015 + Math.floor(Math.random() * 8)}-01-01`,
          dsbeintritt: `${2015 + Math.floor(Math.random() * 8)}-01-01`,
          isActive: Math.random() > 0.1,
          status: Math.random() > 0.1 ? 'aktiv' : 'inaktiv',
          clubId: devClubId,
          createdAt: new Date(),
          updatedAt: new Date(),
          sepa: {
            iban: `DE${String(Math.floor(Math.random() * 100)).padStart(2, '0')}1234567890123456${String(i).padStart(2, '0')}`,
            bic: 'TESTDE21XXX',
            kontoinhaber: `${member.firstName} ${member.lastName}`,
            mandatsdatum: '2023-01-01',
            mandatsreferenz: `DEV-${String(i + 1).padStart(3, '0')}-2025`,
            verwendungszweck: 'Mitgliedsbeitrag'
          }
        };

        await addDoc(collection(db, `clubs/${devClubId}/mitglieder`), memberData);
      }

      toast({
        title: 'Development Club erstellt!',
        description: `20 Test-Mitglieder erstellt. Gehe zu /vereinssoftware`
      });

    } catch (error) {
      console.error('Fehler:', error);
      toast({
        title: 'Fehler',
        description: 'Development Club konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.email !== 'admin@rwk-einbeck.de') {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">🔒 Nur für Super-Admin</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">🔧 Development Setup</h1>
          <p className="text-muted-foreground mt-2">Development-Club erstellen</p>
        </div>
        <Link href="/dashboard-auswahl">
          <Button variant="outline">Zurück</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🏗️ Development Club erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Was wird erstellt:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Development Test Verein</li>
                <li>• 20 Test-Mitglieder mit SEPA-Daten</li>
                <li>• Automatischer Zugang für Super-Admin</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Prioritäten:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>1. <strong>Support-Code</strong> (höchste Priorität)</li>
                <li>2. <strong>Development Club</strong> (Fallback)</li>
                <li>3. <strong>Kein Zugang</strong> (Fehlermeldung)</li>
              </ul>
            </div>

            <Button 
              onClick={createDevClub} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Erstelle...' : '🚀 Development Club erstellen'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
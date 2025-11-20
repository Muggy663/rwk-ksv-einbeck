"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TestMemberAdd() {
  const addTestMember = async () => {
    try {
      // Test-Mitglied aus deiner überarbeiteten Liste
      const testMember = {
        firstName: "Bernhard",
        lastName: "Drewes",
        name: "Bernhard Drewes",
        strasse: "Domeierstr. 19",
        plz: "37574",
        ort: "Einbeck",
        email: "",
        telefon: "",
        mobil: "",
        mitgliedsnummer: "001",
        gender: "male",
        isActive: true,
        birthYear: null,
        alter: 0,
        eintrittsdatum: null,
        clubId: "SGi_Einbeck", // Deine Club-ID
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Füge zu shooters Collection hinzu
      const docRef = await addDoc(collection(db, 'shooters'), testMember);
      
      alert(`✅ Test-Mitglied erfolgreich hinzugefügt!\n📄 ID: ${docRef.id}\n👤 ${testMember.name}\n🏠 ${testMember.strasse}, ${testMember.plz} ${testMember.ort}`);
      
      // Weiterleitung zur Mitgliederverwaltung
      window.location.href = '/vereinssoftware/mitglieder';
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
      alert('❌ Fehler beim Hinzufügen des Test-Mitglieds');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test-Mitglied hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Test-Mitglied:</h3>
              <p><strong>Name:</strong> Bernhard Drewes</p>
              <p><strong>Adresse:</strong> Domeierstr. 19, 37574 Einbeck</p>
              <p><strong>Mitgl.-Nr.:</strong> 001</p>
              <p><strong>Geschlecht:</strong> Männlich</p>
            </div>
            
            <Button onClick={addTestMember} className="w-full">
              Test-Mitglied zu shooters hinzufügen
            </Button>
            
            <p className="text-sm text-gray-600">
              Das Mitglied wird direkt in die shooters Collection eingefügt und ist sofort in der Vereinssoftware sichtbar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

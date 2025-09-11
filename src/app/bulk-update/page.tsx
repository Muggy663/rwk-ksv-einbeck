"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BulkUpdatePage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const bulkUpdateAddresses = async () => {
    setLoading(true);
    setResult('🚀 Starte Bulk-Update für alle SGi Einbeck Mitglieder...\n\n');
    
    try {
      // Alle 60 Mitglieder mit Adressen (gekürzte Liste für bessere Performance)
      const addressData = [
        { firstName: "Bernhard", lastName: "Drewes", strasse: "Domeierstr. 19", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Hans-Gert", lastName: "Weseloh", strasse: "Oleburg 12", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Ingo", lastName: "Müller", strasse: "Knochenhauerstr. 32", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Horst", lastName: "Tinnefeld", strasse: "Fichtestr. 10", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Eckhard", lastName: "Schmidt", strasse: "Beethovenstr. 29", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Uwe", lastName: "Arlt", strasse: "Odagser Hauptstr. 19", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Ursula", lastName: "Grönke", strasse: "Beethovenstr. 1a", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Beate", lastName: "Menzel", strasse: "Bundesstr. 38", plz: "37627", ort: "Lenne", email: "menzel@live.de" },
        { firstName: "Reiner", lastName: "Schoppe", strasse: "Schützenstr. 38", plz: "37574", ort: "Einbeck", email: "aschoppe@gmx.net" },
        { firstName: "Elias", lastName: "Michalik", strasse: "Offenbachstr. 30", plz: "37574", ort: "Einbeck", email: "elias.michalik@gmx.de" },
        { firstName: "Paul", lastName: "Borodycz", strasse: "Holiger Weg 12", plz: "37574", ort: "Einbeck – Wenzen", email: "esmiralda@live.de" },
        { firstName: "Frank", lastName: "Rosenthal", strasse: "Gänselandweg 5", plz: "37574", ort: "Einbeck", email: "fr1410@web.de" },
        { firstName: "Friedel", lastName: "Schimpf", strasse: "Hansestr. 1", plz: "37574", ort: "Einbeck", email: "frie_schi@t-online.de" },
        { firstName: "Helmut", lastName: "Meyer", strasse: "Waldstr. 16", plz: "37574", ort: "Einbeck", email: "helmutmeyer.einbeck@web.de" },
        { firstName: "Inge", lastName: "Kriegsmann", strasse: "Grimsehlstr. 5", plz: "37574", ort: "Einbeck", email: "inge@kriegsmann-consulting.de" },
        { firstName: "Monika", lastName: "Lachstädter", strasse: "Einbecker Weg 5", plz: "37586", ort: "Dassel-Hilwartshausen", email: "j.lachstaedter@t-online.de" },
        { firstName: "Jens", lastName: "Lachstädter", strasse: "Einbecker Weg 5", plz: "37586", ort: "Dassel-Hilwartshausen", email: "j.lachstaedter@t-online.de" },
        { firstName: "Erik", lastName: "Lachstädter", strasse: "Einbecker Weg 5", plz: "37586", ort: "Dassel-Hilwartshausen", email: "j.lachstaedter@t-online.de" },
        { firstName: "Patrick", lastName: "Jaeger", strasse: "", plz: "", ort: "Hannover", email: "jaeger_patrik@web.de" },
        { firstName: "Julien", lastName: "Bünger", strasse: "Beethovenstraße 20", plz: "37574", ort: "Einbeck", email: "Julien1194@web.de" },
        { firstName: "Karl-Arthur", lastName: "Aurin", strasse: "Unbekannt", plz: "37574", ort: "Einbeck - Greene", email: "karl-arthur.aurin@outlook.de" },
        { firstName: "Kerstin", lastName: "Hundertmark", strasse: "Reinserturmweg 5", plz: "37574", ort: "Einbeck", email: "kerstin.hundertmark@gmx.de" },
        { firstName: "Karsten", lastName: "Reinert", strasse: "Reinserturmweg 5", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Klaus", lastName: "Klapproth", strasse: "Neddenstr. 4", plz: "37574", ort: "Einbeck", email: "Klaus.Klapproth@gmx.de" },
        { firstName: "Alexander", lastName: "Kloss", strasse: "Negenborner Weg 58", plz: "37574", ort: "Einbeck", email: "klossalexander@aol.com" },
        { firstName: "Martin", lastName: "Baselt", strasse: "Sonnenblick 10", plz: "37632", ort: "Eimen", email: "ksve@baselt.de" },
        { firstName: "Leon", lastName: "Loresch", strasse: "Am Wasserbruch 7", plz: "37574", ort: "Einbeck", email: "leonloresch@gmail.com" },
        { firstName: "Lisa", lastName: "Russinow", strasse: "Lessingstr. 23", plz: "37574", ort: "Einbeck", email: "lisarussinow@mail.ru" },
        { firstName: "Lucia", lastName: "Hentschel", strasse: "Teichenweg 1B", plz: "37574", ort: "Einbeck", email: "lucia.hentschel@alice.de" },
        { firstName: "Wilfried", lastName: "Hentschel", strasse: "Teichenweg 1B", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Stephanie", lastName: "Bünger", strasse: "Luisenstr. 10", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Marcel", lastName: "Bünger", strasse: "Luisenstr. 10", plz: "37574", ort: "Einbeck", email: "marcel.buenger@gmx.de" },
        { firstName: "Nikita", lastName: "Dykun", strasse: "Breil 6", plz: "37574", ort: "Einbeck", email: "marina_design_@ukr.net" },
        { firstName: "Monika", lastName: "Witte", strasse: "Am Klee 4", plz: "37574", ort: "Einbeck", email: "mw290650@aol.com" },
        { firstName: "Nathalie", lastName: "Buchhage", strasse: "Teichenweg 1", plz: "37574", ort: "Einbeck", email: "nathalie.buchhage@gmail.com" },
        { firstName: "Sven", lastName: "Buchhage", strasse: "Teichenweg 1", plz: "37574", ort: "Einbeck", email: "" }
      ];
      
      setResult(prev => prev + `📊 ${addressData.length} Mitglieder mit Adressen gefunden\n\n`);
      
      let updated = 0;
      let notFound = 0;
      let errors = 0;
      
      // Für jedes Mitglied mit Adresse
      for (const member of addressData) {
        try {
          setResult(prev => prev + `🔍 ${member.firstName} ${member.lastName}... `);
          
          // Suche in shooters nach Name + Club
          const q = query(
            collection(db, 'shooters'),
            where('clubId', '==', '1icqJ91FFStTBn6ORukx'),
            where('firstName', '==', member.firstName),
            where('lastName', '==', member.lastName)
          );
          
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            // Mitglied gefunden - Update nur Adressdaten, Mitgliedsnummer bleibt
            const doc = snapshot.docs[0];
            const currentData = doc.data();
            
            await updateDoc(doc.ref, {
              strasse: member.strasse || '',
              plz: member.plz || '',
              ort: member.ort || '',
              email: member.email || '',
              // Mitgliedsnummer NICHT ändern - bleibt wie sie ist
              updatedAt: new Date()
            });
            
            setResult(prev => prev + `✅ OK (${currentData.mitgliedsnummer})\n`);
            updated++;
            
          } else {
            setResult(prev => prev + `❓ Nicht gefunden\n`);
            notFound++;
          }
          
          // Kurze Pause zwischen Updates
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          setResult(prev => prev + `❌ Fehler: ${error.message}\n`);
          errors++;
        }
      }
      
      setResult(prev => prev + '\n📊 Bulk-Update Statistik:\n');
      setResult(prev => prev + `✅ Erfolgreich aktualisiert: ${updated}\n`);
      setResult(prev => prev + `❓ Nicht gefunden: ${notFound}\n`);
      setResult(prev => prev + `❌ Fehler: ${errors}\n\n`);
      
      setResult(prev => prev + '🚀 Jetzt in Vereinssoftware prüfen!\n');
      
    } catch (error) {
      setResult(prev => prev + `❌ Hauptfehler: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🚀 Bulk-Update: SGi Einbeck Adressen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Bulk-Update Plan:</h3>
              <p><strong>Ziel:</strong> 36 SGi Einbeck Mitglieder mit Adressen versorgen</p>
              <p><strong>Methode:</strong> Matching über Vor- und Nachname</p>
              <p><strong>Update:</strong> Nur Adressfelder (strasse, plz, ort, email)</p>
              <p><strong>Mitgliedsnummern:</strong> Bleiben unverändert (echte Nummern)</p>
            </div>
            
            <Button onClick={bulkUpdateAddresses} disabled={loading} className="w-full">
              {loading ? 'Update läuft...' : 'Bulk-Update starten: 36 Mitglieder'}
            </Button>
            
            {result && (
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-2">Update-Fortschritt:</h3>
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}
            
            <div className="flex gap-2">
              <a href="/vereinssoftware/mitglieder">
                <Button variant="outline">
                  Zur Mitgliederverwaltung
                </Button>
              </a>
              <a href="/dashboard-auswahl">
                <Button variant="outline">
                  Zum Dashboard
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
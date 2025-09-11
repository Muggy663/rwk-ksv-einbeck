"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TestUpdatePage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBulkUpdate = async () => {
    setLoading(true);
    setResult('🚀 Starte Update für ALLE 60 SGi Mitglieder...\n\n');
    
    try {
      // Alle 60 Mitglieder aus final-members.json
      const allMembers = [
        { firstName: "Bernhard", lastName: "Drewes", strasse: "Domeierstr. 19", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Hans-Gerhard", lastName: "Weseloh", strasse: "Oleburg 12", plz: "37574", ort: "Einbeck", email: "" },
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
        { firstName: "Patrik", lastName: "Jaeger", strasse: "", plz: "", ort: "Hannover", email: "jaeger_patrik@web.de" },
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
        { firstName: "Sven", lastName: "Buchhage", strasse: "Teichenweg 1", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Reiner", lastName: "Goebel", strasse: "Gleiwitzer Str. 6", plz: "37574", ort: "Einbeck", email: "reiner.goebel@t-online.de" },
        { firstName: "Kerstin", lastName: "Guttmann", strasse: "Hainsteinhof 14", plz: "37079", ort: "Göttingen", email: "rk.guttmann@web.de" },
        { firstName: "Olivia", lastName: "Mau", strasse: "Negenborner Weg 114", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Sara", lastName: "Mau", strasse: "Negenborner Weg 114", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Julius", lastName: "Mau", strasse: "Negenborner Weg 114", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Sigrid", lastName: "Wulff", strasse: "Schützenstr. 19", plz: "37574", ort: "Einbeck", email: "schrader-sigrid@t-online.de" },
        { firstName: "Harald", lastName: "Wulff", strasse: "Schützenstr. 19", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Thomas", lastName: "Jaeger", strasse: "Grimsehlstr. 5", plz: "37574", ort: "Einbeck", email: "thomas.jaeger.64@gmx.de" },
        { firstName: "Ulrike", lastName: "Jaeger", strasse: "", plz: "37574", ort: "Einbeck", email: "u.jaeger910@gmail.com" },
        { firstName: "Stefan", lastName: "Beumer", strasse: "Marktplatz 16 - 18", plz: "37574", ort: "Einbeck", email: "vorstandssekretariat@sparkasse-einbeck.de" },
        { firstName: "Annika", lastName: "Schoppe", strasse: "Schützenstr. 38", plz: "37574", ort: "Einbeck", email: "Aschoppe@arcor.de" },
        { firstName: "Ludwig", lastName: "Wiesemüller", strasse: "Königsberger Stieg 7", plz: "37574", ort: "Einbeck - Billerbeck", email: "wiesemueller300@gmail.com" },
        { firstName: "Dirk", lastName: "Heinemeyer", strasse: "Stuckenbreite 5a", plz: "37574", ort: "Einbeck - Avendshausen", email: "dheinemeyer75@gmail.com" },
        { firstName: "Daniela", lastName: "Coors", strasse: "Bismarckstr. 4a", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Marcel", lastName: "Leiding", strasse: "Bismarckstr. 4a", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Martina", lastName: "Reinert", strasse: "Hagebuttenstr. 9", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Hans-Jürgen", lastName: "Reinert", strasse: "Hagebuttenstr. 9", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Regine", lastName: "Reinert", strasse: "Reinserturmweg 5", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Andrej", lastName: "Sawtschenko", strasse: "Albert-Einstein-Straße 7", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Antonia", lastName: "Weber", strasse: "Neddenstr. 28", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Carolin", lastName: "Weber", strasse: "Neddenstr. 28", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Cecile", lastName: "Aylin Dogan", strasse: "Mühlenbergstr. 31", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Ronja", lastName: "Raue", strasse: "Kantor-Hase-Weg 5", plz: "37574", ort: "Einbeck", email: "" },
        { firstName: "Ingrid", lastName: "Drechsel", strasse: "Einbecker Weg 5", plz: "37586", ort: "Dassel-Hilwartshausen", email: "" }
      ];
      
      let updated = 0;
      let notFound = 0;
      let errors = 0;
      
      // Für jedes Mitglied
      for (const member of allMembers) {
        try {
          setResult(prev => prev + `🔍 ${member.firstName} ${member.lastName}... `);
          
          const q = query(
            collection(db, 'shooters'),
            where('clubId', '==', '1icqJ91FFStTBn6ORukx'),
            where('firstName', '==', member.firstName),
            where('lastName', '==', member.lastName)
          );
          
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const currentData = doc.data();
            
            await updateDoc(doc.ref, {
              strasse: member.strasse || '',
              plz: member.plz || '',
              ort: member.ort || '',
              email: member.email || '',
              updatedAt: new Date()
            });
            
            setResult(prev => prev + `✅ OK (${currentData.mitgliedsnummer})\n`);
            updated++;
          } else {
            setResult(prev => prev + `❓ Nicht gefunden\n`);
            notFound++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          setResult(prev => prev + `❌ Fehler: ${error.message}\n`);
          errors++;
        }
      }
      
      setResult(prev => prev + '\n📊 Statistik:\n');
      setResult(prev => prev + `✅ Aktualisiert: ${updated}\n`);
      setResult(prev => prev + `❓ Nicht gefunden: ${notFound}\n`);
      setResult(prev => prev + `❌ Fehler: ${errors}\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ Fehler: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test: Bernhard Drewes Update</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Bulk-Update Daten:</h3>
              <p><strong>Anzahl:</strong> 60 SGi Einbeck Mitglieder</p>
              <p><strong>Methode:</strong> Matching über Vor- und Nachname</p>
              <p><strong>Update:</strong> Nur Adressfelder (strasse, plz, ort, email)</p>
              <p><strong>Club-ID:</strong> 1icqJ91FFStTBn6ORukx</p>
            </div>
            
            <Button onClick={testBulkUpdate} disabled={loading} className="w-full">
              {loading ? 'Update läuft...' : 'Alle 60 SGi Mitglieder updaten'}
            </Button>
            
            {result && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Test-Ergebnis:</h3>
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
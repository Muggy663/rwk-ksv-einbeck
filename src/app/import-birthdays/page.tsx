"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ImportBirthdaysPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const importBirthdays = async () => {
    setLoading(true);
    setResult('🎂 Importiere 99 Geburtstage für SGi Einbeck...\n\n');
    
    try {
      // Alle 99 Geburtstage aus der geparsten Datei
      const birthdayData = [
        { firstName: "Uwe", lastName: "Arlt", geburtstag: "1958-09-04" },
        { firstName: "Karl-Arthur", lastName: "Aurin", geburtstag: "1989-06-10" },
        { firstName: "Eckhard", lastName: "Bangel", geburtstag: "1946-06-19" },
        { firstName: "Martin", lastName: "Baselt", geburtstag: "1964-08-02" },
        { firstName: "Stefan", lastName: "Beumer", geburtstag: "1965-09-17" },
        { firstName: "Rüdiger", lastName: "Blöck", geburtstag: "1954-03-01" },
        { firstName: "Ludwig", lastName: "Borchert", geburtstag: "1940-05-21" },
        { firstName: "Paul", lastName: "Borodycz", geburtstag: "1977-05-13" },
        { firstName: "Nathalie", lastName: "Buchhage", geburtstag: "1995-01-03" },
        { firstName: "Sven", lastName: "Buchhage", geburtstag: "1991-02-09" },
        { firstName: "Julien", lastName: "Bünger", geburtstag: "1994-11-20" },
        { firstName: "Merlin-Etienne", lastName: "Bünger", geburtstag: "2003-08-21" },
        { firstName: "Malina", lastName: "Bünger", geburtstag: "2020-11-25" },
        { firstName: "Marcel", lastName: "Bünger", geburtstag: "1989-10-01" },
        { firstName: "Stephanie", lastName: "Bünger", geburtstag: "1993-02-06" },
        { firstName: "Andreas", lastName: "Coors", geburtstag: "1962-09-23" },
        { firstName: "Daniela", lastName: "Coors", geburtstag: "1990-10-23" },
        { firstName: "Gustav", lastName: "Creydt", geburtstag: "1942-10-04" },
        { firstName: "Martin", lastName: "Deutsch", geburtstag: "1951-12-06" },
        { firstName: "Erwin", lastName: "Diefenbach", geburtstag: "1946-05-20" },
        { firstName: "Merlin", lastName: "Diedrich", geburtstag: "2009-01-30" },
        { firstName: "Simon", lastName: "Dietrich", geburtstag: "1977-02-11" },
        { firstName: "Cecile Aylin", lastName: "Dogan", geburtstag: "2007-04-26" },
        { firstName: "Ingrid", lastName: "Drechsel", geburtstag: "1934-11-07" },
        { firstName: "Bernhard", lastName: "Drewes", geburtstag: "1936-11-14" },
        { firstName: "Dan Niklas", lastName: "Eligehausen", geburtstag: "2006-01-06" },
        { firstName: "Ingo", lastName: "Feldmann", geburtstag: "1957-03-12" },
        { firstName: "Ursula", lastName: "Grönke", geburtstag: "1944-11-04" },
        { firstName: "Monika", lastName: "Grupe", geburtstag: "1966-01-25" },
        { firstName: "Ansh", lastName: "Gupta", geburtstag: "2017-09-13" },
        { firstName: "Ayanna", lastName: "Gupta", geburtstag: "2014-05-16" },
        { firstName: "Kerstin", lastName: "Guttmann", geburtstag: "1963-09-17" },
        { firstName: "Dirk", lastName: "Heinemeyer", geburtstag: "1975-02-21" },
        { firstName: "Sascha", lastName: "Hellkamp Dr.", geburtstag: "1976-05-28" },
        { firstName: "Lucia", lastName: "Hentschel", geburtstag: "1956-03-01" },
        { firstName: "Wilfried", lastName: "Hentschel", geburtstag: "1947-12-20" },
        { firstName: "Kerstin", lastName: "Hundertmark", geburtstag: "1964-10-09" },
        { firstName: "Patrik", lastName: "Jaeger", geburtstag: "1988-09-10" },
        { firstName: "Thomas", lastName: "Jaeger", geburtstag: "1964-03-10" },
        { firstName: "Ulrike", lastName: "Jaeger", geburtstag: "1971-10-09" },
        { firstName: "Hartmut", lastName: "Kahl", geburtstag: "1964-11-09" },
        { firstName: "Frank", lastName: "Kappey", geburtstag: "1963-10-03" },
        { firstName: "Herbert", lastName: "Kerl", geburtstag: "1946-08-24" },
        { firstName: "Klaus", lastName: "Klapproth", geburtstag: "1957-01-27" },
        { firstName: "Alexander", lastName: "Kloss", geburtstag: "1976-04-07" },
        { firstName: "Laura", lastName: "Kreikenbohm", geburtstag: "2005-11-16" },
        { firstName: "Inge", lastName: "Kriegsmann", geburtstag: "1945-02-23" },
        { firstName: "Erik", lastName: "Lachstädter", geburtstag: "1998-09-23" },
        { firstName: "Jens", lastName: "Lachstädter", geburtstag: "1964-12-28" },
        { firstName: "Monika", lastName: "Lachstädter", geburtstag: "1964-07-24" },
        { firstName: "Lea Marie", lastName: "Langnickel", geburtstag: "2013-08-28" },
        { firstName: "Michael", lastName: "Langnickel", geburtstag: "1990-09-11" },
        { firstName: "Patricia", lastName: "Langnickel", geburtstag: "1992-12-03" },
        { firstName: "Marcel", lastName: "Leiding", geburtstag: "1990-09-19" },
        { firstName: "Maik", lastName: "Linsel", geburtstag: "1978-02-02" },
        { firstName: "Kira", lastName: "Littau", geburtstag: "2003-07-17" },
        { firstName: "Leon", lastName: "Loresch", geburtstag: "2004-04-20" },
        { firstName: "Raimund", lastName: "Maisold", geburtstag: "1966-03-11" },
        { firstName: "Julius", lastName: "Mau", geburtstag: "2011-03-24" },
        { firstName: "Olivia", lastName: "Mau", geburtstag: "2013-03-19" },
        { firstName: "Sara", lastName: "Mau", geburtstag: "1986-10-27" },
        { firstName: "Stefan", lastName: "Mau", geburtstag: "1987-02-09" },
        { firstName: "Elisa", lastName: "Mengert", geburtstag: "1999-12-06" },
        { firstName: "Beate", lastName: "Menzel", geburtstag: "1965-06-30" },
        { firstName: "Marina", lastName: "Metzger", geburtstag: "2015-03-17" },
        { firstName: "Helmut", lastName: "Meyer", geburtstag: "1937-10-09" },
        { firstName: "Elias", lastName: "Michalik", geburtstag: "2003-09-09" },
        { firstName: "Uwe", lastName: "Mies", geburtstag: "1961-02-15" },
        { firstName: "Ingo", lastName: "Müller", geburtstag: "1963-12-24" },
        { firstName: "Ronja", lastName: "Raue", geburtstag: "2007-03-04" },
        { firstName: "Hans-Jürgen", lastName: "Reinert", geburtstag: "1952-11-30" },
        { firstName: "Karsten", lastName: "Reinert", geburtstag: "1968-06-22" },
        { firstName: "Martina", lastName: "Reinert", geburtstag: "1958-07-12" },
        { firstName: "Regine", lastName: "Reinert", geburtstag: "1947-09-06" },
        { firstName: "Frank", lastName: "Rosenthal", geburtstag: "1967-10-14" },
        { firstName: "Lisa", lastName: "Russinow", geburtstag: "2004-05-12" },
        { firstName: "Andrej", lastName: "Sawtschenko", geburtstag: "1994-07-20" },
        { firstName: "Friedel", lastName: "Schimpf", geburtstag: "1961-09-01" },
        { firstName: "Jannik Elia", lastName: "Schlimme", geburtstag: "2005-09-05" },
        { firstName: "Eckhard", lastName: "Schmidt", geburtstag: "1946-06-26" },
        { firstName: "Alfons", lastName: "Schneider", geburtstag: "1950-02-05" },
        { firstName: "Annika", lastName: "Schoppe", geburtstag: "1981-07-08" },
        { firstName: "Reiner", lastName: "Schoppe", geburtstag: "1944-04-25" },
        { firstName: "Julian", lastName: "Schwingel", geburtstag: "1989-12-30" },
        { firstName: "Gerd", lastName: "Strothmeyer", geburtstag: "1944-01-07" },
        { firstName: "Dirk", lastName: "Strohmeyer", geburtstag: "1975-05-06" },
        { firstName: "Herbert", lastName: "Synowzik", geburtstag: "1950-06-19" },
        { firstName: "Norbert", lastName: "Thiel", geburtstag: "1949-08-18" },
        { firstName: "Winfried", lastName: "Thiemann", geburtstag: "1936-11-02" },
        { firstName: "Horst", lastName: "Tinnefeld", geburtstag: "1935-12-27" },
        { firstName: "Sebastian", lastName: "Traupe", geburtstag: "1979-06-15" },
        { firstName: "Antonia", lastName: "Weber", geburtstag: "2007-07-02" },
        { firstName: "Carolin", lastName: "Weber", geburtstag: "2007-07-02" },
        { firstName: "Hans-Gert", lastName: "Weseloh", geburtstag: "1953-08-14" },
        { firstName: "Ludwig", lastName: "Wiesemüller", geburtstag: "1966-11-08" },
        { firstName: "Monika", lastName: "Witte", geburtstag: "1950-06-29" },
        { firstName: "Harald", lastName: "Wulff", geburtstag: "1959-01-10" },
        { firstName: "Sigrid", lastName: "Wulff", geburtstag: "1952-08-03" },
        { firstName: "Peter", lastName: "Zieseniß", geburtstag: "1945-11-14" }
      ];
      
      let updated = 0;
      let notFound = 0;
      
      for (const member of birthdayData) {
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
            const docRef = snapshot.docs[0];
            
            await updateDoc(docRef.ref, {
              geburtstag: member.geburtstag,
              updatedAt: new Date()
            });
            
            setResult(prev => prev + `✅ ${new Date(member.geburtstag).toLocaleDateString('de-DE')}\n`);
            updated++;
          } else {
            setResult(prev => prev + `❓ Nicht gefunden\n`);
            notFound++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          setResult(prev => prev + `❌ Fehler: ${error.message}\n`);
        }
      }
      
      setResult(prev => prev + '\n📊 Import-Statistik:\n');
      setResult(prev => prev + `✅ Geburtstage importiert: ${updated}\n`);
      setResult(prev => prev + `❓ Nicht gefunden: ${notFound}\n\n`);
      setResult(prev => prev + '🎉 Geburtstage erfolgreich importiert!\n');
      setResult(prev => prev + '📅 Jetzt können präzise Geburtstags-Aktionen geplant werden!\n');
      
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
          <CardTitle>🎂 Geburtstage aus Geburtstage.txt importieren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Import-Plan:</h3>
              <p><strong>Quelle:</strong> Geburtstage.txt (99 Einträge)</p>
              <p><strong>Ziel:</strong> SGi Einbeck Mitglieder mit echten Geburtstagen</p>
              <p><strong>Format:</strong> DD.MM.YY → YYYY-MM-DD</p>
              <p><strong>Beispiel:</strong> 04.09.58 → 1958-09-04</p>
            </div>
            
            <Button onClick={importBirthdays} disabled={loading} className="w-full">
              {loading ? 'Import läuft...' : '99 Geburtstage importieren'}
            </Button>
            
            {result && (
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-2">Import-Fortschritt:</h3>
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}
            
            <div className="flex gap-2">
              <a href="/vereinssoftware/mitglieder">
                <Button variant="outline">
                  Zur Mitgliederverwaltung
                </Button>
              </a>
              <a href="/vereinssoftware/jubilaeen">
                <Button variant="outline">
                  Zu den Jubiläen
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
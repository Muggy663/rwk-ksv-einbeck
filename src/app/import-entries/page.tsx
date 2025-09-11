"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ImportEntriesPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState('');

  const parseAndImport = async () => {
    setLoading(true);
    setResult('📅 Importiere Eintrittsdaten aus Eintritt.txt...\n\n');
    
    try {
      // Direkte Daten aus Eintritt.txt
      const eintrittData = `Arlt	Uwe	1998	1998
Aurin	Karl-Arthur	2006	2006
Bangel	Eckhard	1978	1978
Baselt	Martin	1999	1999
Beumer	Stefan	2009	2009
Blöck	Rüdiger	2011	2011
Borchert	Ludwig	1978	1978
Borodycz	Paul	2006	2006
Buchhage	Nathalie	2023	2023
Buchhage	Sven	2023	2023
Bünger	Julien	2024	2024
Bünger	Merlin-Etienne	2024	2024
Bünger	Malina	2020	2020
Bünger	Marcel	2005	2006
Bünger	Stephanie	2010	2010
Coors	Andreas	1978	1978
Coors	Daniela	2006	2002
Creydt	Gustav	1962	1962
Deutsch	Martin	2015	2015
Diefenbach	Erwin	1977	1977
Diedrich	Merlin	2020	2020
Dietrich	Simon	2016	2016
Dogan	Cecile Aylin	2017	2017
Drechsel	Ingrid	1980	1980
Drewes	Bernhard	1954	1955
Eligehausen	Dan Niklas	2024	2024
Feldmann	Ingo	2024	2023
Grönke	Ursula	2013	2013
Grupe	Monika	2016	2016
Gupta	Ansh	2024	2024
Gupta	Ayanna	2024	2024
Guttmann	Kerstin	2015	2015
Heinemeyer	Dirk	2025	
Hellkamp Dr.	Sascha	1992	1992
Hentschel	Lucia	1986	1986
Hentschel	Wilfried	1988	1988
Hundertmark	Kerstin	1982	1982
Jaeger	Patrik	1999	1999
Jaeger	Thomas	1978	1978
Jaeger	Ulrike	1998	1998
Kahl	Hartmut	2015	2015
Kappey	Frank	1997	1976
Kerl	Herbert	1993	1994
Klapproth	Klaus	2016	2016
Kloss	Alexander	1988	1988
Kreikenbohm	Laura	2024	2015
Kriegsmann	Inge	2001	2001
Lachstädter	Erik	2012	2012
Lachstädter	Jens	1981	1981
Lachstädter	Monika	1989	1989
Langnickel	Lea Marie	2022	2022
Langnickel	Michael	2022	2022
Langnickel	Patricia	2022	2022
Leiding	Marcel	2005	2006
Linsel	Maik	2025	2025
Littau	Kira	2024	2024
Loresch	Leon	2024	2024
Maisold	Raimund	2024	2015
Mau	Julius	2024	2024
Mau	Olivia	2020	2020
Mau	Sara	2024	2024
Mau	Stefan	1997	1997
Mengert	Elisa	2022	
Menzel	Beate	1982	1982
Metzger	Marina	2025	2025
Meyer	Helmut	1954	1955
Michalik	Elias	2014	2014
Mies	Uwe	1999	1999
Müller	Ingo	1985	1985
Raue	Ronja	2019	2019
Reinert	Hans-Jürgen	2006	1999
Reinert	Karsten	1984	1984
Reinert	Martina	2007	1999
Reinert	Regine	1977	1977
Rosenthal	Frank	1994	1995
Russinow	Lisa	2016	2016
Sawtschenko	Andrej	2019	2019
Schimpf	Friedel	1982	1977
Schlimme	Jannik Elia	2024	2024
Schmidt	Eckhard	1996	1997
Schneider	Alfons	1992	1973
Schoppe	Annika	1990	1990
Schoppe	Reiner	1971	1971
Schwingel	Julian	2008	2008
Strothmeyer	Gerd	1984	1984
Strohmeyer	Dirk	2024	2024
Synowzik	Herbert	1974	1974
Thiel	Norbert	1991	1988
Thiemann	Winfried	1985	1985
Tinnefeld	Horst	1962	1962
Traupe	Sebastian	1994	1988
Weber	Antonia	2017	2015
Weber	Carolin	2017	2015
Weseloh	Hans-Gert	1978	1978
Wiesemüller	Ludwig	2025	2025
Witte	Monika	2022	2022
Wulff	Harald	1998	1998
Wulff	Sigrid	1983	1983
Zieseniß	Peter	2009	2009`;
      
      const lines = eintrittData.trim().split('\n');
      const entries = [];
      
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 4) {
          const lastName = parts[0].trim();
          const firstName = parts[1].trim();
          const vereinseintritt = parts[2].trim();
          const dsbeintritt = parts[3].trim();
          
          const convertYear = (yearStr) => {
            if (!yearStr || yearStr === '-' || yearStr.trim() === '') return '';
            const year = yearStr.trim();
            // Nur Jahr verwenden, 01.01. als Standard-Datum
            return year.length === 4 ? `${year}-01-01` : '';
          };
          
          entries.push({
            firstName,
            lastName,
            vereinseintritt: convertYear(vereinseintritt),
            dsbeintritt: convertYear(dsbeintritt)
          });
        }
      }
      
      setResult(prev => prev + `📊 ${entries.length} Einträge geparst\n\n`);
      
      let updated = 0;
      let notFound = 0;
      
      for (const entry of entries) {
        try {
          setResult(prev => prev + `🔍 ${entry.firstName} ${entry.lastName}... `);
          
          const q = query(
            collection(db, 'shooters'),
            where('clubId', '==', '1icqJ91FFStTBn6ORukx'),
            where('firstName', '==', entry.firstName),
            where('lastName', '==', entry.lastName)
          );
          
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const docRef = snapshot.docs[0];
            
            const updateData = {};
            if (entry.vereinseintritt) updateData.vereinseintritt = entry.vereinseintritt;
            if (entry.dsbeintritt) updateData.dsbeintritt = entry.dsbeintritt;
            updateData.updatedAt = new Date();
            
            await updateDoc(docRef.ref, updateData);
            
            setResult(prev => prev + `✅ V: ${entry.vereinseintritt || '-'}, DSB: ${entry.dsbeintritt || '-'}\n`);
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
      setResult(prev => prev + `✅ Eintrittsdaten importiert: ${updated}\n`);
      setResult(prev => prev + `❓ Nicht gefunden: ${notFound}\n`);
      
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
          <CardTitle>📅 Vereins- und DSB-Eintritte importieren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">CSV-Format:</h3>
              <p><strong>Spalten:</strong> Nachname [Tab] Vorname [Tab] Eintritt ESG [Tab] Eintritt DSB</p>
              <p><strong>Quelle:</strong> Eintritt.txt (90 Einträge)</p>
              <p><strong>Konvertierung:</strong> 1998 → 01.01.1998</p>
              <p><strong>Beispiele:</strong> Uwe Arlt (1998/1998), Bernhard Drewes (1954/1955)</p>
            </div>
            
            <Button onClick={parseAndImport} disabled={loading} className="w-full">
              {loading ? 'Import läuft...' : '90 Eintrittsdaten aus Eintritt.txt importieren'}
            </Button>
            
            {result && (
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}
            
            <div className="flex gap-2">
              <a href="/vereinssoftware/mitglieder">
                <Button variant="outline">Zur Mitgliederverwaltung</Button>
              </a>
              <a href="/import-birthdays">
                <Button variant="outline">Geburtstage importieren</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const emailList = `Adrian Schomburg <schomburgadrian@gmail.com>; Andreas Coors (a-coors@t-online.de); Angelika Kappei <kjl-a.kappei@web.de>; anna-lena.mundhenk@web.de; astitz@t-online.de; danielamaier72@web.de; elk.fritsch@gmx.de; erhard-helmker@t-online.de; Felted1@web.de; frankkappey@gmx.de; gabriel.einbeck@t-online.de; grote.hsc@online.de; henrikehoffmann@hotmail.de; hhn.hoffmann@online.de; hoffmann-mackensen@t-online.de; Horst-Ebers-jun@gmx.de; hturdreyer@web.de; inge-oppermann@t-online.de; Jan Greve <jangreve1@web.de>; JJIKahle@web.de; johanna84@gmx.net; Jürgen Wauker <juergen.wauker@gmx.de>; k.czaika@t-online.de; karsten.reinert@gmx.de; katrinklose@googlemail.com; kerstin.collin@gmx.net; kerstin.hundertmark@gmx.de; kodaller@gmail.com; ksve@baselt.de; maisold.r@gmail.com; marcel.buenger@gmx.de; mein-janosch@t-online.de; michael.fillips@freenet.de; michael.lex@ludwig-und-partner.de; michael.stuke@gmx.net; michel.knoke@freenet.de; mirko-kappei@web.de; mr-pfeifferlbg@t-online.de; mw290650@aol.com; oliver.jeske@gmx.de; olschewski.einbeck@freenet.de; pulli1@t-online.de; Rebecca.mue66@yahoo.de; a.bokelmann@live.de; reineke.fabian@web.de; sander-lars@t-online.de; sandralosche39@gmail.com; schrader-sigrid@t-online.de; schroeder81@web.de; Silke.duee@freenet.de; sophie.traupe@web.de; Stephanie.Buenger@gmx.de; tabeastitz@t-online.de; W.Halm@web.de; wikalichte@t-online.de`;

export default function ImportContactsPage() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const parseEmailList = (emailString: string) => {
    const contacts: any[] = [];
    const entries = emailString.split(';').map(entry => entry.trim()).filter(entry => entry.length > 0);
    
    entries.forEach(entry => {
      let name = '';
      let email = '';
      
      const angleMatch = entry.match(/^(.+?)\s*<(.+?)>$/);
      const parenMatch = entry.match(/^(.+?)\s*\((.+?)\)$/);
      const emailMatch = entry.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      
      if (angleMatch) {
        name = angleMatch[1].trim();
        email = angleMatch[2].trim();
      } else if (parenMatch) {
        name = parenMatch[1].trim();
        email = parenMatch[2].trim();
      } else if (emailMatch) {
        email = entry.trim();
        name = email.split('@')[0];
      }
      
      if (email && email.includes('@')) {
        contacts.push({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          group: 'sportleiter',
          role: 'vereinsvertreter',
          createdAt: new Date()
        });
      }
    });
    
    return contacts;
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const contacts = parseEmailList(emailList);
      console.log(`📧 ${contacts.length} Kontakte gefunden`);
      
      let imported = 0;
      let skipped = 0;
      
      for (const contact of contacts) {
        try {
          const existingQuery = query(
            collection(db, 'email_contacts'),
            where('email', '==', contact.email)
          );
          const existingDocs = await getDocs(existingQuery);
          
          if (existingDocs.empty) {
            await addDoc(collection(db, 'email_contacts'), contact);
            console.log(`✅ Importiert: ${contact.name} (${contact.email})`);
            imported++;
          } else {
            console.log(`⏭️ Übersprungen: ${contact.email}`);
            skipped++;
          }
        } catch (error) {
          console.error(`❌ Fehler bei ${contact.email}:`, error);
        }
      }
      
      toast({
        title: 'Import erfolgreich',
        description: `${imported} Kontakte importiert, ${skipped} übersprungen.`,
      });
      
      setImportResult(`✅ Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen`);
    } catch (error) {
      console.error('Import-Fehler:', error);
      toast({
        title: 'Import-Fehler',
        description: 'Fehler beim Importieren der Kontakte.',
        variant: 'destructive'
      });
      setImportResult('❌ Import fehlgeschlagen');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Users className="h-8 w-8" />
          E-Mail-Kontakte importieren
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sportleiter-Verteiler Import</CardTitle>
          <CardDescription>
            Importiert 50+ E-Mail-Adressen in die email_contacts Collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleImport} 
            disabled={isImporting}
            size="lg"
            className="w-full"
          >
            {isImporting ? 'Importiere...' : 'E-Mail-Verteiler importieren'}
          </Button>

          {importResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">{importResult}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
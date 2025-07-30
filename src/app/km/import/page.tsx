"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ExcelImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log('Excel Rohdaten (erste 5 Zeilen):', jsonData.slice(0, 5)); // Debug
      
      const members = [];
      let currentVerein = '';
      
      for (let i = 1; i < jsonData.length; i++) { // Skip Header (Zeile 0)
        const row = jsonData[i] as any[];
        // Reduzierter Debug
        if (i < 3) console.log(`Zeile ${i}:`, { name: row[3], vorname: row[4], geburt: row[5] });
        
        // Skip komplett leere Zeilen
        if (!row || row.every(cell => !cell)) continue;
        
        // Spalten: A=0(Nr), B=1(Mitgliedsnr), C=2(Verein), D=3(Name), E=4(Vorname), F=5(Geburt)
        const nr = row[0]?.toString() || '';
        const mitgliedsnummer = row[1]?.toString() || '';
        const verein = row[2]?.toString() || '';
        const name = row[3]?.toString() || '';
        const vorname = row[4]?.toString() || '';
        let geburtsdatum = '';
        if (row[5]) {
          if (i < 3) console.log(`Zeile ${i} - Geburt:`, row[5], typeof row[5]);
          try {
            let dateValue = row[5];
            
            if (typeof dateValue === 'number' && dateValue > 1000) {
              // Excel-Datum als Zahl (Tage seit 1900-01-01)
              const excelEpoch = new Date(1900, 0, 1);
              const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
              if (!isNaN(date.getTime()) && date.getFullYear() > 1920 && date.getFullYear() < 2020) {
                geburtsdatum = date.toISOString().split('T')[0];
                if (i < 3) console.log(`-> Excel-Zahl: ${geburtsdatum}`);
              }
            } else if (dateValue) {
              // String-Datum - verschiedene Formate probieren
              const dateStr = dateValue.toString().trim();
              
              // Verschiedene Datumsformate
              const formats = [
                dateStr, // Original
                dateStr.replace(/\./g, '-'), // 01.01.1990 -> 01-01-1990
                dateStr.replace(/\//g, '-'), // 01/01/1990 -> 01-01-1990
                dateStr.split('.').reverse().join('-'), // 01.01.1990 -> 1990-01-01
                dateStr.split('/').reverse().join('-'), // 01/01/1990 -> 1990-01-01
              ];
              
              // Auch 2-stellige Jahre probieren
              if (dateStr.includes('.') || dateStr.includes('/')) {
                const parts = dateStr.split(/[.\/]/);
                if (parts.length === 3 && parts[2].length === 2) {
                  // 2-stelliges Jahr zu 4-stellig konvertieren
                  const year = parseInt(parts[2]);
                  const fullYear = year > 30 ? 1900 + year : 2000 + year;
                  formats.push(`${parts[0]}-${parts[1]}-${fullYear}`);
                  formats.push(`${fullYear}-${parts[1]}-${parts[0]}`);
                }
              }
              
              for (const format of formats) {
                const date = new Date(format);
                if (!isNaN(date.getTime()) && date.getFullYear() > 1920 && date.getFullYear() < 2020) {
                  geburtsdatum = date.toISOString().split('T')[0];
                  if (i < 3) console.log(`-> String-Format '${format}': ${geburtsdatum}`);
                  break;
                }
              }
            }
          } catch (e) {
            console.log(`Zeile ${i} - Datums-Parsing Fehler:`, row[5], e);
          }
        }
        
        // Vereinsname aktualisieren wenn vorhanden und nicht Header
        if (verein && verein.trim() !== '' && 
            verein !== 'Verein' && verein !== 'Club' && verein !== 'Schützenverein') {
          currentVerein = verein.trim();
          if (i < 5) console.log('Neuer Verein:', currentVerein);
        }
        
        // Skip Header und nur echte Mitglieder mit Verein hinzufügen
        if (name && name.trim() !== '' && vorname && vorname.trim() !== '' && 
            name !== 'Name' && name !== 'Nachname' && vorname !== 'Vorname' && 
            vorname !== 'Firstname' && name !== 'Lastname' && currentVerein) {
          // Geschlechts-Erkennung
          const gender = guessGender(vorname);
          
          members.push({
            mitgliedsnummer: mitgliedsnummer.trim(),
            verein: currentVerein,
            name: name.trim(),
            vorname: vorname.trim(),
            geburtsdatum,
            gender
          });
          if (i < 5) console.log('Mitglied hinzugefügt:', members[members.length - 1]); // Debug
        }
      }
      
      setPreview(members);
      toast({ title: 'Excel gelesen', description: `${members.length} Mitglieder gefunden` });
      
    } catch (error) {
      console.error('Excel-Parsing Fehler:', error);
      toast({ title: 'Fehler', description: 'Excel-Datei konnte nicht gelesen werden', variant: 'destructive' });
    }
  };
  
  // Geschlechts-Erkennung
  const guessGender = (vorname: string): 'male' | 'female' | 'unknown' => {
    const nameLower = vorname.toLowerCase().trim();
    
    // Häufige männliche Namen (erweitert)
    const maleNames = [
      'alexander', 'andreas', 'christian', 'daniel', 'frank', 'hans', 'jürgen', 'klaus', 'manfred', 'martin', 'michael', 'peter', 'stefan', 'thomas', 'uwe', 'wolfgang', 'max', 'paul', 'karl', 'heinz',
      'bernd', 'otto', 'helmut', 'werner', 'günter', 'horst', 'dieter', 'gerhard', 'rolf', 'herbert', 'walter', 'rainer', 'norbert', 'jörg', 'detlef', 'reinhard', 'gerd', 'hartmut', 'volker', 'axel',
      'dirk', 'rüdiger', 'friedhelm', 'wilfried', 'siegfried', 'alfred', 'ernst', 'georg', 'heinrich', 'hermann', 'kurt', 'ludwig', 'rudolf', 'wilhelm', 'adolf', 'anton', 'bruno', 'emil', 'fritz', 'gustav',
      'johann', 'josef', 'richard', 'robert', 'willi', 'armin', 'bernhard', 'erich', 'erwin', 'eugen', 'friedrich', 'gottfried', 'günther', 'hans-peter', 'heinz-werner', 'holger', 'joachim', 'jochen', 'johannes',
      'lars', 'marcel', 'markus', 'matthias', 'oliver', 'ralf', 'roland', 'sebastian', 'thorsten', 'tobias', 'jan', 'jens', 'kai', 'marco', 'sven', 'tim', 'tom', 'björn', 'carsten', 'dennis'
    ];
    
    // Häufige weibliche Namen (erweitert)
    const femaleNames = [
      'andrea', 'angela', 'anna', 'barbara', 'birgit', 'brigitte', 'christine', 'claudia', 'doris', 'elisabeth', 'gabi', 'heike', 'ingrid', 'karin', 'martina', 'monika', 'petra', 'sabine', 'susanne', 'ursula', 'maria', 'eva', 'lisa', 'sarah',
      'renate', 'christa', 'helga', 'inge', 'margot', 'ruth', 'edith', 'elfriede', 'erna', 'gerda', 'gertrud', 'gisela', 'hannelore', 'hedwig', 'herta', 'hildegard', 'ilse', 'irene', 'lieselotte', 'margarete',
      'marianne', 'marie', 'martha', 'rosemarie', 'waltraud', 'anneliese', 'brunhilde', 'erika', 'frieda', 'gabriele', 'gudrun', 'hanna', 'johanna', 'käthe', 'lotte', 'luise', 'marga', 'rosa', 'thea', 'vera',
      'alexandra', 'antje', 'astrid', 'beate', 'bettina', 'cornelia', 'dagmar', 'diana', 'elke', 'franziska', 'gabriela', 'iris', 'jasmin', 'julia', 'katja', 'katrin', 'manuela', 'melanie', 'nadine', 'nicole',
      'silke', 'simone', 'stefanie', 'tanja', 'ute', 'vanessa', 'yvonne', 'angelika', 'anke', 'annette', 'bärbel', 'christiane', 'daniela', 'gisela', 'jutta', 'michaela', 'regina', 'silvia', 'sonja', 'ulrike'
    ];
    
    // Exakte Übereinstimmung zuerst
    if (maleNames.includes(nameLower)) return 'male';
    if (femaleNames.includes(nameLower)) return 'female';
    
    // Dann Teilstring-Suche
    if (maleNames.some(n => nameLower.includes(n) || n.includes(nameLower))) return 'male';
    if (femaleNames.some(n => nameLower.includes(n) || n.includes(nameLower))) return 'female';
    
    // Sammle unbekannte Namen für Debugging
    if (Math.random() < 0.05) console.log('Unbekannter Name:', vorname);
    
    // Endungen-basierte Erkennung (verbessert)
    if (nameLower.endsWith('a') && !nameLower.endsWith('cha') && !nameLower.endsWith('sha')) return 'female';
    if (nameLower.endsWith('e') && nameLower.length > 3 && !nameLower.endsWith('ke') && !nameLower.endsWith('le')) return 'female';
    if (nameLower.endsWith('ine') || nameLower.endsWith('ina') || nameLower.endsWith('ela')) return 'female';
    if (nameLower.endsWith('er') || nameLower.endsWith('en') || nameLower.endsWith('us') || nameLower.endsWith('an')) return 'male';
    
    return 'unknown';
  };

  const handleImport = async () => {
    if (!preview.length) return;

    setImporting(true);
    try {
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: preview })
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: 'Erfolg', description: result.message });
        setFile(null);
        setPreview([]);
      } else {
        toast({ title: 'Fehler', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Import fehlgeschlagen', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">📊 Excel-Import</h1>
          <p className="text-muted-foreground">
            Mitgliederliste aus Excel importieren
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Excel-Datei hochladen</CardTitle>
          <CardDescription>
            Format: Mitgliedsnummer | Verein | Name | Vorname | Geburtsdatum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <div className="text-gray-500">
                  <div className="text-4xl mb-2">📁</div>
                  <div>Excel-Datei hier ablegen oder klicken zum Auswählen</div>
                  <div className="text-sm mt-1">Unterstützt: .xlsx, .xls</div>
                </div>
              </label>
            </div>
            
            <div className="text-center">
              <label htmlFor="excel-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>📂 Excel-Datei auswählen</span>
                </Button>
              </label>
            </div>
          </div>

          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="font-medium">Datei ausgewählt:</div>
              <div className="text-sm text-blue-700">{file.name}</div>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Vorschau ({preview.length} Einträge)</h3>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Nr.</th>
                      <th className="p-2 text-left">Verein</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Geburt</th>
                      <th className="p-2 text-left">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((member, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 text-sm">{member.mitgliedsnummer}</td>
                        <td className="p-2 text-sm">{member.verein}</td>
                        <td className="p-2 text-sm">{member.vorname} {member.name}</td>
                        <td className="p-2 text-sm">{member.geburtsdatum ? new Date(member.geburtsdatum).getFullYear() : '?'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                            member.gender === 'female' ? 'bg-pink-100 text-pink-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.gender === 'male' ? 'M' :
                             member.gender === 'female' ? 'W' : '?'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                    ... und {preview.length - 5} weitere
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleImport}
              disabled={!preview.length || importing}
              className={preview.length === 0 ? 'opacity-50' : ''}
            >
              {importing ? 'Importiere...' : `${preview.length} Mitglieder importieren`}
            </Button>
            <Button variant="outline" onClick={() => { setFile(null); setPreview([]); }}>
              Zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
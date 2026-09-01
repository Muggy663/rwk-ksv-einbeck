// /app/verein/mitglieder-import/page.tsx
"use client";
import React, { useState, useRef, useCallback } from 'react';
import { logError, logInfo } from '@/lib/utils/secure-logger';
import { useVereinAuth } from '@/app/verein/layout';
import { useClubContext } from '@/contexts/ClubContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// Excel-Datum (Seriennummer) → Geburtsjahr
function excelDateToYear(value: number | string | null | undefined): number | null {
  if (!value) return null;
  if (typeof value === 'number' && value > 10000) {
    // Excel-Seriennummer: Tage seit 1900-01-01
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    const year = date.getUTCFullYear();
    if (year > 1920 && year < 2020) return year;
  }
  if (typeof value === 'string') {
    const match = value.match(/(\d{4})/);
    if (match) {
      const year = parseInt(match[1]);
      if (year > 1920 && year < 2020) return year;
    }
  }
  return null;
}

function normalizeGender(geschlecht: string | null | undefined): 'male' | 'female' | 'unknown' {
  if (!geschlecht) return 'unknown';
  const g = geschlecht.toLowerCase().trim();
  if (g === 'männlich' || g === 'm' || g === 'male' || g === 'herr') return 'male';
  if (g === 'weiblich' || g === 'w' || g === 'female' || g === 'frau') return 'female';
  return 'unknown';
}

interface ParsedMember {
  nachname: string;
  vorname: string;
  verbandsnummer: string;
  geburtsjahr: number | null;
  geschlecht: 'male' | 'female' | 'unknown';
  status: string;
  email: string;
  telefon: string;
  // Matching-Ergebnis
  matchedShooterId?: string;
  matchType?: 'mitgliedsnummer' | 'name' | 'neu';
  action?: 'update' | 'create' | 'skip';
  skipReason?: string;
}

interface ImportResult {
  updated: number;
  created: number;
  skipped: number;
  errors: string[];
}

export default function MitgliederImportPage() {
  const { loadingPermissions, currentClubId } = useVereinAuth();
  const { activeClubId } = useClubContext();
  const { toast } = useToast();

  const effectiveClubId = currentClubId || activeClubId;

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcel = useCallback(async (file: File) => {
    setIsParsing(true);
    setImportResult(null);
    try {
      // Vereinsnummer des eigenen Vereins laden
      const clubSnap = await getDoc(doc(db, 'clubs', effectiveClubId || ''));
      const clubNumber: string = clubSnap.exists() ? (clubSnap.data().clubNumber || '') : '';
      const vereinsnummer = clubNumber ? clubNumber.split('-')[1] || '' : '';
      if (!vereinsnummer) {
        toast({
          title: 'Hinweis: Keine Vereinsnummer hinterlegt',
          description: 'Für deinen Verein ist keine Vereinsnummer (08-XXX) gepflegt. Die Prüfung auf Mitglieder anderer Vereine ist deaktiviert. Bitte den Administrator informieren.',
          variant: 'destructive'
        });
      }

      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rows.length < 2) {
        toast({ title: 'Fehler', description: 'Die Datei enthält keine Daten.', variant: 'destructive' });
        setIsParsing(false);
        return;
      }

      // Header-Zeile finden (erste Zeile mit "Nachname")
      const headerRow = rows[0] as string[];
      const colIndex = (name: string) => headerRow.findIndex(h => h && h.toString().toLowerCase().includes(name.toLowerCase()));

      const idxNachname = colIndex('Nachname');
      const idxVorname = colIndex('Vorname');
      const idxVerbandsnummer = colIndex('Verbandsnummer');
      const idxGeburtsdatum = colIndex('Geburtsdatum');
      const idxGeschlecht = colIndex('Geschlecht');
      const idxStatus = colIndex('Status');
      const idxEmailPrivat = colIndex('E-Mail Privat');
      const idxTelefonPrivat = colIndex('Telefon Privat');

      if (idxNachname === -1 || idxVorname === -1) {
        toast({
          title: 'Ungültiges Format',
          description: 'Spalten "Nachname" und "Vorname" nicht gefunden. Bitte nur die Mitcom-Excel verwenden.',
          variant: 'destructive'
        });
        setIsParsing(false);
        return;
      }

      // Bestehende Schützen des Vereins laden
      const shootersSnap = await getDocs(
        query(collection(db, 'shooters'), where('clubId', '==', effectiveClubId))
      );
      const shootersByMitgliedsnummer = new Map<string, string>(); // mitgliedsnummer → id
      const shootersByName = new Map<string, string>(); // "vorname nachname" → id

      shootersSnap.docs.forEach(d => {
        const data = d.data();
        if (data.mitgliedsnummer) shootersByMitgliedsnummer.set(data.mitgliedsnummer.trim(), d.id);
        const fullName = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.toLowerCase().trim();
        if (fullName.length > 1) shootersByName.set(fullName, d.id);
      });

      const members: ParsedMember[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const nachname = (row[idxNachname] || '').toString().trim();
        const vorname = (row[idxVorname] || '').toString().trim();
        if (!nachname || !vorname || nachname === 'Nachname') continue;

        const verbandsnummer = idxVerbandsnummer >= 0 ? (row[idxVerbandsnummer] || '').toString().trim() : '';
        // Führende 0 entfernen — KM-Seite erwartet Format ohne führende 0 (z.B. "80170131" statt "080170131")
        const mitgliedsnummer = verbandsnummer.startsWith('0') ? verbandsnummer.slice(1) : verbandsnummer;
        const geburtsjahr = idxGeburtsdatum >= 0 ? excelDateToYear(row[idxGeburtsdatum]) : null;
        const geschlecht = normalizeGender(idxGeschlecht >= 0 ? row[idxGeschlecht] : null);
        const status = idxStatus >= 0 ? (row[idxStatus] || '').toString().trim() : 'Aktiv';
        const email = idxEmailPrivat >= 0 ? (row[idxEmailPrivat] || '').toString().trim() : '';
        const telefon = idxTelefonPrivat >= 0 ? (row[idxTelefonPrivat] || '').toString().trim() : '';

        // Vereinsnummer-Prüfung: Mitgliedsnummer muss zur Vereinsnummer des eigenen Vereins passen
        if (vereinsnummer && mitgliedsnummer && mitgliedsnummer.length >= 7) {
          const nummerVereinsnummer = mitgliedsnummer.slice(0, 3);
          if (nummerVereinsnummer !== vereinsnummer) {
            members.push({
              nachname, vorname, verbandsnummer: mitgliedsnummer, geburtsjahr, geschlecht,
              status, email, telefon,
              matchType: 'neu', action: 'skip', skipReason: `Anderer Verein (${nummerVereinsnummer} ≠ ${vereinsnummer})`
            });
            continue;
          }
        }

        // Matching: erst per Mitgliedsnummer, dann per Name
        let matchedShooterId: string | undefined;
        let matchType: ParsedMember['matchType'] = 'neu';

        if (mitgliedsnummer && shootersByMitgliedsnummer.has(mitgliedsnummer)) {
          matchedShooterId = shootersByMitgliedsnummer.get(mitgliedsnummer);
          matchType = 'mitgliedsnummer';
        } else {
          const nameKey = `${vorname} ${nachname}`.toLowerCase();
          if (shootersByName.has(nameKey)) {
            matchedShooterId = shootersByName.get(nameKey);
            matchType = 'name';
          }
        }

        // Aktion bestimmen
        let action: ParsedMember['action'] = 'create';
        let skipReason: string | undefined;

        if (status.toLowerCase() !== 'aktiv') {
          action = 'skip';
          skipReason = 'Inaktiv';
        } else if (matchedShooterId) {
          action = 'update';
        } else {
          action = 'create';
        }

        members.push({
          nachname, vorname, verbandsnummer: mitgliedsnummer, geburtsjahr, geschlecht,
          status, email, telefon,
          matchedShooterId, matchType, action, skipReason
        });
      }

      setParsedMembers(members);
      setStep('preview');
    } catch (err) {
      logError('Excel-Parse-Fehler:', err);
      toast({ title: 'Fehler beim Lesen', description: 'Die Datei konnte nicht gelesen werden.', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  }, [effectiveClubId, toast]);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx'].includes(ext || '')) {
      toast({
        title: 'Falsches Dateiformat',
        description: 'Nur Excel-Dateien (.xls oder .xlsx) werden unterstützt. Kein PDF, kein CSV.',
        variant: 'destructive'
      });
      return;
    }
    setFileName(file.name);
    parseExcel(file);
  }, [parseExcel, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const runImport = async () => {
    if (!effectiveClubId) return;
    setIsImporting(true);
    const result: ImportResult = { updated: 0, created: 0, skipped: 0, errors: [] };

    for (const member of parsedMembers) {
      try {
        if (member.action === 'skip') {
          result.skipped++;
          continue;
        }

        const shooterData: any = {
          firstName: member.vorname,
          lastName: member.nachname,
          name: `${member.vorname} ${member.nachname}`,
          clubId: effectiveClubId,
          isActive: true,
        };

        // Nur befüllen wenn vorhanden
        if (member.geschlecht !== 'unknown') shooterData.gender = member.geschlecht;
        if (member.geburtsjahr) shooterData.birthYear = member.geburtsjahr;
        if (member.verbandsnummer) shooterData.mitgliedsnummer = member.verbandsnummer;
        if (member.email) shooterData.email = member.email;
        if (member.telefon) shooterData.telefon = member.telefon;

        if (member.action === 'update' && member.matchedShooterId) {
          // Nur vorhandene Felder aktualisieren — niemals überschreiben was schon gesetzt ist
          const updatePayload: any = { updatedAt: new Date(), source: 'mitcom_import' };
          if (member.geschlecht !== 'unknown') updatePayload.gender = member.geschlecht;
          if (member.geburtsjahr) updatePayload.birthYear = member.geburtsjahr;
          if (member.verbandsnummer) updatePayload.mitgliedsnummer = member.verbandsnummer;
          if (member.email) updatePayload.email = member.email;
          if (member.telefon) updatePayload.telefon = member.telefon;
          updatePayload.firstName = member.vorname;
          updatePayload.lastName = member.nachname;
          updatePayload.name = `${member.vorname} ${member.nachname}`;

          await updateDoc(doc(db, 'shooters', member.matchedShooterId), updatePayload);
          result.updated++;
        } else if (member.action === 'create') {
          shooterData.createdAt = new Date();
          shooterData.importedAt = new Date();
          shooterData.source = 'mitcom_import';
          shooterData.teamIds = [];
          if (!shooterData.gender) shooterData.gender = 'unknown';

          const newRef = doc(collection(db, 'shooters'));
          await setDoc(newRef, shooterData);
          result.created++;
        }
      } catch (err) {
        logError(`Import-Fehler ${member.vorname} ${member.nachname}:`, err);
        result.errors.push(`${member.vorname} ${member.nachname}`);
      }
    }

    setImportResult(result);
    setStep('done');
    setIsImporting(false);
    logInfo(`Mitcom-Import abgeschlossen: ${result.updated} aktualisiert, ${result.created} neu, ${result.skipped} übersprungen`);
  };

  const reset = () => {
    setStep('upload');
    setFileName(null);
    setParsedMembers([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loadingPermissions) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const toUpdate = parsedMembers.filter(m => m.action === 'update').length;
  const toCreate = parsedMembers.filter(m => m.action === 'create').length;
  const toSkip = parsedMembers.filter(m => m.action === 'skip').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <BackButton fallbackHref="/mitglieder" size="sm" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Mitglieder-Import aus Mitcom
          </CardTitle>
          <CardDescription>
            Importiere deine Vereinsmitglieder aus dem Mitcom-Mitgliederverwaltungssystem.
            Bestehende Schützen werden aktualisiert, neue werden angelegt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Hinweis-Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-medium">So funktioniert der Import:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-300">
                <li>Exportiere deine Mitglieder aus Mitcom als <strong>Excel-Datei (.xls oder .xlsx)</strong></li>
                <li>Lade die Datei hier hoch — PDF und CSV werden <strong>nicht</strong> unterstützt</li>
                <li>Bestehende Schützen werden per Verbandsnummer oder Name erkannt und aktualisiert</li>
                <li>Geschlecht, Geburtsjahr und Mitgliedsnummer werden aus Mitcom übernommen</li>
                <li>Inaktive Mitglieder werden übersprungen</li>
              </ul>
            </div>
          </div>

          {/* Schritt 1: Upload */}
          {step === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={handleFileInput}
              />
              {isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Datei wird analysiert...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Excel-Datei hier ablegen oder klicken zum Auswählen</p>
                  <p className="text-sm text-muted-foreground">Nur .xls und .xlsx — kein PDF, kein CSV</p>
                </div>
              )}
            </div>
          )}

          {/* Schritt 2: Vorschau */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {toUpdate} werden aktualisiert
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {toCreate} werden neu angelegt
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                    {toSkip} übersprungen (inaktiv)
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>Andere Datei</Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Datei: <span className="font-medium">{fileName}</span> · {parsedMembers.length} Mitglieder gefunden
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Verbandsnr.</TableHead>
                        <TableHead>Geburtsjahr</TableHead>
                        <TableHead>Geschlecht</TableHead>
                        <TableHead>Aktion</TableHead>
                        <TableHead>Matching</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedMembers.map((m, i) => (
                        <TableRow key={i} className={m.action === 'skip' ? 'opacity-40' : ''}>
                          <TableCell className="font-medium">{m.vorname} {m.nachname}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{m.verbandsnummer || '—'}</TableCell>
                          <TableCell>{m.geburtsjahr || '—'}</TableCell>
                          <TableCell>
                            {m.geschlecht === 'male' ? (
                              <Badge className="bg-blue-100 text-blue-700 border-0">M</Badge>
                            ) : m.geschlecht === 'female' ? (
                              <Badge className="bg-pink-100 text-pink-700 border-0">W</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 border-0">?</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {m.action === 'update' && <Badge className="bg-green-100 text-green-700 border-0">Aktualisieren</Badge>}
                            {m.action === 'create' && <Badge className="bg-blue-100 text-blue-700 border-0">Neu anlegen</Badge>}
                            {m.action === 'skip' && <Badge variant="outline" className="text-gray-500">Überspringen</Badge>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.matchType === 'mitgliedsnummer' && '✓ Verbandsnr.'}
                            {m.matchType === 'name' && '✓ Name'}
                            {m.matchType === 'neu' && '— Neu'}
                            {m.skipReason && m.skipReason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={reset} disabled={isImporting}>Abbrechen</Button>
                <Button onClick={runImport} disabled={isImporting || (toUpdate + toCreate === 0)}>
                  {isImporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importiere...</>
                  ) : (
                    <><Users className="h-4 w-4 mr-2" />Import starten ({toUpdate + toCreate} Einträge)</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Schritt 3: Ergebnis */}
          {step === 'done' && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Import abgeschlossen</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {importResult.updated} aktualisiert · {importResult.created} neu angelegt · {importResult.skipped} übersprungen
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {importResult.errors.length} Fehler
                  </p>
                  <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={reset}>Neuen Import starten</Button>
                <Button variant="outline" onClick={() => window.location.href = '/verein/schuetzen'}>
                  Zu Meine Schützen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

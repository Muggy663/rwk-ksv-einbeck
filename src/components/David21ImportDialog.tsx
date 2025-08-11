"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { David21Service } from '@/lib/services/david21-service';
import { KMErgebnisseService } from '@/lib/services/km-ergebnisse-service';

interface David21ImportDialogProps {
  onImport?: (results: any[]) => void;
  trigger?: React.ReactNode;
  wettkampfId?: string;
}

export function David21ImportDialog({ onImport, trigger, wettkampfId = 'VW111' }: David21ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!file) {
      toast({ title: 'Fehler', description: 'Bitte wähle eine Datei aus', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const content = await file.text();
      const results = David21Service.parseResults(content);
      
      if (results.length === 0) {
        toast({ title: 'Fehler', description: 'Keine gültigen Ergebnisse gefunden', variant: 'destructive' });
        return;
      }

      // Speichere in Firebase
      const savedIds = await KMErgebnisseService.saveErgebnisse(results, wettkampfId);
      
      // Verknüpfe mit Schützen-IDs
      await KMErgebnisseService.linkErgebnisseToSchuetzen(savedIds);
      
      // Berechne Statistiken
      const statistik = KMErgebnisseService.calculateStatistics(
        results.map(r => ({ ...r, importDatum: new Date(), saison: '2025', status: 'importiert' as const }))
      );

      // Callback für Parent-Komponente
      if (onImport) {
        onImport(results);
      }

      toast({ 
        title: '✅ Import erfolgreich', 
        description: `${results.length} Ergebnisse gespeichert (Ø ${statistik?.durchschnitt} Ringe)`,
        duration: 4000
      });
      
      setOpen(false);
      setFile(null);
    } catch (error) {
      console.error('Import Error:', error);
      toast({ title: 'Fehler', description: 'Import fehlgeschlagen', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            David21 Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            David21 Ergebnisse importieren
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="resultFile">Ergebnis-Datei (.TXT)</Label>
            <Input
              id="resultFile"
              type="file"
              accept=".txt,.TXT"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm mb-1">📊 Unterstützte Formate</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• VMT*.TXT - David21 Ergebnis-Dateien</li>
              <li>• Format: StartNr;Name;Vorname;VerNr;Ringe;Zehntel;InnerZehner</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? 'Importiere...' : 'Importieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
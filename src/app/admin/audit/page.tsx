"use client";

import React from 'react';
import { AuditTrail } from '@/components/audit/AuditTrail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Änderungsprotokoll</h1>
          <p className="text-muted-foreground">
            Protokollierung aller Änderungen an Ergebnissen und anderen Daten.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/audit/create-samples">Beispiel-Einträge erstellen</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Über das Änderungsprotokoll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Das Änderungsprotokoll zeichnet alle Änderungen an Ergebnissen und anderen wichtigen Daten auf.
            Es hilft dabei, nachzuvollziehen, wer wann welche Änderungen vorgenommen hat.
          </p>
          <p className="mt-2">
            Für jede Änderung werden folgende Informationen gespeichert:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Zeitpunkt der Änderung</li>
            <li>Benutzer, der die Änderung vorgenommen hat</li>
            <li>Art der Änderung (Erstellen, Aktualisieren, Löschen)</li>
            <li>Betroffene Entität (Ergebnis, Mannschaft, Schütze, etc.)</li>
            <li>Details zur Änderung</li>
          </ul>
        </CardContent>
      </Card>

      <AuditTrail showFilters={true} limit={100} />
    </div>
  );
}
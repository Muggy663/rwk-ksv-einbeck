// src/app/updates/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function UpdatesPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-muted-foreground">
            Übersicht aller Änderungen und Verbesserungen der RWK App Einbeck
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-2">
            <span>Aktuelle Version: 0.9.5 (26. Juni 2025)</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.9.5</CardTitle>
              <Badge variant="secondary">Neu</Badge>
            </div>
            <CardDescription>26. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bugfix-Update für Firebase-Admin-Integration und Vercel-Build.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Admin</strong>: Korrektur der Firebase-Admin-Importe für Firestore-Statistik</li>
              <li><strong>Vercel</strong>: Behebung des Fehlers "d is not a function" im Vercel-Build</li>
              <li>Optimierte Importe für Firebase-Admin v10+</li>
              <li>Verbesserte Fehlerbehandlung in der Firestore-Statistik-Funktion</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.5" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.4</CardTitle>
            <CardDescription>25. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Update mit Fehlerbehebungen und UI-Verbesserungen für RWK-Tabellen und Terminverwaltung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>🐛 Behebung von Fehlern in der Datenbank-Recovery-Seite</li>
              <li>📅 Korrektur von Problemen beim Hinzufügen von Terminen</li>
              <li>📊 Verbesserte Sortierlogik für RWK-Tabellen</li>
              <li>🎨 Neue UI-Funktionen für RWK-Tabellen</li>
              <li>📱 Verbesserte mobile Ansicht für Tabellen</li>
              <li>🔧 Behebung von NaN-Fehlern in RWK-Tabellen</li>
              <li>📊 Optimiertes Statistik-Dashboard</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.4" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.3</CardTitle>
            <CardDescription>25. Juni 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bugfix-Update für Ergebniserfassung und Terminverwaltung.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>🐛 Korrektur der Anzeige von Teams mit fehlenden Ergebnissen</li>
              <li>🔧 Verbesserung der Benutzeroberfläche für vollständig erfasste Teams</li>
              <li>🔒 Behebung von Berechtigungsproblemen bei Liga-Updates</li>
              <li>📊 Filterung von Saisons - nur laufende und abgeschlossene Saisons werden angezeigt</li>
              <li>📅 Behebung des Fehlers bei der Bearbeitung von Terminen</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.3" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.9.2</CardTitle>
            <CardDescription>20. Januar 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Performance-Update mit Batch-Loading und Caching-Optimierungen.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>⚡ Hybrid Lazy Loading für optimale Performance</li>
              <li>📊 Batch-Loading reduziert Datenbankabfragen von ~49 auf 3</li>
              <li>🔄 Intelligentes Caching für bereits geladene Daten</li>
              <li>⏱️ Sofortige Anzeige der Team-Tabellen</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Link href="/updates/v0.9.2" className="text-primary hover:text-primary/80 text-sm flex items-center">
                Details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Weitere Update-Karten hier */}
        
        <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Ältere Versionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/updates/v0.9.1" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.9.1 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.9" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.9.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.8" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.8.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.7" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.7.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.6" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.6.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.5" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.5.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.4" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.4.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.3" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.3.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.2" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.2.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.1.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
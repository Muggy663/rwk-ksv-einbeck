// src/app/updates/v0.9.7/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wrench, Sparkles } from 'lucide-react';

export default function UpdateV097Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 0.9.7</h1>
          <p className="text-muted-foreground">
            Admin-Features & RWK-Ordnung Update (26. Juni 2025)
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/updates" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Alle Updates
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
          <CardDescription>
            Dieses Update bringt wichtige Admin-Features und vervollständigt die RWK-Ordnung-Umsetzung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Ersatzschützen-System, Startgelder-Verwaltung und intelligenter Auf-/Abstieg für Administratoren.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
            Neue Admin-Features
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Ersatzschützen-System</strong>: Vollständige Implementierung gemäß RWK-Ordnung mit automatischem Ergebnis-Transfer</li>
            <li><strong>Startgelder-Verwaltung</strong>: Automatische Berechnung mit PDF/CSV-Export für den Schatzmeister</li>
            <li><strong>Halbautomatischer Auf-/Abstieg</strong>: Intelligente Vorschläge mit Ringzahl-Vergleichen</li>
            <li><strong>RWK-Tabellen Anzeige</strong>: Ersatzschützen werden mit ⚠️ Badge und Tooltip sichtbar markiert</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-gray-500" />
            Technische Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Build-Fixes</strong>: Korrektur der @types/nodemailer Version für Vercel-Kompatibilität</li>
            <li><strong>Mobile Layout</strong>: Verbesserte Darstellung der RWK-Ordnung auf Mobilgeräten</li>
            <li><strong>Dark Mode</strong>: Bessere Lesbarkeit der Überschriften in der RWK-Ordnung</li>
          </ul>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">👥 Ersatzschützen-System</h4>
            <p className="text-sm text-green-700">
              <strong>Vollständig funktionsfähig:</strong> Einzelschützen können in Teams wechseln, 
              neue Schützen können einspringen. Ergebnisse werden automatisch übertragen oder beibehalten. 
              Ersatzschützen sind in den RWK-Tabellen mit Badge sichtbar.
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💰 Startgelder-Verwaltung</h4>
            <p className="text-sm text-blue-700">
              Automatische Berechnung der Startgelder pro Verein mit Export als PDF oder CSV. 
              Perfekt für den Schatzmeister zur Weiterleitung an die Vereine.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">🏆 Intelligenter Auf-/Abstieg</h4>
            <p className="text-sm text-purple-700">
              Halbautomatisches System: Meister steigen auf, Letzte steigen ab. 
              Vorletzte werden mit Zweitplatzierten verglichen (höhere Ringzahl entscheidet).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
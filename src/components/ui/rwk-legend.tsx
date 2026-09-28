"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LineChart as LineChartIcon, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const RWKLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors">
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                RWK Tabellen - Erklärung & Legende
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Sortierung & Wertung */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-semibold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Sortierung & Wertung</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-4">
                  Die Tabelle wird nach dem letzten vollständig abgeschlossenen Durchgang sortiert. 
                  Teams, die bereits weitere Durchgänge begonnen haben, werden erst neu eingeordnet, 
                  wenn alle Teams diesen Durchgang abgeschlossen haben.
                </p>
              </div>

              {/* Statistik-Diagramme */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-900 dark:text-green-100 font-semibold">
                  <LineChartIcon className="h-4 w-4 text-green-600" />
                  <span>Statistik-Diagramme</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                  Klicken Sie auf Schützen-Namen für detaillierte Statistik-Diagramme mit Leistungsverlauf.
                </p>
              </div>
            </div>

            {/* Symbole & Markierungen */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Symbole & Markierungen</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pl-6">
                <div className="flex items-center gap-3">
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-xs min-w-fit">FEHLT</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fehlende Ergebnisse</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-lg min-w-fit">-</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Durchgang nicht begonnen</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-500 font-bold text-sm min-w-fit">AK</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Außer Konkurrenz</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs min-w-fit">Lücken</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fehlende frühere DG</span>
                </div>
              </div>
            </div>

            {/* Platzierung & Auf-/Abstieg */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-semibold mb-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Platzierung & Auf-/Abstieg</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pl-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-200 font-bold text-xs">1</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Platz 1 – Meister / Aufstieg</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 dark:bg-slate-500/40 dark:text-slate-100 font-bold text-xs">2</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Platz 2 – Aufstieg / Vergleich</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-200 text-orange-800 dark:bg-orange-500/30 dark:text-orange-200 font-bold text-xs">N-1</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Vorletzter – Abstiegskampf</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-200 text-red-800 dark:bg-red-500/30 dark:text-red-200 font-bold text-xs">N</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Letzter – Abstieg</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 pl-6 leading-relaxed">
                Die farbigen Zonen richten sich nach der Ligagröße. Zusätzlich vergleicht die App den
                Zweiten mit dem Vorletzten der höheren Liga (Aufstieg) und den Vorletzten mit dem Zweiten
                der niedrigeren Liga (Abstieg) und zeigt einen Hinweis wie „Aufstieg möglich", „Abstieg
                droht" oder „Klassenerhalt". Nach dem letzten Durchgang steht das Ergebnis fest
                („Aufstieg geschafft", „Klassenerhalt geschafft", „Abstieg"). Das ist eine Prognose für
                die nächste Saison unter der Annahme, dass alle Mannschaften erneut melden – keine
                amtliche Auf-/Abstiegsentscheidung.
              </p>
            </div>

            {/* Mobile Hinweis */}
            <div className="mt-6 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 md:hidden">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-100 font-medium mb-2">
                <span>📱</span>
                <span>Mobile Ansicht</span>
              </div>
              <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <p>Mannschaften werden als übersichtliche Karten angezeigt – zum Aufklappen der Schützen-Details einfach antippen.</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

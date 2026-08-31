"use client";

import React, { useState } from 'react';
import { A11yButton } from '@/components/ui/a11y-button';
import { A11yTable } from '@/components/ui/a11y-table';
import { AriaLive } from '@/components/ui/aria-live';
import { OptimizedCard } from '@/components/optimized-card';
import { Button } from '@/components/ui/button';

export default function BarrierefreiheitPage() {
  const [message, setMessage] = useState('');
  
  const tableData = [
    { id: 1, name: 'Max Mustermann', verein: 'SV Musterstadt', ergebnis: 298 },
    { id: 2, name: 'Erika Musterfrau', verein: 'SV Beispieldorf', ergebnis: 296 },
    { id: 3, name: 'Peter Schmidt', verein: 'SV Testheim', ergebnis: 295 },
  ];
  
  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Verein', accessorKey: 'verein' },
    { 
      header: 'Ergebnis', 
      accessorKey: 'ergebnis',
      cell: (value: number) => (
        <span className={value >= 297 ? 'text-green-600 font-bold' : ''}>
          {value}
        </span>
      )
    },
  ];

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Barrierefreiheit Beispiele</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <OptimizedCard
          title="Barrierefreie Buttons"
          description="Verbesserte Tastaturnavigation und Screenreader-Unterstützung"
        >
          <div className="space-y-4">
            <A11yButton 
              ariaLabel="Speichern" 
              tooltipText="Änderungen speichern"
              keyboardShortcut="Strg+S"
              onClick={() => setMessage('Gespeichert!')}
            >
              Speichern
            </A11yButton>
            
            <A11yButton 
              variant="destructive"
              ariaLabel="Löschen" 
              tooltipText="Eintrag löschen"
              keyboardShortcut="Entf"
              onClick={() => setMessage('Gelöscht!')}
            >
              Löschen
            </A11yButton>
            
            <A11yButton 
              variant="outline"
              ariaLabel="Hilfe anzeigen" 
              tooltipText="Hilfe zu diesem Formular anzeigen"
              onClick={() => setMessage('Hilfe wird angezeigt')}
            >
              Hilfe
            </A11yButton>
          </div>
        </OptimizedCard>
        
        <OptimizedCard
          title="ARIA Live Regions"
          description="Dynamische Ankündigungen für Screenreader"
        >
          <div className="space-y-4">
            <p>Klicken Sie auf die Buttons, um Nachrichten für Screenreader zu generieren:</p>
            
            <div className="flex space-x-2">
              <Button onClick={() => setMessage('Daten wurden erfolgreich geladen.')}>
                Info-Nachricht
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => setMessage('Fehler! Die Aktion konnte nicht ausgeführt werden.')}
              >
                Fehler-Nachricht
              </Button>
            </div>
            
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p className="font-semibold">Letzte Nachricht:</p>
              <p>{message || 'Keine Nachricht'}</p>
            </div>
            
            <AriaLive message={message} clearAfter={5000} />
          </div>
        </OptimizedCard>
      </div>
      
      <OptimizedCard
        title="Barrierefreie Tabelle"
        description="Mit Caption, Summary und semantisch korrekter Struktur"
      >
        <A11yTable 
          caption="Ergebnisse der letzten Wettkämpfe"
          summary="Diese Tabelle zeigt die Ergebnisse der letzten Wettkämpfe mit ID, Name, Verein und Ergebnis."
          data={tableData}
          columns={columns}
        />
      </OptimizedCard>
    </div>
  );
}

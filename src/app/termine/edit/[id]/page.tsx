'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SimplifiedEditPage({ params }: { params: { id: string } }) {
  const id = params.id;
  
  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0">Termin bearbeiten</h1>
        <Link href="/termine/verwaltung">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-center text-lg mb-4">
          Die Bearbeitungsfunktion wird aktuell überarbeitet.
        </p>
        <p className="text-center mb-6">
          Bitte löschen Sie den Termin und erstellen Sie einen neuen.
        </p>
        <div className="flex justify-center">
          <Link href="/termine/verwaltung">
            <Button>Zurück zur Terminverwaltung</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
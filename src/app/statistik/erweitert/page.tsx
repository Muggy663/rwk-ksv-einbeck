"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ExtendedStatisticsPage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Saisonübergreifende Statistiken</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/statistik" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Funktion vorübergehend deaktiviert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Diese Funktion ist derzeit nicht verfügbar und wird überarbeitet.
            Bitte nutzen Sie die anderen Statistik-Funktionen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

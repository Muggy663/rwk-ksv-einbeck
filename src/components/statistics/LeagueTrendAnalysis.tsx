"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LeagueTrendAnalysis() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Liga-Trendanalyse</CardTitle>
        <CardDescription>
          Vergleich der Leistungsentwicklung aller Teams in einer Liga
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center py-4">
          Liga-Trendanalyse-Komponente wird geladen...
        </p>
      </CardContent>
    </Card>
  );
}

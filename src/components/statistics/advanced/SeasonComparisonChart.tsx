"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Shooter {
  id: string;
  name: string;
  teamName: string;
}

interface SeasonComparisonChartProps {
  shooters: Shooter[];
  numberOfSeasons: number;
}

export function SeasonComparisonChart({}: SeasonComparisonChartProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Saisonvergleich</CardTitle>
        <CardDescription>
          Vergleich der Leistung über mehrere Saisons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center py-4">
          Saisonvergleich-Komponente wird geladen...
        </p>
      </CardContent>
    </Card>
  );
}

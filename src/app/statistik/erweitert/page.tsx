"use client";

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { CrossSeasonStats } from '@/components/statistics/cross-season-stats';

export default function ExtendedStatisticsPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Saisonübergreifende Statistiken</h1>
          <p className="text-muted-foreground">Leistungsentwicklung einzelner Schützen über mehrere Saisons</p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/statistik" className="flex items-center justify-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>

      <CrossSeasonStats />
    </div>
  );
}

"use client";

import { Button } from '@/components/ui/button';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { CrossSeasonStats } from '@/components/statistics/cross-season-stats';

export default function ExtendedStatisticsPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/10 via-background to-background p-6 animate-fade-in">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white shadow-lg">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                Saisonübergreifende Statistiken
              </h1>
              <p className="text-sm text-muted-foreground">Leistungsentwicklung einzelner Schützen über mehrere Saisons</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/statistik" className="flex items-center justify-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Übersicht
            </Link>
          </Button>
        </div>
      </div>

      <CrossSeasonStats />
    </div>
  );
}

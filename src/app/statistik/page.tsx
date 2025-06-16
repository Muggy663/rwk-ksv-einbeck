"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, Users, ArrowRight, LineChart, TrendingUp } from 'lucide-react';

export default function StatistikPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Statistik-Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Standard-Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Sehen Sie sich die Standard-Statistiken an, einschließlich Leistungsentwicklung, 
              Mannschaftsvergleich und Geschlechterverteilung.
            </p>
            <Button asChild>
              <Link href="/statistik/dashboard">
                Zu den Standard-Statistiken
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Schützenvergleich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Vergleichen Sie bis zu 6 Schützen direkt miteinander und analysieren Sie 
              deren Leistungsentwicklung über die Saison.
            </p>
            <Button asChild>
              <Link href="/statistik/vergleich">
                Zum Schützenvergleich
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Erweiterte Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Entdecken Sie saisonübergreifende Vergleiche und Trendanalysen 
              für tiefere Einblicke in die Leistungsentwicklung.
            </p>
            <Button asChild>
              <Link href="/statistik/erweitert">
                Zu den erweiterten Statistiken
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
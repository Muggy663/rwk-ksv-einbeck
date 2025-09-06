"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, Users, ArrowRight, LineChart, TrendingUp } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function StatistikPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <BackButton className="mr-2" fallbackHref="/" />
        <h1 className="text-3xl font-bold text-primary">Statistik-Dashboard</h1>
      </div>
      
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
        
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Saisonübergreifende Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Analysieren Sie Leistungstrends über mehrere Saisons hinweg für Schützen und Mannschaften.
            </p>
            <Button asChild className="w-full text-center">
              <Link href="/statistik/erweitert" className="flex items-center justify-center">
                <span className="sm:hidden">Saisonübergreifend</span>
                <span className="hidden sm:inline">Zu den saisonübergreifenden Statistiken</span>
                <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

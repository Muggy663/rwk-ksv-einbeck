"use client";

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, Users, TrendingUp, ArrowRight, Trophy, Target, LineChart } from 'lucide-react';

const cards = [
  {
    href: '/statistik/dashboard',
    icon: BarChart3,
    title: 'Standard-Statistiken',
    text: 'Leistungsentwicklung, Mannschaftsvergleich und Geschlechterverteilung – interaktiv gefiltert nach Saison, Liga und Verein.',
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'group-hover:shadow-blue-500/30',
  },
  {
    href: '/statistik/vergleich',
    icon: Users,
    title: 'Schützenvergleich',
    text: 'Bis zu 6 Schützen direkt gegenüberstellen und ihre Entwicklung über die Durchgänge einer Saison analysieren.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'group-hover:shadow-emerald-500/30',
  },
  {
    href: '/statistik/erweitert',
    icon: TrendingUp,
    title: 'Saisonübergreifend',
    text: 'Leistungstrends eines Schützen über mehrere Jahre – vereins- und disziplinübergreifend zusammengeführt.',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'group-hover:shadow-amber-500/30',
    badge: 'Neu in 3.0',
  },
];

export default function StatistikPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 animate-fade-in">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-primary to-emerald-600 p-3 text-white shadow-lg">
            <LineChart className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-emerald-600 to-primary bg-clip-text text-transparent sm:text-4xl">
              Statistik-Center
            </h1>
            <p className="mt-1 text-muted-foreground">
              Auswertungen für Rundenwettkampf und Kreismeisterschaft – von der einzelnen Saison bis zum Mehrjahres-Trend
            </p>
          </div>
        </div>

        {/* Mini-Highlights */}
        <div className="relative mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-sm shadow-sm backdrop-blur">
            <Trophy className="h-4 w-4 text-amber-500" /> Mannschaftsvergleich
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-sm shadow-sm backdrop-blur">
            <Target className="h-4 w-4 text-blue-500" /> Schützenleistung
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-sm shadow-sm backdrop-blur">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Saisonübergreifende Trends
          </span>
        </div>
      </div>

      {/* Karten */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group">
              <Card
                className={`glass-card h-full overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${c.glow} animate-fade-in`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${c.gradient}`} />
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`inline-flex rounded-xl bg-gradient-to-br ${c.gradient} p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {c.badge && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {c.badge}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold">{c.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Öffnen
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

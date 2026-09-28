"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ReferenceLine,
} from 'recharts';
import type { IndividualShooterDisplayData, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';

interface ShooterDetailModalContentProps {
  shooterData: IndividualShooterDisplayData | null;
  numRounds: number;
  seasonId?: string; // fuer Deeplink zur Mannschafts-Statistik
}

export const ShooterDetailModalContent: React.FC<ShooterDetailModalContentProps> = ({ shooterData, numRounds, seasonId }) => {
  if (!shooterData) return null;

  // Deeplinks in die Statistik-Seiten (mit Vorauswahl)
  const teamStatsHref = seasonId && shooterData.leagueId
    ? `/statistik/mannschaft?season=${encodeURIComponent(seasonId)}&league=${encodeURIComponent(shooterData.leagueId)}&team=${encodeURIComponent(shooterData.teamName || '')}`
    : null;
  const crossSeasonHref = `/statistik/erweitert?shooter=${encodeURIComponent(shooterData.shooterName || '')}`;

  const chartData = [];
  const validResults: number[] = [];
  for (let i = 1; i <= numRounds; i++) {
    const scoreValue = shooterData.results[`dg${i}`];
    chartData.push({ name: `DG ${i}`, Ringe: typeof scoreValue === 'number' ? scoreValue : null });
    if (typeof scoreValue === 'number') validResults.push(scoreValue);
  }

  const leagueSpecificType = shooterData.leagueType;
  let defaultMaxScore = 300; // Default for KK
  const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
  if (leagueSpecificType && fourHundredPointDisciplines.includes(leagueSpecificType)) {
    defaultMaxScore = 400;
  }
  
  let dataMin = 0;
  let dataMax = defaultMaxScore; // Use defaultMaxScore if no valid results

  if (validResults.length > 0) {
    dataMin = Math.min(...validResults);
    dataMax = Math.max(...validResults, defaultMaxScore); // Ensure dataMax is at least defaultMaxScore
  }
  
  const yAxisDomainMin = Math.max(0, Math.floor((dataMin - 20) / 10) * 10); // Ensure min is not negative
  const yAxisDomainMax = Math.ceil((dataMax + 20) / 10) * 10;


  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary dark:text-foreground">
          {shooterData.shooterName}
          {shooterData.teamOutOfCompetition && (
            <span 
              className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium cursor-help"
              title={shooterData.teamOutOfCompetitionReason || 'Außer Konkurrenz'}
            >
              AK
            </span>
          )}
        </DialogTitle>
        <DialogDescription>
          {shooterData.teamName} - Ergebnisse der Saison {shooterData.competitionYear || ''}
          {shooterData.rank && ` (Aktueller Rang in dieser Ansicht: ${shooterData.rank})`}
          {shooterData.teamOutOfCompetition && (
            <span className="block mt-1 text-amber-700">
              Außer Konkurrenz: {shooterData.teamOutOfCompetitionReason || 'Keine Begründung angegeben'}
            </span>
          )}
        </DialogDescription>
      </DialogHeader>
      {/* Verknuepfungen in die Statistik-Auswertungen (mit Vorauswahl) */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        {teamStatsHref && (
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto border-primary/40 !text-foreground hover:!text-foreground hover:bg-primary/10">
            <Link href={teamStatsHref} className="flex items-center justify-center">
              <Users className="mr-2 h-4 w-4" />
              Mannschafts-Statistik
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto border-primary/40 !text-foreground hover:!text-foreground hover:bg-primary/10">
          <Link href={crossSeasonHref} className="flex items-center justify-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Verlauf über Jahre
          </Link>
        </Button>
      </div>
      <div className="mt-4 grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-accent">Ergebnisübersicht</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(numRounds)].map((_, i) => (
                  <TableHead key={`detail-dg${i + 1}`} className="text-center text-xs px-1 py-1.5 font-normal text-muted-foreground">DG {i + 1}</TableHead>
                ))}
                <TableHead className="text-center text-xs px-1 py-1.5 font-medium text-muted-foreground">Gesamt</TableHead>
                <TableHead className="text-center text-xs px-1 py-1.5 font-medium text-muted-foreground">Schnitt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {[...Array(numRounds)].map((_, i) => (
                  <TableCell key={`detail-val-dg${i + 1}`} className="text-center text-sm px-1 py-1.5">
                    {shooterData.results?.[`dg${i + 1}`] !== null ? (
                      shooterData.results?.[`dg${i + 1}`]
                    ) : (
                      // Prüfe, ob ein späterer Durchgang Ergebnisse hat
                      Object.entries(shooterData.results || {}).some(([key, value]) => 
                        key.startsWith('dg') && 
                        parseInt(key.substring(2)) > (i + 1) && 
                        value !== null
                      ) ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold" title="Fehlendes Ergebnis">FEHLT</span>
                      ) : (
                        <span className="text-muted-foreground" title="Durchgang noch nicht begonnen">-</span>
                      )
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-center text-sm font-semibold text-primary px-1 py-1.5">{shooterData.totalScore}</TableCell>
                <TableCell className="text-center text-sm font-medium text-muted-foreground px-1 py-1.5">{shooterData.averageScore != null ? shooterData.averageScore.toFixed(2) : '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {chartData.some(d => d.Ringe !== null && d.Ringe > 0) && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-accent">Leistungsdiagramm</h3>
            <div className="h-[300px] w-full bg-muted/20 p-4 rounded-lg shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[yAxisDomainMin, yAxisDomainMax]} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} labelStyle={{ color: 'hsl(var(--foreground))' }} formatter={(value: any) => (value === null ? '-' : value)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Ringe" stroke="hsl(var(--primary))" strokeWidth={2} name="Ringe" dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} connectNulls={false} />
                  {shooterData.averageScore !== null && shooterData.averageScore > 0 && (
                    <ReferenceLine y={shooterData.averageScore} label={{ value: `Ø ${shooterData.averageScore.toFixed(2)}`, position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} stroke="hsl(var(--accent))" strokeDasharray="3 3" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

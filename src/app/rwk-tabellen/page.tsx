"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ChevronDown,
  ChevronRight,
  TableIcon as TableIconLucide,
  Loader,
  AlertCircle,
  User,
  Users,
  Trophy,
  Medal,
  LineChart as LineChartIcon,
} from 'lucide-react';
import type {
  Season,
  League,
  Team,
  Club,
  Shooter,
  ScoreEntry,
  CompetitionDisplayConfig,
  FirestoreLeagueSpecificDiscipline,
  UIDisciplineSelection,
  AggregatedCompetitionData,
  IndividualShooterDisplayData,
  ShooterDisplayResults,
  TeamDisplay,
  LeagueDisplay,
} from '@/types/rwk';
import { uiDisciplineFilterOptions, getUIDisciplineValueFromSpecificType, leagueDisciplineOptions, MAX_SHOOTERS_PER_TEAM } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const EXCLUDED_TEAM_NAME_PART = 'einzel'; // Case-insensitive check later

interface TeamShootersTableProps {
  shootersResults: ShooterDisplayResults[];
  numRounds: number;
  parentTeam: TeamDisplay; // Pass the whole parent team for context
  onShooterClick: (shooterData: IndividualShooterDisplayData) => void;
}

const TeamShootersTable: React.FC<TeamShootersTableProps> = ({
  shootersResults,
  numRounds,
  parentTeam,
  onShooterClick,
}) => {
  if (!shootersResults || shootersResults.length === 0) {
    return (
      <div className="p-3 text-sm text-center text-muted-foreground bg-muted/30 rounded-b-md">
        Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.
      </div>
    );
  }
  return (
    <div className="p-2 bg-muted/20 rounded-b-md shadow-inner overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="text-xs border-b-0">
            <TableHead className="pl-3 pr-1 py-1.5 text-muted-foreground font-normal whitespace-nowrap">Schütze</TableHead>
            {[...Array(numRounds)].map((_, i) => (
              <TableHead key={`shooter-dg${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>
            ))}
            <TableHead className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
            <TableHead className="pl-1 pr-3 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Schnitt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shootersResults.map(shooterRes => {
            const shooterDataForModal: IndividualShooterDisplayData = {
              shooterId: shooterRes.shooterId,
              shooterName: shooterRes.shooterName,
              shooterGender: shooterRes.shooterGender,
              teamName: parentTeam.name,
              results: shooterRes.results,
              totalScore: shooterRes.total || 0,
              averageScore: shooterRes.average,
              roundsShot: shooterRes.roundsShot,
              // Pass league context for the modal if available/needed
              leagueId: parentTeam.leagueId,
              leagueType: parentTeam.leagueType,
              competitionYear: parentTeam.competitionYear,
            };
            return (
              <TableRow key={`ts-${shooterRes.shooterId}`} className="text-sm border-b-0 hover:bg-background/40">
                <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap">
                   <Button
                    variant="link"
                    className="p-0 h-auto text-sm text-left hover:text-primary whitespace-normal text-wrap"
                    onClick={() => onShooterClick(shooterDataForModal)}
                  >
                    {shooterRes.shooterName}
                  </Button>
                </TableCell>
                {[...Array(numRounds)].map((_, i) => (
                  <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="px-1 py-1.5 text-center">
                    {shooterRes.results?.[`dg${i + 1}`] ?? '-'}
                  </TableCell>
                ))}
                <TableCell className="px-1 py-1.5 text-center font-medium">{shooterRes.total ?? '-'}</TableCell>
                <TableCell className="pl-1 pr-3 py-1.5 text-center font-medium">{shooterRes.average != null ? shooterRes.average.toFixed(2) : '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};


interface ShooterDetailModalContentProps {
  shooterData: IndividualShooterDisplayData | null;
  numRounds: number;
}

const ShooterDetailModalContent: React.FC<ShooterDetailModalContentProps> = ({ shooterData, numRounds }) => {
  if (!shooterData) return null;

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
        <DialogTitle className="text-2xl text-primary">{shooterData.shooterName}</DialogTitle>
        <DialogDescription>
          {shooterData.teamName} - Ergebnisse der Saison {shooterData.competitionYear || ''}
          {shooterData.rank && ` (Aktueller Rang in dieser Ansicht: ${shooterData.rank})`}
        </DialogDescription>
      </DialogHeader>
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
                  <TableCell key={`detail-val-dg${i + 1}`} className="text-center text-sm px-1 py-1.5">{shooterData.results?.[`dg${i + 1}`] ?? '-'}</TableCell>
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


const RwkTabellenPageLoadingSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIconLucide className="h-8 w-8 text-primary" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-full sm:w-[220px]" />
        </div>
      </div>
      <Tabs defaultValue="mannschaften" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="mannschaften" className="py-2.5"><Users className="mr-2 h-5 w-5" />Mannschaften</TabsTrigger>
          <TabsTrigger value="einzelschützen" className="py-2.5"><User className="mr-2 h-5 w-5" />Einzelschützen</TabsTrigger>
        </TabsList>
        <TabsContent value="mannschaften">
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-7 w-3/4 mb-1" /><Skeleton className="h-4 w-1/2" /></CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6">
                <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Lade Tabellendaten für {title || 'RWK Tabellen'}...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="einzelschützen">
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-7 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-1/4 mb-4" />
              <Skeleton className="h-40 w-full" />
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6">
                <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Lade Einzelrangliste...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Rest of the file remains the same, but with all Loader2 replaced with Loader and AlertTriangle replaced with AlertCircle
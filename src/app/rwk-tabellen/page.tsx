
"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
import { hasLaterRoundsButMissingEarlier } from '@/lib/services/missing-results-checker';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ManualAccordion } from './manual-accordion';
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
  Loader2,
  AlertTriangle,
  User,
  Users,
  Trophy,
  Medal,
  LineChart as LineChartIcon,
  FileDown,
} from 'lucide-react';
import { PDFButton } from '@/components/ui/pdf-button';
import { useNativeApp } from '@/components/ui/native-app-detector';
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
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, documentId, setDoc } from 'firebase/firestore';
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
import { SubstitutionBadge } from '@/components/ui/substitution-badge';

const EXCLUDED_TEAM_NAME_PART = 'einzel'; // Case-insensitive check later

interface TeamShootersTableProps {
  shootersResults: ShooterDisplayResults[];
  numRounds: number;
  parentTeam: TeamDisplay; // Pass the whole parent team for context
  onShooterClick: (shooterData: IndividualShooterDisplayData) => void;
  teamSubstitutions: Map<string, any>;
}

const TeamShootersTable: React.FC<TeamShootersTableProps> = ({
  shootersResults,
  numRounds,
  parentTeam,
  onShooterClick,
  teamSubstitutions,
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
              // Pass team competition status
              teamOutOfCompetition: parentTeam.outOfCompetition || false,
              teamOutOfCompetitionReason: parentTeam.outOfCompetitionReason,
            };
            return (
              <TableRow key={`ts-${shooterRes.shooterId}`} className="text-sm border-b-0 hover:bg-background/40">
                <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-left hover:text-primary whitespace-normal text-wrap justify-start"
                        onClick={() => onShooterClick(shooterDataForModal)}
                      >
                        {shooterRes.shooterName}
                      </Button>
                      <LineChartIcon className="h-3 w-3 text-muted-foreground" title="Klicken Sie auf den Namen für Statistik-Diagramm" />
                      {hasLaterRoundsButMissingEarlier(shooterRes.results, numRounds) && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-sm" title="Spätere Durchgänge geschossen, aber frühere fehlen">
                          Lücken
                        </span>
                      )}
                    </div>
                    <SubstitutionBadge
                      isSubstitute={teamSubstitutions.has(`${parentTeam.id}-${shooterRes.shooterId}`)}
                      substitutionInfo={teamSubstitutions.get(`${parentTeam.id}-${shooterRes.shooterId}`)}
                    />
                  </div>
                </TableCell>
                {[...Array(numRounds)].map((_, i) => (
                  <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="px-1 py-1.5 text-center">
                    {shooterRes.results?.[`dg${i + 1}`] !== null ? (
                      shooterRes.results?.[`dg${i + 1}`]
                    ) : (
                      // Prüfe, ob ein späterer Durchgang Ergebnisse hat
                      Object.entries(shooterRes.results || {}).some(([key, value]) => 
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
        <DialogTitle className="text-2xl text-primary">
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
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
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
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Lade Einzelrangliste...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


function RwkTabellenPageComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const { isNativeApp } = useNativeApp();
  
  const [urlParams, setUrlParams] = useState<{
    year: string | null,
    discipline: string | null,
    league: string | null
  }>({
    year: null,
    discipline: null,
    league: null
  });

  // States for filters and data
  const [availableYearsFromDb, setAvailableYearsFromDb] = useState<number[]>([]);
  const [isLoadingInitialYears, setIsLoadingInitialYears] = useState(true);
  
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionDisplayConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'mannschaften' | 'einzelschützen'>('mannschaften');

  const [teamData, setTeamData] = useState<AggregatedCompetitionData | null>(null);
  const [allIndividualDataForDiscipline, setAllIndividualDataForDiscipline] = useState<IndividualShooterDisplayData[]>([]);
  const [filteredIndividualData, setFilteredIndividualData] = useState<IndividualShooterDisplayData[]>([]);
  
  // Lazy loading states
  const [loadedTeamShooters, setLoadedTeamShooters] = useState<Set<string>>(new Set());
  const [loadingTeamShooters, setLoadingTeamShooters] = useState<Set<string>>(new Set());
  
  const [topMaleShooter, setTopMaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [topFemaleShooter, setTopFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter] = useState<string>(""); // Empty string for "All Leagues"
  const [lastClickedLeagueId, setLastClickedLeagueId] = useState<string | null>(null); // Track last clicked league from teams tab
  const [shooterSearchTerm, setShooterSearchTerm] = useState<string>(""); // Search term for individual shooters
  
  // Filter für "Außer Konkurrenz"-Teams und Schützen
  const [showOutOfCompetitionTeams, setShowOutOfCompetitionTeams] = useState<boolean>(true);
  const [showOutOfCompetitionShooters, setShowOutOfCompetitionShooters] = useState<boolean>(true);

  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5);
  
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([]);
  
  const [isShooterDetailModalOpen, setIsShooterDetailModalOpen] = useState(false);
  const [selectedShooterForDetail, setSelectedShooterForDetail] = useState<IndividualShooterDisplayData | null>(null);
  const [teamSubstitutions, setTeamSubstitutions] = useState<Map<string, any>>(new Map());

  // Extrahiere URL-Parameter auf Client-Seite
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUrlParams({
        year: params.get('year'),
        discipline: params.get('discipline'),
        league: params.get('league')
      });
      
      // Filter-Einstellungen aus URL laden
      const showAKParam = params.get('showAK');
      if (showAKParam !== null) {
        setShowOutOfCompetitionTeams(showAKParam === 'true');
      }
      
      const showAKShootersParam = params.get('showAKShooters');
      if (showAKShootersParam !== null) {
        setShowOutOfCompetitionShooters(showAKShootersParam === 'true');
      }
    }
  }, []);
  
  // Memoize URL parameters to stabilize dependencies
  const initialYearFromParams = useMemo(() => urlParams.year, [urlParams.year]);
  const initialDisciplineFromParams = useMemo(() => urlParams.discipline as UIDisciplineSelection | null, [urlParams.discipline]);
  const initialLeagueIdFromParams = useMemo(() => urlParams.league, [urlParams.league]);

  const fetchAvailableYearsFromSeasons = useCallback(async (): Promise<number[]> => {

    try {
      // Query for seasons with status "Laufend" to determine available years
      const seasonsColRef = collection(db, 'seasons');
      const q = query(seasonsColRef,
        where("status", "==", "Laufend"),
        orderBy('competitionYear', 'desc')
      );

      const seasonsSnapshot = await getDocs(q);
      const years = new Set<number>();
      const availableDisciplines = new Set<string>();
      
      seasonsSnapshot.forEach(docData => {
        const seasonData = docData.data() as Season;
        if (seasonData.competitionYear) years.add(seasonData.competitionYear);
        
        // Store discipline types (lowercase for consistent comparison)
        if (seasonData.type) {
          availableDisciplines.add(seasonData.type.toLowerCase());
        }
      });
      

      
      // Füge manuelle Jahre hinzu (für abgeschlossene Saisons)
      const manualYears = [2025];
      manualYears.forEach(year => years.add(year));
      
      const sortedYears = Array.from(years).sort((a, b) => b - a);

      return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
    } catch (err: any) {
      console.error('RWK DEBUG: Error fetching available years:', err);
      toast({ title: "Fehler", description: `Verfügbare Jahre konnten nicht geladen werden: ${err.message}`, variant: "destructive" });
      return [new Date().getFullYear()];
    }
  }, [toast]);

  const calculateNumRounds = useCallback(async (year: number, uiDiscipline: UIDisciplineSelection): Promise<number> => {
    if (!year || !uiDiscipline) return 5;

    try {
      const seasonsQuery = query(
        collection(db, "seasons"),
        where("competitionYear", "==", year),
        where("type", "in", [uiDiscipline, uiDiscipline.toUpperCase(), uiDiscipline.toLowerCase()]),
        where("status", "in", ["Laufend", "Abgeschlossen"]),
        limit(1)
      );
      const seasonsSnapForRounds = await getDocs(seasonsQuery);

      if (!seasonsSnapForRounds.empty) {
          const firstSeasonDoc = seasonsSnapForRounds.docs[0];
          if (firstSeasonDoc && firstSeasonDoc.id) { // Check if firstSeasonDoc and its id are defined
            const leagueForRoundsQuery = query(
              collection(db, "rwk_leagues"),
              where("seasonId", "==", firstSeasonDoc.id), // Use the ID of the found season
              limit(1) 
            );
            const leagueSnap = await getDocs(leagueForRoundsQuery);
            if(!leagueSnap.empty){
                const leagueData = leagueSnap.docs[0].data() as League;
                const specificType = leagueData.type;
                const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
                if (fourHundredPointDisciplines.includes(specificType)) {

                  return 4;
                }
            }
          }
      }
    } catch (err: any) {
      console.error('RWK DEBUG: Error in calculateNumRounds:', err);
      toast({ title: "Fehler Rundenanzahl", description: `Anzahl der Durchgänge konnte nicht ermittelt werden: ${err.message}`, variant: "destructive" });
    }

    return 5;
  }, [toast]);

  const fetchCompetitionTeamData = useCallback(async (config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> => {
    if (!config || !config.year || !config.discipline) return null;

    try {
      const seasonsColRef = collection(db, "seasons");
      const qSeasons = query(seasonsColRef, 
        where("competitionYear", "==", config.year), 
        where("type", "in", [config.discipline, config.discipline.toUpperCase(), config.discipline.toLowerCase()]), 
        where("status", "in", ["Laufend", "Abgeschlossen"]) // "Laufend" OR "Abgeschlossen" seasons
      );
      const seasonsSnapshot = await getDocs(qSeasons);

      if (seasonsSnapshot.empty) {
        console.warn(`RWK DEBUG: No 'Laufend' or 'Abgeschlossen' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
      }
      const laufendeSeasonIds = seasonsSnapshot.docs.map(sDoc => sDoc.id).filter(id => !!id);
      if (laufendeSeasonIds.length === 0) return { id: `${config.year}-${config.discipline}`, config, leagues: [] };

      const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
      const firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];
      if (firestoreDisciplinesToQuery.length === 0) {
        console.warn(`RWK DEBUG: No specific Firestore discipline types for UI discipline: ${config.discipline}`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
      }

      const leaguesColRef = collection(db, "rwk_leagues");
      const qLeagues = query(leaguesColRef, 
        where("seasonId", "in", laufendeSeasonIds), 
        where("type", "in", firestoreDisciplinesToQuery), 
        orderBy("order", "asc")
      );
      const leaguesSnapshot = await getDocs(qLeagues);
      
      const fetchedLeaguesData: LeagueDisplay[] = [];
      const clubCache = new Map<string, string>(); 
      const shooterCache = new Map<string, Shooter>();





      // Batch-load ALLE Teams für alle Ligen auf einmal
      const allLeagueIds = leaguesSnapshot.docs.map(doc => doc.id);
      const allTeamsQuery = query(
        collection(db, "rwk_teams"), 
        where("leagueId", "in", allLeagueIds), 
        where("competitionYear", "==", config.year)
      );
      const allTeamsSnapshot = await getDocs(allTeamsQuery);
      const teamsByLeague = new Map<string, any[]>();
      allTeamsSnapshot.docs.forEach(teamDoc => {
        const teamData = teamDoc.data();
        const leagueId = teamData.leagueId;
        if (!teamsByLeague.has(leagueId)) teamsByLeague.set(leagueId, []);
        teamsByLeague.get(leagueId)!.push({id: teamDoc.id, ...teamData});
      });

      // Batch-load ALLE Scores auf einmal
      const allScoresQuery = query(
        collection(db, "rwk_scores"),
        where("competitionYear", "==", config.year),
        where("leagueType", "in", firestoreDisciplinesToQuery)
      );
      const allScoresSnapshot = await getDocs(allScoresQuery);
      const scoresByTeam = new Map<string, ScoreEntry[]>();
      allScoresSnapshot.docs.forEach(scoreDoc => {
        const score = scoreDoc.data() as ScoreEntry;
        if (!scoresByTeam.has(score.teamId)) scoresByTeam.set(score.teamId, []);
        scoresByTeam.get(score.teamId)!.push({id: scoreDoc.id, ...score});
      });

      // Batch-load alle Clubs auf einmal (mit IN-Limit Handling)
      const allClubIds = [...new Set(allTeamsSnapshot.docs.map(doc => doc.data().clubId).filter(Boolean))];
      if (allClubIds.length > 0) {
        try {
          const batchSize = 30;
          for (let i = 0; i < allClubIds.length; i += batchSize) {
            const batch = allClubIds.slice(i, i + batchSize);
            const clubsQuery = query(collection(db, "clubs"), where(documentId(), "in", batch));
            const clubsSnapshot = await getDocs(clubsQuery);
            clubsSnapshot.docs.forEach(clubDoc => {
              clubCache.set(clubDoc.id, (clubDoc.data() as Club).name || "Unbek. Verein");
            });
          }
        } catch (e) { console.error("RWK DEBUG: Error batch-fetching clubs", e); }
      }

      for (const leagueDoc of leaguesSnapshot.docs) {
        const leagueData = leagueDoc.data() as Omit<League, 'id'>;
        const leagueDisplay: LeagueDisplay = { 
            id: leagueDoc.id, 
            ...leagueData, 
            teams: [], 
            individualLeagueShooters: [] 
        };
        let teamDisplays: TeamDisplay[] = [];
        
        const teamsForThisLeague = teamsByLeague.get(leagueDisplay.id) || [];

        for (const teamData of teamsForThisLeague) {

          if (teamData.name && teamData.name.toLowerCase().includes(EXCLUDED_TEAM_NAME_PART)) {

            continue; 
          }
          
          const clubName = teamData.clubId ? (clubCache.get(teamData.clubId) || "Unbek. Verein") : "Unbek. Verein";
          // Berechne Team-Grunddaten aus Scores (ohne Schützen-Details)
          const teamScores = scoresByTeam.get(teamData.id) || [];
          let roundResultsTemp: { [key: string]: number[] } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) roundResultsTemp[`dg${r}`] = [];
          
          // Duplikat-Filterung für Team-Scores
          const teamScoresArray = teamScores.map(score => ({ ...score }));
          const teamDuplicateMap = new Map();
          teamScoresArray.forEach(score => {
            const key = `${score.shooterId}|${score.durchgang}|${score.competitionYear}|${score.leagueType}`;
            if (!teamDuplicateMap.has(key)) {
              teamDuplicateMap.set(key, score);
            } else {
              const existing = teamDuplicateMap.get(key);
              if (score.entryTimestamp && existing.entryTimestamp && 
                  score.entryTimestamp.seconds > existing.entryTimestamp.seconds) {
                teamDuplicateMap.set(key, score);
              }
            }
          });
          
          // Gruppiere bereinigte Scores nach Schützen für Team-Berechnung
          const scoresByShooter = new Map<string, ScoreEntry[]>();
          Array.from(teamDuplicateMap.values()).forEach(score => {
            if (!scoresByShooter.has(score.shooterId)) scoresByShooter.set(score.shooterId, []);
            scoresByShooter.get(score.shooterId)!.push(score);
          });

          // Berechne beste Scores pro Runde für Team-Wertung
          scoresByShooter.forEach(shooterScores => {
            const shooterResults: { [key: string]: number | null } = {};
            for (let r = 1; r <= numRoundsForCompetition; r++) shooterResults[`dg${r}`] = null;
            
            shooterScores.forEach(score => {
              if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && typeof score.totalRinge === 'number') {
                shooterResults[`dg${score.durchgang}`] = score.totalRinge;
              }
            });

            for (let r = 1; r <= numRoundsForCompetition; r++) {
              const rk = `dg${r}`;
              if (shooterResults[rk] !== null && typeof shooterResults[rk] === 'number') {
                roundResultsTemp[rk].push(shooterResults[rk] as number);
              }
            }
          });

          // Berechne Team-Ergebnisse
          const roundResults: { [key: string]: number | null } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) {
            const rk = `dg${r}`;
            const scoresForRound = roundResultsTemp[rk].sort((a, b) => b - a);
            let roundSum = 0; 
            let contributingScoresCount = 0;
            for (let sIdx = 0; sIdx < Math.min(scoresForRound.length, MAX_SHOOTERS_PER_TEAM); sIdx++) {
                roundSum += scoresForRound[sIdx];
                contributingScoresCount++;
            }
            roundResults[rk] = contributingScoresCount === MAX_SHOOTERS_PER_TEAM ? roundSum : null;
          }

          let teamTotal = 0; let numScoredRds = 0;
          Object.values(roundResults).forEach(val => { if (val !== null) { teamTotal += val; numScoredRds++; } });

          const teamDisplayItem: TeamDisplay = { 
            ...teamData, 
            clubName, 
            shootersResults: [], // Wird lazy geladen
            roundResults, 
            totalScore: teamTotal, 
            averageScore: numScoredRds > 0 ? parseFloat((teamTotal / numScoredRds).toFixed(2)) : null, 
            numScoredRounds: numScoredRds,
            leagueType: leagueDisplay.type,
            sortingScore: 0, // Wird später berechnet
            sortingAverage: 0 // Wird später berechnet
          };
          teamDisplays.push(teamDisplayItem);
        }
        // Sortiere Teams und berücksichtige "Außer Konkurrenz"-Status
        // Prüfe, ob alle Teams den aktuellen Durchgang abgeschlossen haben
        const determineCurrentRound = () => {
          // Prüfe, ob ein Durchgang vollständig ist (alle Teams und alle Schützen haben Ergebnisse)
          const isRoundComplete = (round) => {
            if (round === 0) return false;
            const roundKey = `dg${round}`;
            
            // Prüfe für jedes Team
            for (const team of teamDisplays) {
              // Prüfe, ob das Team ein Ergebnis für diesen Durchgang hat
              if (!team.roundResults || team.roundResults[roundKey] === null) {
                return false;
              }
              
              // Prüfe auch, ob alle Schützen des Teams Ergebnisse haben
              // Dies erfordert, dass wir die Schützen-Ergebnisse laden
              if (team.shooterIds && team.shooterIds.length > 0) {
                // Hier könnte eine tiefere Prüfung erfolgen, wenn die Schützen-Daten bereits geladen sind
                // Für jetzt verlassen wir uns auf die Team-Ergebnisse
              }
            }
            
            return true;
          };
          
          // Finde den höchsten vollständigen Durchgang
          for (let r = numRoundsForCompetition; r >= 1; r--) {
            if (isRoundComplete(r)) {
              return r;
            }
          }
          
          return 0; // Kein vollständiger Durchgang gefunden
        };
        
        const currentRound = determineCurrentRound();

        
        // Berechne die Punktzahl bis zum aktuellen vollständigen Durchgang
        for (const team of teamDisplays) {
          let totalScore = 0;
          let completedRounds = 0;
          
          for (let r = 1; r <= currentRound; r++) {
            const roundKey = `dg${r}`;
            if (team.roundResults && team.roundResults[roundKey] !== null) {
              totalScore += team.roundResults[roundKey];
              completedRounds++;
            }
          }
          
          // Speichere die Werte für die Sortierung
          team.sortingScore = totalScore;
          team.sortingAverage = completedRounds > 0 ? totalScore / completedRounds : 0;
        }
        
        teamDisplays.sort((a, b) => {
          // Teams "außer Konkurrenz" immer nach Teams in Wertung
          if (a.outOfCompetition && !b.outOfCompetition) return 1;
          if (!a.outOfCompetition && b.outOfCompetition) return -1;
          
          // Sortierung nach Punkten bis zum aktuellen vollständigen Durchgang
          return (b.sortingScore ?? 0) - (a.sortingScore ?? 0) || 
                 (b.sortingAverage ?? 0) - (a.sortingAverage ?? 0) || 
                 a.clubName.localeCompare(b.clubName) || 
                 a.name.localeCompare(b.name);
        });
        
        // Vergebe Rangplätze nur für Teams in Wertung
        let rankCounter = 1;
        teamDisplays.forEach(team => {
          if (!team.outOfCompetition) {
            team.rank = rankCounter++;
          } else {
            team.rank = null; // Kein Rang für Teams "außer Konkurrenz"
          }
        });
        leagueDisplay.teams = teamDisplays;
        
        // Populate individualLeagueShooters
        const leagueShootersMap = new Map<string, IndividualShooterDisplayData>();
        leagueDisplay.teams.forEach(team => {
            (team.shootersResults || []).forEach(sr => {
                if (!leagueShootersMap.has(sr.shooterId)) {
                    leagueShootersMap.set(sr.shooterId, {
                        shooterId: sr.shooterId,
                        shooterName: sr.shooterName,
                        shooterGender: sr.shooterGender,
                        teamName: team.name, // Team name for context in league's individual list
                        results: {...sr.results},
                        totalScore: sr.total || 0,
                        averageScore: sr.average,
                        roundsShot: sr.roundsShot,
                        competitionYear: team.competitionYear,
                        leagueId: leagueDisplay.id,
                        leagueType: leagueDisplay.type,
                        teamOutOfCompetition: team.outOfCompetition || false,
                        teamOutOfCompetitionReason: team.outOfCompetitionReason,
                    });
                }
            });
        });
        // Filtere und sortiere Schützen
        leagueDisplay.individualLeagueShooters = Array.from(leagueShootersMap.values())
            .filter(s => s.roundsShot > 0) // Only shooters with actual scores
            .sort((a, b) => {
              // Schützen "außer Konkurrenz" immer nach Schützen in Wertung
              if (a.teamOutOfCompetition && !b.teamOutOfCompetition) return 1;
              if (!a.teamOutOfCompetition && b.teamOutOfCompetition) return -1;
              
              // Sortierung nach Gesamtpunkten
              const totalDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
              if (totalDiff !== 0) return totalDiff;
              
              // Bei Gleichstand: Stichentscheid vom letzten zum ersten Durchgang
              for (let round = numRounds; round >= 1; round--) {
                const aScore = a.results[`dg${round}`] ?? 0;
                const bScore = b.results[`dg${round}`] ?? 0;
                if (bScore !== aScore) return bScore - aScore;
              }
              
              // Falls immer noch gleich: Alphabetisch nach Namen
              return a.shooterName.localeCompare(b.shooterName);
            });
        
        // Vergebe Rangplätze nur für Schützen in Wertung
        let shooterRankCounter = 1;
        leagueDisplay.individualLeagueShooters.forEach(shooter => {
          if (!shooter.teamOutOfCompetition) {
            shooter.rank = shooterRankCounter++;
          } else {
            shooter.rank = null; // Kein Rang für Schützen "außer Konkurrenz"
          }
        });


        fetchedLeaguesData.push(leagueDisplay);
      }
      // Lade Substitutions-Daten (optional - bei Fehlern wird ignoriert)
      try {
        const substitutionsQuery = query(
          collection(db, 'team_substitutions'),
          where('competitionYear', '==', config.year)
        );
        const substitutionsSnapshot = await getDocs(substitutionsQuery);
        const substitutionsMap = new Map();
        substitutionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const key = `${data.teamId}-${data.replacementShooterId}`;
          substitutionsMap.set(key, {
            originalShooterName: data.originalShooterName,
            fromRound: data.fromRound,
            reason: data.reason,
            type: data.type
          });
        });
        setTeamSubstitutions(substitutionsMap);
      } catch (error) {
        // Substitutions sind optional - bei Berechtigungsfehlern einfach ignorieren

        setTeamSubstitutions(new Map());
      }
      

      return { id: `${config.year}-${config.discipline}`, config, leagues: fetchedLeaguesData };
    } catch (err: any) {
      console.error('RWK DEBUG: Error fetching team data:', err);
      toast({ title: "Fehler Mannschaftsdaten", description: `Fehler beim Laden der Mannschaftsdaten: ${err.message}`, variant: "destructive" });
      setError((err as Error).message || 'Unbekannter Fehler beim Laden der Mannschaftsdaten.');
      return null;
    }
  }, [toast]); // Removed uiDisciplineFilterOptions, MAX_SHOOTERS_PER_TEAM if they are stable constants

  const fetchIndividualShooterData = useCallback(async (config: CompetitionDisplayConfig, numRoundsForCompetition: number, filterByLeagueId?: string | null): Promise<IndividualShooterDisplayData[]> => {
    if (!config || !config.year || !config.discipline) return [];

    
    try {
      const scoresColRef = collection(db, "rwk_scores");
      let scoresQueryConstraints: any[] = [where("competitionYear", "==", config.year)];
      
      // WICHTIG: Liga-Filter ist jetzt immer erforderlich - keine übergreifende Abfrage mehr
      if (!filterByLeagueId || filterByLeagueId === "ALL_LEAGUES_IND_FILTER") {
        console.warn('RWK DEBUG: Keine Liga-ID für Einzelschützen-Filter - das sollte nicht passieren');
        return [];
      }
      
      // Spezialfall: KK Gewehr Ehrungen - alle KK Gewehr Auflage Ligen
      if (filterByLeagueId === "KK_GEWEHR_EHRUNGEN") {

        scoresQueryConstraints = [
          where("competitionYear", "==", config.year),
          where("leagueType", "in", ["KK", "KKG"]) // KK Gewehr Auflage
        ];
      } else {
        // Filtere nach spezifischer Liga-ID
        scoresQueryConstraints = [
          where("competitionYear", "==", config.year),
          where("leagueId", "==", filterByLeagueId)
        ];
      }
      

      
      const scoresQuery = query(scoresColRef, ...scoresQueryConstraints);
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const allScores: ScoreEntry[] = [];
      scoresSnapshot.docs.forEach(d => { allScores.push({ id: d.id, ...d.data() as ScoreEntry }); });
      

      
      // Optional: Zeige die ersten 3 leagueTypes zur Diagnose
      const leagueTypes = [...new Set(allScores.map(s => s.leagueType))];


      const shootersMap = new Map<string, IndividualShooterDisplayData>();
      // Lade alle einzigartigen Schützen-IDs für bessere Namensauflösung
      const allShooterIds = [...new Set(allScores.map(s => s.shooterId).filter(Boolean))];
      const shooterNamesMap = new Map<string, string>();
      
      // Batch-lade Schützen-Infos für bessere Namen (mit IN-Limit Handling)
      if (allShooterIds.length > 0) {
        try {
          // Firebase IN-Limit: Max 30 IDs pro Query
          const batchSize = 30;
          for (let i = 0; i < allShooterIds.length; i += batchSize) {
            const batch = allShooterIds.slice(i, i + batchSize);
            const shootersQuery = query(collection(db, "shooters"), where(documentId(), "in", batch));
            const shootersSnapshot = await getDocs(shootersQuery);
            shootersSnapshot.docs.forEach(doc => {
              const shooterData = doc.data() as Shooter;
              let displayName = shooterData.name || '';
              if (shooterData.firstName || shooterData.lastName) {
                const nameParts = [];
                if (shooterData.firstName) nameParts.push(shooterData.firstName);
                if (shooterData.lastName) nameParts.push(shooterData.lastName);
                if (shooterData.title) nameParts.push(shooterData.title);
                displayName = nameParts.join(' ');
              }
              shooterNamesMap.set(doc.id, displayName);
            });
          }
        } catch (error) {
          console.warn('RWK DEBUG: Fehler beim Laden der Schützen-Namen:', error);
        }
      }
      
      for (const score of allScores) {
        if (!score.shooterId) continue;
        let currentShooterData = shootersMap.get(score.shooterId);
        if (!currentShooterData) {
          const initialResults: { [key: string]: number | null } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) initialResults[`dg${r}`] = null;
          
          // Verwende verbesserten Namen falls verfügbar
          const shooterName = shooterNamesMap.get(score.shooterId) || score.shooterName || "Unbek. Schütze";
          
          currentShooterData = {
            shooterId: score.shooterId, shooterName,
            shooterGender: score.shooterGender || 'unknown', teamName: score.teamName || "Unbek. Team", 
            results: initialResults, totalScore: 0, averageScore: null, roundsShot: 0,
            competitionYear: score.competitionYear, leagueId: score.leagueId, leagueType: score.leagueType,
            teamOutOfCompetition: score.teamOutOfCompetition || false,
            teamOutOfCompetitionReason: score.teamOutOfCompetitionReason,
          };
          shootersMap.set(score.shooterId, currentShooterData);
        }
        
        // Prioritize 'female' if ever encountered for this shooter
        const genderFromScore = score.shooterGender?.toLowerCase();
        if (genderFromScore === 'female' || genderFromScore === 'w') {
            currentShooterData.shooterGender = 'female';
        } else if ((genderFromScore === 'male' || genderFromScore === 'm') && currentShooterData.shooterGender !== 'female') {
            currentShooterData.shooterGender = 'male';
        }

        // Ensure teamName is set if initially unknown
        if (score.teamName && (currentShooterData.teamName === "Unbek. Team" || !currentShooterData.teamName)) {
            currentShooterData.teamName = score.teamName;
        }

        // Setze Liga-Kontext (sollte immer gleich sein, da nach Liga gefiltert)
        if (!currentShooterData.leagueId) {
          currentShooterData.leagueId = score.leagueId;
          currentShooterData.leagueType = score.leagueType;
        }


        if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && typeof score.totalRinge === 'number') {
          currentShooterData.results[`dg${score.durchgang}`] = score.totalRinge;
        }
      }
      shootersMap.forEach(shooterData => {
        let currentTotal = 0; let roundsShotCount = 0;
        Object.values(shooterData.results).forEach(res => { if (res !== null && typeof res === 'number') { currentTotal += res; roundsShotCount++; } });
        shooterData.totalScore = currentTotal; shooterData.roundsShot = roundsShotCount;
        if (shooterData.roundsShot > 0 && shooterData.totalScore !== null) shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
      });
      // Entferne Duplikate basierend auf Name+Team, behalte den mit den meisten Scores
      const shootersByName = new Map();
      Array.from(shootersMap.values()).forEach(shooter => {
        const key = `${shooter.shooterName}-${shooter.teamName}`;
        if (!shootersByName.has(key)) {
          shootersByName.set(key, []);
        }
        shootersByName.get(key).push(shooter);
      });
      
      const deduplicatedShooters = [];
      shootersByName.forEach(shooters => {
        if (shooters.length === 1) {
          deduplicatedShooters.push(shooters[0]);
        } else {
          // Behalte den mit den meisten Scores
          const best = shooters.reduce((best, current) => 
            current.roundsShot > best.roundsShot ? current : best
          );
          deduplicatedShooters.push(best);
        }
      });
      
      const rankedShooters = deduplicatedShooters
        .filter(s => s.roundsShot > 0) 
        .sort((a, b) => {
          // Erst nach Gesamtpunkten
          const totalDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
          if (totalDiff !== 0) return totalDiff;
          
          // Bei Gleichstand: Stichentscheid vom letzten zum ersten Durchgang
          for (let round = numRoundsForCompetition; round >= 1; round--) {
            const aScore = a.results[`dg${round}`] ?? 0;
            const bScore = b.results[`dg${round}`] ?? 0;
            if (bScore !== aScore) return bScore - aScore;
          }
          
          // Falls immer noch gleich: Alphabetisch nach Namen
          return a.shooterName.localeCompare(b.shooterName);
        });
      // Vergebe Rangplätze nur für Schützen in Wertung
      let shooterRankCounter = 1;
      rankedShooters.forEach(shooter => {
        if (!shooter.teamOutOfCompetition) {
          shooter.rank = shooterRankCounter++;
        } else {
          shooter.rank = null; // Kein Rang für Schützen "außer Konkurrenz"
        }
      });

      return rankedShooters;
    } catch (err: any) {
      console.error("RWK DEBUG: Error fetching individual shooter data:", err);
      toast({ title: "Fehler Einzelergebnisse", description: `Fehler beim Laden der Einzelschützendaten: ${err.message}`, variant: "destructive" });
      setError((err as Error).message || "Unbekannter Fehler beim Laden der Einzelschützendaten.");
      return [];
    }
  }, [toast]); // Removed uiDisciplineFilterOptions if it's a stable constant

  const loadData = useCallback(async () => {
    if (!selectedCompetition) {

      setLoadingData(false);
      return;
    }
    
    // Cache nur für Team-Daten, nicht für Einzelschützen
    const cacheKey = `rwk-teams-${selectedCompetition.year}-${selectedCompetition.discipline}`;
    
    // Cache für Einzelschützen deaktivieren um Probleme zu vermeiden
    if (activeTab === 'einzelschützen') {
      sessionStorage.removeItem(cacheKey);
    }
    

    

    setLoadingData(true); setError(null); 
    setTeamData(null); 
    setAllIndividualDataForDiscipline([]); 
    setFilteredIndividualData([]);
    setTopMaleShooter(null);
    setTopFemaleShooter(null);
    
    try {
      const numRounds = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
      setCurrentNumRoundsState(numRounds);


      const fetchedTeamData = await fetchCompetitionTeamData(selectedCompetition, numRounds);
      setTeamData(fetchedTeamData);
      
      let allIndividuals: any[] = [];
      
      // Lazy load individual data only when needed (on tab switch) and only with league filter
      if (activeTab === 'einzelschützen' && selectedIndividualLeagueFilter) {
        // Lade nur Schützen für die ausgewählte Liga
        const individualsInLeague = await fetchIndividualShooterData(selectedCompetition, numRounds, selectedIndividualLeagueFilter);
        setFilteredIndividualData(individualsInLeague);
        setAllIndividualDataForDiscipline(individualsInLeague); // Setze auch allIndividualData

        if (individualsInLeague.length > 0) {
          const males = individualsInLeague.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
          setTopMaleShooter(males.length > 0 ? males[0] : null);
          
          const females = individualsInLeague.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
          setTopFemaleShooter(females.length > 0 ? females[0] : null);
        }
      } else if (activeTab === 'einzelschützen' && !selectedIndividualLeagueFilter) {
        // Keine Liga ausgewählt - leere Daten setzen
        setFilteredIndividualData([]);
        setAllIndividualDataForDiscipline([]);
        setTopMaleShooter(null);
        setTopFemaleShooter(null);
      }
      
      // Cache nur für Team-Daten speichern
      if (activeTab === 'mannschaften') {
        const cacheData = {
          timestamp: Date.now(),
          teamData: fetchedTeamData
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }

    } catch (err: any) {
      console.error('RWK DEBUG: Failed to load RWK data in loadData:', err);
      toast({ title: "Fehler Datenladen", description: `Fehler beim Laden der Wettkampfdaten: ${err.message}`, variant: "destructive" });
      setError((err as Error).message || 'Unbekannter Fehler beim Laden der Daten.');
    } finally {
      setLoadingData(false);

    }
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, calculateNumRounds, fetchCompetitionTeamData, fetchIndividualShooterData, toast]);

  // Effect for initial load and when URL parameters change
  useEffect(() => {

    setIsLoadingInitialYears(true);
    let isMounted = true;
  
    fetchAvailableYearsFromSeasons().then(dbYears => {
      if (!isMounted) return;
      setAvailableYearsFromDb(dbYears);
      setIsLoadingInitialYears(false);
  
      let yearToSet: number;
      const currentActualYear = new Date().getFullYear();
      const validUIDisciplines = uiDisciplineFilterOptions.map(opt => opt.value);
      let disciplineToSet: UIDisciplineSelection = uiDisciplineFilterOptions[0]?.value || 'KK';
      
      if (initialYearFromParams && !isNaN(parseInt(initialYearFromParams))) {
        const yearFromParam = parseInt(initialYearFromParams);
        yearToSet = dbYears.includes(yearFromParam) ? yearFromParam : (dbYears.includes(currentActualYear) ? currentActualYear : (dbYears[0] || currentActualYear));
      } else {
        yearToSet = dbYears.includes(currentActualYear) ? currentActualYear : (dbYears[0] || currentActualYear);
      }
      
      if (initialDisciplineFromParams && validUIDisciplines.includes(initialDisciplineFromParams)) {
          disciplineToSet = initialDisciplineFromParams;
      }
      
      const disciplineLabelObj = uiDisciplineFilterOptions.find(d => d.value === disciplineToSet);
      const disciplineLabel = disciplineLabelObj ? disciplineLabelObj.label.replace(/\s*\(.*\)\s*$/, '').trim() : disciplineToSet;

      const newSelectedCompetition: CompetitionDisplayConfig = {
        year: yearToSet,
        discipline: disciplineToSet,
        displayName: `${yearToSet} ${disciplineLabel}`,
      };

      // Only update if different to prevent loops
      if (JSON.stringify(newSelectedCompetition) !== JSON.stringify(selectedCompetition)) {

          setSelectedCompetition(newSelectedCompetition);
      } else {

      }

      if (initialLeagueIdFromParams) {
        setOpenAccordionItems([initialLeagueIdFromParams]);
        // Context-Aware Navigation: Setze Liga-Filter für Einzelschützen wenn aus URL
        setSelectedIndividualLeagueFilter(initialLeagueIdFromParams);
        setLastClickedLeagueId(initialLeagueIdFromParams);
      } else {
        // If no specific league in URL, ensure all accordions are open by default (handled in another effect)
      }
      
      // Normalize URL if params were missing or defaulted
      const currentParams = new URLSearchParams(window.location.search);
      let needsUrlUpdate = false;
      if (currentParams.get('year') !== yearToSet.toString()) {
          currentParams.set('year', yearToSet.toString());
          needsUrlUpdate = true;
      }
      if (currentParams.get('discipline') !== disciplineToSet) {
          currentParams.set('discipline', disciplineToSet);
          needsUrlUpdate = true;
      }
      // Liga-Parameter beibehalten wenn vorhanden
      if (initialLeagueIdFromParams && currentParams.get('league') !== initialLeagueIdFromParams) {
        currentParams.set('league', initialLeagueIdFromParams);
        needsUrlUpdate = true;
      }
      
      if (needsUrlUpdate) {

         router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
      }


    }).catch(err => {
        if (!isMounted) return;
        console.error("RWK DEBUG: Error in initial useEffect (fetchAvailableYears):", err);
        setIsLoadingInitialYears(false);
        setError("Fehler beim Initialisieren der Jahresauswahl.");
    });
    return () => { isMounted = false; };
  }, [fetchAvailableYearsFromSeasons, initialYearFromParams, initialDisciplineFromParams, initialLeagueIdFromParams, router, selectedCompetition]); // Removed searchParams from dependencies


  // Effect to load data when selectedCompetition, activeTab, or league filter changes
  useEffect(() => {
    if (selectedCompetition && !isLoadingInitialYears) { 

      loadData();
    }
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, loadData, isLoadingInitialYears]); // loadData is memoized
  
  // Speichern der Filtereinstellungen im localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showOutOfCompetitionTeams', showOutOfCompetitionTeams.toString());
      localStorage.setItem('showOutOfCompetitionShooters', showOutOfCompetitionShooters.toString());
    }
  }, [showOutOfCompetitionTeams, showOutOfCompetitionShooters]);
  
  // Laden der gespeicherten Filtereinstellungen beim Start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTeamsPreference = localStorage.getItem('showOutOfCompetitionTeams');
      if (savedTeamsPreference !== null) {
        setShowOutOfCompetitionTeams(savedTeamsPreference === 'true');
      }
      
      const savedShootersPreference = localStorage.getItem('showOutOfCompetitionShooters');
      if (savedShootersPreference !== null) {
        setShowOutOfCompetitionShooters(savedShootersPreference === 'true');
      }
    }
  }, []);

  // Effect to open league accordions - only specific league from URL or keep closed
  useEffect(() => {
    if (teamData && teamData.leagues && openAccordionItems.length === 0) {
      if (initialLeagueIdFromParams) {
        // Automatisches Öffnen der spezifischen Liga aus URL-Parameter
        const targetLeague = teamData.leagues.find(l => l.id === initialLeagueIdFromParams);
        if (targetLeague) {

          setOpenAccordionItems([initialLeagueIdFromParams]);
        }
      }
      // KEINE automatische Öffnung aller Ligen mehr - bleiben geschlossen
    }
  }, [teamData, initialLeagueIdFromParams]);


  const handleYearChange = useCallback((yearString: string) => {
    const year = parseInt(yearString, 10);
    if (!selectedCompetition || selectedCompetition.year === year || isNaN(year) || loadingData) return;

    // Update URL, this will trigger the main useEffect to update selectedCompetition
    router.replace(`/rwk-tabellen?year=${year.toString()}&discipline=${selectedCompetition.discipline}`, { scroll: false });
    setOpenAccordionItems([]); // Reset open accordions on year change
    setSelectedIndividualLeagueFilter(""); // Reset league filter
  }, [selectedCompetition, router, loadingData]);

  const handleDisciplineChange = useCallback((discipline: UIDisciplineSelection) => {
    if (!selectedCompetition || selectedCompetition.discipline === discipline || loadingData) return;

    // Update URL, this will trigger the main useEffect to update selectedCompetition
    router.replace(`/rwk-tabellen?year=${selectedCompetition.year}&discipline=${discipline}`, { scroll: false });
    setOpenAccordionItems([]); // Reset open accordions on discipline change
    setSelectedIndividualLeagueFilter(""); // Reset league filter
  }, [selectedCompetition, router, loadingData]);


  const handleAccordionValueChange = useCallback((value: string[]) => {
    setOpenAccordionItems(value);
    // Immer die zuletzt geöffnete Liga merken
    const newlyOpened = value.find(id => !openAccordionItems.includes(id));
    if (newlyOpened) {
      setLastClickedLeagueId(newlyOpened);

    }
  }, [openAccordionItems]);
  
  // Tastaturkürzel für Filter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+A für Teams "Außer Konkurrenz"
      if (e.altKey && e.key === 'a') {
        setShowOutOfCompetitionTeams(prev => !prev);
      }
      // Alt+S für Schützen "Außer Konkurrenz"
      if (e.altKey && e.key === 's') {
        setShowOutOfCompetitionShooters(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTeamShooters = useCallback(async (teamId: string, teamData: TeamDisplay, numRounds: number) => {
    if (loadedTeamShooters.has(teamId) || loadingTeamShooters.has(teamId)) return;
    
    // Conditional Loading: Nur laden wenn Team Schützen hat
    const shooterIdsForTeam = teamData.shooterIds || [];
    const validShooterIds = shooterIdsForTeam.filter(id => id && typeof id === 'string' && id.trim() !== "");
    
    if (validShooterIds.length === 0) {
      // Kein Loading nötig - Team hat keine Schützen
      setLoadedTeamShooters(prev => new Set([...prev, teamId]));
      return;
    }
    
    setLoadingTeamShooters(prev => new Set([...prev, teamId]));
    
    try {

      // Lade Scores für dieses Team
      const scoresQuery = query(
        collection(db, "rwk_scores"), 
        where("teamId", "==", teamId), 
        where("competitionYear", "==", teamData.competitionYear),
        where("shooterId", "in", validShooterIds)
      );
      const teamScoresSnapshot = await getDocs(scoresQuery);
      const scoresByShooter = new Map<string, ScoreEntry[]>();
      teamScoresSnapshot.forEach(scoreDoc => {
        const score = scoreDoc.data() as ScoreEntry;
        if (!scoresByShooter.has(score.shooterId)) scoresByShooter.set(score.shooterId, []);
        scoresByShooter.get(score.shooterId)!.push(score);
      });

      // Lade Schützen-Infos einzeln für bessere Fehlerbehandlung
      const shooterInfos = new Map<string, any>();
      
      for (const shooterId of validShooterIds) {
        try {
          const shooterDocRef = doc(db, "shooters", shooterId);
          const shooterSnap = await getDoc(shooterDocRef);
          
          if (shooterSnap.exists()) {
            const shooterData = shooterSnap.data();
            
            // Erstelle vollständigen Namen aus firstName, lastName, title
            let displayName = shooterData.name || '';
            if (shooterData.firstName || shooterData.lastName) {
              const nameParts = [];
              if (shooterData.firstName) nameParts.push(shooterData.firstName);
              if (shooterData.lastName) nameParts.push(shooterData.lastName);
              if (shooterData.title) nameParts.push(shooterData.title);
              displayName = nameParts.join(' ');
            }
            

            
            shooterInfos.set(shooterId, {
              ...shooterData,
              displayName // Speichere den zusammengesetzten Namen separat
            });
          } else {
            console.warn(`❌ Schütze ${shooterId} nicht in shooters gefunden - suche in Scores...`);
            
            // TEST-MODUS: Suche Namen in bestehenden Scores
            try {
              const scoresQuery = query(
                collection(db, "rwk_scores"),
                where("shooterId", "==", shooterId),
                limit(1)
              );
              const scoresSnapshot = await getDocs(scoresQuery);
              
              if (!scoresSnapshot.empty) {
                const scoreData = scoresSnapshot.docs[0].data();
                const nameFromScore = scoreData.shooterName;

                
                // Erstelle shooters Eintrag
                try {
                  const shooterDocRef = doc(db, "shooters", shooterId);
                  const nameParts = nameFromScore.split(' ');
                  const shooterData = {
                    name: nameFromScore,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    gender: scoreData.shooterGender || 'unknown',
                    createdAt: new Date(),
                    createdBy: 'auto-from-scores'
                  };
                  await setDoc(shooterDocRef, shooterData);

                } catch (createError) {
                  console.error(`Fehler beim Erstellen von Schütze ${shooterId}:`, createError);
                }
                
                shooterInfos.set(shooterId, {
                  name: nameFromScore,
                  displayName: nameFromScore,
                  gender: scoreData.shooterGender || 'unknown',
                  isTemporary: false
                });
              } else {

                shooterInfos.set(shooterId, {
                  name: `Schütze ${shooterId.substring(0,8)}`,
                  displayName: `Schütze ${shooterId.substring(0,8)}`,
                  gender: 'unknown',
                  isTemporary: true
                });
              }
            } catch (scoreError) {
              console.error(`Fehler beim Suchen in Scores für ${shooterId}:`, scoreError);
            }
          }
        } catch (error) {
          console.error(`Fehler beim Laden von Schütze ${shooterId}:`, error);
        }
      }

      // Erstelle Schützen-Ergebnisse
      const shootersResults: ShooterDisplayResults[] = [];
      for (const shooterId of validShooterIds) {
        const shooterInfo = shooterInfos.get(shooterId);
        // Verwende den bereits zusammengesetzten Namen oder Fallback
        let shooterDisplayName = shooterInfo?.displayName || shooterInfo?.name || (scoresByShooter.get(shooterId)?.[0]?.shooterName) || `Schütze ${shooterId.substring(0,5)}`;
        
        const sResults: ShooterDisplayResults = { 
          shooterId, 
          shooterName: shooterDisplayName, 
          shooterGender: shooterInfo?.gender || (scoresByShooter.get(shooterId)?.[0]?.shooterGender) || 'unknown',
          results: {}, average: null, total: 0, roundsShot: 0,
          teamId, 
          leagueId: teamData.leagueId, 
          competitionYear: teamData.competitionYear,
          leagueType: teamData.leagueType,
        };
        for (let r = 1; r <= numRounds; r++) sResults.results[`dg${r}`] = null;
        
        const scoresForThisShooter = scoresByShooter.get(shooterId) || [];
        scoresForThisShooter.forEach(score => {
          if (score.durchgang >= 1 && score.durchgang <= numRounds && typeof score.totalRinge === 'number') {
            sResults.results[`dg${score.durchgang}`] = score.totalRinge;
          }
        });
        
        let currentTotal = 0; let roundsShotCount = 0;
        Object.values(sResults.results).forEach(res => { if (res !== null && typeof res === 'number') { currentTotal += res; roundsShotCount++; } });
        sResults.total = currentTotal; sResults.roundsShot = roundsShotCount;
        if (sResults.roundsShot > 0 && sResults.total !== null) sResults.average = parseFloat((sResults.total / sResults.roundsShot).toFixed(2));
        shootersResults.push(sResults);
      }
      
      shootersResults.sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || a.shooterName.localeCompare(b.shooterName));

      // Update teamData
      setTeamData(prev => {
        if (!prev) return prev;
        const updatedLeagues = prev.leagues.map(league => ({
          ...league,
          teams: league.teams.map(team => 
            team.id === teamId ? { ...team, shootersResults } : team
          )
        }));
        return { ...prev, leagues: updatedLeagues };
      });

      setLoadedTeamShooters(prev => new Set([...prev, teamId]));
    } catch (error) {
      console.error('Error loading team shooters:', error);
    } finally {
      setLoadingTeamShooters(prev => { const newSet = new Set(prev); newSet.delete(teamId); return newSet; });
    }
  }, [loadedTeamShooters, loadingTeamShooters]);

  const toggleTeamExpansion = useCallback((teamId: string) => {
    const isExpanding = !expandedTeamIds.includes(teamId);
    setExpandedTeamIds(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    
    if (isExpanding && teamData) {
      // Finde das Team und lade Schützen-Details
      for (const league of teamData.leagues) {
        const team = league.teams.find(t => t.id === teamId);
        if (team) {
          loadTeamShooters(teamId, team, currentNumRoundsState);
          break;
        }
      }
    }
  }, [expandedTeamIds, teamData, loadTeamShooters, currentNumRoundsState]);

  const handleShooterNameClick = useCallback((shooterData: IndividualShooterDisplayData) => {
    setSelectedShooterForDetail(shooterData);
    setIsShooterDetailModalOpen(true);
  }, []);

  const pageTitle = useMemo(() => {
    if (!selectedCompetition) return 'RWK Tabellen';
    return selectedCompetition.displayName;
  }, [selectedCompetition]);
  
  const availableLeaguesForIndividualFilter = useMemo(() => {
    if (!teamData || !teamData.leagues) return [];
    return teamData.leagues
      .filter(league => league && typeof league.id === 'string' && league.id.trim() !== "") // Ensure valid IDs
      .map(league => ({ 
        id: league.id, 
        name: league.name, 
        type: league.type, // Specific Firestore type
        competitionYear: league.competitionYear, 
        order: league.order 
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
  }, [teamData]);

  // Conditional rendering for loading initial config
  if (isLoadingInitialYears || !selectedCompetition) {
    return <RwkTabellenPageLoadingSkeleton title={pageTitle || 'Lade Konfiguration...'} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <TableIconLucide className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">{pageTitle}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select 
            value={selectedCompetition.year.toString()} 
            onValueChange={handleYearChange} 
            disabled={availableYearsFromDb.length === 0 || loadingData}
          >
            <SelectTrigger className="w-full sm:w-[180px] shadow-md" aria-label="Jahr auswählen">
              <SelectValue placeholder={availableYearsFromDb.length === 0 ? "Keine Jahre" : "Jahr wählen"} />
            </SelectTrigger>
            <SelectContent>
              {availableYearsFromDb.length > 0 ? (
                availableYearsFromDb.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)
              ) : (
                <SelectItem value="NO_YEARS_PLACEHOLDER_RWK" disabled>Keine Saisons aktiv</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select 
            value={selectedCompetition.discipline} 
            onValueChange={value => handleDisciplineChange(value as UIDisciplineSelection)} 
            disabled={loadingData || uiDisciplineFilterOptions.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[220px] shadow-md" aria-label="Disziplin auswählen">
              <SelectValue placeholder={uiDisciplineFilterOptions.length === 0 ? "Keine Disziplinen" : "Disziplin wählen"} />
            </SelectTrigger>
            <SelectContent>
              {uiDisciplineFilterOptions.map(disc => <SelectItem key={disc.value} value={disc.value}>{disc.label}</SelectItem>)}
              {uiDisciplineFilterOptions.length === 0 && <SelectItem value="NO_DISCIPLINES_PLACEHOLDER_RWK" disabled>Keine Disziplinen</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as 'mannschaften' | 'einzelschützen');
        // Context-Aware Navigation: Verwende zuletzt geöffnete Liga
        if (value === 'einzelschützen' && lastClickedLeagueId) {
          // Aktualisiere Liga-Filter immer mit zuletzt geöffneter Liga
          if (selectedIndividualLeagueFilter !== lastClickedLeagueId) {
            setSelectedIndividualLeagueFilter(lastClickedLeagueId);

          }
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="mannschaften" className="py-2.5"><Users className="mr-2 h-5 w-5" />Mannschaften</TabsTrigger>
          <TabsTrigger value="einzelschützen" className="py-2.5"><User className="mr-2 h-5 w-5" />Einzelschützen</TabsTrigger>
        </TabsList>

        {loadingData && <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg">Lade Daten für {selectedCompetition.displayName}...</p></div>}
        
        {!loadingData && error && (
          <Card className="shadow-lg border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Fehler beim Laden</CardTitle></CardHeader><CardContent className="text-destructive-foreground bg-destructive/10 p-6"><p>{error}</p><p className="text-sm mt-1">Bitte sicherstellen, dass Saisons für das gewählte Jahr/Disziplin existieren, Status "Laufend" haben und Firestore-Indizes korrekt sind.</p></CardContent></Card>
        )}

        <TabsContent value="mannschaften">
          {!loadingData && !error && (!teamData || teamData.leagues.length === 0) && (
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-accent">Keine Ligen für {selectedCompetition.displayName}</CardTitle></CardHeader>
                <CardContent className="text-center py-12 p-6">
                    <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                    <p className="text-lg text-muted-foreground">
                        Für {selectedCompetition.displayName} wurden keine Ligen mit Status "Laufend" gefunden, oder es sind keine Mannschaften für diese Ligen vorhanden.
                    </p>
                     <p className="text-sm mt-1">Bitte überprüfen Sie den Status der Saison in der <Link href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</Link>.</p>
                </CardContent>
            </Card>
          )}
          {!loadingData && !error && teamData && teamData.leagues.length > 0 && (
            <ManualAccordion 
              value={openAccordionItems}
              onValueChange={handleAccordionValueChange}
              items={teamData.leagues.map(league => ({
                id: league.id,
                title: <>{league.name} {league.shortName && `(${league.shortName})`}</>,
                content: (
                  <div className="pt-0 pb-0">
                    {/* Erklärung der Wertungslogik */}
                    <div className="mb-4 bg-muted/20 p-3 rounded-md text-sm">
                      <h4 className="font-medium mb-1">Hinweise:</h4>
                      <p className="mb-2">Die Tabelle wird nach dem letzten vollständig abgeschlossenen Durchgang sortiert. 
                      Teams, die bereits weitere Durchgänge begonnen haben, werden erst neu eingeordnet, 
                      wenn alle Teams diesen Durchgang abgeschlossen haben.</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LineChartIcon className="h-3 w-3" />
                        <strong>Tipp:</strong> Klicken Sie auf Schützen-Namen für detaillierte Statistik-Diagramme
                      </p>
                      <p className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        <strong>Achtung:</strong> Fehlende Ergebnisse werden mit <span className="bg-red-100 text-red-700 px-1 rounded-sm font-bold">FEHLT</span> markiert und können die Gesamtwertung beeinflussen
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <span className="h-3 w-3">-</span>
                        <strong>Hinweis:</strong> Ein Strich (-) bedeutet, dass der Durchgang noch nicht begonnen wurde
                      </p>
                    </div>
                    
                    {/* Farbkodierung für den aktuellen Durchgang */}
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <span className="font-medium">Aktueller vollständiger Durchgang:</span>
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold">
                        {league.teams.length > 0 && 
                         league.teams[0].sortingScore !== undefined && 
                         league.teams[0].sortingAverage && 
                         !isNaN(league.teams[0].sortingScore / league.teams[0].sortingAverage) ? 
                          Math.floor(league.teams[0].sortingScore / league.teams[0].sortingAverage) : 0}
                      </span>
                    </div>
                    
                    {/* Fortschrittsanzeige für Durchgänge */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(currentNumRoundsState)].map((_, i) => {
                        const currentRound = league.teams.length > 0 && 
                          league.teams[0].sortingScore !== undefined && 
                          league.teams[0].sortingAverage && 
                          !isNaN(league.teams[0].sortingScore / league.teams[0].sortingAverage) ? 
                            Math.floor(league.teams[0].sortingScore / league.teams[0].sortingAverage) : 0;
                        return (
                          <div 
                            key={i} 
                            className={`h-2 flex-1 rounded-full ${i < currentRound ? 'bg-green-500' : 'bg-muted'}`}
                            title={`Durchgang ${i+1}: ${i < currentRound ? 'Abgeschlossen' : 'Offen'}`}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Verbesserte mobile Ansicht */}
                    <div className="md:hidden p-3 bg-yellow-50 text-yellow-800 rounded-md mb-4">
                      <p className="text-sm">Für die beste Ansicht der Tabelle bitte das Gerät drehen oder einen größeren Bildschirm verwenden.</p>
                    </div>
                    
                    {/* Schnellfilter für Teams */}
                    <div className="mb-4">
                      <Input 
                        placeholder="Team suchen..." 
                        className="max-w-xs" 
                        onChange={(e) => {
                          const filterValue = e.target.value.toLowerCase();
                          const filteredTeams = league.teams.filter(team => 
                            team.name.toLowerCase().includes(filterValue) || 
                            team.clubName.toLowerCase().includes(filterValue)
                          );
                          // Hier könnte man die gefilterten Teams anzeigen, aber das würde eine größere Änderung erfordern
                          // Für jetzt nur die Anzahl der gefundenen Teams anzeigen
                          if (filterValue) {

                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-muted/10">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`showOutOfCompetitionTeams-${league.id}`}
                          checked={showOutOfCompetitionTeams}
                          onCheckedChange={(checked) => {
                            setShowOutOfCompetitionTeams(!!checked);
                            // URL aktualisieren
                            const currentParams = new URLSearchParams(window.location.search);
                            currentParams.set('showAK', (!!checked).toString());
                            router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
                          }}
                          className="mr-1"
                        />
                        <Label 
                          htmlFor={`showOutOfCompetitionTeams-${league.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Teams "Außer Konkurrenz" anzeigen
                        </Label>
                      </div>
                      {!isNativeApp && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <PDFButton 
                            league={league} 
                            numRounds={currentNumRoundsState} 
                            competitionYear={selectedCompetition.year} 
                            type="teams"
                            className="text-xs px-2 py-1 whitespace-nowrap"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs px-2 py-1 whitespace-nowrap"
                            onClick={async () => {
                              // Import der benötigten Funktionen
                              const { generateShootersPDFFixed } = await import('@/lib/utils/pdf-generator.fix');
                              // Lade Einzelschützen für diese Liga
                              const shooterData = await fetchIndividualShooterData(
                                selectedCompetition, 
                                currentNumRoundsState, 
                                league.id
                              );
                              
                              // Erstelle temporäres League-Objekt mit den geladenen Schützen
                              const tempLeague = {
                                ...league,
                                individualLeagueShooters: shooterData
                              };
                              
                              // Generiere PDF mit den geladenen Daten und Logo
                              try {
                                await generateShootersPDFFixed(
                                  tempLeague, 
                                  currentNumRoundsState, 
                                  selectedCompetition.year
                                );
                                
                                toast({
                                  title: 'PDF erstellt',
                                  description: 'Die PDF-Datei wurde erfolgreich erstellt.',
                                });
                              } catch (error) {
                                console.error('Fehler beim Erstellen der PDF:', error);
                                toast({
                                  title: 'Fehler',
                                  description: 'Die PDF-Datei konnte nicht erstellt werden.',
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            Einzelschützen als PDF
                          </Button>
                        </div>
                      )}
                    </div>
                    {league.teams.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[50px] text-center px-2 py-2 text-xs font-medium text-muted-foreground">#</TableHead>
                              <TableHead className="min-w-[150px] px-2 py-2 text-xs font-medium text-muted-foreground">Mannschaft</TableHead>
                              {[...Array(currentNumRoundsState)].map((_, i) => (
                                <TableHead key={`dg-header-${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>
                              ))}
                              <TableHead className="text-center px-1 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
                              <TableHead className="text-center px-1 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Schnitt</TableHead>
                              <TableHead className="w-[60px] text-right pr-4 px-2 py-2"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {league.teams
                              .filter(team => showOutOfCompetitionTeams || !team.outOfCompetition)
                              .map(team => (
                              <React.Fragment key={team.id}>
                                <TableRow className="hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => toggleTeamExpansion(team.id)}>
                                  <TableCell className="text-center font-medium px-2 py-2">
                                    {team.outOfCompetition ? 
                                      <span className="text-amber-500" title="Außer Konkurrenz">AK</span> : 
                                      team.rank
                                    }
                                  </TableCell>
                                  <TableCell className="font-medium text-foreground px-2 py-2">
                                    {team.name}
                                    <TeamStatusBadge 
                                      outOfCompetition={team.outOfCompetition} 
                                      reason={team.outOfCompetitionReason} 
                                      className="ml-2" 
                                    />
                                  </TableCell>
                                  {[...Array(currentNumRoundsState)].map((_, i) => (
                                    <TableCell key={`dg-val-${i + 1}-${team.id}`} className="text-center px-1 py-2">{(team.roundResults as any)?.[`dg${i + 1}`] ?? '-'}</TableCell>
                                  ))}
                                  <TableCell className="text-center font-semibold text-primary px-2 py-2">
                                    {team.sortingScore !== undefined && team.sortingScore !== team.totalScore ? (
                                      <div className="flex flex-col items-center">
                                        <span>{team.totalScore ?? '-'}</span>
                                        <span className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-sm mt-0.5" title="Wertung basiert auf vollständig abgeschlossenen Durchgängen">
                                          Wertung: {team.sortingScore}
                                        </span>
                                      </div>
                                    ) : (
                                      team.totalScore ?? '-'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center font-medium text-muted-foreground px-2 py-2">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-right pr-4 px-2 py-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toggleTeamExpansion(team.id);}} aria-label={`Details für ${team.name} ${expandedTeamIds.includes(team.id) ? 'ausblenden' : 'anzeigen'}`} className="hover:bg-accent/20 rounded-md">
                                      {expandedTeamIds.includes(team.id) ? <ChevronDown className="h-5 w-5 transition-transform duration-200 rotate-180" /> : <ChevronRight className="h-5 w-5 transition-transform duration-200" />}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {expandedTeamIds.includes(team.id) && (
                                  <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableCell colSpan={5 + currentNumRoundsState + 1} className="p-0 border-t-0">
                                      {loadingTeamShooters.has(team.id) ? (
                                        <div className="p-4 text-center">
                                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                          <p className="text-sm text-muted-foreground">Lade Schützen...</p>
                                        </div>
                                      ) : (
                                        <TeamShootersTable shootersResults={team.shootersResults} numRounds={currentNumRoundsState} parentTeam={team} onShooterClick={handleShooterNameClick} teamSubstitutions={teamSubstitutions} />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {pageTitle} vorhanden.</p>)}
                  </div>
                )
              }))}
            />
          )}
        </TabsContent>

        <TabsContent value="einzelschützen">
          {!loadingData && !error && (
             <div className="mb-4 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🎯 Liga-Auswahl erforderlich</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Bitte wählen Sie eine Liga aus, um die Einzelrangliste anzuzeigen. 
                    Eine übergreifende Anzeige aller Disziplinen ist nicht möglich, 
                    da verschiedene Disziplinen (Pistole, Gewehr, Luftdruck) nicht vergleichbar sind.
                  </p>
                  <div>
                    <Label htmlFor="individualLeagueFilter" className="text-sm font-medium text-blue-900">Liga auswählen:</Label>
                    <Select 
                        value={selectedIndividualLeagueFilter || ""} 
                        onValueChange={(value) => setSelectedIndividualLeagueFilter(value)}
                        disabled={loadingData || !teamData || availableLeaguesForIndividualFilter.length === 0}
                    >
                      <SelectTrigger id="individualLeagueFilter" className="w-full sm:w-[350px] mt-1 shadow-sm border-blue-300">
                        <SelectValue placeholder="-- Bitte Liga auswählen --" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Spezielle Option für KK Gewehr Ehrungen */}
                        {selectedCompetition?.discipline === 'KK' && (
                          <SelectItem value="KK_GEWEHR_EHRUNGEN" className="bg-amber-50 text-amber-800 font-medium">
                            🏆 Alle KK Gewehr Auflage
                          </SelectItem>
                        )}
                        {availableLeaguesForIndividualFilter
                          .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "") 
                          .map(league => {
                            // Entferne "Gruppe" und "(Gruppe)" aus dem Namen
                            const cleanName = league.name
                              .replace(/\s*\(Gruppe\)\s*/g, '')
                              .replace(/\s+Gruppe\s*$/g, '')
                              .trim();
                            return (
                              <SelectItem key={league.id} value={league.id}>
                                {cleanName} ({league.type})
                              </SelectItem>
                            );
                          })
                        }
                        {availableLeaguesForIndividualFilter.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").length === 0 && selectedCompetition && (
                          <SelectItem value="NO_LEAGUES_FOR_IND_FILTER_RWK" disabled>Keine Ligen verfügbar</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showOutOfCompetitionShootersIndividual"
                      checked={showOutOfCompetitionShooters}
                      onCheckedChange={(checked) => {
                        setShowOutOfCompetitionShooters(!!checked);
                        // URL aktualisieren
                        const currentParams = new URLSearchParams(window.location.search);
                        currentParams.set('showAKShooters', (!!checked).toString());
                        router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
                      }}
                    />
                    <Label 
                      htmlFor="showOutOfCompetitionShootersIndividual"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Schützen "Außer Konkurrenz" anzeigen
                    </Label>
                  </div>
                  {selectedIndividualLeagueFilter && (
                    <div className="flex-1 max-w-xs">
                      <Input 
                        placeholder="Schütze suchen..." 
                        value={shooterSearchTerm}
                        onChange={(e) => setShooterSearchTerm(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
          )}
          {!loadingData && !error && !selectedIndividualLeagueFilter && (
            <Card className="shadow-lg border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Liga-Auswahl erforderlich
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12 p-6">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg text-blue-700 mb-4">
                  Bitte wählen Sie oben eine Liga aus, um die Einzelrangliste anzuzeigen.
                </p>
                <p className="text-sm text-blue-600">
                  Dies verhindert die Vermischung verschiedener Disziplinen in der Rangliste.
                </p>
              </CardContent>
            </Card>
          )}
          {!loadingData && !error && selectedIndividualLeagueFilter && filteredIndividualData.length === 0 && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Einzelschützen für {selectedCompetition?.displayName || pageTitle} {selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : ''}</CardTitle></CardHeader><CardContent className="text-center py-12 p-6"><AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-lg text-muted-foreground">Für die ausgewählte Liga wurden keine Einzelschützenergebnisse gefunden.</p></CardContent></Card>
          )}
          {!loadingData && !error && selectedIndividualLeagueFilter && filteredIndividualData.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {topMaleShooter && (<Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium text-primary">Bester Schütze</CardTitle><Trophy className="h-5 w-5 text-amber-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{topMaleShooter.shooterName}</p><p className="text-sm text-muted-foreground">{topMaleShooter.teamName}</p><p className="text-lg">Gesamt: <span className="font-semibold">{topMaleShooter.totalScore}</span> Ringe</p><p className="text-sm">Schnitt: {topMaleShooter.averageScore != null ? topMaleShooter.averageScore.toFixed(2) : '-'} ({topMaleShooter.roundsShot} DG)</p></CardContent></Card>)}
                {topFemaleShooter && (<Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium text-primary">Beste Dame</CardTitle><Medal className="h-5 w-5 text-pink-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{topFemaleShooter.shooterName}</p><p className="text-sm text-muted-foreground">{topFemaleShooter.teamName}</p><p className="text-lg">Gesamt: <span className="font-semibold">{topFemaleShooter.totalScore}</span> Ringe</p><p className="text-sm">Schnitt: {topFemaleShooter.averageScore != null ? topFemaleShooter.averageScore.toFixed(2) : '-'} ({topFemaleShooter.roundsShot} DG)</p></CardContent></Card>)}
                {(!topMaleShooter && !loadingData) && (<Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Kein Bester Schütze</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnte kein bester Schütze ermittelt werden.</p></CardContent></Card>)}
                {!topFemaleShooter && !loadingData && (<Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Beste Dame</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnte keine beste Dame ermittelt werden.</p></CardContent></Card>)}
              </div>
              <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl text-accent">Einzelrangliste {selectedIndividualLeagueFilter === 'KK_GEWEHR_EHRUNGEN' ? '(🏆 Alle KK Gewehr Auflage)' : selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : '(Alle Ligen der Disziplin)'}</CardTitle><CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {pageTitle}.</CardDescription></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead><TableHead>Name</TableHead><TableHead>Mannschaft</TableHead>
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg-header-${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">Gesamt</TableHead><TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">Schnitt</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredIndividualData
                          .filter(shooter => showOutOfCompetitionShooters || !shooter.teamOutOfCompetition)
                          .filter(shooter => 
                            !shooterSearchTerm || 
                            shooter.shooterName.toLowerCase().includes(shooterSearchTerm.toLowerCase()) ||
                            shooter.teamName.toLowerCase().includes(shooterSearchTerm.toLowerCase())
                          )
                          .map(shooter => (
                          <TableRow key={`ind-${shooter.shooterId}`} className="hover:bg-secondary/20 transition-colors">
                            <TableCell className="text-center font-medium">
                              {shooter.teamOutOfCompetition ? 
                                <span className="text-amber-500" title="Außer Konkurrenz">AK</span> : 
                                shooter.rank
                              }
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <Button variant="link" className="p-0 h-auto text-base text-left hover:text-primary whitespace-normal text-wrap" onClick={() => handleShooterNameClick(shooter)}>
                                  {shooter.shooterName}
                                </Button>
                                <LineChartIcon className="h-3 w-3 text-muted-foreground" title="Klicken Sie auf den Namen für Statistik-Diagramm" />
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {shooter.teamName}
                              {shooter.teamOutOfCompetition && (
                                <span 
                                  className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium cursor-help"
                                  title={shooter.teamOutOfCompetitionReason || 'Außer Konkurrenz'}
                                  aria-label={`Außer Konkurrenz: ${shooter.teamOutOfCompetitionReason || 'Keine Begründung angegeben'}`}
                                >
                                  AK
                                </span>
                              )}
                            </TableCell>
                            {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`ind-dg-val-${i + 1}-${shooter.shooterId}`} className="text-center px-1 py-2">{shooter.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                            <TableCell className="text-center font-semibold text-primary">{shooter.totalScore}</TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground">{shooter.averageScore != null ? shooter.averageScore.toFixed(2) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isShooterDetailModalOpen} onOpenChange={setIsShooterDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for better chart display */}
          {selectedShooterForDetail && <ShooterDetailModalContent shooterData={selectedShooterForDetail} numRounds={currentNumRoundsState} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RwkTabellenPage() {
  return (
    <Suspense fallback={<RwkTabellenPageLoadingSkeleton title="RWK Tabellen laden..." />}>
      <RwkTabellenPageComponent />
    </Suspense>
  );
}


"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
  AlertTriangle,
  User,
  Users,
  Trophy,
  Medal,
  LineChart as LineChartIcon,
  FileDown,
} from 'lucide-react';
import { PDFExportButton } from '@/components/pdf-export-button';
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
  
  const [topMaleShooter, setTopMaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [topFemaleShooter, setTopFemaleShooter] = useState<IndividualShooterDisplayData | null>(null);
  const [selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter] = useState<string>(""); // Empty string for "All Leagues"

  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNumRoundsState, setCurrentNumRoundsState] = useState<number>(5);
  
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([]);
  
  const [isShooterDetailModalOpen, setIsShooterDetailModalOpen] = useState(false);
  const [selectedShooterForDetail, setSelectedShooterForDetail] = useState<IndividualShooterDisplayData | null>(null);

  // Extrahiere URL-Parameter auf Client-Seite
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUrlParams({
        year: params.get('year'),
        discipline: params.get('discipline'),
        league: params.get('league')
      });
    }
  }, []);
  
  // Memoize URL parameters to stabilize dependencies
  const initialYearFromParams = useMemo(() => urlParams.year, [urlParams.year]);
  const initialDisciplineFromParams = useMemo(() => urlParams.discipline as UIDisciplineSelection | null, [urlParams.discipline]);
  const initialLeagueIdFromParams = useMemo(() => urlParams.league, [urlParams.league]);

  const fetchAvailableYearsFromSeasons = useCallback(async (): Promise<number[]> => {
    console.log("RWK DEBUG: fetchAvailableYearsFromSeasons called");
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
      
      console.log("RWK DEBUG: Available disciplines from DB:", Array.from(availableDisciplines));
      
      const sortedYears = Array.from(years).sort((a, b) => b - a);
      console.log("RWK DEBUG: Available years from DB:", sortedYears);
      return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
    } catch (err: any) {
      console.error('RWK DEBUG: Error fetching available years:', err);
      toast({ title: "Fehler", description: `Verfügbare Jahre konnten nicht geladen werden: ${err.message}`, variant: "destructive" });
      return [new Date().getFullYear()];
    }
  }, [toast]);

  const calculateNumRounds = useCallback(async (year: number, uiDiscipline: UIDisciplineSelection): Promise<number> => {
    if (!year || !uiDiscipline) return 5;
    console.log(`RWK DEBUG: calculateNumRounds for year ${year}, UI disc ${uiDiscipline}`);
    try {
      const seasonsQuery = query(
        collection(db, "seasons"),
        where("competitionYear", "==", year),
        where("type", "in", [uiDiscipline, uiDiscipline.toUpperCase(), uiDiscipline.toLowerCase()]),
        where("status", "==", "Laufend"),
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
                  console.log(`RWK DEBUG: calculateNumRounds - Luftdruckdisziplin (${specificType}), 4 Runden.`);
                  return 4;
                }
            }
          }
      }
    } catch (err: any) {
      console.error('RWK DEBUG: Error in calculateNumRounds:', err);
      toast({ title: "Fehler Rundenanzahl", description: `Anzahl der Durchgänge konnte nicht ermittelt werden: ${err.message}`, variant: "destructive" });
    }
    console.log(`RWK DEBUG: calculateNumRounds - Defaulting to 5 Runden.`);
    return 5;
  }, [toast]);

  const fetchCompetitionTeamData = useCallback(async (config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> => {
    if (!config || !config.year || !config.discipline) return null;
    console.log(`RWK DEBUG: fetchCompetitionTeamData for year ${config.year}, UI discipline ${config.discipline}`);
    try {
      const seasonsColRef = collection(db, "seasons");
      const qSeasons = query(seasonsColRef, 
        where("competitionYear", "==", config.year), 
        where("type", "in", [config.discipline, config.discipline.toUpperCase(), config.discipline.toLowerCase()]), 
        where("status", "==", "Laufend") // Only "Laufend" seasons
      );
      const seasonsSnapshot = await getDocs(qSeasons);

      if (seasonsSnapshot.empty) {
        console.warn(`RWK DEBUG: No 'Laufend' seasons found for year ${config.year} and UI discipline ${config.discipline}.`);
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

      for (const leagueDoc of leaguesSnapshot.docs) {
        const leagueData = leagueDoc.data() as Omit<League, 'id'>;
        const leagueDisplay: LeagueDisplay = { 
            id: leagueDoc.id, 
            ...leagueData, 
            teams: [], 
            individualLeagueShooters: [] 
        };
        let teamDisplays: TeamDisplay[] = [];
        
        const teamsColRef = collection(db, "rwk_teams");
        const qTeams = query(teamsColRef, where("leagueId", "==", leagueDisplay.id), where("competitionYear", "==", config.year));
        const teamsSnapshot = await getDocs(qTeams);

        for (const teamDoc of teamsSnapshot.docs) {
          const teamData = teamDoc.data() as Team;
          if (teamData.name && teamData.name.toLowerCase().includes(EXCLUDED_TEAM_NAME_PART)) {
            console.log(`RWK DEBUG: Filtering out team by name: ${teamData.name}`);
            continue; 
          }
          
          let clubName = "Unbek. Verein";
          if (teamData.clubId) {
            if (clubCache.has(teamData.clubId)) { clubName = clubCache.get(teamData.clubId)!; } 
            else {
              try {
                const clubSnap = await getDoc(doc(db, "clubs", teamData.clubId));
                if (clubSnap.exists()) { clubName = (clubSnap.data() as Club).name || clubName; clubCache.set(teamData.clubId, clubName); }
              } catch (e) { console.error("RWK DEBUG: Error fetching club", teamData.clubId, e); }
            }
          }
          const teamDisplayItem: TeamDisplay = { 
            ...teamData, 
            id: teamDoc.id, 
            clubName, 
            shootersResults: [], 
            roundResults: {}, 
            totalScore: 0, 
            averageScore: null, 
            numScoredRounds: 0,
            leagueType: leagueDisplay.type 
          };

          const shooterIdsForTeam = teamData.shooterIds || [];
          if (shooterIdsForTeam.length > 0) {
            const validShooterIds = shooterIdsForTeam.filter(id => id && typeof id === 'string' && id.trim() !== "");
            if (validShooterIds.length > 0) {
                const scoresQuery = query(collection(db, "rwk_scores"), 
                                          where("teamId", "==", teamDisplayItem.id), 
                                          where("competitionYear", "==", teamDisplayItem.competitionYear),
                                          where("shooterId", "in", validShooterIds));
                const teamScoresSnapshot = await getDocs(scoresQuery);
                const scoresByShooter = new Map<string, ScoreEntry[]>();
                teamScoresSnapshot.forEach(scoreDoc => {
                    const score = scoreDoc.data() as ScoreEntry;
                    if (!scoresByShooter.has(score.shooterId)) scoresByShooter.set(score.shooterId, []);
                    scoresByShooter.get(score.shooterId)!.push(score);
                });
              
              for (const shooterId of validShooterIds) {
                let shooterInfo = shooterCache.get(shooterId);
                if (!shooterInfo) {
                  try {
                    const shooterSnap = await getDoc(doc(db, "rwk_shooters", shooterId));
                    if (shooterSnap.exists()) { shooterInfo = {id: shooterSnap.id, ...shooterSnap.data()} as Shooter; shooterCache.set(shooterId, shooterInfo); }
                  } catch (e) { console.error("RWK DEBUG: Error fetching shooter", shooterId, e); }
                }
                const sResults: ShooterDisplayResults = { 
                  shooterId, 
                  shooterName: shooterInfo?.name || (scoresByShooter.get(shooterId)?.[0]?.shooterName) || `Schütze ${shooterId.substring(0,5)}`, 
                  shooterGender: shooterInfo?.gender || (scoresByShooter.get(shooterId)?.[0]?.shooterGender) || 'unknown',
                  results: {}, average: null, total: 0, roundsShot: 0,
                  teamId: teamDisplayItem.id, 
                  leagueId: leagueDisplay.id, 
                  competitionYear: teamDisplayItem.competitionYear,
                  leagueType: leagueDisplay.type,
                };
                for (let r = 1; r <= numRoundsForCompetition; r++) sResults.results[`dg${r}`] = null;
                
                const scoresForThisShooterInTeam = scoresByShooter.get(shooterId) || [];
                scoresForThisShooterInTeam.forEach(score => {
                  if (score.durchgang >= 1 && score.durchgang <= numRoundsForCompetition && typeof score.totalRinge === 'number') {
                    sResults.results[`dg${score.durchgang}`] = score.totalRinge;
                  }
                });
                let currentTotal = 0; let roundsShotCount = 0;
                Object.values(sResults.results).forEach(res => { if (res !== null && typeof res === 'number') { currentTotal += res; roundsShotCount++; } });
                sResults.total = currentTotal; sResults.roundsShot = roundsShotCount;
                if (sResults.roundsShot > 0 && sResults.total !== null) sResults.average = parseFloat((sResults.total / sResults.roundsShot).toFixed(2));
                teamDisplayItem.shootersResults.push(sResults);
              }
              teamDisplayItem.shootersResults.sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || a.shooterName.localeCompare(b.shooterName));
            }
          }

          let roundResultsTemp: { [key: string]: number[] } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) roundResultsTemp[`dg${r}`] = [];
          
          teamDisplayItem.shootersResults.forEach(sr => {
            for (let r = 1; r <= numRoundsForCompetition; r++) {
              const rk = `dg${r}`;
              if (sr.results[rk] !== null && typeof sr.results[rk] === 'number') {
                roundResultsTemp[rk].push(sr.results[rk] as number);
              }
            }
          });

          for (let r = 1; r <= numRoundsForCompetition; r++) {
            const rk = `dg${r}`;
            const scoresForRound = roundResultsTemp[rk].sort((a, b) => b - a);
            let roundSum = 0; 
            let contributingScoresCount = 0;
            for (let sIdx = 0; sIdx < Math.min(scoresForRound.length, MAX_SHOOTERS_PER_TEAM); sIdx++) {
                roundSum += scoresForRound[sIdx];
                contributingScoresCount++;
            }
            teamDisplayItem.roundResults[rk] = contributingScoresCount === MAX_SHOOTERS_PER_TEAM ? roundSum : null;
          }

          let teamTotal = 0; let numScoredRds = 0;
          Object.values(teamDisplayItem.roundResults).forEach(val => { if (val !== null) { teamTotal += val; numScoredRds++; } });
          teamDisplayItem.totalScore = teamTotal; teamDisplayItem.numScoredRounds = numScoredRds;
          teamDisplayItem.averageScore = numScoredRds > 0 ? parseFloat((teamTotal / numScoredRds).toFixed(2)) : null;
          teamDisplays.push(teamDisplayItem);
        }
        teamDisplays.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.clubName.localeCompare(b.clubName) || a.name.localeCompare(b.name));
        teamDisplays.forEach((team, index) => { team.rank = index + 1; });
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
                    });
                }
            });
        });
        leagueDisplay.individualLeagueShooters = Array.from(leagueShootersMap.values())
            .filter(s => s.roundsShot > 0) // Only shooters with actual scores
            .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
        leagueDisplay.individualLeagueShooters.forEach((shooter, index) => { shooter.rank = index + 1; });


        fetchedLeaguesData.push(leagueDisplay);
      }
      console.log(`RWK DEBUG: fetchCompetitionTeamData - Processed ${fetchedLeaguesData.length} leagues.`);
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
    console.log(`RWK DEBUG: fetchIndividualShooterData for year ${config.year}, UI disc ${config.discipline}, League Filter: ${filterByLeagueId || 'ALL'}`);
    try {
      const scoresColRef = collection(db, "rwk_scores");
      let scoresQueryConstraints: any[] = [where("competitionYear", "==", config.year)];
      
      const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
      let firestoreDisciplinesToQuery: FirestoreLeagueSpecificDiscipline[] = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [];

      if (filterByLeagueId && filterByLeagueId !== "ALL_LEAGUES_IND_FILTER") {
        scoresQueryConstraints.push(where("leagueId", "==", filterByLeagueId));
        // We don't need to re-filter by leagueType if we're already filtering by a specific leagueId
        // as that league already has a specific type.
      } else { 
        if (firestoreDisciplinesToQuery.length > 0) {
          scoresQueryConstraints.push(where("leagueType", "in", firestoreDisciplinesToQuery));
        } else { 
            console.warn(`RWK DEBUG: fetchIndividualShooterData - No firestore discipline types for UI disc ${config.discipline}.`);
            return [];
        }
      }
      
      const scoresQuery = query(scoresColRef, ...scoresQueryConstraints);
      const scoresSnapshot = await getDocs(scoresQuery);
      const allScores: ScoreEntry[] = [];
      scoresSnapshot.docs.forEach(d => { allScores.push({ id: d.id, ...d.data() as ScoreEntry }); });

      const shootersMap = new Map<string, IndividualShooterDisplayData>();
      for (const score of allScores) {
        if (!score.shooterId) continue;
        let currentShooterData = shootersMap.get(score.shooterId);
        if (!currentShooterData) {
          const initialResults: { [key: string]: number | null } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) initialResults[`dg${r}`] = null;
          currentShooterData = {
            shooterId: score.shooterId, shooterName: score.shooterName || "Unbek. Schütze",
            shooterGender: score.shooterGender || 'unknown', teamName: score.teamName || "Unbek. Team", 
            results: initialResults, totalScore: 0, averageScore: null, roundsShot: 0,
            competitionYear: score.competitionYear, leagueId: score.leagueId, leagueType: score.leagueType,
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

        // Ensure league context for the shooter matches the filter if one is applied
        if (filterByLeagueId && filterByLeagueId !== "ALL_LEAGUES_IND_FILTER" && score.leagueId === filterByLeagueId) {
          currentShooterData.leagueId = score.leagueId;
          currentShooterData.leagueType = score.leagueType;
        } else if ((!filterByLeagueId || filterByLeagueId === "ALL_LEAGUES_IND_FILTER") && !currentShooterData.leagueId) {
          // If no league filter, or this is the first score, set league context
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
      const rankedShooters = Array.from(shootersMap.values())
        .filter(s => s.roundsShot > 0) 
        .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.averageScore ?? 0) - (a.averageScore ?? 0) || a.shooterName.localeCompare(b.shooterName));
      rankedShooters.forEach((shooter, index) => { shooter.rank = index + 1; });
      console.log(`RWK DEBUG: fetchIndividualShooterData - Processed ${rankedShooters.length} shooters.`);
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
      console.log("RWK DEBUG: loadData - Aborting, selectedCompetition not ready.");
      setLoadingData(false);
      return;
    }
    console.log("RWK DEBUG: loadData triggered.", { year: selectedCompetition.year, disc: selectedCompetition.discipline, tab: activeTab, leagueFilter: selectedIndividualLeagueFilter });
    setLoadingData(true); setError(null); 
    setTeamData(null); 
    setAllIndividualDataForDiscipline([]); 
    setFilteredIndividualData([]);
    setTopMaleShooter(null);
    setTopFemaleShooter(null);
    
    try {
      const numRounds = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
      setCurrentNumRoundsState(numRounds);
      console.log(`RWK DEBUG: loadData - Num rounds for competition set to: ${numRounds}`);

      const fetchedTeamData = await fetchCompetitionTeamData(selectedCompetition, numRounds);
      setTeamData(fetchedTeamData);
      
      // Fetch all individuals for the selected discipline (without league filter initially)
      const allIndividuals = await fetchIndividualShooterData(selectedCompetition, numRounds, null);
      setAllIndividualDataForDiscipline(allIndividuals);
      
      // Apply league filter if one is selected
      if (selectedIndividualLeagueFilter && selectedIndividualLeagueFilter !== "ALL_LEAGUES_IND_FILTER") {
          const individualsInLeague = await fetchIndividualShooterData(selectedCompetition, numRounds, selectedIndividualLeagueFilter);
          setFilteredIndividualData(individualsInLeague);
      } else {
          setFilteredIndividualData(allIndividuals); // Show all if no league filter
      }

      if (allIndividuals.length > 0) { // Base top shooters on all individuals for the discipline
        const males = allIndividuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
        setTopMaleShooter(males.length > 0 ? males[0] : null);
        
        const females = allIndividuals.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
        setTopFemaleShooter(females.length > 0 ? females[0] : null);
      }
    } catch (err: any) {
      console.error('RWK DEBUG: Failed to load RWK data in loadData:', err);
      toast({ title: "Fehler Datenladen", description: `Fehler beim Laden der Wettkampfdaten: ${err.message}`, variant: "destructive" });
      setError((err as Error).message || 'Unbekannter Fehler beim Laden der Daten.');
    } finally {
      setLoadingData(false);
      console.log("RWK DEBUG: loadData finished.");
    }
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, calculateNumRounds, fetchCompetitionTeamData, fetchIndividualShooterData, toast]);

  // Effect for initial load and when URL parameters change
  useEffect(() => {
    console.log("RWK DEBUG: Main useEffect for initialization. searchParams:", initialYearFromParams, initialDisciplineFromParams, initialLeagueIdFromParams);
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
          console.log("RWK DEBUG: Setting selectedCompetition from initial params/defaults:", newSelectedCompetition);
          setSelectedCompetition(newSelectedCompetition);
      } else {
          console.log("RWK DEBUG: selectedCompetition is already up-to-date, not setting again from initial effect.");
      }

      if (initialLeagueIdFromParams) {
        setOpenAccordionItems([initialLeagueIdFromParams]);
        // Do not set selectedIndividualLeagueFilter here directly, let user choose or loadData handle "ALL"
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
      if (needsUrlUpdate && (!initialLeagueIdFromParams || currentParams.get('league') !== initialLeagueIdFromParams)) {
         // If league was not in params, or it changed, remove it when year/discipline default
         if (currentParams.has('league') && !initialLeagueIdFromParams) currentParams.delete('league');
         // Or if league was in params and valid, keep it
         else if (initialLeagueIdFromParams && !currentParams.has('league')) currentParams.set('league', initialLeagueIdFromParams);
         
         console.log(`RWK DEBUG: URL needs update. Replacing URL with: /rwk-tabellen?${currentParams.toString()}`);
         router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
      } else if (!needsUrlUpdate && initialLeagueIdFromParams && currentParams.get('league') !== initialLeagueIdFromParams) {
        // If only league param is different from what's already set (e.g. user navigated back)
        currentParams.set('league', initialLeagueIdFromParams);
        console.log(`RWK DEBUG: URL league param different. Replacing URL with: /rwk-tabellen?${currentParams.toString()}`);
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
      console.log("RWK DEBUG: useEffect for loadData triggered by selectedCompetition, activeTab or selectedIndividualLeagueFilter change.");
      loadData();
    }
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, loadData, isLoadingInitialYears]); // loadData is memoized

  // Effect to open all league accordions by default if no specific league is targeted
  useEffect(() => {
    if (teamData && teamData.leagues && !initialLeagueIdFromParams && openAccordionItems.length === 0) {
      const allLeagueIds = teamData.leagues.map(l => l.id).filter(id => !!id);
      if (allLeagueIds.length > 0) {
          console.log(`RWK DEBUG: Setting openAccordionItems to all leagues by default:`, allLeagueIds);
          setOpenAccordionItems(allLeagueIds);
      }
    }
  }, [teamData, initialLeagueIdFromParams, openAccordionItems.length]);


  const handleYearChange = useCallback((yearString: string) => {
    const year = parseInt(yearString, 10);
    if (!selectedCompetition || selectedCompetition.year === year || isNaN(year) || loadingData) return;
    console.log("RWK DEBUG: handleYearChange - Year changed to:", year);
    // Update URL, this will trigger the main useEffect to update selectedCompetition
    router.replace(`/rwk-tabellen?year=${year.toString()}&discipline=${selectedCompetition.discipline}`, { scroll: false });
    setOpenAccordionItems([]); // Reset open accordions on year change
    setSelectedIndividualLeagueFilter(""); // Reset league filter
  }, [selectedCompetition, router, loadingData]);

  const handleDisciplineChange = useCallback((discipline: UIDisciplineSelection) => {
    if (!selectedCompetition || selectedCompetition.discipline === discipline || loadingData) return;
    console.log("RWK DEBUG: handleDisciplineChange - Discipline changed to:", discipline);
    // Update URL, this will trigger the main useEffect to update selectedCompetition
    router.replace(`/rwk-tabellen?year=${selectedCompetition.year}&discipline=${discipline}`, { scroll: false });
    setOpenAccordionItems([]); // Reset open accordions on discipline change
    setSelectedIndividualLeagueFilter(""); // Reset league filter
  }, [selectedCompetition, router, loadingData]);


  const handleAccordionValueChange = useCallback((value: string[]) => {
    setOpenAccordionItems(value);
  }, []);

  const toggleTeamExpansion = useCallback((teamId: string) => {
    setExpandedTeamIds(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
  }, []);

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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'mannschaften' | 'einzelschützen')} className="w-full">
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
            <Accordion type="multiple" value={openAccordionItems} onValueChange={handleAccordionValueChange} className="w-full space-y-4">
              {teamData.leagues.map((league) => (
                <AccordionItem value={league.id} key={league.id} className="border bg-card shadow-lg rounded-lg overflow-hidden">
                  <AccordionTrigger className="bg-accent/10 hover:bg-accent/20 px-6 py-4 text-xl font-semibold text-accent data-[state=open]:border-b data-[state=open]:border-border/50">
                    {league.name} {league.shortName && `(${league.shortName})`}
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 data-[state=closed]:pb-0 data-[state=open]:pb-0"> {/* Ensure no extra padding */}
                    <div className="flex justify-end space-x-2 p-2 bg-muted/10">
                      <PDFExportButton 
                        league={league} 
                        numRounds={currentNumRoundsState} 
                        competitionYear={selectedCompetition.year} 
                        type="teams"
                        className="mr-2"
                      />
                      {league.individualLeagueShooters.length > 0 && (
                        <PDFExportButton 
                          league={league} 
                          numRounds={currentNumRoundsState} 
                          competitionYear={selectedCompetition.year} 
                          type="shooters"
                        />
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
                            {league.teams.map(team => (
                              <React.Fragment key={team.id}>
                                <TableRow className="hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => toggleTeamExpansion(team.id)}>
                                  <TableCell className="text-center font-medium px-2 py-2">{team.rank}</TableCell>
                                  <TableCell className="font-medium text-foreground px-2 py-2">{team.name}</TableCell>
                                  {[...Array(currentNumRoundsState)].map((_, i) => (
                                    <TableCell key={`dg-val-${i + 1}-${team.id}`} className="text-center px-1 py-2">{(team.roundResults as any)?.[`dg${i + 1}`] ?? '-'}</TableCell>
                                  ))}
                                  <TableCell className="text-center font-semibold text-primary px-2 py-2">{team.totalScore ?? '-'}</TableCell>
                                  <TableCell className="text-center font-medium text-muted-foreground px-2 py-2">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>
                                  <TableCell className="text-right pr-4 px-2 py-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toggleTeamExpansion(team.id);}} aria-label={`Details für ${team.name} ${expandedTeamIds.includes(team.id) ? 'ausblenden' : 'anzeigen'}`} className="hover:bg-accent/20 rounded-md">
                                      {expandedTeamIds.includes(team.id) ? <ChevronDown className="h-5 w-5 transition-transform duration-200 rotate-180" /> : <ChevronRight className="h-5 w-5 transition-transform duration-200" />}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {expandedTeamIds.includes(team.id) && (
                                  <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableCell colSpan={5 + currentNumRoundsState + 1} className="p-0 border-t-0"> {/* Adjusted colSpan */}
                                      <TeamShootersTable shootersResults={team.shootersResults} numRounds={currentNumRoundsState} parentTeam={team} onShooterClick={handleShooterNameClick} />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {pageTitle} vorhanden.</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="einzelschützen">
          {!loadingData && !error && (
             <div className="mb-4">
                <Label htmlFor="individualLeagueFilter" className="text-sm font-medium">Nach Liga filtern:</Label>
                <Select 
                    value={selectedIndividualLeagueFilter || "ALL_LEAGUES_IND_FILTER"} 
                    onValueChange={(value) => setSelectedIndividualLeagueFilter(value === "ALL_LEAGUES_IND_FILTER" ? "" : value)}
                    disabled={loadingData || !teamData || availableLeaguesForIndividualFilter.length === 0}
                >
                  <SelectTrigger id="individualLeagueFilter" className="w-full sm:w-[350px] mt-1 shadow-sm">
                    <SelectValue placeholder="Alle Ligen der Disziplin anzeigen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_LEAGUES_IND_FILTER">Alle Ligen der Disziplin</SelectItem>
                    {availableLeaguesForIndividualFilter
                      .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "") 
                      .map(league => (<SelectItem key={league.id} value={league.id}>{league.name} ({leagueDisciplineOptions.find(opt => opt.value === league.type)?.label || league.type}, {league.competitionYear})</SelectItem>))
                    }
                    {availableLeaguesForIndividualFilter.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").length === 0 && selectedCompetition && (
                      <SelectItem value="NO_LEAGUES_FOR_IND_FILTER_RWK" disabled>Keine Ligen für Filter in dieser Saison/Disziplin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
          )}
          {!loadingData && !error && filteredIndividualData.length === 0 && (
            <Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Einzelschützen für {selectedCompetition?.displayName || pageTitle} {selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : ''}</CardTitle></CardHeader><CardContent className="text-center py-12 p-6"><AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-lg text-muted-foreground">Für die aktuelle Auswahl wurden keine Einzelschützenergebnisse gefunden.</p></CardContent></Card>
          )}
          {!loadingData && !error && filteredIndividualData.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {topMaleShooter && (<Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium text-primary">Bester Schütze</CardTitle><Trophy className="h-5 w-5 text-amber-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{topMaleShooter.shooterName}</p><p className="text-sm text-muted-foreground">{topMaleShooter.teamName}</p><p className="text-lg">Gesamt: <span className="font-semibold">{topMaleShooter.totalScore}</span> Ringe</p><p className="text-sm">Schnitt: {topMaleShooter.averageScore != null ? topMaleShooter.averageScore.toFixed(2) : '-'} ({topMaleShooter.roundsShot} DG)</p></CardContent></Card>)}
                {topFemaleShooter && (<Card className="shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium text-primary">Beste Dame</CardTitle><Medal className="h-5 w-5 text-pink-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{topFemaleShooter.shooterName}</p><p className="text-sm text-muted-foreground">{topFemaleShooter.teamName}</p><p className="text-lg">Gesamt: <span className="font-semibold">{topFemaleShooter.totalScore}</span> Ringe</p><p className="text-sm">Schnitt: {topFemaleShooter.averageScore != null ? topFemaleShooter.averageScore.toFixed(2) : '-'} ({topFemaleShooter.roundsShot} DG)</p></CardContent></Card>)}
                {(!topMaleShooter && !loadingData) && (<Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Kein Bester Schütze</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnte kein bester Schütze ermittelt werden.</p></CardContent></Card>)}
                {!topFemaleShooter && !loadingData && (<Card className="shadow-lg"><CardHeader><CardTitle className="text-accent">Keine Beste Dame</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Für die aktuelle Auswahl konnte keine beste Dame ermittelt werden.</p></CardContent></Card>)}
              </div>
              <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl text-accent">Einzelrangliste {selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : '(Alle Ligen der Disziplin)'}</CardTitle><CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {pageTitle}.</CardDescription></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                          <TableHead className="w-[40px] text-center">#</TableHead><TableHead>Name</TableHead><TableHead>Mannschaft</TableHead>
                          {[...Array(currentNumRoundsState)].map((_, i) => (<TableHead key={`ind-dg-header-${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>))}
                          <TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">Gesamt</TableHead><TableHead className="text-center font-semibold px-1 py-1.5 text-xs text-muted-foreground whitespace-nowrap">Schnitt</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredIndividualData.map(shooter => (
                          <TableRow key={`ind-${shooter.shooterId}`} className="hover:bg-secondary/20 transition-colors">
                            <TableCell className="text-center font-medium">{shooter.rank}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              <Button variant="link" className="p-0 h-auto text-base text-left hover:text-primary whitespace-normal text-wrap" onClick={() => handleShooterNameClick(shooter)}>
                                {shooter.shooterName}
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{shooter.teamName}</TableCell>
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

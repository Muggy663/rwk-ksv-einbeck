
"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
import { NativeSelect } from "@/components/ui/native-select";
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
  Info,
} from 'lucide-react';
import { PDFButton } from '@/components/ui/pdf-button';
import { NativePDFButton } from '@/components/ui/native-pdf-button';
import { PDFHelpDialog } from '@/components/ui/pdf-help-dialog';
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
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';
import { SubstitutionBadge } from '@/components/ui/substitution-badge';
import { BackButton } from '@/components/ui/back-button';
import { RWKLegend } from '@/components/ui/rwk-legend';
import { SmartTable } from '@/components/ui/smart-table';
import { MobileTeamCards } from '@/components/ui/mobile-team-cards';
import { MobileShooterCards } from '@/components/ui/mobile-shooter-cards';
import { deduplicateScores, groupScoresByShooter } from '@/lib/utils/score-deduplication';
import { SubstitutionService } from '@/lib/services/substitution-service';
import { TeamCalculationService } from '@/lib/services/team-calculation-service';


const EXCLUDED_TEAM_NAME_PART = 'einzel'; // Case-insensitive check later

/**
 * Bestimmt den liga-weit vollständigen Durchgang
 * (Alle Teams in der Liga haben diesen Durchgang vollständig)
 */
const determineLeagueCompleteRound = (teams: TeamDisplay[], numRounds: number): number => {
  if (!teams || teams.length === 0) return 0;
  
  // Finde den niedrigsten vollständigen Durchgang über alle Teams
  let leagueCompleteRound = numRounds;
  
  for (const team of teams) {
    // Überspringe Teams "außer Konkurrenz"
    if (team.outOfCompetition) continue;
    
    // Finde letzten lückenlosen Durchgang für dieses Team
    let teamCompleteRound = 0;
    for (let r = 1; r <= numRounds; r++) {
      if (team.roundResults?.[`dg${r}`] !== null) {
        teamCompleteRound = r;
      } else {
        break; // Lücke gefunden
      }
    }
    
    // Nimm das Minimum (schwächstes Glied)
    leagueCompleteRound = Math.min(leagueCompleteRound, teamCompleteRound);
  }
  
  return leagueCompleteRound;
};

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
  const { isNativeApp, isPWA, isMobile } = useNativeApp();
  const needsSpecialTouch = isNativeApp || isPWA || isMobile;
  
  if (!shootersResults || shootersResults.length === 0) {
    return (
      <div className="p-3 text-sm text-center text-muted-foreground bg-muted/30 rounded-b-md">
        Keine Schützen für dieses Team erfasst oder Ergebnisse vorhanden.
      </div>
    );
  }
  return (
    <div className="p-2 bg-muted/20 rounded-b-md shadow-inner overflow-x-auto" style={{ 
      touchAction: "manipulation",
      WebkitOverflowScrolling: "touch",
      transform: "translateZ(0)",
      WebkitTransform: "translateZ(0)",
      overflowX: "scroll",
      overflowY: "hidden",
      willChange: "scroll-position"
    }}>
      <Table className="min-w-full responsive-card-table" style={{ 
        touchAction: "auto",
        transform: "translateZ(0)"
      }}>
        <TableHeader>
          <TableRow className="text-xs border-b-0">
            <TableHead className="pl-3 pr-1 py-1.5 text-muted-foreground font-normal whitespace-nowrap">Schütze</TableHead>
            {[...Array(numRounds)].map((_, i) => (
              <TableHead key={`shooter-dg${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>
            ))}
            <TableHead className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
            {!isNativeApp && <TableHead className="pl-1 pr-3 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Schnitt</TableHead>}
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
                <TableCell className="font-medium pl-3 pr-1 py-1.5 whitespace-nowrap" data-label="Schütze">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="link"
                        className={cn(
                          "p-0 text-left hover:text-primary whitespace-normal text-wrap justify-start font-normal",
                          isNativeApp ? "text-[10px] leading-tight h-4 min-h-4" : "text-xs h-auto"
                        )}
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
                    <div className="flex justify-start">
                      <SubstitutionBadge
                        isSubstitute={teamSubstitutions.has(`${parentTeam.id}-${shooterRes.shooterId}`)}
                        substitutionInfo={teamSubstitutions.get(`${parentTeam.id}-${shooterRes.shooterId}`)}
                      />
                    </div>
                  </div>
                </TableCell>
                {[...Array(numRounds)].map((_, i) => (
                  <TableCell key={`shooter-dg${i + 1}-${shooterRes.shooterId}`} className="px-1 py-1.5 text-center" data-label={`DG ${i + 1}`}>
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
                <TableCell className="px-1 py-1.5 text-center font-medium" data-label="Gesamt">{shooterRes.total ?? '-'}</TableCell>
                {!isNativeApp && <TableCell className="pl-1 pr-3 py-1.5 text-center font-medium" data-label="Schnitt">
                  {(() => {
                    // Prüfe ob Schütze ersetzt wurde (hat Substitution-Info)
                    const substitutionInfo = teamSubstitutions.get(`${parentTeam.id}-${shooterRes.shooterId}`);
                    const isReplacedShooter = substitutionInfo && substitutionInfo.type === 'replaced_shooter';
                    
                    // Für ersetzte Schützen: Zeige Gesamt statt Durchschnitt
                    if (isReplacedShooter) {
                      return <span className="text-orange-600 font-medium" title="Ersetzt - Gesamtwertung">{shooterRes.total ?? '-'}</span>;
                    }
                    
                    // Normale Durchschnittswertung
                    return shooterRes.average != null ? shooterRes.average.toFixed(2) : '-';
                  })()
                }
                </TableCell>}
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
  const { isNativeApp, isPWA, isMobile } = useNativeApp();
  const needsSpecialTouch = isNativeApp || isPWA || isMobile;
  
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
  const [availableCompetitions, setAvailableCompetitions] = useState<CompetitionDisplayConfig[]>([]);
  const [isLoadingInitialCompetitions, setIsLoadingInitialCompetitions] = useState(true);
  
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
  const [isPortrait, setIsPortrait] = useState(false);
  
  // Detect orientation changes
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

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

  const fetchAvailableCompetitions = useCallback(async (): Promise<CompetitionDisplayConfig[]> => {
    try {
      // Add request deduplication
      const requestKey = 'fetchAvailableCompetitions';
      if ((window as any)[requestKey]) {
        return (window as any)[requestKey];
      }
      
      const seasonsColRef = collection(db, 'seasons');
      const q = query(seasonsColRef,
        where("status", "in", ["Laufend", "Abgeschlossen"]),
        orderBy('competitionYear', 'desc')
      );

      const requestPromise = getDocs(q).then(seasonsSnapshot => {
        const laufendCompetitions: CompetitionDisplayConfig[] = [];
        const abgeschlossenCompetitions: CompetitionDisplayConfig[] = [];
      
      seasonsSnapshot.forEach(docData => {
        const seasonData = docData.data() as Season;
        if (seasonData.competitionYear && seasonData.type) {
          const uiDiscipline = getUIDisciplineValueFromSpecificType(seasonData.type as FirestoreLeagueSpecificDiscipline);
          const disciplineLabel = uiDisciplineFilterOptions.find(d => d.value === uiDiscipline)?.label || uiDiscipline;
          
          const competition = {
            year: seasonData.competitionYear,
            discipline: uiDiscipline,
            displayName: `${seasonData.competitionYear} ${disciplineLabel}`
          };
          
          if (seasonData.status === "Laufend") {
            laufendCompetitions.push(competition);
          } else {
            abgeschlossenCompetitions.push(competition);
          }
        }
      });
      
      // Prioritize "Laufend" competitions, then "Abgeschlossen"
      const allCompetitions = [...laufendCompetitions, ...abgeschlossenCompetitions];
      
        // Remove duplicates
        const uniqueCompetitions = allCompetitions.filter((comp, index, self) => 
          index === self.findIndex(c => c.year === comp.year && c.discipline === comp.discipline)
        );
        
        const result = uniqueCompetitions.length > 0 ? uniqueCompetitions : [
          { year: new Date().getFullYear(), discipline: 'KK', displayName: `${new Date().getFullYear()} Kleinkaliber` }
        ];
        
        delete (window as any)[requestKey];
        return result;
      });
      
      (window as any)[requestKey] = requestPromise;
      return await requestPromise;
    } catch (err: any) {
      delete (window as any)[requestKey];
      logError('RWK DEBUG: Error fetching available competitions:', err);
      toast({ title: "Fehler", description: `Verfügbare Wettkämpfe konnten nicht geladen werden: ${err.message}`, variant: "destructive" });
      return [{ year: new Date().getFullYear(), discipline: 'KK', displayName: `${new Date().getFullYear()} Kleinkaliber` }];
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
      logError('RWK DEBUG: Error in calculateNumRounds:', err);
      toast({ title: "Fehler Rundenanzahl", description: `Anzahl der Durchgänge konnte nicht ermittelt werden: ${err.message}`, variant: "destructive" });
    }

    return 5;
  }, [toast]);

  const fetchCompetitionTeamData = useCallback(async (config: CompetitionDisplayConfig, numRoundsForCompetition: number): Promise<AggregatedCompetitionData | null> => {
    if (!config || !config.year || !config.discipline) return null;

    try {
      const seasonsColRef = collection(db, "seasons");
      const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
      const firestoreTypesToQuery = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [config.discipline];
      
      const qSeasons = query(seasonsColRef, 
        where("competitionYear", "==", config.year), 
        where("type", "in", firestoreTypesToQuery), 
        where("status", "in", ["Laufend", "Abgeschlossen"])
      );
      const seasonsSnapshot = await getDocs(qSeasons);

      if (seasonsSnapshot.empty) {
        logWarn(`RWK DEBUG: No seasons found for year ${config.year} and discipline ${config.discipline} with types ${firestoreTypesToQuery.join(', ')}.`);
        return { id: `${config.year}-${config.discipline}`, config, leagues: [] };
      }
      const seasonIds = seasonsSnapshot.docs.map(sDoc => sDoc.id).filter(id => !!id);
      if (seasonIds.length === 0) return { id: `${config.year}-${config.discipline}`, config, leagues: [] };

      const leaguesColRef = collection(db, "rwk_leagues");
      const qLeagues = query(leaguesColRef, 
        where("seasonId", "in", seasonIds), 
        where("type", "in", firestoreTypesToQuery), 
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

      // Batch-load ALLE Scores auf einmal - verwende saison-spezifische Collection falls vorhanden
      let allScoresSnapshot;
      try {
        // Verwende neue Collection-Naming-Logik
        const seasonSpecificCollection = getSeasonSpecificScoresCollection(config.year, firestoreTypesToQuery[0]);
        
        logDebug(`🔍 Versuche saison-spezifische Collection: ${seasonSpecificCollection}`);
        
        const seasonSpecificQuery = query(
          collection(db, seasonSpecificCollection),
          where("competitionYear", "==", config.year),
          where("leagueType", "in", firestoreTypesToQuery)
        );
        allScoresSnapshot = await getDocs(seasonSpecificQuery);
        
        logDebug(`✅ Saison-spezifische Collection gefunden: ${allScoresSnapshot.docs.length} Scores`);
      } catch (error) {
        logDebug(`⚠️ Saison-spezifische Collection nicht gefunden, verwende rwk_scores`);
        
        // Fallback auf ursprüngliche Collection
        const allScoresQuery = query(
          collection(db, "rwk_scores"),
          where("competitionYear", "==", config.year),
          where("leagueType", "in", firestoreTypesToQuery)
        );
        allScoresSnapshot = await getDocs(allScoresQuery);
      }
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
        } catch (e) { logError("RWK DEBUG: Error batch-fetching clubs", e); }
      }

      // Lade Substitutions einmal für alle Teams (zentral)
      const substitutions = await SubstitutionService.loadSubstitutions(config.year);

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
          
          // Berechne Team-Grunddaten mit zentralem Service
          const teamScores = scoresByTeam.get(teamData.id) || [];
          
          const calculationResult = TeamCalculationService.calculateTeamResults(
            teamData.id,
            teamScores,
            numRoundsForCompetition,
            substitutions,
            teamData.name
          );
          
          const roundResults = calculationResult.roundResults;
          const teamTotal = calculationResult.totalScore;
          const numScoredRds = calculationResult.numScoredRounds;

          const teamDisplayItem: TeamDisplay = { 
            ...teamData, 
            clubName, 
            shootersResults: [], // Wird lazy geladen
            roundResults, 
            totalScore: teamTotal, 
            averageScore: numScoredRds > 0 ? parseFloat((teamTotal / numScoredRds).toFixed(2)) : null, 
            numScoredRounds: numScoredRds,
            leagueType: leagueDisplay.type,
            sortingScore: calculationResult.sortingScore,
            sortingAverage: calculationResult.sortingAverage
          };
          teamDisplays.push(teamDisplayItem);
        }
        // Sortiere Teams (sortingScore bereits durch TeamCalculationService berechnet)
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
        // Filtere und sortiere Schützen - zeige alle Schützen, auch ohne Ergebnisse
        leagueDisplay.individualLeagueShooters = Array.from(leagueShootersMap.values())
            // Entferne Filter für roundsShot > 0, um alle Schützen zu zeigen
            .sort((a, b) => {
              // Schützen "außer Konkurrenz" immer nach Schützen in Wertung
              if (a.teamOutOfCompetition && !b.teamOutOfCompetition) return 1;
              if (!a.teamOutOfCompetition && b.teamOutOfCompetition) return -1;
              
              // Sortierung nach Durchschnitt
              const avgDiff = (b.averageScore ?? 0) - (a.averageScore ?? 0);
              if (avgDiff !== 0) return avgDiff;
              
              // Bei Gleichstand: Nach Gesamtpunkten
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
      // Lade Substitutions-Daten (zentral für alle Teams)
      const substitutionsMap = await SubstitutionService.loadSubstitutions(config.year);
      setTeamSubstitutions(substitutionsMap);
      

      return { id: `${config.year}-${config.discipline}`, config, leagues: fetchedLeaguesData };
    } catch (err: any) {
      logError('RWK DEBUG: Error fetching team data:', err);
      toast({ title: "Fehler Mannschaftsdaten", description: `Fehler beim Laden der Mannschaftsdaten: ${err.message}`, variant: "destructive" });
      setError((err as Error).message || 'Unbekannter Fehler beim Laden der Mannschaftsdaten.');
      return null;
    }
  }, [toast]); // Removed uiDisciplineFilterOptions, MAX_SHOOTERS_PER_TEAM if they are stable constants

  const fetchIndividualShooterData = useCallback(async (config: CompetitionDisplayConfig, numRoundsForCompetition: number, filterByLeagueId?: string | null): Promise<IndividualShooterDisplayData[]> => {
    if (!config || !config.year || !config.discipline) return [];

    
    try {
      // Lade zuerst alle Teams der Liga, um alle Schützen zu bekommen
      let teamsQuery;
      if (filterByLeagueId === "KK_GEWEHR_EHRUNGEN") {
        // Lade alle Teams für KK Gewehr Auflage Ligen
        const seasonsQuery = query(
          collection(db, "seasons"),
          where("competitionYear", "==", config.year),
          where("type", "in", ["KK", "KKG"])
        );
        const seasonsSnapshot = await getDocs(seasonsQuery);
        const seasonIds = seasonsSnapshot.docs.map(doc => doc.id);
        
        if (seasonIds.length > 0) {
          const leaguesQuery = query(
            collection(db, "rwk_leagues"),
            where("seasonId", "in", seasonIds)
          );
          const leaguesSnapshot = await getDocs(leaguesQuery);
          const leagueIds = leaguesSnapshot.docs.map(doc => doc.id);
          
          if (leagueIds.length > 0) {
            teamsQuery = query(
              collection(db, "rwk_teams"),
              where("leagueId", "in", leagueIds),
              where("competitionYear", "==", config.year)
            );
          }
        }
      } else if (filterByLeagueId === "LGA_GESAMTLISTE") {
        // Direkte Liga-IDs für Luftdruck-Ligen verwenden
        const luftdruckLeagueIds = ["vOHbDJw7mktQI53Mzs5d", "wxotHc2CVAa4kflVhaPd", "YLpb9AklRcU7mpF870vP", "sTcYhFYKOmJ6AJ5w3IyN"];
        // Secure logging: Liga-IDs count only
        if (process.env.NODE_ENV === 'development') {
          logDebug('Debug LGA_GESAMTLISTE - Liga-IDs count:', luftdruckLeagueIds?.length || 0);
        }
        
        teamsQuery = query(
          collection(db, "rwk_teams"),
          where("leagueId", "in", luftdruckLeagueIds),
          where("competitionYear", "==", config.year)
        );
      } else {
        teamsQuery = query(
          collection(db, "rwk_teams"),
          where("leagueId", "==", filterByLeagueId),
          where("competitionYear", "==", config.year)
        );
      }
      
      if (!teamsQuery) {
        if (process.env.NODE_ENV === 'development') {
          logWarn('RWK DEBUG: Keine Teams-Query für Liga-Filter');
        }
        return [];
      }
      
      const teamsSnapshot = await getDocs(teamsQuery);
      const allShooterIdsFromTeams = new Set<string>();
      const teamInfoMap = new Map<string, any>();
      
      teamsSnapshot.docs.forEach(teamDoc => {
        const teamData = teamDoc.data();
        teamInfoMap.set(teamDoc.id, teamData);
        if (teamData.shooterIds && Array.isArray(teamData.shooterIds)) {
          teamData.shooterIds.forEach(shooterId => {
            if (shooterId && typeof shooterId === 'string') {
              allShooterIdsFromTeams.add(shooterId);
            }
          });
        }
      });
      
      // Jetzt lade Scores für diese Schützen - verwende saison-spezifische Collection falls vorhanden
      let scoresQueryConstraints: any[] = [where("competitionYear", "==", config.year)];
      
      // WICHTIG: Liga-Filter ist jetzt immer erforderlich - keine übergreifende Abfrage mehr
      if (!filterByLeagueId || filterByLeagueId === "ALL_LEAGUES_IND_FILTER") {
        if (process.env.NODE_ENV === 'development') {
          logWarn('RWK DEBUG: Keine Liga-ID für Einzelschützen-Filter');
        }
        return [];
      }
      
      // Spezialfall: KK Gewehr Ehrungen - alle KK Gewehr Auflage Ligen
      if (filterByLeagueId === "KK_GEWEHR_EHRUNGEN") {
        scoresQueryConstraints = [
          where("competitionYear", "==", config.year),
          where("leagueType", "in", ["KK", "KKG"]) // KK Gewehr Auflage
        ];
      } else if (filterByLeagueId === "LGA_GESAMTLISTE") {
        // Verwende die spezifischen Liga-IDs für Scores
        const luftdruckLeagueIds = ["vOHbDJw7mktQI53Mzs5d", "wxotHc2CVAa4kflVhaPd", "YLpb9AklRcU7mpF870vP", "sTcYhFYKOmJ6AJ5w3IyN"];
        scoresQueryConstraints = [
          where("competitionYear", "==", config.year),
          where("leagueId", "in", luftdruckLeagueIds)
        ];
      } else {
        // Filtere nach spezifischer Liga-ID
        scoresQueryConstraints = [
          where("competitionYear", "==", config.year),
          where("leagueId", "==", filterByLeagueId)
        ];
      }
      
      // Versuche saison-spezifische Collection zu verwenden
      let scoresQuery;
      try {
        // Verwende neue Collection-Naming-Logik
        const seasonSpecificCollection = getSeasonSpecificScoresCollection(config.year, config.discipline as FirestoreLeagueSpecificDiscipline);
        
        if (process.env.NODE_ENV === 'development') {
          logDebug('Individual: Versuche saison-spezifische Collection');
        }
        
        scoresQuery = query(collection(db, seasonSpecificCollection), ...scoresQueryConstraints);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logDebug('Individual: Saison-spezifische Collection nicht gefunden, verwende rwk_scores');
        }
        scoresQuery = query(collection(db, "rwk_scores"), ...scoresQueryConstraints);
      }
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const allScores: ScoreEntry[] = [];
      scoresSnapshot.docs.forEach(d => { allScores.push({ id: d.id, ...d.data() as ScoreEntry }); });
      
      // Lade Substitutions-Daten für diese Liga
      let substitutionsMap = new Map();
      try {
        const substitutionsQuery = query(
          collection(db, 'team_substitutions'),
          where('competitionYear', '==', config.year)
        );
        const substitutionsSnapshot = await getDocs(substitutionsQuery);
        logInfo('Substitutions gefunden:', { data: substitutionsSnapshot.docs.length });
        substitutionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const key = `${data.teamId}-${data.originalShooterId}`;
          substitutionsMap.set(key, {
            originalShooterName: data.originalShooterName,
            replacementShooterName: data.replacementShooterName,
            fromRound: data.fromRound,
            reason: data.reason,
            type: data.type
          });
        });
      } catch (error) {
        // Substitutions sind optional
      }
      

      
      // Debug: Zeige Statistiken zur Diagnose
      if (process.env.NODE_ENV === 'development') {
        const leagueTypes = [...new Set(allScores.map(s => s.leagueType))];
        logDebug('Debug - LeagueTypes count:', leagueTypes?.length || 0);
        logDebug('Debug - Scores count:', allScores?.length || 0);
        logDebug('Debug - Filter type:', typeof filterByLeagueId);
      }
      
      // Wenn keine Scores gefunden, prüfe alle Scores für dieses Jahr
      if (allScores.length === 0) {
        try {
          // Versuche zuerst saison-spezifische Collection
          const seasonSpecificCollection = getSeasonSpecificScoresCollection(config.year, config.discipline as FirestoreLeagueSpecificDiscipline);
          const seasonSpecificQuery = query(
            collection(db, seasonSpecificCollection),
            where("competitionYear", "==", config.year)
          );
          const seasonSpecificSnapshot = await getDocs(seasonSpecificQuery);
          const seasonSpecificLeagueTypes = [...new Set(seasonSpecificSnapshot.docs.map(doc => doc.data().leagueType))];
          if (process.env.NODE_ENV === 'development') {
            logDebug('Debug - Saison-spezifische leagueTypes count:', seasonSpecificLeagueTypes?.length || 0);
          }
        } catch (error) {
          // Fallback auf rwk_scores
          const allScoresQuery = query(
            collection(db, "rwk_scores"),
            where("competitionYear", "==", config.year)
          );
          const allScoresSnapshot = await getDocs(allScoresQuery);
          const allYearLeagueTypes = [...new Set(allScoresSnapshot.docs.map(doc => doc.data().leagueType))];
          if (process.env.NODE_ENV === 'development') {
            logDebug('Debug - Alle leagueTypes count:', allYearLeagueTypes?.length || 0);
          }
        }
      }

      const shootersMap = new Map<string, IndividualShooterDisplayData>();
      // Kombiniere Schützen aus Teams und Scores
      const allShooterIds = [...new Set([
        ...Array.from(allShooterIdsFromTeams),
        ...allScores.map(s => s.shooterId).filter(Boolean)
      ])];
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
              // Speichere sowohl Namen als auch Geschlecht
              shooterNamesMap.set(doc.id, {
                name: displayName,
                gender: shooterData.gender || 'unknown'
              });
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            logWarn('RWK DEBUG: Fehler beim Laden der Schützen-Namen:', error?.message || 'Unknown error');
          }
        }
      }
      
      // Erstelle Einträge für alle Schützen aus Teams (auch ohne Ergebnisse)
      for (const shooterId of allShooterIdsFromTeams) {
        if (!shootersMap.has(shooterId)) {
          const initialResults: { [key: string]: number | null } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) initialResults[`dg${r}`] = null;
          
          // Finde Team-Info für diesen Schützen
          let teamName = "Unbek. Team";
          let teamOutOfCompetition = false;
          let teamOutOfCompetitionReason = undefined;
          let leagueId = filterByLeagueId;
          let leagueType = undefined;
          
          for (const [teamId, teamData] of teamInfoMap) {
            if (teamData.shooterIds && teamData.shooterIds.includes(shooterId)) {
              teamName = teamData.name || "Unbek. Team";
              teamOutOfCompetition = teamData.outOfCompetition || false;
              teamOutOfCompetitionReason = teamData.outOfCompetitionReason;
              leagueId = teamData.leagueId;
              leagueType = teamData.leagueType;
              break;
            }
          }
          
          const shooterInfo = shooterNamesMap.get(shooterId);
          const shooterName = shooterInfo?.name || `Schütze ${shooterId.substring(0,8)}`;
          
          const shooterData = {
            shooterId, shooterName,
            shooterGender: shooterInfo?.gender || 'unknown', teamName,
            results: initialResults, totalScore: 0, averageScore: null, roundsShot: 0,
            competitionYear: config.year, leagueId, leagueType,
            teamOutOfCompetition, teamOutOfCompetitionReason,
          };
          shootersMap.set(shooterId, shooterData);
        }
      }
      
      // Jetzt füge Ergebnisse hinzu
      for (const score of allScores) {
        if (!score.shooterId) continue;
        let currentShooterData = shootersMap.get(score.shooterId);
        if (!currentShooterData) {
          // Schütze nicht in Teams gefunden, erstelle trotzdem Eintrag
          const initialResults: { [key: string]: number | null } = {};
          for (let r = 1; r <= numRoundsForCompetition; r++) initialResults[`dg${r}`] = null;
          
          const shooterInfo = shooterNamesMap.get(score.shooterId);
          const shooterName = shooterInfo?.name || score.shooterName || "Unbek. Schütze";
          
          currentShooterData = {
            shooterId: score.shooterId, shooterName,
            shooterGender: shooterInfo?.gender || score.shooterGender || 'unknown', teamName: score.teamName || "Unbek. Team", 
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
          // Prüfe Substitution: Nur Ergebnisse ab fromRound für Einzelwertung
          const isSubstitutionScore = score.isSubstitutionCopy === true;
          const shouldCountForIndividual = !isSubstitutionScore; // Kopierte Ergebnisse nicht für Einzelwertung
          
          currentShooterData.results[`dg${score.durchgang}`] = score.totalRinge;
          
          // Markiere welche Ergebnisse für Einzelwertung zählen
          if (!currentShooterData.individualResults) currentShooterData.individualResults = {};
          currentShooterData.individualResults[`dg${score.durchgang}`] = shouldCountForIndividual ? score.totalRinge : null;
        }
      }
      shootersMap.forEach((shooterData, shooterId) => {
        let currentTotal = 0; let roundsShotCount = 0;
        
        // Verwende individualResults falls vorhanden, sonst normale results
        const resultsToUse = shooterData.individualResults || shooterData.results;
        Object.values(resultsToUse).forEach(res => { 
          if (res !== null && typeof res === 'number') { 
            currentTotal += res; 
            roundsShotCount++; 
          } 
        });
        
        shooterData.totalScore = currentTotal; 
        shooterData.roundsShot = roundsShotCount;
        if (shooterData.roundsShot > 0 && shooterData.totalScore !== null) {
          shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
        }
        
        // Prüfe Substitution für diesen Schützen
        for (const [teamId, teamData] of teamInfoMap) {
          if (teamData.shooterIds && teamData.shooterIds.includes(shooterId)) {
            // Prüfe ob dieser Schütze der ursprüngliche (ersetzte) Schütze ist
            const originalSubstitutionKey = `${teamId}-${shooterId}`;
            const originalSubstitution = substitutionsMap.get(originalSubstitutionKey);
            if (originalSubstitution) {
              shooterData.isReplacedShooter = true;
            }
            break;
          }
        }
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
        // Zeige alle Schützen, auch ohne Ergebnisse
        // .filter(s => s.roundsShot > 0) // Entfernt, um alle Schützen zu zeigen 
        // Filtere ersetzte Schützen aus
        .filter(shooter => {
          // Prüfe alle Substitution-Keys
          for (const [key, substitution] of substitutionsMap) {
            const [teamId, originalShooterId] = key.split('-');
            if (originalShooterId === shooter.shooterId) {
              return false; // Ersetzte Schützen ausblenden
            }
          }
          return true;
        })
        .sort((a, b) => {
          // Ersetzte Schützen immer nach normalen Schützen
          if (a.isReplacedShooter && !b.isReplacedShooter) return 1;
          if (!a.isReplacedShooter && b.isReplacedShooter) return -1;
          
          // Beide ersetzt: nach Gesamtpunkten
          if (a.isReplacedShooter && b.isReplacedShooter) {
            return (b.totalScore ?? 0) - (a.totalScore ?? 0);
          }
          
          // Beide normal: nach Durchschnitt
          const avgDiff = (b.averageScore ?? 0) - (a.averageScore ?? 0);
          if (avgDiff !== 0) return avgDiff;
          
          // Bei Gleichstand: Nach Gesamtpunkten
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
      logError("RWK DEBUG: Error fetching individual shooter data:", err);
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
    
    // Prevent multiple simultaneous loads
    if (loadingData) {
      return;
    }
    
    // Cache nur für Team-Daten, nicht für Einzelschützen
    const cacheKey = `rwk-teams-${selectedCompetition.year}-${selectedCompetition.discipline}`;
    
    // Cache für Einzelschützen deaktivieren um Probleme zu vermeiden
    if (activeTab === 'einzelschützen') {
      sessionStorage.removeItem(cacheKey);
    }
    
    setLoadingData(true); 
    setError(null); 
    
    // Only clear data if competition changed
    const competitionKey = `${selectedCompetition.year}-${selectedCompetition.discipline}`;
    const currentKey = teamData?.config ? `${teamData.config.year}-${teamData.config.discipline}` : null;
    
    if (competitionKey !== currentKey) {
      setTeamData(null); 
      setAllIndividualDataForDiscipline([]); 
      setFilteredIndividualData([]);
      setTopMaleShooter(null);
      setTopFemaleShooter(null);
    }
    
    try {
      const numRounds = await calculateNumRounds(selectedCompetition.year, selectedCompetition.discipline);
      setCurrentNumRoundsState(numRounds);

      // Only fetch team data if not already loaded or competition changed
      let fetchedTeamData = teamData;
      if (!fetchedTeamData || competitionKey !== currentKey) {
        fetchedTeamData = await fetchCompetitionTeamData(selectedCompetition, numRounds);
        setTeamData(fetchedTeamData);
      }
      
      // Lazy load individual data only when needed (on tab switch) and only with league filter
      if (activeTab === 'einzelschützen' && selectedIndividualLeagueFilter) {
        // Lade nur Schützen für die ausgewählte Liga
        const individualsInLeague = await fetchIndividualShooterData(selectedCompetition, numRounds, selectedIndividualLeagueFilter);
        setFilteredIndividualData(individualsInLeague);
        setAllIndividualDataForDiscipline(individualsInLeague);

        if (individualsInLeague.length > 0) {
          // Filtere AK-Schützen (Außer Konkurrenz) aus der Bestenliste heraus
          const shootersInCompetition = individualsInLeague.filter(s => !s.teamOutOfCompetition);
          
          const males = shootersInCompetition.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'male' || s.shooterGender.toLowerCase() === 'm'));
          setTopMaleShooter(males.length > 0 ? males[0] : null);
          
          const females = shootersInCompetition.filter(s => s.shooterGender && (s.shooterGender.toLowerCase() === 'female' || s.shooterGender.toLowerCase() === 'w'));
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
      if (activeTab === 'mannschaften' && fetchedTeamData) {
        const cacheData = {
          timestamp: Date.now(),
          teamData: fetchedTeamData
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }

    } catch (err: any) {
      logError('RWK DEBUG: Failed to load RWK data in loadData:', err);
      toast({ title: "Fehler Datenladen", description: `Fehler beim Laden der Wettkampfdaten: ${err.message}`, variant: "destructive" });
      setError((err as Error).message || 'Unbekannter Fehler beim Laden der Daten.');
    } finally {
      setLoadingData(false);
    }
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, loadingData, teamData, calculateNumRounds, fetchCompetitionTeamData, fetchIndividualShooterData, toast]);

  // Effect for initial load and when URL parameters change
  useEffect(() => {
    setIsLoadingInitialCompetitions(true);
    let isMounted = true;
  
    fetchAvailableCompetitions().then(competitions => {
      if (!isMounted) return;
      setAvailableCompetitions(competitions);
      setIsLoadingInitialCompetitions(false);
  
      // Find matching competition from URL params or use first "Laufend" competition
      let competitionToSet = competitions[0]; // Default fallback
      
      if (initialYearFromParams && initialDisciplineFromParams) {
        const yearFromParam = parseInt(initialYearFromParams);
        const matchingCompetition = competitions.find(comp => 
          comp.year === yearFromParam && comp.discipline === initialDisciplineFromParams
        );
        if (matchingCompetition) {
          competitionToSet = matchingCompetition;
        }
      } else {
        // Default to first "Laufend" competition if no URL params
        competitionToSet = competitions[0];
      }

      // Only update if different to prevent loops
      if (!selectedCompetition || 
          selectedCompetition.year !== competitionToSet.year || 
          selectedCompetition.discipline !== competitionToSet.discipline) {
        setSelectedCompetition(competitionToSet);
      }

      if (initialLeagueIdFromParams) {
        setOpenAccordionItems([initialLeagueIdFromParams]);
        setSelectedIndividualLeagueFilter(initialLeagueIdFromParams);
        setLastClickedLeagueId(initialLeagueIdFromParams);
      }
    }).catch(err => {
        if (!isMounted) return;
        logError("RWK DEBUG: Error in initial useEffect (fetchAvailableCompetitions):", err);
        setIsLoadingInitialCompetitions(false);
        setError("Fehler beim Initialisieren der Wettkampfauswahl.");
    });
    return () => { isMounted = false; };
  }, [fetchAvailableCompetitions, initialYearFromParams, initialDisciplineFromParams, initialLeagueIdFromParams]);


  // Effect to load data when selectedCompetition, activeTab, or league filter changes
  useEffect(() => {
    if (selectedCompetition && !isLoadingInitialCompetitions && !loadingData) { 
      // Debounce the loadData call to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        loadData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, isLoadingInitialCompetitions]);
  
  // Load substitutions when teamData is available
  useEffect(() => {
    if (teamData && selectedCompetition && teamSubstitutions.size === 0) {
      const loadSubstitutions = async () => {
        try {
          const substitutionsQuery = query(
            collection(db, 'team_substitutions'),
            where('competitionYear', '==', selectedCompetition.year)
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
          logError('Error loading substitutions:', error);
        }
      };
      loadSubstitutions();
    }
  }, [teamData, selectedCompetition, teamSubstitutions.size]);
  
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


  const handleCompetitionChange = useCallback((competitionKey: string) => {
    const competition = availableCompetitions.find(comp => 
      `${comp.year}-${comp.discipline}` === competitionKey
    );
    
    if (!competition || loadingData) return;

    // Update state immediately
    setSelectedCompetition(competition);
    setOpenAccordionItems([]);
    setSelectedIndividualLeagueFilter("");
    
    // Update URL
    router.replace(`/rwk-tabellen?year=${competition.year}&discipline=${competition.discipline}`, { scroll: false });
  }, [availableCompetitions, router, loadingData]);


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

      // Lade Scores für dieses Team - verwende saison-spezifische Collection falls vorhanden
      let teamScoresSnapshot;
      try {
        // Verwende neue Collection-Naming-Logik
        const seasonSpecificCollection = getSeasonSpecificScoresCollection(teamData.competitionYear, teamData.leagueType as FirestoreLeagueSpecificDiscipline);
        
        logDebug(`🔍 Team: Versuche saison-spezifische Collection: ${seasonSpecificCollection}`);
        
        const seasonSpecificQuery = query(
          collection(db, seasonSpecificCollection), 
          where("teamId", "==", teamId), 
          where("competitionYear", "==", teamData.competitionYear),
          where("shooterId", "in", validShooterIds)
        );
        teamScoresSnapshot = await getDocs(seasonSpecificQuery);
        
        logDebug(`✅ Team: Saison-spezifische Collection gefunden: ${teamScoresSnapshot.docs.length} Scores`);
      } catch (error) {
        logDebug(`⚠️ Team: Saison-spezifische Collection nicht gefunden, verwende rwk_scores`);
        
        const scoresQuery = query(
          collection(db, "rwk_scores"), 
          where("teamId", "==", teamId), 
          where("competitionYear", "==", teamData.competitionYear),
          where("shooterId", "in", validShooterIds)
        );
        teamScoresSnapshot = await getDocs(scoresQuery);
      }
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
            logWarn(`❌ Schütze ${shooterId} nicht in shooters gefunden - suche in Scores...`);
            
            // TEST-MODUS: Suche Namen in bestehenden Scores
            try {
              // Versuche zuerst saison-spezifische Collection
              let scoresSnapshot;
              try {
                const seasonSpecificCollection = getSeasonSpecificScoresCollection(teamData.competitionYear, teamData.leagueType as FirestoreLeagueSpecificDiscipline);
                const seasonSpecificQuery = query(
                  collection(db, seasonSpecificCollection),
                  where("shooterId", "==", shooterId),
                  limit(1)
                );
                scoresSnapshot = await getDocs(seasonSpecificQuery);
              } catch (error) {
                // Fallback auf rwk_scores
                const scoresQuery = query(
                  collection(db, "rwk_scores"),
                  where("shooterId", "==", shooterId),
                  limit(1)
                );
                scoresSnapshot = await getDocs(scoresQuery);
              }
              
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
                  logError(`Fehler beim Erstellen von Schütze ${shooterId}:`, createError);
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
              logError(`Fehler beim Suchen in Scores für ${shooterId}:`, scoreError);
            }
          }
        } catch (error) {
          logError(`Fehler beim Laden von Schütze ${shooterId}:`, error);
        }
      }

      // Erstelle Schützen-Ergebnisse
      const shootersResults: ShooterDisplayResults[] = [];
      for (const shooterId of validShooterIds) {
        const shooterInfo = shooterInfos.get(shooterId);
        // Verwende den bereits zusammengesetzten Namen oder Fallback
        let shooterDisplayName = shooterInfo?.displayName || shooterInfo?.name || (scoresByShooter.get(shooterId)?.[0]?.shooterName) || `Schütze ${shooterId.substring(0,5)}`;
        
        // Prüfe Substitution-Info
        const substitutionKey = `${teamId}-${shooterId}`;
        const substitutionInfo = teamSubstitutions.get(substitutionKey);

        
        const sResults: ShooterDisplayResults = { 
          shooterId, 
          shooterName: shooterDisplayName, 
          shooterGender: shooterInfo?.gender || (scoresByShooter.get(shooterId)?.[0]?.shooterGender) || 'unknown',
          results: {}, average: null, total: 0, roundsShot: 0,
          teamId, 
          leagueId: teamData.leagueId, 
          competitionYear: teamData.competitionYear,
          leagueType: teamData.leagueType,
          isSubstitute: !!substitutionInfo,
          substitutionInfo: substitutionInfo ? {
            fromRound: substitutionInfo.fromRound,
            originalShooterName: substitutionInfo.originalShooterName,
            replacementShooterName: shooterDisplayName,
            reason: substitutionInfo.reason || '',
            type: substitutionInfo.type || 'new_shooter'
          } : undefined,
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
      
      shootersResults.sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || (b.total ?? 0) - (a.total ?? 0) || a.shooterName.localeCompare(b.shooterName));

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
      logError('Error loading team shooters:', error);
    } finally {
      setLoadingTeamShooters(prev => { const newSet = new Set(prev); newSet.delete(teamId); return newSet; });
    }
  }, [loadedTeamShooters, loadingTeamShooters, teamSubstitutions]);

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
  if (isLoadingInitialCompetitions || !selectedCompetition) {
    return <RwkTabellenPageLoadingSkeleton title={pageTitle || 'Lade Konfiguration...'} />;
  }

  return (
    <div className="space-y-8" style={{
      touchAction: 'manipulation',
      WebkitOverflowScrolling: 'touch',
      WebkitTransform: 'translateZ(0)',
      willChange: 'scroll-position'
    }}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <BackButton className="mr-2" fallbackHref="/" />
          <TableIconLucide className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">{pageTitle}</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-muted-foreground hover:text-primary p-2"
            onClick={() => document.getElementById('rwk-legend')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <NativeSelect
            value={selectedCompetition ? `${selectedCompetition.year}-${selectedCompetition.discipline}` : ""}
            onChange={(e) => handleCompetitionChange(e.target.value)}
            disabled={availableCompetitions.length === 0 || loadingData}
            className="w-full sm:w-[300px] shadow-md"
            placeholder={availableCompetitions.length === 0 ? "Keine Wettkämpfe" : "Wettkampf wählen"}
            options={availableCompetitions.map(comp => ({
              value: `${comp.year}-${comp.discipline}`,
              label: comp.displayName
            }))}
          />
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

          
          {/* Orientierungs-Hinweis für Portrait-Modus */}
          {isPortrait && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100 text-sm">
                <span>🔄</span>
                <span><strong>Bessere Ansicht:</strong> Drehen Sie Ihr Gerät ins Querformat für die vollständige Tabellen-Ansicht!</span>
              </div>
            </div>
          )}
          
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

                    

                    
                    <div className="flex justify-between items-center px-2 py-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`showOutOfCompetitionTeams-${league.id}`}
                          checked={showOutOfCompetitionTeams}
                          onCheckedChange={(checked) => {
                            setShowOutOfCompetitionTeams(!!checked);
                            const currentParams = new URLSearchParams(window.location.search);
                            currentParams.set('showAK', (!!checked).toString());
                            router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
                          }}
                          className="h-5 w-5"
                        />
                        <Label 
                          htmlFor={`showOutOfCompetitionTeams-${league.id}`}
                          className="text-xs cursor-pointer"
                        >
                          AK-Teams anzeigen
                        </Label>
                      </div>
                      
                      {/* PDF Buttons nur auf Desktop */}
                      <div className="hidden lg:flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs px-2 py-1"
                          onClick={async () => {
                            try {
                              const { generateLeaguePDFFixed } = await import('@/lib/services/pdf-service-fixed');
                              
                              // Lade Schützendaten für diese Liga
                              const shooterData = await fetchIndividualShooterData(
                                selectedCompetition, 
                                currentNumRoundsState, 
                                league.id
                              );
                              
                              // Erstelle temporäre Liga mit Schützendaten
                              const tempLeague = {
                                ...league,
                                individualLeagueShooters: shooterData
                              };
                              
                              // Generiere PDF
                              const pdfBlob = await generateLeaguePDFFixed(
                                tempLeague, 
                                currentNumRoundsState, 
                                selectedCompetition.year
                              );
                              
                              // Download PDF
                              const url = URL.createObjectURL(pdfBlob);
                              const a = document.createElement('a');
                              a.href = url;
                              const sanitizedLeagueName = String(league.name || '').replace(/[<>"'&\/\\]/g, '');
                              const sanitizedYear = String(selectedCompetition.year || '').replace(/[<>"'&\/\\]/g, '');
                              a.download = `${sanitizedLeagueName}_Mannschaften_${sanitizedYear}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              
                              toast({
                                title: 'PDF erstellt',
                                description: 'Die PDF-Datei wurde erfolgreich erstellt.',
                              });
                            } catch (error) {
                              logError('Fehler beim Erstellen der PDF:', error);
                              toast({
                                title: 'Fehler',
                                description: 'Die PDF-Datei konnte nicht erstellt werden.',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          Mannschaften als PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs px-2 py-1"
                          onClick={async () => {
                            try {
                              const { generateShootersPDFFixed } = await import('@/lib/utils/pdf-generator.fix');
                              
                              // Lade Schützendaten für diese Liga
                              const shooterData = await fetchIndividualShooterData(
                                selectedCompetition, 
                                currentNumRoundsState, 
                                league.id
                              );
                              
                              // Erstelle temporäre Liga mit Schützendaten
                              const tempLeague = {
                                ...league,
                                individualLeagueShooters: shooterData
                              };
                              
                              // Generiere PDF
                              const pdfBlob = await generateShootersPDFFixed(
                                tempLeague, 
                                currentNumRoundsState, 
                                selectedCompetition.year
                              );
                              
                              // Download PDF
                              const url = URL.createObjectURL(pdfBlob);
                              const a = document.createElement('a');
                              a.href = url;
                              const sanitizedLeagueName = String(league.name || '').replace(/[<>"'&\/\\]/g, '');
                              const sanitizedYear = String(selectedCompetition.year || '').replace(/[<>"'&\/\\]/g, '');
                              a.download = `${sanitizedLeagueName}_Einzelschützen_${sanitizedYear}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              
                              toast({
                                title: 'PDF erstellt',
                                description: 'Die PDF-Datei wurde erfolgreich erstellt.',
                              });
                            } catch (error) {
                              logError('Fehler beim Erstellen der PDF:', error);
                              toast({
                                title: 'Fehler',
                                description: 'Die PDF-Datei konnte nicht erstellt werden.',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          Einzelschützen PDF
                        </Button>
                      </div>
                      
                      {/* Mobile Hinweis */}
                      <div className="lg:hidden text-xs text-muted-foreground">
                        💡 PDF am Desktop
                      </div>
                    </div>
                    {league.teams.length > 0 ? (
                      isPortrait ? (
                        (() => {
                          // Berechne liga-weit vollständigen Durchgang auch für Mobile
                          const leagueCompleteRound = determineLeagueCompleteRound(league.teams, currentNumRoundsState);
                          
                          return (
                        <div>
                          <MobileTeamCards
                          teams={league.teams.filter(team => showOutOfCompetitionTeams || !team.outOfCompetition)}
                          numRounds={currentNumRoundsState}
                          onShooterClick={handleShooterNameClick}
                          teamSubstitutions={teamSubstitutions}
                          expandedTeams={expandedTeamIds}
                          onToggleTeam={toggleTeamExpansion}
                          loadingTeams={loadingTeamShooters}
                          onLoadTeamShooters={loadTeamShooters}
                          leagueCompleteRound={leagueCompleteRound}
                        />
                        </div>
                          );
                        })()
                      ) : (
                        (() => {
                          // Berechne liga-weit vollständigen Durchgang
                          const leagueCompleteRound = determineLeagueCompleteRound(league.teams, currentNumRoundsState);
                          
                          return (
                        <div className={needsSpecialTouch ? "overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" : "overflow-x-auto"} style={needsSpecialTouch ? { 
                          touchAction: 'manipulation', 
                          maxHeight: '70vh',
                          WebkitOverflowScrolling: 'touch',
                          transform: 'translateZ(0)',
                          overflow: 'auto',
                          WebkitTransform: 'translateZ(0)',
                          willChange: 'scroll-position'
                        } : { touchAction: 'pan-x pan-y', overflowX: 'scroll' }}>
                          <SmartTable style={{ 
                            touchAction: 'auto',
                            transform: 'translateZ(0)'
                          }}>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[50px] text-center px-2 py-2 text-xs font-medium text-muted-foreground">#</TableHead>
                              <TableHead className="min-w-[150px] px-2 py-2 text-sm font-medium text-muted-foreground">Mannschaft</TableHead>
                              {[...Array(currentNumRoundsState)].map((_, i) => (
                                <TableHead key={`dg-header-${i + 1}`} className="px-1 py-1.5 text-center text-xs text-muted-foreground font-normal">DG {i + 1}</TableHead>
                              ))}
                              <TableHead className="text-center px-1 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Gesamt</TableHead>
                              {!isNativeApp && <TableHead className="text-center px-1 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Schnitt</TableHead>}
                              {!isNativeApp && <TableHead className="w-[60px] text-right pr-4 px-2 py-2"></TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {league.teams
                              .filter(team => showOutOfCompetitionTeams || !team.outOfCompetition)
                              .map(team => (
                              <React.Fragment key={team.id}>
                                <TableRow className="hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => isNativeApp ? toggleTeamExpansion(team.id) : toggleTeamExpansion(team.id)}>
                                  <TableCell className="text-center font-medium px-2 py-2">
                                    {team.outOfCompetition ? 
                                      <span className="text-amber-500 dark:text-amber-400" title="Außer Konkurrenz">AK</span> : 
                                      <span className="text-foreground dark:text-foreground">{team.rank}</span>
                                    }
                                  </TableCell>
                                  <TableCell className="font-medium text-foreground px-2 py-2 text-sm">
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
                                  <TableCell className="text-center px-2 py-2">
                                    {(() => {
                                      // Berechne Wertungs-Score bis zum liga-weiten vollständigen Durchgang
                                      let leagueScore = 0;
                                      for (let r = 1; r <= leagueCompleteRound; r++) {
                                        const score = team.roundResults?.[`dg${r}`];
                                        if (score !== null && score !== undefined) {
                                          leagueScore += score;
                                        }
                                      }
                                      
                                      const showBoth = leagueScore !== team.totalScore;
                                      
                                      return (
                                        <div className="flex flex-col items-center">
                                          <span className="font-bold text-lg text-primary">{leagueScore}</span>
                                          {showBoth && (
                                            <span className="text-xs text-muted-foreground">({team.totalScore ?? 0})</span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  {!isNativeApp && <TableCell className="text-center font-medium text-muted-foreground px-2 py-2">{team.averageScore != null ? team.averageScore.toFixed(2) : '-'}</TableCell>}
                                  {!isNativeApp && <TableCell className="text-right pr-4 px-2 py-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toggleTeamExpansion(team.id);}} aria-label={`Details für ${team.name} ${expandedTeamIds.includes(team.id) ? 'ausblenden' : 'anzeigen'}`} className="hover:bg-accent/20 rounded-md">
                                      {expandedTeamIds.includes(team.id) ? <ChevronDown className="h-5 w-5 transition-transform duration-200 rotate-180" /> : <ChevronRight className="h-5 w-5 transition-transform duration-200" />}
                                    </Button>
                                  </TableCell>}
                                </TableRow>
                                {expandedTeamIds.includes(team.id) && (
                                  <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableCell colSpan={isNativeApp ? 3 + currentNumRoundsState : 5 + currentNumRoundsState + 1} className="p-0 border-t-0 pl-6">
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
                          </SmartTable>
                        </div>
                          );
                        })()
                      )
                    ) : (<p className="p-4 text-center text-muted-foreground">Keine Mannschaften in dieser Liga für {pageTitle} vorhanden.</p>)}
                    

                  </div>
                )
              }))}
            />
          )}
          
          {/* RWK Legende am Ende */}
          <div id="rwk-legend" className="mt-12 mb-8">
            <RWKLegend />
          </div>
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
                    <NativeSelect
                      id="individualLeagueFilter"
                      value={selectedIndividualLeagueFilter || ""}
                      onChange={(e) => setSelectedIndividualLeagueFilter(e.target.value)}
                      disabled={loadingData || !teamData || availableLeaguesForIndividualFilter.length === 0}
                      className="w-full sm:w-[350px] mt-1 shadow-sm border-blue-300"
                      placeholder="-- Bitte Liga auswählen --"
                      options={[
                        ...(selectedCompetition?.discipline === 'KK' ? [{
                          value: "KK_GEWEHR_EHRUNGEN",
                          label: "🏆 Alle KK Gewehr Auflage"
                        }] : []),
                        ...((selectedCompetition?.discipline === 'LG' || selectedCompetition?.discipline === 'LP') ? [{
                          value: "LGA_GESAMTLISTE",
                          label: "🏆 Alle Luftdruck Auflage (Gesamtliste)"
                        }] : []),
                        ...availableLeaguesForIndividualFilter
                          .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "")
                          .map(league => {
                            const cleanName = league.name
                              .replace(/\s*\(Gruppe\)\s*/g, '')
                              .replace(/\s+Gruppe\s*$/g, '')
                              .trim();
                            return {
                              value: league.id,
                              label: `${cleanName} (${league.type})`
                            };
                          })
                      ]}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showOutOfCompetitionShootersIndividual"
                      checked={showOutOfCompetitionShooters}
                      onCheckedChange={(checked) => {
                        setShowOutOfCompetitionShooters(!!checked);
                        const currentParams = new URLSearchParams(window.location.search);
                        currentParams.set('showAKShooters', (!!checked).toString());
                        router.replace(`/rwk-tabellen?${currentParams.toString()}`, { scroll: false });
                      }}
                      className="h-5 w-5"
                    />
                    <Label 
                      htmlFor="showOutOfCompetitionShootersIndividual"
                      className="text-xs cursor-pointer"
                    >
                      AK-Schützen anzeigen
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
                <CardHeader><CardTitle className="text-xl text-accent">Einzelrangliste {selectedIndividualLeagueFilter === 'KK_GEWEHR_EHRUNGEN' ? '(🏆 Alle KK Gewehr Auflage)' : selectedIndividualLeagueFilter === 'LGA_GESAMTLISTE' ? '(🏆 Alle Luftdruck Auflage)' : selectedIndividualLeagueFilter && availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter) ? `(Liga: ${availableLeaguesForIndividualFilter.find(l => l.id === selectedIndividualLeagueFilter)?.name})` : '(Alle Ligen der Disziplin)'}</CardTitle><CardDescription>Alle Schützen sortiert nach Gesamtergebnis für {pageTitle}.</CardDescription></CardHeader>
                <CardContent>
                  {isPortrait ? (
                    <MobileShooterCards
                      shooters={filteredIndividualData
                        .filter(shooter => showOutOfCompetitionShooters || !shooter.teamOutOfCompetition)
                        .filter(shooter => 
                          !shooterSearchTerm || 
                          shooter.shooterName.toLowerCase().includes(shooterSearchTerm.toLowerCase()) ||
                          shooter.teamName.toLowerCase().includes(shooterSearchTerm.toLowerCase())
                        )}
                      numRounds={currentNumRoundsState}
                      onShooterClick={handleShooterNameClick}
                    />
                  ) : (
                    <div className={needsSpecialTouch ? "overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" : "overflow-x-auto"} style={needsSpecialTouch ? { 
                      touchAction: 'manipulation', 
                      maxHeight: '70vh',
                      WebkitOverflowScrolling: 'touch',
                      transform: 'translateZ(0)',
                      overflow: 'auto',
                      WebkitTransform: 'translateZ(0)',
                      willChange: 'scroll-position'
                    } : { touchAction: 'pan-x pan-y', overflowX: 'scroll' }}>
                      <Table className="responsive-card-table" style={{ 
                        touchAction: 'auto',
                        transform: 'translateZ(0)'
                      }}>
                      <TableHeader className="pwa-table-header"><TableRow className="bg-muted/50">
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
                            <TableCell className="text-center font-medium" data-label="Rang">
                              {shooter.teamOutOfCompetition ? 
                                <span className="text-amber-500 dark:text-amber-400" title="Außer Konkurrenz">AK</span> : 
                                <span className="text-foreground dark:text-foreground">{shooter.rank}</span>
                              }
                            </TableCell>
                            <TableCell className="text-foreground" data-label="Name">
                              <div className="flex items-center gap-2">
                                <Button variant="link" className="p-0 h-auto text-sm text-left hover:text-primary whitespace-normal text-wrap font-normal" onClick={() => handleShooterNameClick(shooter)}>
                                  {shooter.shooterName}
                                </Button>
                                <LineChartIcon className="h-3 w-3 text-muted-foreground" title="Klicken Sie auf den Namen für Statistik-Diagramm" />
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-label="Mannschaft">
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
                            {[...Array(currentNumRoundsState)].map((_, i) => (<TableCell key={`ind-dg-val-${i + 1}-${shooter.shooterId}`} className="text-center px-1 py-2" data-label={`DG ${i + 1}`}>{shooter.results?.[`dg${i + 1}`] ?? '-'}</TableCell>))}
                            <TableCell className="text-center font-semibold text-primary" data-label="Gesamt">{shooter.totalScore}</TableCell>
                            <TableCell className="text-center font-medium text-muted-foreground" data-label="Schnitt">
                              {(() => {
                                // Prüfe ob Schütze ersetzt wurde (nur echte Ersetzungen, nicht fehlende Ergebnisse)
                                const isReplacedShooter = shooter.isReplacedShooter;
                                
                                // Für ersetzte Schützen: Zeige Gesamt statt Durchschnitt
                                if (isReplacedShooter) {
                                  return <span className="text-orange-600 font-medium" title="Ersetzt - Gesamtwertung">{shooter.totalScore}</span>;
                                }
                                
                                // Normale Durchschnittswertung
                                return shooter.averageScore != null ? shooter.averageScore.toFixed(2) : '-';
                              })()
                            }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
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

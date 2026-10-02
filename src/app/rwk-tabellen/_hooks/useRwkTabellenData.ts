"use client";
// Data-Layer-Hook fuer die RWK-Tabellen. Enthaelt State, Firestore-Ladefunktionen
// und Handler. Aus page.tsx ausgelagert; Verhalten unveraendert.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { useToast } from '@/hooks/use-toast';
import { useNativeApp } from '@/components/ui/native-app-detector';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, query, where, orderBy, limit, documentId, setDoc } from 'firebase/firestore';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';
import { SubstitutionService } from '@/lib/services/substitution-service';
import { TeamCalculationService } from '@/lib/services/team-calculation-service';
import { uiDisciplineFilterOptions, getUIDisciplineValueFromSpecificType } from '@/types/rwk';
import type {
  Season, League, Club, Shooter, ScoreEntry, CompetitionDisplayConfig,
  FirestoreLeagueSpecificDiscipline, UIDisciplineSelection, AggregatedCompetitionData,
  IndividualShooterDisplayData, ShooterDisplayResults, TeamDisplay, LeagueDisplay,
} from '@/types/rwk';
import { EXCLUDED_TEAM_NAME_PART, determineLeagueCompleteRound, buildDisplayName, sortTeamsAndAssignRanks, sortShootersAndAssignRanks } from '../_lib/rwk-zones';

export function useRwkTabellenData() {
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
  // Karten-Ansicht auf allen kleineren Bildschirmen (< lg / 1024px) statt
  // horizontal scrollender Tabelle - kein "Gerät drehen" mehr noetig.
  const [useMobileCards, setUseMobileCards] = useState(false);
  
  useEffect(() => {
    const checkViewport = () => {
      setUseMobileCards(window.innerWidth < 1024);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
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
    // Add request deduplication
    const requestKey = 'fetchAvailableCompetitions';
    try {
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
      // Bei Abgeschlossenen: KK vor LD vor KKP (typische Saisonreihenfolge)
      const disciplinePriority: Record<string, number> = { 'KK': 1, 'KKP': 2, 'LD': 3 };
      abgeschlossenCompetitions.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year; // Neuestes Jahr zuerst
        return (disciplinePriority[a.discipline] || 99) - (disciplinePriority[b.discipline] || 99);
      });
      const allCompetitions = [...laufendCompetitions, ...abgeschlossenCompetitions];
      
        // Remove duplicates
        const uniqueCompetitions = allCompetitions.filter((comp, index, self) => 
          index === self.findIndex(c => c.year === comp.year && c.discipline === comp.discipline)
        );
        
        const result = uniqueCompetitions.length > 0 ? uniqueCompetitions : ([
          { year: new Date().getFullYear(), discipline: 'KK', displayName: `${new Date().getFullYear()} Kleinkaliber` }
        ] as CompetitionDisplayConfig[]);
        
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

      // Batch-load ALLE Scores auf einmal - lade aus allen relevanten Collections
      let allScoresSnapshot;
      try {
        // Bestimme alle einzigartigen Collections für die Disziplin-Typen
        const collectionsToQuery = [...new Set(
          firestoreTypesToQuery.map(type => 
            getSeasonSpecificScoresCollection(config.year, type as any)
          )
        )];
        
        // Lade aus allen Collections parallel
        const snapshots = await Promise.all(
          collectionsToQuery.map(collectionName =>
            getDocs(query(
              collection(db, collectionName),
              where("competitionYear", "==", config.year),
              where("leagueType", "in", firestoreTypesToQuery)
            ))
          )
        );
        
        // Kombiniere alle Docs zu einem virtuellen Snapshot
        const allDocs = snapshots.flatMap(snap => snap.docs);
        allScoresSnapshot = { docs: allDocs };
        
        logDebug(`✅ Scores geladen aus ${collectionsToQuery.length} Collections: ${allDocs.length} Scores`);
      } catch (error) {
        logDebug(`⚠️ Saison-spezifische Collections nicht gefunden, verwende rwk_scores`);
        
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
        scoresByTeam.get(score.teamId)!.push({...score, id: scoreDoc.id});
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

          // Einzelmeldung erkennen: weniger als 3 Schützen = keine echte Mannschaft.
          // (Namen mit "Einzel" werden bereits weiter oben herausgefiltert.)
          const anzahlSchuetzen = Array.isArray(teamData.shooterIds) ? teamData.shooterIds.length : 0;
          const istEinzelwertung = anzahlSchuetzen < 3;

          // Bei einer Einzelwertung werden pro Durchgang die tatsächlich gemeldeten
          // Schützen gewertet (1 oder 2), damit ein Durchgang nicht fälschlich leer
          // bleibt, nur weil keine 3 Schützen vorhanden sind. Echte Mannschaften: beste 3.
          const wertungsSchuetzen = istEinzelwertung && anzahlSchuetzen > 0 ? anzahlSchuetzen : 3;

          const calculationResult = TeamCalculationService.calculateTeamResults(
            teamData.id,
            teamScores,
            numRoundsForCompetition,
            substitutions,
            teamData.name,
            wertungsSchuetzen
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
            sortingAverage: calculationResult.sortingAverage,
            istEinzelwertung, // außer Wertung, wird wie "außer Konkurrenz" behandelt
          };
          teamDisplays.push(teamDisplayItem);
        }
        // Sortiere Teams — Basis ist liga-weiter vollständiger Durchgang (Minimum aller Teams)
        // Damit wird verhindert dass ein Team das einen Durchgang mehr eingetragen hat nach oben sortiert wird
        const leagueCompleteRoundForSort = determineLeagueCompleteRound(teamDisplays, numRoundsForCompetition);
        
        // "Außer Wertung" = außer Konkurrenz ODER Einzelmeldung (<3 Schützen)
        // Sortierung + Rangvergabe über das zentrale, getestete Util.
        sortTeamsAndAssignRanks(teamDisplays, leagueCompleteRoundForSort);
        leagueDisplay.teams = teamDisplays;
        
        // Populate individualLeagueShooters — wird nach dem Return asynchron via fetchIndividualShooterData befüllt
        leagueDisplay.individualLeagueShooters = [];
        
        // Vergebe Rangplätze (leer vorerst, wird nach Nachladen gesetzt)
        fetchedLeaguesData.push(leagueDisplay);
      }
      // Substitutions sind bereits oben (fuer die Berechnung) geladen -> wiederverwenden,
      // statt sie ein zweites Mal zu laden (spart eine team_substitutions-Query).
      setTeamSubstitutions(substitutions);

      // Einzelranglisten werden NICHT mehr vorab fuer alle Ligen geladen.
      // Sie werden lazy in loadData nachgeladen, sobald im Einzel-Tab eine Liga
      // gewaehlt wird. individualLeagueShooters wird beim Rendern nicht gelesen;
      // die PDF-Buttons laden ihre Daten selbst nach. Das eliminiert L x (teams+scores+subs+shooters)
      // Reads pro Wettkampf-Oeffnen.

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
        // Alle KK Gewehr Ligen = type "KK" (nicht KKP)
        const leaguesSnap = await getDocs(query(
          collection(db, "rwk_leagues"),
          where("competitionYear", "==", config.year),
          where("type", "==", "KK")
        ));
        const kkLeagueIds = leaguesSnap.docs.map(d => d.id);

        if (kkLeagueIds.length > 0) {
          teamsQuery = query(
            collection(db, "rwk_teams"),
            where("leagueId", "in", kkLeagueIds),
            where("competitionYear", "==", config.year)
          );
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
        // Scores nach KK Gewehr Liga-IDs filtern (type "KK", nicht "KKP")
        const leaguesSnap2 = await getDocs(query(
          collection(db, "rwk_leagues"),
          where("competitionYear", "==", config.year),
          where("type", "==", "KK")
        ));
        const kkLeagueIds2 = leaguesSnap2.docs.map(d => d.id);
        if (kkLeagueIds2.length > 0) {
          scoresQueryConstraints = [
            where("competitionYear", "==", config.year),
            where("leagueId", "in", kkLeagueIds2)
          ];
        } else {
          return [];
        }
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
      
      // Versuche saison-spezifische Collections zu verwenden
      const allScores: ScoreEntry[] = [];
      let scoresQuery;
      try {
        // Bestimme alle einzigartigen Collections für die Disziplin
        const selectedUIDiscOption = uiDisciplineFilterOptions.find(opt => opt.value === config.discipline);
        const allTypes = selectedUIDiscOption ? selectedUIDiscOption.firestoreTypes : [config.discipline as any];
        const collectionsToQuery = [...new Set(
          allTypes.map(type => getSeasonSpecificScoresCollection(config.year, type as any))
        )];
        
        // Lade aus allen Collections parallel und kombiniere
        const snapshots = await Promise.all(
          collectionsToQuery.map(collectionName =>
            getDocs(query(collection(db, collectionName), ...scoresQueryConstraints))
          )
        );
        const allDocs = snapshots.flatMap(snap => snap.docs);
        allDocs.forEach(d => { allScores.push({ ...d.data() as ScoreEntry, id: d.id }); });
      } catch (error) {
        scoresQuery = query(collection(db, "rwk_scores"), ...scoresQueryConstraints);
        const scoresSnapshot = await getDocs(scoresQuery);
        scoresSnapshot.docs.forEach(d => { allScores.push({ ...d.data() as ScoreEntry, id: d.id }); });
      }
      
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
          const key = `${data.teamId}|${data.originalShooterId}`;
          substitutionsMap.set(key, {
            originalShooterName: data.originalShooterName,
            replacementShooterName: data.replacementShooterName,
            fromRound: data.fromRound,
            reason: data.reason,
            type: data.type,
            leagueId: data.leagueId || null,
          });
        });
      } catch (error) {
        // Substitutions sind optional
      }
      

      
      const shootersMap = new Map<string, IndividualShooterDisplayData>();
      // Kombiniere Schützen aus Teams und Scores
      const allShooterIds = [...new Set([
        ...Array.from(allShooterIdsFromTeams),
        ...allScores.map(s => s.shooterId).filter(Boolean)
      ])];
      const shooterNamesMap = new Map<string, { name: string; gender: string }>();
      
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
              // Speichere sowohl Namen als auch Geschlecht
              shooterNamesMap.set(doc.id, {
                name: buildDisplayName(shooterData),
                gender: shooterData.gender || 'unknown'
              });
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            logWarn('RWK DEBUG: Fehler beim Laden der Schützen-Namen:', (error as any)?.message || 'Unknown error');
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
          
          for (const [, teamData] of teamInfoMap) {
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
            const originalSubstitutionKey = `${teamId}|${shooterId}`;
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
      
      const deduplicatedShooters: any[] = [];
      shootersByName.forEach(shooters => {
        if (shooters.length === 1) {
          deduplicatedShooters.push(shooters[0]);
        } else {
          // Behalte den mit den meisten Scores
          const best = shooters.reduce((best: any, current: any) => 
            current.roundsShot > best.roundsShot ? current : best
          );
          deduplicatedShooters.push(best);
        }
      });
      
      const rankedShooters = deduplicatedShooters
        // Bei Gesamtlisten: nur Schützen mit mindestens einem Score anzeigen
        .filter(shooter => {
          if (filterByLeagueId === 'KK_GEWEHR_EHRUNGEN' || filterByLeagueId === 'LGA_GESAMTLISTE') {
            return shooter.roundsShot > 0;
          }
          return true; // Bei normalen Ligen: alle anzeigen (auch ohne Ergebnisse)
        })
        // Filtere ersetzte Schützen aus
        .filter(shooter => {
          // Prüfe alle Substitution-Keys mit sicherem Separator '|'
          for (const [key, substitution] of substitutionsMap) {
            // Key-Format: teamId|originalShooterId
            const parts = key.split('|');
            if (parts.length === 2 && parts[1] === shooter.shooterId) {
              // Nur filtern wenn die Substitution zur gleichen Liga gehört
              // oder keine Liga-ID gespeichert ist (Fallback: filtern)
              if (!substitution.leagueId || substitution.leagueId === shooter.leagueId) {
                return false; // Ersetzte Schützen ausblenden
              }
            }
          }
          return true;
        });
      // Sortierung + Rangvergabe über das zentrale, getestete Util.
      sortShootersAndAssignRanks(rankedShooters, numRoundsForCompetition);

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
    
    setLoadingData(true); 
    setError(null); 
    
    // Only clear data if competition changed
    const competitionKey = `${selectedCompetition.year}-${selectedCompetition.discipline}`;
    const currentKey = teamData?.config ? `${teamData.config.year}-${teamData.config.discipline}` : null;
    
    if (competitionKey !== currentKey) {
      setTeamData(null); 
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
        setTopMaleShooter(null);
        setTopFemaleShooter(null);
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
    return undefined;
  }, [selectedCompetition, activeTab, selectedIndividualLeagueFilter, isLoadingInitialCompetitions]);
  
  // Substitutions werden zentral in fetchCompetitionTeamData geladen und gesetzt
  // (vollstaendiges Key-Format ueber SubstitutionService) - kein separater Nachlade-Effekt noetig.

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

      // Batch-Laden statt N+1: alle vorhandenen Schuetzen in 30er-Bloecken per documentId() in [...]
      const foundShooterIds = new Set<string>();
      try {
        const batchSize = 30;
        for (let i = 0; i < validShooterIds.length; i += batchSize) {
          const batch = validShooterIds.slice(i, i + batchSize);
          const shootersSnap = await getDocs(query(collection(db, "shooters"), where(documentId(), "in", batch)));
          shootersSnap.docs.forEach(docSnap => {
            const shooterData = docSnap.data();
            shooterInfos.set(docSnap.id, { ...shooterData, displayName: buildDisplayName(shooterData) });
            foundShooterIds.add(docSnap.id);
          });
        }
      } catch (error) {
        logError('Fehler beim Batch-Laden der Schuetzen:', error);
      }

      // Fallback nur fuer NICHT gefundene Schuetzen: Namen aus Scores holen, ggf. Schuetzen-Doc anlegen
      const missingShooterIds = validShooterIds.filter(id => !foundShooterIds.has(id));
      for (const shooterId of missingShooterIds) {
        logWarn(`❌ Schütze ${shooterId} nicht in shooters gefunden - suche in Scores...`);
        try {
          let scoresSnapshot;
          try {
            const seasonSpecificCollection = getSeasonSpecificScoresCollection(teamData.competitionYear, teamData.leagueType as FirestoreLeagueSpecificDiscipline);
            scoresSnapshot = await getDocs(query(
              collection(db, seasonSpecificCollection),
              where("shooterId", "==", shooterId),
              limit(1)
            ));
          } catch (error) {
            scoresSnapshot = await getDocs(query(
              collection(db, "rwk_scores"),
              where("shooterId", "==", shooterId),
              limit(1)
            ));
          }

          if (!scoresSnapshot.empty) {
            const scoreData = scoresSnapshot.docs[0].data();
            const nameFromScore = scoreData.shooterName;

            // Erstelle shooters Eintrag NUR wenn nicht vorhanden - gender niemals überschreiben!
            try {
              const nameParts = nameFromScore.split(' ');
              await setDoc(doc(db, "shooters", shooterId), {
                name: nameFromScore,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                gender: scoreData.shooterGender || 'unknown',
                createdAt: new Date(),
                createdBy: 'auto-from-scores'
              });
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

  return {
    router, isNativeApp, needsSpecialTouch,
    availableCompetitions, isLoadingInitialCompetitions,
    selectedCompetition, setSelectedCompetition, activeTab, setActiveTab,
    teamData, filteredIndividualData,
    loadedTeamShooters, loadingTeamShooters,
    topMaleShooter, topFemaleShooter,
    selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter,
    lastClickedLeagueId, shooterSearchTerm, setShooterSearchTerm,
    showOutOfCompetitionTeams, setShowOutOfCompetitionTeams,
    showOutOfCompetitionShooters, setShowOutOfCompetitionShooters,
    loadingData, error, currentNumRoundsState,
    openAccordionItems, expandedTeamIds,
    isShooterDetailModalOpen, setIsShooterDetailModalOpen,
    selectedShooterForDetail, teamSubstitutions, useMobileCards,
    fetchIndividualShooterData, handleCompetitionChange, handleAccordionValueChange,
    toggleTeamExpansion, handleShooterNameClick, loadTeamShooters, toast,
    pageTitle, availableLeaguesForIndividualFilter,
  };
}

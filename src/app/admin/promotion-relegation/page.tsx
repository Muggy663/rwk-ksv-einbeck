"use client";

import { useState, useEffect } from 'react';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowUp, ArrowDown, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { calculateLeagueStandings, generatePromotionRelegationSuggestions, applyPromotionRelegation, berechneLigaAusgleich } from '@/lib/services/season-transition-service';
import { writeBatch } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Season {
  id: string;
  competitionYear: number;
  name: string;
  status: string;
  type: string;
}

interface League {
  id: string;
  name: string;
  type: string;
  competitionYear: number;
  seasonId: string;
  order?: number;
}

interface PromotionRelegationSuggestion {
  teamId: string;
  teamName: string;
  clubName: string;
  currentLeague: string;
  currentPosition: number;
  action: 'promote' | 'relegate' | 'stay' | 'compare';
  targetLeague?: string;
  reason: string;
  confirmed: boolean;
  compareWith?: {
    teamId: string;
    teamName: string;
    league: string;
    position: number;
    score: number;
  };
}

export default function SeasonTransitionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSourceSeason, setSelectedSourceSeason] = useState<string>('');
  const [selectedTargetSeason, setSelectedTargetSeason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [suggestions, setSuggestions] = useState<PromotionRelegationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [withdrawnTeams, setWithdrawnTeams] = useState<string[]>([]);
  const [availableTeams, setAvailableTeams] = useState<{id: string, name: string, clubName: string}[]>([]);
  const [allLeagueSuggestions, setAllLeagueSuggestions] = useState<Map<string, PromotionRelegationSuggestion[]>>(new Map());
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [teamStandings, setTeamStandings] = useState<Map<string, any>>(new Map());
  // Nachher-Übersicht: alle Mannschaften der Ziel-Saison mit aktueller Liga-Zuordnung,
  // um die Einteilung nach dem Anwenden zu prüfen und manuell nachzujustieren.
  const [ligaEinteilung, setLigaEinteilung] = useState<Array<{ docId: string; name: string; clubId: string; clubName: string; leagueId: string | null; leagueType: string | null; shooterCount: number; isEinzel: boolean; ringe: number | null; schuetzenNamen: string[] }>>([]);
  const [isAusgleich, setIsAusgleich] = useState(false);
  const [zielLigen, setZielLigen] = useState<League[]>([]);
  const [showEinteilung, setShowEinteilung] = useState(false);
  const [isLoadingEinteilung, setIsLoadingEinteilung] = useState(false);
  // Übersprungene Vorschläge aus dem letzten Anwenden (sichtbar in der UI ausgeben)
  const [skippedInfo, setSkippedInfo] = useState<string[]>([]);
  // Liga-ID, über der gerade ein Team schwebt (Drop-Highlight)
  const [dragOverLeague, setDragOverLeague] = useState<string | null>(null);


  useEffect(() => {
    const fetchSeasons = async () => {
      setIsLoading(true);
      try {
        const seasonsQuery = query(collection(db, 'seasons'), orderBy('competitionYear', 'desc'));
        const snapshot = await getDocs(seasonsQuery);
        const fetchedSeasons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Season[];
        
        setSeasons(fetchedSeasons);
      } catch (error) {
        logError('Error fetching seasons:', error);
        toast({
          title: 'Fehler beim Laden der Saisons',
          description: 'Die Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasons();
  }, [toast]);

  useEffect(() => {
    const fetchLeagues = async () => {
      if (!selectedSourceSeason) return;
      
      setIsLoading(true);
      try {
        const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
        if (!selectedSeason) return;
        
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSourceSeason),
          orderBy('order', 'asc')
        );
        
        const snapshot = await getDocs(leaguesQuery);
        const fetchedLeagues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as League[];
        
        setLeagues(fetchedLeagues);
      } catch (error) {
        logError('Error fetching leagues:', error);
        toast({
          title: 'Fehler beim Laden der Ligen',
          description: 'Die Ligen konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [selectedSourceSeason, seasons, toast]);

  const generateSuggestions = async () => {
    if (!selectedSourceSeason || !selectedLeague) {
      toast({
        title: 'Fehlende Auswahl',
        description: 'Bitte wählen Sie Saison und Liga aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
      if (!selectedSeason) return;

      // Teams der Liga laden für Abmeldungs-Auswahl
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('leagueId', '==', selectedLeague),
        where('competitionYear', '==', selectedSeason.competitionYear)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const clubsQuery = query(collection(db, 'clubs'));
      const clubsSnapshot = await getDocs(clubsQuery);
      const clubsMap = new Map();
      clubsSnapshot.docs.forEach(doc => {
        clubsMap.set(doc.id, doc.data().name);
      });
      
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        clubName: clubsMap.get(doc.data().clubId) || 'Unbekannt'
      }));
      setAvailableTeams(teams);
      
      // Echte Auf-/Abstiegsvorschläge basierend auf RWK-Ordnung §16
      const generatedSuggestions = await generatePromotionRelegationSuggestions(
        selectedLeague,
        selectedSeason.competitionYear,
        leagues,
        withdrawnTeams
      );
      
      // Team-Ergebnisse laden
      const standings = await calculateLeagueStandings(selectedLeague, selectedSeason.competitionYear);
      const standingsMap = new Map();
      standings.forEach(standing => {
        standingsMap.set(standing.teamId, standing);
      });
      setTeamStandings(standingsMap);
      
      setSuggestions(generatedSuggestions);
      setShowSuggestions(true);
      
      toast({
        title: 'Vorschläge generiert',
        description: `${generatedSuggestions.length} Auf-/Abstiegs-Vorschläge basierend auf aktuellen Tabellen erstellt.`
      });
      
    } catch (error: any) {
      logError('Error generating suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Vorschläge konnten nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasConfirmedSuggestions = () => {
    return Array.from(allLeagueSuggestions.values())
      .some(suggestions => suggestions.some(s => s.confirmed));
  };
  
  const applyAllLeagueSuggestions = async () => {
    const allConfirmed = Array.from(allLeagueSuggestions.values())
      .flat()
      .filter(s => s.confirmed);
    
    if (allConfirmed.length === 0) {
      toast({
        title: 'Keine Bestätigungen',
        description: 'Bitte bestätigen Sie mindestens einen Vorschlag.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedTargetSeason) {
      toast({
        title: 'Keine Ziel-Saison',
        description: 'Bitte wählen Sie eine Ziel-Saison für die Änderungen aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await applyPromotionRelegation(allConfirmed, selectedTargetSeason);
      
      toast({
        title: 'Auf-/Abstiege angewendet',
        description: `${res.moved} Mannschaft(en) verschoben${res.skipped.length ? `, ${res.skipped.length} übersprungen` : ''}.`,
      });
      setSkippedInfo(res.skipped);
      if (res.skipped.length > 0) {
        // Übersprungene sind i.d.R. normal (nicht gemeldet / offene Klassen) -> Info, kein Fehler
        logDebug('Auf-/Abstieg übersprungen:', res.skipped.join(' | '));
      }
      
      setShowAllLeagues(false);
      setAllLeagueSuggestions(new Map());
      // Nachher-Übersicht laden, damit der Nutzer die Einteilung prüfen/nachjustieren kann.
      await loadLigaEinteilung(selectedTargetSeason);
      
    } catch (error: any) {
      logError('Error applying all league suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Änderungen konnten nicht angewendet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Lädt alle Mannschaften der Ziel-Saison + deren Ligen für die Nachher-Übersicht.
  const loadLigaEinteilung = async (targetSeasonId: string) => {
    if (!targetSeasonId) return;
    setIsLoadingEinteilung(true);
    try {
      // Ziel-Ligen laden (nach order sortiert)
      const ligenSnap = await getDocs(query(collection(db, 'rwk_leagues'), where('seasonId', '==', targetSeasonId)));
      const ligen = ligenSnap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) } as League))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setZielLigen(ligen);

      // Vereinsnamen auflösen
      const clubsSnap = await getDocs(collection(db, 'clubs'));
      const clubName = new Map<string, string>();
      clubsSnap.docs.forEach(c => clubName.set(c.id, (c.data() as any).name || c.id));

      // Schützennamen auflösen (für Einzel-Nachnamen-Abgleich)
      const shootersSnap = await getDocs(collection(db, 'shooters'));
      const shooterName = new Map<string, string>();
      shootersSnap.docs.forEach(s => {
        const sd = s.data() as any;
        const nm = (sd.firstName && sd.lastName) ? `${sd.firstName} ${sd.lastName}` : (sd.name || '');
        shooterName.set(s.id, nm);
      });

      // Vorjahres-Ringzahlen nach normalisiertem Teamnamen (aus der Analyse: teamStandings)
      const normTeam = (n?: string) => (n || '').toLowerCase().replace(/\be\.?\s*v\.?(?=\s|$)/g, ' ').replace(/[.\s]/g, '');
      const ringeByName = new Map<string, number>();
      teamStandings.forEach((st: any) => {
        if (st?.teamName && typeof st.totalScore === 'number') {
          ringeByName.set(normTeam(st.teamName), st.totalScore);
        }
      });

      // Teams der Ziel-Saison laden
      const teamsSnap = await getDocs(query(collection(db, 'rwk_teams'), where('seasonId', '==', targetSeasonId)));
      const ligaTypeById = new Map(ligen.map(l => [l.id, l.type]));
      const teams = teamsSnap.docs.map(d => {
        const data = d.data() as any;
        const count = data.shooterIds?.length || 0;
        const ringe = ringeByName.get(normTeam(data.name || ''));
        // Disziplin bevorzugt aus der zugeordneten Liga (aktuell), sonst vom Team-Feld
        const leagueType = (data.leagueId && ligaTypeById.get(data.leagueId)) || data.leagueType || null;
        return {
          docId: d.id,
          name: data.name || 'Unbenannt',
          clubId: data.clubId || '',
          clubName: clubName.get(data.clubId) || data.clubName || '',
          leagueId: data.leagueId ?? null,
          leagueType,
          shooterCount: count,
          isEinzel: count < 3 || String(data.name || '').toLowerCase().includes('einzel'),
          ringe: typeof ringe === 'number' ? ringe : null,
          schuetzenNamen: (data.shooterIds || []).map((id: string) => shooterName.get(id)).filter(Boolean) as string[],
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      setLigaEinteilung(teams);
      setShowEinteilung(true);
    } catch (error) {
      logError('Fehler beim Laden der Liga-Einteilung:', error);
      toast({ title: 'Fehler', description: 'Liga-Einteilung konnte nicht geladen werden.', variant: 'destructive' });
    } finally {
      setIsLoadingEinteilung(false);
    }
  };

  // Disziplin-Kategorie für den Schutz beim Verschieben (LGA/LGS/LP/KK getrennt).
  const disziplinKat = (type?: string | null): string => {
    const t = (type || '').toUpperCase();
    if (t === 'LGA') return 'LG-AUFLAGE';
    if (t === 'LGS' || t === 'LG') return 'LG-FREIHAND';
    if (t === 'LP' || t === 'LPA') return 'LP';
    if (t === 'KK' || t === 'KKG') return 'KK';
    if (t === 'KKP') return 'KKP';
    return t || '?';
  };

  // Ändert die Liga-Zuordnung eines einzelnen Teams direkt in der Übersicht.
  // WICHTIG: Ein Team darf NUR innerhalb derselben Disziplin verschoben werden.
  // Die Disziplin (leagueType) des Teams wird dabei NIE verändert – so kann eine
  // LGA-Mannschaft nicht versehentlich zu LP werden.
  const changeTeamLeague = async (docId: string, newLeagueId: string) => {
    const team = ligaEinteilung.find(t => t.docId === docId);
    const liga = zielLigen.find(l => l.id === newLeagueId);
    // "Nicht zugewiesen" (leerer Wert) ist immer erlaubt – nur die Liga wird entfernt.
    if (liga && team && team.leagueType && disziplinKat(team.leagueType) !== disziplinKat(liga.type)) {
      toast({
        title: 'Verschieben nicht möglich',
        description: `„${team.name}" ist eine ${team.leagueType}-Mannschaft und kann nicht in die ${liga.type}-Liga „${liga.name}" verschoben werden.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      await updateDoc(doc(db, 'rwk_teams', docId), {
        leagueId: newLeagueId || null,
        // leagueType NICHT überschreiben – Disziplin des Teams bleibt immer erhalten.
      });
      setLigaEinteilung(prev => prev.map(t => t.docId === docId ? { ...t, leagueId: newLeagueId || null } : t));
      toast({ title: 'Gespeichert', description: 'Liga-Zuordnung aktualisiert.' });
    } catch (error) {
      logError('Fehler beim Ändern der Liga-Zuordnung:', error);
      toast({ title: 'Fehler', description: 'Zuordnung konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  // Ligagrößen ausgleichen (Mannschaften deterministisch, Einzelstarter per KI) und
  // die Vorschläge direkt anwenden. Alles bleibt danach per Drag & Drop anpassbar.
  const ligaAusgleichAnwenden = async () => {
    if (ligaEinteilung.length === 0) return;
    setIsAusgleich(true);
    try {
      // 1) Deterministischer Größen-Ausgleich für echte Mannschaften (LGA)
      const mannschaften = ligaEinteilung.filter(t => !t.isEinzel);
      const ausgleichTeams = mannschaften.map(t => ({
        docId: t.docId, name: t.name, clubId: t.clubId, leagueId: t.leagueId, leagueType: t.leagueType, ringe: t.ringe,
      }));
      const ausgleichLigen = zielLigen.map(l => ({ id: l.id, name: l.name, type: l.type, order: l.order || 0 }));
      const vorschlaege = berechneLigaAusgleich(ausgleichTeams, ausgleichLigen);

      // Änderungen der Mannschaften in Map sammeln
      const neueZuordnung = new Map<string, string>(); // docId -> ligaId
      vorschlaege.forEach(v => neueZuordnung.set(v.docId, v.nachLigaId));

      // 2) Einzelstarter per KI-Route zuordnen
      // Mannschaften mit ihrer (ggf. neuen) Liga für den Kontext
      const ligaById = new Map(zielLigen.map(l => [l.id, l]));
      const mannschaftInput = mannschaften.map(t => {
        const ligaId = neueZuordnung.get(t.docId) || t.leagueId || '';
        const liga = ligaById.get(ligaId);
        return {
          name: t.name, clubId: t.clubId, ligaId,
          ligaName: liga?.name || '', ligaOrder: liga?.order || 0,
          schuetzen: t.schuetzenNamen,
        };
      }).filter(m => m.ligaId);
      const einzelInput = ligaEinteilung.filter(t => t.isEinzel).map(t => ({
        docId: t.docId, name: t.name, clubId: t.clubId, schuetzen: t.schuetzenNamen, ringe: t.ringe,
      }));
      // nur LGA-Ligen an die KI (Auflage)
      const lgaLigenInput = zielLigen.filter(l => (l.type || '').toUpperCase() === 'LGA').map(l => ({ id: l.id, name: l.name, order: l.order || 0 }));

      let einzelZuordnungen: Array<{ docId: string; ligaId: string }> = [];
      if (einzelInput.length > 0 && lgaLigenInput.length > 0) {
        try {
          const resp = await fetch('/api/admin/liga-einteilung-einzel-ki', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ einzel: einzelInput, mannschaften: mannschaftInput, ligen: lgaLigenInput }),
          });
          if (resp.ok) {
            const data = await resp.json();
            einzelZuordnungen = (data.zuordnungen || []).map((z: any) => ({ docId: z.docId, ligaId: z.ligaId }));
          }
        } catch (kiErr) {
          logDebug('Einzel-KI nicht erreichbar, Einzel bleiben unverändert:', String(kiErr));
        }
      }
      einzelZuordnungen.forEach(z => { if (z.ligaId) neueZuordnung.set(z.docId, z.ligaId); });

      // 3) Änderungen in einem Batch schreiben
      if (neueZuordnung.size === 0) {
        toast({ title: 'Keine Änderung', description: 'Die Einteilung ist bereits ausgeglichen.' });
        return;
      }
      const batch = writeBatch(db);
      let count = 0;
      neueZuordnung.forEach((ligaId, docId) => {
        const t = ligaEinteilung.find(x => x.docId === docId);
        if (!t || t.leagueId === ligaId) return;
        const liga = ligaById.get(ligaId);
        // leagueType nur setzen, wenn das Team noch KEINE Disziplin hat (neu/„Nicht
        // zugewiesen"). Vorhandene Disziplin wird nie überschrieben.
        const setType = liga && !t.leagueType ? { leagueType: liga.type } : {};
        batch.update(doc(db, 'rwk_teams', docId), { leagueId: ligaId, ...setType });
        count++;
      });
      if (count > 0) await batch.commit();

      // 4) Lokalen State aktualisieren
      setLigaEinteilung(prev => prev.map(t => neueZuordnung.has(t.docId) ? { ...t, leagueId: neueZuordnung.get(t.docId)! } : t));
      toast({ title: 'Ligagrößen ausgeglichen', description: `${count} Mannschaft(en)/Einzel neu zugeordnet. Bei Bedarf per Drag & Drop anpassen.` });
    } catch (error) {
      logError('Ligagrößen-Ausgleich fehlgeschlagen:', error);
      toast({ title: 'Fehler', description: 'Ausgleich konnte nicht durchgeführt werden.', variant: 'destructive' });
    } finally {
      setIsAusgleich(false);
    }
  };

  // Erzeugt einen Kontroll-Text der Einteilung (Liga → Mannschaft → Schützen) und
  // kopiert ihn in die Zwischenablage (z. B. für die Mail an die Sportleiter).
  const einteilungAlsText = (): string => {
    const saisonName = seasons.find(s => s.id === selectedTargetSeason)?.name || 'Saison';
    const zeilen: string[] = [`Liga-Einteilung ${saisonName}`, ''];
    // Reihenfolge: echte Ligen nach order, dann "Nicht zugewiesen"
    const ligenSortiert = [...zielLigen].sort((a, b) => (a.order || 0) - (b.order || 0));
    const gruppen: Array<{ id: string; label: string }> = [
      ...ligenSortiert.map(l => ({ id: l.id, label: `${l.name}${l.type ? ` (${l.type})` : ''}` })),
      { id: '__none__', label: 'Nicht zugewiesen' },
    ];
    for (const g of gruppen) {
      const teams = ligaEinteilung
        .filter(t => (g.id === '__none__' ? !t.leagueId : t.leagueId === g.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      if (teams.length === 0) continue;
      zeilen.push(`=== ${g.label} ===`);
      for (const t of teams) {
        const einzelMark = t.isEinzel ? ' [Einzel]' : '';
        zeilen.push(`${t.name}${einzelMark}`);
        if (t.schuetzenNamen && t.schuetzenNamen.length > 0) {
          for (const s of t.schuetzenNamen) zeilen.push(`   - ${s}`);
        }
      }
      zeilen.push('');
    }
    return zeilen.join('\n').trim();
  };

  const einteilungKopieren = async () => {
    const text = einteilungAlsText();
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Kopiert', description: 'Die Einteilung wurde in die Zwischenablage kopiert.' });
    } catch {
      // Fallback: als Datei herunterladen, falls Clipboard nicht verfügbar
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Liga-Einteilung_${(seasons.find(s => s.id === selectedTargetSeason)?.name || 'Saison').replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: 'Heruntergeladen', description: 'Die Einteilung wurde als Textdatei gespeichert.' });
    }
  };

  const toggleSuggestionConfirmation = (teamId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.teamId === teamId ? { ...s, confirmed: !s.confirmed } : s
    ));
  };

  const generateAllLeagueSuggestions = async () => {
    if (!selectedSourceSeason) {
      toast({
        title: 'Fehlende Auswahl',
        description: 'Bitte wählen Sie eine Saison aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
      if (!selectedSeason) return;

      const allSuggestions = new Map<string, PromotionRelegationSuggestion[]>();
      
      // Sortiere Ligen nach Hierarchie für bessere Darstellung
      const sortedLeagues = [...leagues].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const allStandings = new Map();
      
      for (const league of sortedLeagues) {
        try {
          const leagueSuggestions = await generatePromotionRelegationSuggestions(
            league.id,
            selectedSeason.competitionYear,
            leagues,
            withdrawnTeams
          );
          
          if (leagueSuggestions.length > 0) {
            allSuggestions.set(league.id, leagueSuggestions);
            
            // Team-Ergebnisse für diese Liga laden
            const standings = await calculateLeagueStandings(league.id, selectedSeason.competitionYear);
            standings.forEach(standing => {
              allStandings.set(standing.teamId, standing);
            });
          }
        } catch (error) {
          logError(`Error generating suggestions for league ${league.name}:`, error);
        }
      }
      
      setTeamStandings(allStandings);
      
      setAllLeagueSuggestions(allSuggestions);
      setShowAllLeagues(true);
      setShowSuggestions(false); // Einzelansicht ausblenden
      
      const totalSuggestions = Array.from(allSuggestions.values()).reduce((sum, suggestions) => sum + suggestions.length, 0);
      
      toast({
        title: 'Alle Ligen analysiert',
        description: `${allSuggestions.size} Ligen mit insgesamt ${totalSuggestions} Auf-/Abstiegs-Vorschlägen erstellt.`
      });
      
    } catch (error: any) {
      logError('Error generating all league suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Vorschläge für alle Ligen konnten nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToPDF = () => {
    if (allLeagueSuggestions.size === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Bitte analysieren Sie zuerst alle Ligen.',
        variant: 'destructive'
      });
      return;
    }

    const doc = new jsPDF('landscape');
    const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
    
    // Logo hinzufügen
    try {
      doc.addImage('/images/logo2.png', 'PNG', 240, 10, 30, 30);
    } catch (error) {
      logDebug('Logo konnte nicht geladen werden:', error instanceof Error ? error.message : String(error));
    }
    
    // Header
    doc.setFontSize(16);
    doc.text('Auf-/Abstiegsanalyse RWK Einbeck', 20, 20);
    doc.setFontSize(12);
    doc.text(`Saison: ${selectedSeason?.name || 'Unbekannt'}`, 20, 30);
    const dateFormatted = new Date().toLocaleDateString('de-DE');
    doc.text(`Erstellt am: ${dateFormatted}`, 20, 40);
    
    let yPosition = 50;
    
    // Für jede Liga eine Tabelle
    Array.from(allLeagueSuggestions.entries())
      .sort(([aId], [bId]) => {
        const aLeague = leagues.find(l => l.id === aId);
        const bLeague = leagues.find(l => l.id === bId);
        return (aLeague?.order || 0) - (bLeague?.order || 0);
      })
      .forEach(([leagueId, leagueSuggestions]) => {
        const league = leagues.find(l => l.id === leagueId);
        if (!league) return;
        
        // Liga-Überschrift
        doc.setFontSize(14);
        const sanitizedLeagueName = String(league.name || '').replace(/[<>"'&]/g, '');
        const sanitizedLeagueType = String(league.type || '').replace(/[<>"'&]/g, '');
        doc.text(`${sanitizedLeagueName} (${sanitizedLeagueType})`, 20, yPosition);
        yPosition += 10;
        
        // Tabellendaten vorbereiten
        const tableData = leagueSuggestions.map(suggestion => {
          const teamStanding = teamStandings.get(suggestion.teamId);
          const actionText = suggestion.action === 'promote' ? 'Aufstieg' : 
                           suggestion.action === 'relegate' ? 'Abstieg' : 'Verbleibt';
          
          // Sanitize all user-generated content
          const sanitizedTeamName = String(suggestion.teamName || '').replace(/[<>"'&]/g, '');
          const sanitizedReason = String(suggestion.reason || '').replace(/[<>"'&]/g, '');
          
          return [
            suggestion.currentPosition.toString(),
            sanitizedTeamName,
            teamStanding ? `${teamStanding.totalScore}` : '-',
            actionText,
            sanitizedReason
          ];
        });
        
        // Tabelle erstellen
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Platz', 'Mannschaft', 'Ringe', 'Aktion', 'Begründung']],
          // amazonq-ignore-next-line
          body: tableData,

          headStyles: { fillColor: [41, 128, 185] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { cellWidth: 60 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 30 },
            4: { cellWidth: 140 }
          },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          didParseCell: function(data: any) {
            if (data.column.index === 3) {
              const cellText = String(data.cell.text[0] || '').replace(/[<>"'&]/g, '');
              if (cellText === 'Aufstieg') {
                data.cell.styles.textColor = [0, 128, 0];
                data.cell.styles.fontStyle = 'bold';
              } else if (cellText === 'Abstieg') {
                data.cell.styles.textColor = [255, 0, 0];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
        
        // Neue Seite wenn nötig
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
    
    // PDF speichern
    const sanitizedYear = String(selectedSeason?.competitionYear || 'Unbekannt').replace(/[<>"'&\/\\]/g, '');
    const fileName = `RWK_Auf_Abstieg_${sanitizedYear}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF erstellt',
      description: `Auf-/Abstiegsanalyse wurde als ${fileName} gespeichert.`
    });
  };

  const applySuggestions = async () => {
    const confirmedSuggestions = suggestions.filter(s => s.confirmed);
    
    if (confirmedSuggestions.length === 0) {
      toast({
        title: 'Keine Bestätigungen',
        description: 'Bitte bestätigen Sie mindestens einen Vorschlag.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedTargetSeason) {
      toast({
        title: 'Keine Ziel-Saison',
        description: 'Bitte wählen Sie eine Ziel-Saison für die Änderungen aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await applyPromotionRelegation(suggestions, selectedTargetSeason);
      
      toast({
        title: 'Auf-/Abstiege angewendet',
        description: `${res.moved} Mannschaft(en) verschoben${res.skipped.length ? `, ${res.skipped.length} übersprungen` : ''}.`,
      });
      setSkippedInfo(res.skipped);
      if (res.skipped.length > 0) {
        logDebug('Auf-/Abstieg übersprungen:', res.skipped.join(' | '));
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
      await loadLigaEinteilung(selectedTargetSeason);
      
    } catch (error: any) {
      logError('Error applying suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Änderungen konnten nicht angewendet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ArrowUpDown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Auf- & Abstiege</h1>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Auf-/Abstieg</CardTitle>
              <CardDescription>
                Verwalten Sie den Auf- und Abstieg von Mannschaften zwischen Ligen.
                Basierend auf den Ergebnissen der aktuellen Saison werden Mannschaften automatisch auf- oder absteigen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Hinweis:</strong> Die Analyse aller Ligen kann 2-3 Minuten dauern. Bitte haben Sie Geduld und schließen Sie die Seite nicht.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonSelect">Saison</Label>
                  <Select
                    value={selectedSourceSeason}
                    onValueChange={setSelectedSourceSeason}
                    disabled={isLoading || isProcessing}
                  >
                    <SelectTrigger id="seasonSelect">
                      <SelectValue placeholder="Saison auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map(season => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name} ({season.competitionYear})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="leagueSelect">Liga</Label>
                  <Select
                    value={selectedLeague}
                    onValueChange={setSelectedLeague}
                    disabled={isLoading || isProcessing || !selectedSourceSeason}
                  >
                    <SelectTrigger id="leagueSelect">
                      <SelectValue placeholder="Liga auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues.map(league => {
                        const sanitizedName = league.name.replace(/[<>"'&]/g, '');
                        const sanitizedType = league.type.replace(/[<>"'&]/g, '');
                        return (
                          <SelectItem key={league.id} value={league.id}>
                            {sanitizedName} ({sanitizedType})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ziel-Saison: wohin die bestätigten Auf-/Abstiege angewendet werden */}
              <div className="space-y-2">
                <Label htmlFor="targetSeasonSelect">Ziel-Saison (für „Bestätigte anwenden")</Label>
                <Select
                  value={selectedTargetSeason}
                  onValueChange={setSelectedTargetSeason}
                  disabled={isLoading || isProcessing}
                >
                  <SelectTrigger id="targetSeasonSelect">
                    <SelectValue placeholder="Ziel-Saison auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons
                      .filter(s => s.id !== selectedSourceSeason)
                      .map(season => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name} ({season.competitionYear}){season.status ? ` – ${season.status}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Die neue Saison zuerst unter „Saisonwechsel" erstellen (kopiert die Mannschaften 1:1).
                  Hier auswählen, damit die bestätigten Auf-/Abstiege dort angewendet werden – die
                  Quell-Saison bleibt unverändert.
                </p>
              </div>

              {/* Abmeldungen verwalten */}
              {availableTeams.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nach Meldeschluss abgemeldet</CardTitle>
                      <CardDescription>
                        Teams, die nach Meldeschluss abgemeldet werden, steigen automatisch ab.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {availableTeams.map(team => (
                          <div key={team.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`withdraw-${team.id}`}
                              checked={withdrawnTeams.includes(team.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWithdrawnTeams(prev => [...prev, team.id]);
                                } else {
                                  setWithdrawnTeams(prev => prev.filter(id => id !== team.id));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`withdraw-${team.id}`} className="text-sm">
                              {team.name} ({team.clubName})
                            </label>
                          </div>
                        ))}
                      </div>
                      {withdrawnTeams.length > 0 && (
                        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                          <p className="text-sm text-red-800">
                            <strong>{withdrawnTeams.length} Team(s) abgemeldet:</strong> Steigen automatisch ab.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nicht mehr gemeldet</CardTitle>
                      <CardDescription>
                        Teams, die sich für die neue Saison nicht mehr melden.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {availableTeams.map(team => (
                          <div key={`not-registered-${team.id}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`not-registered-${team.id}`}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`not-registered-${team.id}`} className="text-sm">
                              {team.name} ({team.clubName})
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={generateSuggestions}
                  disabled={!selectedSourceSeason || !selectedLeague || isProcessing || !user}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Einzelne Liga
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={generateAllLeagueSuggestions}
                  disabled={!selectedSourceSeason || isProcessing || !user || leagues.length === 0}
                  className="flex-1"
                  variant="outline"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere alle...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Alle Ligen analysieren (2-3 Min)
                    </>
                  )}
                </Button>
                
                {showSuggestions && (
                  <Button
                    onClick={applySuggestions}
                    disabled={isProcessing || suggestions.filter(s => s.confirmed).length === 0}
                    variant="default"
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Bestätigte anwenden
                  </Button>
                )}

                <Button
                  onClick={() => loadLigaEinteilung(selectedTargetSeason)}
                  disabled={!selectedTargetSeason || isLoadingEinteilung}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Aktuelle Einteilung anzeigen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tipp: Über „Aktuelle Einteilung anzeigen" kommst du auch <strong>ohne Analyse</strong> direkt zur Liga-Einteilung
                (Ziel-Saison wählen genügt) – dort siehst du alle Mannschaften mit Schützen und kannst sie per Drag &amp; Drop
                sortieren. Die Analyse brauchst du nur für den automatischen Auf-/Abstieg und den Ligagrößen-Ausgleich nach Ringzahl.
              </p>
              
              {showSuggestions && suggestions.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Auf-/Abstiegs-Vorschläge</CardTitle>
                    <CardDescription>
                      Überprüfen Sie die Vorschläge und bestätigen Sie die gewünschten Änderungen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">✓</TableHead>
                          <TableHead>Mannschaft</TableHead>
                          <TableHead>Verein</TableHead>
                          <TableHead className="text-center">Platz</TableHead>
                          <TableHead className="text-center">Ergebnis</TableHead>
                          <TableHead>Aktion</TableHead>
                          <TableHead>Grund</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map(suggestion => {
                          const teamStanding = teamStandings.get(suggestion.teamId);
                          
                          return (
                            <TableRow key={suggestion.teamId}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={suggestion.confirmed}
                                  onChange={() => toggleSuggestionConfirmation(suggestion.teamId)}
                                  className="w-4 h-4"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {suggestion.teamName}
                              </TableCell>
                              <TableCell>{suggestion.clubName}</TableCell>
                              <TableCell className="text-center">
                                {suggestion.currentPosition}
                              </TableCell>
                              <TableCell className="text-center font-mono">
                                {teamStanding ? `${teamStanding.totalScore} Ringe` : 'Lädt...'}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={suggestion.action === 'promote' ? 'default' : 
                                          suggestion.action === 'relegate' ? 'destructive' : 'secondary'}
                                  className="flex items-center w-fit"
                                >
                                  {suggestion.action === 'promote' && <ArrowUp className="w-3 h-3 mr-1" />}
                                  {suggestion.action === 'relegate' && <ArrowDown className="w-3 h-3 mr-1" />}
                                  {suggestion.action === 'promote' ? 'Aufstieg' : 
                                   suggestion.action === 'relegate' ? 'Abstieg' : 'Verbleibt'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {suggestion.reason}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <strong>Hinweis:</strong> Diese Vorschläge berücksichtigen die aktuellen Tabellenstände. 
                        Bei fehlenden Mannschaften oder besonderen Umständen können manuelle Anpassungen erforderlich sein.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Alle Ligen Übersicht */}
              {showAllLeagues && allLeagueSuggestions.size > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Auf-/Abstiegs-Übersicht aller Ligen</CardTitle>
                    <CardDescription>
                      Vergleichen Sie die Vorschläge aller Ligen und bestätigen Sie die gewünschten Änderungen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Array.from(allLeagueSuggestions.entries())
                      .sort(([aId], [bId]) => {
                        const aLeague = leagues.find(l => l.id === aId);
                        const bLeague = leagues.find(l => l.id === bId);
                        return (aLeague?.order || 0) - (bLeague?.order || 0);
                      })
                      .map(([leagueId, leagueSuggestions]) => {
                        const league = leagues.find(l => l.id === leagueId);
                        if (!league) return null;
                        
                        return (
                          <div key={leagueId} className="border rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-3 text-primary">
                              {league.name} ({league.type})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">✓</TableHead>
                                  <TableHead>Mannschaft</TableHead>
                                  <TableHead>Verein</TableHead>
                                  <TableHead className="text-center">Platz</TableHead>
                                  <TableHead className="text-center">Ergebnis</TableHead>
                                  <TableHead>Aktion</TableHead>
                                  <TableHead>Grund</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {leagueSuggestions.map(suggestion => {
                                  const teamStanding = teamStandings.get(suggestion.teamId);
                                  
                                  return (
                                    <TableRow key={`${leagueId}-${suggestion.teamId}`}>
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={suggestion.confirmed}
                                          onChange={() => {
                                            const updatedSuggestions = new Map(allLeagueSuggestions);
                                            const updated = updatedSuggestions.get(leagueId)?.map(s => 
                                              s.teamId === suggestion.teamId ? { ...s, confirmed: !s.confirmed } : s
                                            );
                                            if (updated) {
                                              updatedSuggestions.set(leagueId, updated);
                                              setAllLeagueSuggestions(updatedSuggestions);
                                            }
                                          }}
                                          className="w-4 h-4"
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {suggestion.teamName}
                                      </TableCell>
                                      <TableCell>{suggestion.clubName}</TableCell>
                                      <TableCell className="text-center">
                                        {suggestion.currentPosition}
                                      </TableCell>
                                      <TableCell className="text-center font-mono">
                                        {teamStanding ? `${teamStanding.totalScore} Ringe` : 'Lädt...'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={suggestion.action === 'promote' ? 'default' : 
                                                  suggestion.action === 'relegate' ? 'destructive' : 
                                                  suggestion.action === 'compare' ? 'secondary' : 'outline'}
                                          className="flex items-center w-fit"
                                        >
                                          {suggestion.action === 'promote' && <ArrowUp className="w-3 h-3 mr-1" />}
                                          {suggestion.action === 'relegate' && <ArrowDown className="w-3 h-3 mr-1" />}
                                          {suggestion.action === 'promote' ? 'Aufstieg' : 
                                           suggestion.action === 'relegate' ? 'Abstieg' : 
                                           suggestion.action === 'compare' ? 'Vergleich' : 'Verbleibt'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {suggestion.reason}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => {
                          // Alle bestätigen
                          const updatedSuggestions = new Map();
                          allLeagueSuggestions.forEach((suggestions, leagueId) => {
                            updatedSuggestions.set(leagueId, suggestions.map(s => ({ ...s, confirmed: true })));
                          });
                          setAllLeagueSuggestions(updatedSuggestions);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Alle bestätigen
                      </Button>
                      
                      <Button
                        onClick={() => {
                          // Alle abwählen
                          const updatedSuggestions = new Map();
                          allLeagueSuggestions.forEach((suggestions, leagueId) => {
                            updatedSuggestions.set(leagueId, suggestions.map(s => ({ ...s, confirmed: false })));
                          });
                          setAllLeagueSuggestions(updatedSuggestions);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Alle abwählen
                      </Button>
                      
                      <Button
                        onClick={() => exportToPDF()}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF Export
                      </Button>
                      
                      <Button
                        onClick={applyAllLeagueSuggestions}
                        disabled={isProcessing || !hasConfirmedSuggestions()}
                        className="ml-auto"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Bestätigte anwenden
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nachher-Übersicht: Liga-Einteilung der Ziel-Saison, nach Liga gruppiert,
                  mit Dropdown pro Team zum direkten Umsortieren (inkl. "Nicht zugewiesen"). */}
              {showEinteilung && (
                <Card className="mt-4">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">Liga-Einteilung {seasons.find(s => s.id === selectedTargetSeason)?.name || ''}</CardTitle>
                        <CardDescription>
                          Prüfen Sie die Einteilung und ordnen Sie einzelne Mannschaften bei Bedarf direkt einer anderen Liga zu.
                          Änderungen werden sofort gespeichert.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="default" size="sm" onClick={ligaAusgleichAnwenden} disabled={isAusgleich || isLoadingEinteilung}>
                          {isAusgleich ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gleiche aus…</> : 'Ligagrößen ausgleichen'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={einteilungKopieren} disabled={isLoadingEinteilung || ligaEinteilung.length === 0}>
                          <FileText className="mr-2 h-4 w-4" />
                          Als Text kopieren
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => loadLigaEinteilung(selectedTargetSeason)} disabled={isLoadingEinteilung}>
                          {isLoadingEinteilung ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aktualisieren'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoadingEinteilung ? (
                      <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade Einteilung…</div>
                    ) : (
                      <>
                        {/* Übersprungene Mannschaften des letzten Anwendens – sichtbar ausgeben */}
                        {skippedInfo.length > 0 && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                              {skippedInfo.length} Mannschaft(en) wurden nicht automatisch verschoben:
                            </p>
                            <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc pl-5 space-y-0.5">
                              {skippedInfo.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                              Das ist meist normal (Mannschaft dieses Jahr nicht gemeldet oder offene Klasse ohne Auf-/Abstieg).
                              Bei Bedarf unten manuell zuordnen.
                            </p>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground">
                          Mannschaften per <strong>Drag &amp; Drop</strong> in eine andere Liga ziehen – oder am Handy das Dropdown nutzen. Änderungen werden sofort gespeichert.
                        </p>

                        {/* Gesamt-Aufzählung nach Disziplin (Mannschaften + Einzel) */}
                        {(() => {
                          const zaehler = new Map<string, { mannschaften: number; einzel: number }>();
                          ligaEinteilung.forEach(t => {
                            const typ = (t.leagueType || '—').toUpperCase();
                            if (!zaehler.has(typ)) zaehler.set(typ, { mannschaften: 0, einzel: 0 });
                            const e = zaehler.get(typ)!;
                            if (t.isEinzel) e.einzel++; else e.mannschaften++;
                          });
                          const reihenfolge = ['LGA', 'LGS', 'LG', 'LP', 'LPA', 'KKG', 'KK', 'KKP'];
                          const eintraege = Array.from(zaehler.entries()).sort((a, b) => {
                            const ia = reihenfolge.indexOf(a[0]); const ib = reihenfolge.indexOf(b[0]);
                            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                          });
                          if (eintraege.length === 0) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-medium text-muted-foreground">Meldungen gesamt:</span>
                              {eintraege.map(([typ, v]) => (
                                <span key={typ} className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-medium">
                                  {typ}: {v.mannschaften} {v.mannschaften === 1 ? 'Mannschaft' : 'Mannschaften'}{v.einzel > 0 ? ` + ${v.einzel} Einzel` : ''}
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Pro Liga (order-sortiert) + am Ende "Nicht zugewiesen" */}
                        {[...zielLigen, { id: '__none__', name: 'Nicht zugewiesen', type: '', competitionYear: 0, seasonId: '' } as League].map(liga => {
                          const teamsInLiga = ligaEinteilung.filter(t =>
                            liga.id === '__none__' ? !t.leagueId : t.leagueId === liga.id
                          );
                          const istNichtZugewiesen = liga.id === '__none__';
                          // "Nicht zugewiesen" immer anzeigen (als Drop-Ziel), andere nur mit Teams
                          if (teamsInLiga.length === 0 && !istNichtZugewiesen) return null;
                          const istDropZiel = liga.id !== '__none__';
                          const highlight = dragOverLeague === liga.id;
                          return (
                            <div
                              key={liga.id}
                              onDragOver={(e) => { if (istDropZiel || istNichtZugewiesen) { e.preventDefault(); setDragOverLeague(liga.id); } }}
                              onDragLeave={() => setDragOverLeague(prev => prev === liga.id ? null : prev)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverLeague(null);
                                const docId = e.dataTransfer.getData('text/plain');
                                if (!docId) return;
                                // "Nicht zugewiesen" als Ziel = Liga entfernen ('')
                                changeTeamLeague(docId, liga.id === '__none__' ? '' : liga.id);
                              }}
                              className={`border rounded-lg p-4 transition-all ${
                                highlight ? 'border-primary ring-2 ring-primary/40 bg-primary/5' :
                                istNichtZugewiesen ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''
                              }`}
                            >
                              <h4 className={`font-semibold text-base mb-3 ${istNichtZugewiesen ? 'text-amber-700 dark:text-amber-300' : 'text-primary'}`}>
                                {liga.name}{liga.type ? ` (${liga.type})` : ''} — {(() => {
                                  // Nur echte Mannschaften zählen (Einzel separat ausweisen)
                                  const mannschaftenAnzahl = teamsInLiga.filter(t => !t.isEinzel).length;
                                  const einzelAnzahl = teamsInLiga.length - mannschaftenAnzahl;
                                  const teil = `${mannschaftenAnzahl} ${mannschaftenAnzahl === 1 ? 'Mannschaft' : 'Mannschaften'}`;
                                  const einzelTeil = einzelAnzahl > 0 ? ` + ${einzelAnzahl} Einzel` : '';
                                  return `${teil}${einzelTeil}`;
                                })()}
                              </h4>
                              {teamsInLiga.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Mannschaft hierher ziehen…</p>
                              ) : (
                                <div className="space-y-2">
                                  {teamsInLiga.map(t => (
                                    <div
                                      key={t.docId}
                                      draggable
                                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.docId); e.currentTarget.style.opacity = '0.5'; }}
                                      onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
                                      className="border rounded-md bg-card px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-accent/50"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                          <span className="text-muted-foreground select-none">⠿</span>
                                          <span className="font-medium">{t.name}</span>
                                          {t.leagueType && <Badge variant="outline" className="font-mono">{t.leagueType}</Badge>}
                                          {t.isEinzel && <Badge variant="secondary">Einzel</Badge>}
                                          <span className="text-sm text-muted-foreground">{t.clubName}</span>
                                        </div>
                                        <div className="w-full sm:w-56 sm:hidden">
                                          <Select value={t.leagueId || ''} onValueChange={(v) => changeTeamLeague(t.docId, v)}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Liga wählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {zielLigen.map(l => (
                                                <SelectItem key={l.id} value={l.id}>{l.name} ({l.type})</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      {t.schuetzenNamen && t.schuetzenNamen.length > 0 && (
                                        <div className="mt-1 pl-6 text-xs text-muted-foreground">
                                          {t.schuetzenNamen.join(' · ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Tipp:</strong> Neu gemeldete Mannschaften ohne Vorjahr erscheinen unter „Nicht zugewiesen".
                            Ziehen Sie sie in die passende Liga (neue Mannschaften starten laut RWK-Ordnung in der niedrigsten Liga).
                            Wenn alles stimmt, kann die Saison unter „Saisonverwaltung" auf „Laufend" gesetzt werden.
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <p>
                Diese Funktion verwaltet den Auf- und Abstieg von Mannschaften zwischen Ligen.
                Basierend auf den Ergebnissen der aktuellen Saison werden Mannschaften automatisch auf- oder absteigen.
                <strong>Hinweis:</strong> Diese Funktion kann nur vom Administrator ausgeführt werden.
              </p>
            </CardFooter>
          </Card>
    </div>
  );
}

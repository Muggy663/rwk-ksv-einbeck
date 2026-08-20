"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Award, Loader2, ArrowLeft } from 'lucide-react';
import { CertificateGenerator } from '@/lib/utils/certificate-generator';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchTopShooters, fetchTopTeams, fetchBestOverallShooters } from '@/lib/utils/certificate-data-generator';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';

export default function CertificatesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string; type: string; shortName: string; discipline: string }>>([]);
  const [combinePdf, setCombinePdf] = useState<boolean>(true);
  const [numTopShooters, setNumTopShooters] = useState<number>(3);
  const [numTopTeams, setNumTopTeams] = useState<number>(2);
  const [includeAkCertificates, setIncludeAkCertificates] = useState<boolean>(true);
  const [generateOverallBest, setGenerateOverallBest] = useState<boolean>(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [ceremonyDate, setCeremonyDate] = useState<string>('');
  const [ceremonyLocation, setCeremonyLocation] = useState<string>('Einbeck');
  
  const todayFormatted = format(new Date(), 'dd.MM.yyyy', { locale: de });

  // Lade verfügbare Saisons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          orderBy('competitionYear', 'desc')
        );
        
        const snapshot = await getDocs(seasonsQuery);
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setSeasons(seasonsData);
        
        // Automatisch die neueste Saison auswählen
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        logError('Fehler beim Laden der Saisons:', error);
        toast({
          title: 'Fehler',
          description: 'Die Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    fetchSeasons();
  }, [toast]);

  // Lade Ligen für die ausgewählte Saison
  useEffect(() => {
    if (!selectedSeason) return;
    
    const fetchLeagues = async () => {
      try {
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSeason),
          orderBy('order', 'asc')
        );
        
        const snapshot = await getDocs(leaguesQuery);
        const typeToDiscipline: Record<string, string> = {
          'LGA': 'Luftgewehr Auflage', 'LG': 'Luftgewehr Freihand',
          'LP': 'Luftpistole', 'LPA': 'Luftpistole Auflage',
          'KK': 'Kleinkaliber', 'KKA': 'Kleinkaliber Auflage',
          'KKP': 'KK Pistole', 'SP': 'Sportpistole'
        };
        const leaguesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          type: doc.data().type,
          shortName: doc.data().type,
          discipline: typeToDiscipline[doc.data().type] || doc.data().shotSettings?.discipline || doc.data().name
        }));
        
        setLeagues(leaguesData);
        
        // Automatisch die erste Liga auswählen
        if (leaguesData.length > 0) {
          setSelectedLeague(leaguesData[0].id);
        } else {
          setSelectedLeague('');
        }
      } catch (error) {
        logError('Fehler beim Laden der Ligen:', error);
        toast({
          title: 'Fehler',
          description: 'Die Ligen konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };
    
    fetchLeagues();
  }, [selectedSeason, toast]);

  const generateLeagueCertificates = async () => {
    if (!selectedLeague || !selectedSeason) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie eine Liga und Saison aus.', variant: 'destructive' });
      return;
    }
    if (numTopShooters === 0 && numTopTeams === 0) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie mindestens eine Art von Urkunden aus.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      toast({ title: 'Info', description: 'Die Urkunden werden generiert. Dies kann einen Moment dauern.' });
      const currentDateFormatted = ceremonyDate ?
        format(new Date(ceremonyDate), 'dd. MMMM yyyy', { locale: de }) :
        format(new Date(), 'dd. MMMM yyyy', { locale: de });

      // Ligen bestimmen: eine oder alle
      const leagueIdsToProcess = selectedLeague === 'ALL'
        ? leagues.map(l => l.id)
        : [selectedLeague];

      const allCertificates = [];

      for (const leagueId of leagueIdsToProcess) {
        const leagueRef = doc(db, 'rwk_leagues', leagueId);
        const leagueSnap = await getDoc(leagueRef);
        if (!leagueSnap.exists()) continue;
        const leagueData = leagueSnap.data();
        const leagueName = leagueData.name;
        const seasonRef = doc(db, 'seasons', selectedSeason);
        const seasonSnap = await getDoc(seasonRef);
        if (!seasonSnap.exists()) continue;
        const seasonData = seasonSnap.data();
        const certificates = [];

        if (numTopShooters > 0) {
          const topShooters = await fetchTopShooters(leagueId, numTopShooters);
          for (const shooter of topShooters) {
            const substitutionsQuery = query(
              collection(db, 'team_substitutions'),
              where('replacementShooterId', '==', shooter.shooterId),
              where('competitionYear', '==', seasonData.competitionYear)
            );
            const substitutionsSnapshot = await getDocs(substitutionsQuery);
            let displayName = shooter.name;
            if (!substitutionsSnapshot.empty) {
              const substitution = substitutionsSnapshot.docs[0].data();
              displayName = `${shooter.name}\nErsatz ab DG${substitution.fromRound} für ${substitution.originalShooterName}`;
            }
            certificates.push({
              type: 'shooter',
              season: shooter.season.replace('RWK ', ''),
              discipline: shooter.discipline,
              category: leagueName,
              recipientName: shooter.teamName ? `${displayName}\n${shooter.teamName}` : displayName,
              score: shooter.totalScore.toString(),
              rank: shooter.rank,
              date: `${ceremonyLocation}, ${currentDateFormatted}`
            });
          }
        }

        if (numTopTeams > 0) {
          const topTeams = await fetchTopTeams(leagueId, numTopTeams);
          for (const team of topTeams) {
            if (team.isOutOfCompetition && !includeAkCertificates) continue;
            const replacedShooters = new Set();
            const teamMembersWithSubstitutions = [];
            if (team.teamMembersWithScores) {
              for (const member of team.teamMembersWithScores) {
                const q = query(collection(db, 'team_substitutions'), where('replacementShooterName', '==', member.name), where('competitionYear', '==', seasonData.competitionYear));
                const snap = await getDocs(q);
                if (!snap.empty) replacedShooters.add(snap.docs[0].data().originalShooterName);
              }
              for (const member of team.teamMembersWithScores) {
                if (replacedShooters.has(member.name)) continue;
                const q = query(collection(db, 'team_substitutions'), where('replacementShooterName', '==', member.name), where('competitionYear', '==', seasonData.competitionYear));
                const snap = await getDocs(q);
                let displayName = member.name;
                if (!snap.empty) {
                  const sub = snap.docs[0].data();
                  displayName = `${member.name} (Ersatz ab DG${sub.fromRound} für ${sub.originalShooterName})`;
                }
                teamMembersWithSubstitutions.push({ ...member, name: displayName });
              }
            }
            certificates.push({
              type: 'team',
              season: team.season.replace('RWK ', ''),
              discipline: team.discipline,
              category: team.isOutOfCompetition ? `${leagueName} (Außer Konkurrenz)` : leagueName,
              recipientName: team.name,
              teamMembersWithScores: teamMembersWithSubstitutions,
              score: (team.displayScore || team.totalScore).toString(),
              rank: team.rank,
              date: `${ceremonyLocation}, ${currentDateFormatted}`
            });
          }
        }
        allCertificates.push(...certificates);
      }

      if (allCertificates.length === 0) {
        toast({ title: 'Info', description: 'Es wurden keine Daten für Urkunden gefunden.' });
        setLoading(false);
        return;
      }

      const renderCert = (gen: CertificateGenerator, cert: any) => {
        if (cert.type === 'team') {
          const uniqueMembers = (cert.teamMembersWithScores || []).filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.name === m.name) === i);
          gen.generateCertificate({ season: cert.season, discipline: cert.discipline, category: cert.category, recipientName: cert.recipientName, teamMembersWithScores: uniqueMembers, score: cert.score, rank: cert.rank, date: cert.date });
        } else {
          gen.generateCertificate({ season: cert.season, discipline: cert.discipline, category: cert.category, recipientName: cert.recipientName, score: cert.score, rank: cert.rank, date: cert.date });
        }
      };

      if (combinePdf) {
        const gen = new CertificateGenerator({ orientation: 'portrait' });
        allCertificates.forEach((cert, i) => { if (i > 0) gen.addPage(); renderCert(gen, cert); });
        const label = selectedLeague === 'ALL' ? 'Alle_Ligen' : (leagues.find(l => l.id === selectedLeague)?.name || 'Liga');
        gen.save(`Urkunden_${label}.pdf`);
      } else {
        allCertificates.forEach(cert => {
          const gen = new CertificateGenerator({ orientation: 'portrait' });
          renderCert(gen, cert);
          const name = cert.recipientName.split('\n')[0].trim();
          gen.save(`Urkunde_${cert.discipline}_${name}_Platz${cert.rank}.pdf`);
        });
      }

      toast({ title: 'Erfolg', description: `${allCertificates.length} Urkunden wurden erfolgreich generiert.` });
    } catch (error) {
      logError('Fehler beim Generieren der Urkunden:', error);
      toast({ title: 'Fehler', description: 'Die Urkunden konnten nicht generiert werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Generiere Urkunden für Gesamtsieger
  const generateOverallCertificates = async () => {
    if (!selectedSeason) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie eine Saison aus.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      toast({ title: 'Info', description: 'Die Urkunden für Gesamtsieger werden generiert. Dies kann einen Moment dauern.' });
      const currentDateFormatted = ceremonyDate ?
        format(new Date(ceremonyDate), 'dd. MMMM yyyy', { locale: de }) :
        format(new Date(), 'dd. MMMM yyyy', { locale: de });
      const seasonRef = doc(db, 'seasons', selectedSeason);
      const seasonSnap = await getDoc(seasonRef);
      if (!seasonSnap.exists()) throw new Error('Saison nicht gefunden');
      const seasonName = seasonSnap.data().name.replace('RWK ', '');
      const certificates = [];

      let ligaGroups: { ids: string[]; discipline: string }[];
      if (selectedDiscipline === 'ALL') {
        const groupMap = new Map<string, { ids: string[]; discipline: string }>();
        for (const l of leagues) {
          if (!groupMap.has(l.shortName)) groupMap.set(l.shortName, { ids: [], discipline: l.discipline });
          groupMap.get(l.shortName)!.ids.push(l.id);
        }
        ligaGroups = Array.from(groupMap.values());
      } else {
        const matchingLeagues = leagues.filter(l => l.shortName === selectedDiscipline);
        const discipline = matchingLeagues[0]?.discipline || selectedDiscipline;
        ligaGroups = [{ ids: matchingLeagues.map(l => l.id), discipline }];
      }

      for (const group of ligaGroups) {
        const bestShooters = await fetchBestOverallShooters(selectedSeason, undefined, group.ids);

        const addOverallCert = (shooter: any, categoryLabel: string) => {
          if (!shooter) return;
          const name = shooter.teamName
            ? `${shooter.name}\n${shooter.teamName.replace(/\s+/g, ' ').trim()}`
            : shooter.name;
          certificates.push({
            season: seasonName,
            discipline: group.discipline,
            category: categoryLabel,
            recipientName: name,
            score: shooter.totalScore.toString(),
            rank: 1,
            date: `${ceremonyLocation}, ${currentDateFormatted}`
          });
        };

        addOverallCert(bestShooters.bestMale, 'Bester Schütze');
        addOverallCert(bestShooters.bestFemale, 'Beste Schützin');
        addOverallCert(bestShooters.bestPistol, 'Bester Sportpistolenschütze');
        addOverallCert(bestShooters.bestKKPistol, 'Bester KK-Pistolenschütze');
      }

      if (certificates.length === 0) {
        toast({ title: 'Info', description: 'Es wurden keine Daten für Urkunden gefunden.' });
        setLoading(false);
        return;
      }

      if (combinePdf) {
        const gen = new CertificateGenerator({ orientation: 'portrait' });
        certificates.forEach((cert, i) => {
          if (i > 0) gen.addPage();
          gen.generateCertificate(cert);
        });
        const seasonNameSafe = seasons.find(s => s.id === selectedSeason)?.name.replace('RWK ', '') || 'Saison';
        gen.save(`Urkunden_Gesamtsieger_${seasonNameSafe}.pdf`);
      } else {
        certificates.forEach(cert => {
          const gen = new CertificateGenerator({ orientation: 'portrait' });
          gen.generateCertificate(cert);
          const shooterName = cert.recipientName.split('\n')[0].trim();
          gen.save(`Urkunde_Gesamtsieger_${cert.discipline}_${shooterName}.pdf`);
        });
      }

      toast({ title: 'Erfolg', description: `${certificates.length} Urkunden wurden erfolgreich generiert.` });
    } catch (error) {
      logError('Fehler beim Generieren der Urkunden für Gesamtsieger:', error);
      toast({ title: 'Fehler', description: 'Die Urkunden konnten nicht generiert werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Urkunden erstellen</h1>
          <p className="text-muted-foreground">
            Erstellen Sie Urkunden für Rundenwettkämpfe.
          </p>
        </div>
        <Link href="/admin/exports">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Ergebnislisten
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Urkunden für Liga</CardTitle>
          <CardDescription>
            Erstellen Sie Urkunden für die besten Schützen und Mannschaften einer Liga.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="season-select">Saison</Label>
              <NativeSelect
                value={selectedSeason}
                onValueChange={setSelectedSeason}
                disabled={seasons.length === 0 || loading}
                placeholder="Saison auswählen"
                className="w-full"
                options={seasons.map(season => ({
                  value: season.id,
                  label: season.name.replace('RWK ', '').replace('Kleinkaliber ', '').replace('Luftdruck ', '').replace(/[<>"'&]/g, '')
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="league-select">Liga</Label>
              <NativeSelect
                value={selectedLeague}
                onValueChange={setSelectedLeague}
                disabled={leagues.length === 0 || loading}
                placeholder="Liga auswählen"
                className="w-full"
                options={[
                  { value: 'ALL', label: '-- Alle Ligen --' },
                  ...leagues.map(league => ({ value: league.id, label: league.name.replace(/[<>"'&]/g, '') }))
                ]}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ceremony-date">Datum der Siegerehrung</Label>
              <input
                id="ceremony-date"
                type="date"
                value={ceremonyDate}
                onChange={(e) => setCeremonyDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leer lassen für heutiges Datum ({todayFormatted})
              </p>
            </div>
            <div>
              <Label htmlFor="ceremony-location">Ort</Label>
              <input
                id="ceremony-location"
                type="text"
                value={ceremonyLocation}
                onChange={(e) => setCeremonyLocation(e.target.value)}
                disabled={loading}
                placeholder="Einbeck"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird auf der Urkunde als &quot;Ort, Datum&quot; angezeigt
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="num-shooters">Anzahl Top-Schützen (0 = keine)</Label>
                <NativeSelect
                  value={numTopShooters.toString()}
                  onValueChange={(value) => setNumTopShooters(parseInt(value))}
                  disabled={loading}
                  className="w-full"
                  options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
                    value: num.toString(),
                    label: num === 0 ? 'Keine Schützen' : `${num} Schütze${num > 1 ? 'n' : ''}`
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="num-teams">Anzahl Top-Teams (0 = keine)</Label>
                <NativeSelect
                  value={numTopTeams.toString()}
                  onValueChange={(value) => setNumTopTeams(parseInt(value))}
                  disabled={loading}
                  className="w-full"
                  options={[0, 1, 2, 3, 4, 5].map(num => ({
                    value: num.toString(),
                    label: num === 0 ? 'Keine Teams' : `${num} Team${num > 1 ? 's' : ''}`
                  }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-ak" 
                checked={includeAkCertificates} 
                onCheckedChange={(checked) => setIncludeAkCertificates(!!checked)}
                disabled={loading}
              />
              <Label htmlFor="include-ak">
                Außer-Konkurrenz (AK) Mannschaften einschließen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="combine-pdf" 
                checked={combinePdf} 
                onCheckedChange={(checked) => setCombinePdf(!!checked)}
                disabled={loading}
              />
              <Label htmlFor="combine-pdf">
                Alle Urkunden in einem PDF zusammenfassen
              </Label>
            </div>
          </div>

          <Button 
            onClick={generateLeagueCertificates} 
            disabled={!selectedLeague || !selectedSeason || loading || (numTopShooters === 0 && numTopTeams === 0)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Urkunden werden erstellt...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Urkunden für Liga erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Urkunden für Gesamtsieger</CardTitle>
          <CardDescription>
            Erstellen Sie Urkunden für die besten Schützen über alle Ligen hinweg.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ceremony-date-overall">Datum der Siegerehrung</Label>
            <input
              id="ceremony-date-overall"
              type="date"
              value={ceremonyDate}
              onChange={(e) => setCeremonyDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Leer lassen für heutiges Datum ({todayFormatted})
            </p>
          </div>
          <div>
            <Label htmlFor="ceremony-location-overall">Ort</Label>
            <input
              id="ceremony-location-overall"
              type="text"
              value={ceremonyLocation}
              onChange={(e) => setCeremonyLocation(e.target.value)}
              disabled={loading}
              placeholder="Einbeck"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
          </div>
          <div>
            <Label htmlFor="season-select-overall">Saison</Label>
            <NativeSelect
              value={selectedSeason}
              onValueChange={setSelectedSeason}
              disabled={seasons.length === 0 || loading}
              placeholder="Saison auswählen"
              className="w-full"
              options={seasons.map(season => ({
                value: season.id,
                label: season.name.replace('RWK ', '').replace('Kleinkaliber ', '').replace('Luftdruck ', '').replace(/[<>"'&]/g, '')
              }))}
            />
          </div>
          <div>
            <Label>Disziplin (optional)</Label>
            <NativeSelect
              value={selectedDiscipline}
              onValueChange={setSelectedDiscipline}
              disabled={leagues.length === 0 || loading}
              placeholder="Disziplin auswählen"
              className="w-full"
              options={[
                { value: 'ALL', label: '-- Alle Disziplinen --' },
                ...Array.from(new Map(leagues.map(l => [l.shortName, l])).values())
                  .map(l => ({ value: l.shortName, label: l.discipline }))
              ]}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-ak-overall" 
              checked={includeAkCertificates} 
              onCheckedChange={(checked) => setIncludeAkCertificates(!!checked)}
              disabled={loading}
            />
            <Label htmlFor="include-ak-overall">
              Außer-Konkurrenz (AK) Schützen einschließen
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="combine-pdf-overall" 
              checked={combinePdf} 
              onCheckedChange={(checked) => setCombinePdf(!!checked)}
              disabled={loading}
            />
            <Label htmlFor="combine-pdf-overall">
              Alle Urkunden in einem PDF zusammenfassen
            </Label>
          </div>

          <Button 
            onClick={generateOverallCertificates} 
            disabled={!selectedSeason || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Urkunden werden erstellt...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Urkunden für Gesamtsieger erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface LeagueUpdate {
  id: string;
  leagueType: string;
  leagueName: string;
  competitionYear: string | number;
  leagueId: string;
  timestamp: Timestamp;
}

export default function CleanupUpdatesPage() {
  const [updates, setUpdates] = useState<LeagueUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeSeasons, setActiveSeasons] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUpdates();
    loadActiveSeasons();
  }, []);

  const loadActiveSeasons = async () => {
    try {
      const seasonsQuery = query(
        collection(db, 'seasons'),
        orderBy('competitionYear', 'desc')
      );
      
      const snapshot = await getDocs(seasonsQuery);
      const activeYears: string[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'Laufend') {
          activeYears.push(data.competitionYear.toString());
        }
      });
      
      setActiveSeasons(activeYears);
    } catch (error) {
      console.error('Fehler beim Laden der aktiven Saisons:', error);
      // Fallback auf aktuelles Jahr
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (currentMonth >= 3 && currentMonth <= 9) {
        setActiveSeasons([currentYear.toString()]);
      } else {
        if (currentMonth >= 10) {
          setActiveSeasons([(currentYear + 1).toString()]);
        } else {
          setActiveSeasons([currentYear.toString()]);
        }
      }
    }
  };

  const loadUpdates = async () => {
    try {
      const updatesQuery = query(
        collection(db, 'league_updates'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(updatesQuery);
      const updatesData: LeagueUpdate[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        updatesData.push({
          id: doc.id,
          ...data
        } as LeagueUpdate);
      });
      
      setUpdates(updatesData);
    } catch (error) {
      console.error('Fehler beim Laden der Updates:', error);
      toast({
        title: "Fehler",
        description: "Updates konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteOldUpdates = async () => {
    if (!confirm('Sind Sie sicher, dass Sie alle Updates aus abgelaufenen Saisons löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setDeleting(true);
    let deletedCount = 0;

    try {
      // Aktuelle Saison bestimmen - es gibt KK (Sommer) und LG/LP (Winter) Saisons
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 1-12
      
      // Verwende aktive Saisons aus der Datenbank
      const validYears = activeSeasons.length > 0 ? activeSeasons : [currentYear.toString()];

      for (const update of updates) {
        const updateYear = update.competitionYear.toString();
        
        // Lösche Updates, die nicht zu den gültigen Jahren gehören
        if (!validYears.includes(updateYear)) {
          try {
            await deleteDoc(doc(db, 'league_updates', update.id));
            deletedCount++;
          } catch (error) {
            console.error(`Fehler beim Löschen von Update ${update.id}:`, error);
          }
        }
      }

      toast({
        title: "Erfolgreich",
        description: `${deletedCount} alte Updates wurden gelöscht.`,
      });

      // Updates neu laden
      await loadUpdates();

    } catch (error) {
      console.error('Fehler beim Löschen der Updates:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Updates.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllUpdates = async () => {
    if (!confirm('ACHTUNG: Sind Sie sicher, dass Sie ALLE Updates löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setDeleting(true);
    let deletedCount = 0;

    try {
      for (const update of updates) {
        try {
          await deleteDoc(doc(db, 'league_updates', update.id));
          deletedCount++;
        } catch (error) {
          console.error(`Fehler beim Löschen von Update ${update.id}:`, error);
        }
      }

      toast({
        title: "Erfolgreich",
        description: `${deletedCount} Updates wurden gelöscht.`,
      });

      // Updates neu laden
      await loadUpdates();

    } catch (error) {
      console.error('Fehler beim Löschen der Updates:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen der Updates.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Statistiken berechnen mit aktiven Saisons aus der Datenbank
  const validYears = activeSeasons.length > 0 ? activeSeasons : [new Date().getFullYear().toString()];

  const currentSeasonUpdates = updates.filter(update => 
    validYears.includes(update.competitionYear.toString())
  );
  const oldUpdates = updates.filter(update => 
    !validYears.includes(update.competitionYear.toString())
  );

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p>Lade Updates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <BackButton className="mr-2" fallbackHref="/admin" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Alte Updates löschen</h1>
          <p className="text-muted-foreground">
            Bereinigung der league_updates Collection
          </p>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Aktuelle Saison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentSeasonUpdates.length}</div>
            <p className="text-sm text-muted-foreground">Aktive Saisons: {validYears.join(', ')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              Alte Saisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{oldUpdates.length}</div>
            <p className="text-sm text-muted-foreground">Können gelöscht werden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trash2 className="h-5 w-5 text-red-600 mr-2" />
              Gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
            <p className="text-sm text-muted-foreground">Alle Updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Aktionen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-orange-600">Alte Saisons löschen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Löscht alle Updates aus abgelaufenen Saisons. Behält nur Updates der aktiven Saisons: {validYears.join(', ')}.
              {activeSeasons.length === 0 && <span className="text-orange-600"> (Fallback: keine aktiven Saisons gefunden)</span>}
            </p>
            <Button 
              onClick={deleteOldUpdates}
              disabled={deleting || oldUpdates.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {oldUpdates.length} alte Updates löschen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Alle Updates löschen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              <strong>ACHTUNG:</strong> Löscht alle Updates inklusive der aktuellen Saison. Die Startseite zeigt dann keine "Letzte Änderungen" mehr an.
            </p>
            <Button 
              onClick={deleteAllUpdates}
              disabled={deleting || updates.length === 0}
              variant="destructive"
              className="w-full"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Alle {updates.length} Updates löschen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Updates-Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Updates ({updates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Keine Updates vorhanden.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {updates.map((update) => {
                const isOld = !validYears.includes(update.competitionYear.toString());
                return (
                  <div 
                    key={update.id} 
                    className={`p-3 rounded border ${isOld ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {update.leagueName} ({update.leagueType}) - {update.competitionYear}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {update.timestamp.toDate().toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        isOld ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isOld ? 'Alt' : 'Aktuell'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
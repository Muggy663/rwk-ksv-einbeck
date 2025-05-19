// src/app/admin/clubs/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Team } from '@/types/rwk'; // Team-Typ wird benötigt
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Typ für die angezeigten, extrahierten Vereinsnamen
interface ExtractedClub {
  id: string; // Kann der normalisierte Name sein
  name: string;
}

const TEAMS_COLLECTION = "rwk_teams";

// Hilfsfunktion zum Extrahieren des Vereinsnamens aus dem Teamnamen
// Dies ist eine einfache Implementierung und muss ggf. robuster gestaltet werden
const extractClubNameFromTeamName = (teamName: string): string => {
  if (!teamName) return "Unbekannter Verein";
  // Entfernt gängige Mannschaftszusätze wie römische Ziffern, "Einzel", "LG", "KK" etc.
  // und trimmt das Ergebnis.
  let name = teamName.replace(/\s+(?:[IVXLCDM]+|[Ee]inzel|[Ll][Gg]|[Kk][Kk]|[Ss][Pp])(?:$|\s+.*)/, "").trim();
  // Fallback, falls nach dem Ersetzen nichts übrig bleibt oder der Name sehr kurz ist.
  return name.length > 2 ? name : teamName;
};

export default function AdminClubsPage() {
  const [extractedClubs, setExtractedClubs] = useState<ExtractedClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchImplicitClubs = async () => {
    setIsLoading(true);
    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      // Optional: Nach competitionYear filtern, falls relevant, oder alle Teams laden
      // const q = query(teamsCollectionRef, orderBy("name", "asc"));
      const q = query(teamsCollectionRef, orderBy("competitionYear", "desc"), orderBy("name", "asc"));

      const querySnapshot = await getDocs(q);
      const teamNames: string[] = [];
      querySnapshot.forEach((doc) => {
        const teamData = doc.data() as Team;
        if (teamData.name) {
          teamNames.push(teamData.name);
        }
      });

      const uniqueClubNames = new Set<string>();
      teamNames.forEach(teamName => {
        uniqueClubNames.add(extractClubNameFromTeamName(teamName));
      });

      const fetchedClubs: ExtractedClub[] = Array.from(uniqueClubNames)
        .map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '_'), // Einfache ID-Generierung
          name: name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setExtractedClubs(fetchedClubs);
    } catch (error) {
      console.error("Error fetching implicit clubs from teams: ", error);
      toast({
        title: "Fehler beim Laden der Vereinsliste",
        description: (error as Error).message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImplicitClubs();
  }, []);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Übersicht der Vereine (aus Teams)</h1>
        {/* Button zum Anlegen wurde entfernt, da Vereine implizit aus Teams entstehen */}
      </div>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Implizit vorhandene Vereine</CardTitle>
          <CardDescription>
            Diese Liste zeigt eindeutige Vereinsnamen, die aus den Namen der angelegten Mannschaften
            in der `rwk_teams`-Collection extrahiert wurden. Eine direkte Bearbeitung oder das Anlegen
            neuer Vereine ist auf dieser Seite nicht möglich. Neue "Vereine" entstehen implizit,
            wenn Sie eine Mannschaft mit einem neuen Vereinsnamen-Teil anlegen.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex justify-center items-center py-10">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
           ) : extractedClubs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extrahierter Vereinsname</TableHead>
                  {/* Weitere Spalten (wie Kürzel, Kontakt) sind hier nicht verfügbar */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedClubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell>{club.name}</TableCell>
                    {/* Aktionen (Bearbeiten, Löschen) wurden entfernt */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">Keine Teams gefunden, aus denen Vereinsnamen extrahiert werden konnten, oder keine Vereinsnamen konnten extrahiert werden.</p>
              <p className="text-sm">Legen Sie Mannschaften in der Mannschaftsverwaltung an.</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Der Dialog zum Anlegen/Bearbeiten von Vereinen wurde entfernt. */}
    </div>
  );
}

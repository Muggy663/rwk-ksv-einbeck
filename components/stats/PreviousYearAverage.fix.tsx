"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PreviousYearAverageProps {
  shooterId: string;
  currentYear: number;
  currentAverage?: number | null;
  leagueType?: string;
  className?: string;
}

export function PreviousYearAverage({
  shooterId,
  currentYear,
  currentAverage,
  leagueType,
  className = ''
}: PreviousYearAverageProps) {
  const [prevYearAverage, setPrevYearAverage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [difference, setDifference] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreviousYearAverage = async () => {
      if (!shooterId || !currentYear) {
        setError("Fehlende Daten: Schützen-ID oder aktuelles Jahr nicht angegeben");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const previousYear = currentYear - 1;
        
        // Abfrage für Ergebnisse des Vorjahres
        let scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('shooterId', '==', shooterId),
          where('competitionYear', '==', previousYear)
        );
        
        // Wenn ein Ligaart angegeben ist, nach dieser filtern
        if (leagueType) {
          scoresQuery = query(
            scoresQuery,
            where('leagueType', '==', leagueType)
          );
        }
        
        const snapshot = await getDocs(scoresQuery);
        
        if (snapshot.empty) {
          setPrevYearAverage(null);
          return;
        }
        
        // Berechnung des Durchschnitts
        let totalRings = 0;
        let validScoresCount = 0;
        
        snapshot.forEach(doc => {
          const scoreData = doc.data();
          if (scoreData.totalRinge && typeof scoreData.totalRinge === 'number') {
            totalRings += scoreData.totalRinge;
            validScoresCount++;
          }
        });
        
        if (validScoresCount > 0) {
          const average = totalRings / validScoresCount;
          setPrevYearAverage(parseFloat(average.toFixed(2)));
          
          // Differenz zum aktuellen Durchschnitt berechnen, falls vorhanden
          if (currentAverage !== undefined && currentAverage !== null) {
            setDifference(parseFloat((currentAverage - average).toFixed(2)));
          } else {
            setDifference(null);
          }
        } else {
          setPrevYearAverage(null);
          setDifference(null);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Vorjahresdurchschnitts:', error);
        setError("Fehler beim Laden der Daten");
        setPrevYearAverage(null);
        setDifference(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreviousYearAverage();
  }, [shooterId, currentYear, currentAverage, leagueType]);

  if (isLoading) {
    return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
  }

  if (error) {
    return <span className={`text-muted-foreground ${className}`} title={error}>Fehler</span>;
  }

  if (prevYearAverage === null) {
    return <span className={`text-muted-foreground ${className}`}>Keine Daten</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <span>{prevYearAverage}</span>
            {difference !== null && (
              <>
                {difference > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : difference < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={
                  difference > 0 ? 'text-green-500' : 
                  difference < 0 ? 'text-red-500' : 
                  'text-muted-foreground'
                }>
                  {difference > 0 ? '+' : ''}{difference}
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Durchschnitt Vorjahr ({currentYear - 1}): {prevYearAverage}</p>
          {difference !== null && (
            <p>
              {difference > 0 ? 'Verbesserung' : difference < 0 ? 'Verschlechterung' : 'Keine Änderung'}: {difference > 0 ? '+' : ''}{difference} Ringe
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
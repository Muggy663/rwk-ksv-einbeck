"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchTopShootersWithTrend } from '@/lib/services/enhanced-statistics-service';
import { TrendAnalysisCard } from '@/components/statistics/advanced/TrendAnalysisCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendAnalysisProps {
  seasonId?: string;
  leagueId?: string;
  clubId?: string;
}

export function TrendAnalysis({ seasonId, leagueId, clubId }: TrendAnalysisProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [shooters, setShooters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Lade Schützentrends, wenn sich die Props ändern
  useEffect(() => {
    if (!seasonId) return;
    
    const fetchShooterTrends = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const shootersData = await fetchTopShootersWithTrend(
          seasonId,
          leagueId !== 'all' ? leagueId : undefined,
          clubId !== 'all' ? clubId : undefined,
          30 // Maximal 30 Schützen
        );
        
        setShooters(shootersData);
      } catch (error) {
        console.error('Fehler beim Laden der Schützentrends:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShooterTrends();
  }, [seasonId, leagueId, clubId]);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return <TrendAnalysisCard shooters={shooters} />;
}
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Target, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeminiInsightsProps {
  leagueId: string;
  leagueName: string;
  seasonYear: number;
  teamData?: any[];
}

export function GeminiInsights({ leagueId, leagueName, seasonYear, teamData }: GeminiInsightsProps) {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    if (!teamData || teamData.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId,
          leagueName,
          seasonYear,
          teamData: teamData.slice(0, 10) // Nur Top 10 Teams
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setInsights(data.insights);
        setHasGenerated(true);
      } else {
        toast({ title: "Fehler", description: "Analyse konnte nicht erstellt werden.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Verbindungsfehler.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <BarChart3 className="h-5 w-5" />
          🤖 KI-Analyse der Liga
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasGenerated ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Lassen Sie Gemini AI die aktuelle Liga-Situation analysieren
            </p>
            <Button 
              onClick={generateInsights} 
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <><Loader className="mr-2 h-4 w-4 animate-spin" />Analysiere...</>
              ) : (
                <><Target className="mr-2 h-4 w-4" />Liga analysieren</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm">{insights}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setHasGenerated(false);
                setInsights('');
              }}
            >
              Neue Analyse
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
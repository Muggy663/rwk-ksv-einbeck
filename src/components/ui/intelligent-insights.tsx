"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Target, BarChart3, AlertTriangle, Lightbulb } from 'lucide-react';
import { intelligentStatisticsService, type StatisticsInsight } from '@/lib/services/intelligent-statistics-service';

interface IntelligentInsightsProps {
  seasonId: string;
  leagueId?: string;
  clubId?: string;
  className?: string;
}

export function IntelligentInsights({ seasonId, leagueId, clubId, className = "" }: IntelligentInsightsProps) {
  const [insights, setInsights] = useState<StatisticsInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!seasonId) return;

    const loadInsights = async () => {
      setIsLoading(true);
      try {
        const generatedInsights = await intelligentStatisticsService.generateInsights(
          seasonId,
          leagueId !== 'all' ? leagueId : undefined,
          clubId !== 'all' ? clubId : undefined
        );
        setInsights(generatedInsights);
      } catch (error) {
        logError('Fehler beim Laden der Insights:', error);
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, [seasonId, leagueId, clubId]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prognose': return <TrendingUp className="h-4 w-4" />;
      case 'trend': return <BarChart3 className="h-4 w-4" />;
      case 'performance': return <Target className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    
    const labels = {
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig'
    };

    return (
      <Badge variant="secondary" className={variants[confidence as keyof typeof variants]}>
        {labels[confidence as keyof typeof labels]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            🤖 Intelligente Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Analysiere Daten...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            🤖 Intelligente Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nicht genügend Daten für eine Analyse verfügbar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          🤖 Intelligente Analyse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                </div>
                {getConfidenceBadge(insight.confidence)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.message}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 Analyse basiert auf aktuellen Leistungsdaten und statistischen Trends
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

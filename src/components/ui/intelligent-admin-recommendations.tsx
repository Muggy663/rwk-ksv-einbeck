"use client";

import React, { useState, useEffect } from 'react';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Settings, UserPlus, Calendar, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { intelligentAdminService, type AdminRecommendation } from '@/lib/services/intelligent-admin-service';

interface IntelligentAdminRecommendationsProps {
  currentSeasonId: string;
  targetYear: number;
  className?: string;
}

export function IntelligentAdminRecommendations({ 
  currentSeasonId, 
  targetYear, 
  className = "" 
}: IntelligentAdminRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AdminRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentSeasonId) return;

    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        const generatedRecommendations = await intelligentAdminService.generateSeasonPlanningRecommendations(
          currentSeasonId,
          targetYear
        );
        setRecommendations(generatedRecommendations);
      } catch (error) {
        logError('Fehler beim Laden der Admin-Empfehlungen:', error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [currentSeasonId, targetYear]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'team_placement': return <Users className="h-4 w-4" />;
      case 'replacement': return <UserPlus className="h-4 w-4" />;
      case 'league_optimization': return <Settings className="h-4 w-4" />;
      case 'season_planning': return <Calendar className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    
    const labels = {
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig'
    };

    return (
      <Badge variant="secondary" className={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleApplyRecommendation = (recommendationIndex: number) => {
    const recommendation = recommendations[recommendationIndex];
    
    // Simuliere Anwendung der Empfehlung
    setAppliedRecommendations(prev => new Set([...prev, recommendationIndex.toString()]));
    
    // Hier würde die tatsächliche Implementierung der Empfehlung erfolgen
    logDebug('Anwenden der Empfehlung:', recommendation);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            🤖 Intelligente Planungsempfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Analysiere Saisondaten...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            🤖 Intelligente Planungsempfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
            <p>Keine Optimierungen erforderlich.</p>
            <p className="text-sm mt-1">Alle Teams sind optimal platziert.</p>
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
          🤖 Intelligente Planungsempfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => {
            const isApplied = appliedRecommendations.has(index.toString());
            
            return (
              <div 
                key={index} 
                className={`p-4 border rounded-lg transition-all ${
                  isApplied 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {getRecommendationIcon(recommendation.type)}
                    <h4 className="font-medium text-sm">{recommendation.title}</h4>
                    {isApplied && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(recommendation.priority)}
                    <span className={`text-xs font-mono ${getConfidenceColor(recommendation.confidence)}`}>
                      {Math.round(recommendation.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {recommendation.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground italic">
                    💡 {recommendation.action}
                  </p>
                  
                  {!isApplied && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyRecommendation(index)}
                      className="text-xs"
                    >
                      Anwenden
                    </Button>
                  )}
                  
                  {isApplied && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Angewendet
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Empfehlungen basieren auf:</p>
              <ul className="space-y-0.5 text-xs">
                <li>• Aktuelle Leistungsdaten und Trends</li>
                <li>• Liga-Ausgeglichenheit und Teamstärken</li>
                <li>• RWK-Ordnung und bewährte Praktiken</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

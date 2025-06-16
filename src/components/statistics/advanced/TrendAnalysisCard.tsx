"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrendType = 'improving' | 'stable' | 'declining';

interface ShooterWithTrend {
  shooterId: string;
  shooterName: string;
  teamName?: string;
  averageScore: number;
  trend: TrendType;
}

interface TrendAnalysisCardProps {
  shooters?: ShooterWithTrend[];
  className?: string;
}

export function TrendAnalysisCard({ shooters = [], className }: TrendAnalysisCardProps) {
  // Gruppiere Schützen nach Trend
  const improvingShooters = shooters.filter(shooter => shooter.trend === 'improving');
  const stableShooters = shooters.filter(shooter => shooter.trend === 'stable');
  const decliningShooters = shooters.filter(shooter => shooter.trend === 'declining');

  // Funktion zum Rendern eines Trend-Badges
  const renderTrendBadge = (trend: TrendType) => {
    switch (trend) {
      case 'improving':
        return (
          <Badge variant="success" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
            <ArrowUpIcon className="h-3 w-3 mr-1" />
            Steigend
          </Badge>
        );
      case 'declining':
        return (
          <Badge variant="destructive" className="ml-2 bg-red-100 text-red-800 hover:bg-red-200">
            <ArrowDownIcon className="h-3 w-3 mr-1" />
            Fallend
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="ml-2">
            <MinusIcon className="h-3 w-3 mr-1" />
            Stabil
          </Badge>
        );
    }
  };

  // Funktion zum Rendern einer Schützenliste mit Trend
  const renderShooterList = (shooterList: ShooterWithTrend[], emptyMessage: string) => {
    if (shooterList.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <ul className="space-y-2">
        {shooterList.map(shooter => (
          <li key={shooter.shooterId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <div>
              <span className="font-medium">{shooter.shooterName}</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({shooter.teamName || 'Kein Team'})
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">
                Ø {shooter.averageScore.toFixed(1)}
              </span>
              {renderTrendBadge(shooter.trend)}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Trendanalyse</CardTitle>
        <CardDescription>Leistungsentwicklung der Schützen über die Saison</CardDescription>
      </CardHeader>
      <CardContent>
        {shooters.length === 0 ? (
          <p className="text-muted-foreground">Keine Daten für die Trendanalyse verfügbar</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center mb-2">
                <ArrowUpIcon className="h-5 w-5 mr-2 text-green-600" />
                Steigende Leistung
              </h3>
              {renderShooterList(
                improvingShooters, 
                "Keine Schützen mit steigender Leistung gefunden"
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium flex items-center mb-2">
                <MinusIcon className="h-5 w-5 mr-2" />
                Stabile Leistung
              </h3>
              {renderShooterList(
                stableShooters, 
                "Keine Schützen mit stabiler Leistung gefunden"
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium flex items-center mb-2">
                <ArrowDownIcon className="h-5 w-5 mr-2 text-red-600" />
                Fallende Leistung
              </h3>
              {renderShooterList(
                decliningShooters, 
                "Keine Schützen mit fallender Leistung gefunden"
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
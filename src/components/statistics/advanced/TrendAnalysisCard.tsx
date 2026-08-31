"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TopShooter {
  shooterId: string;
  shooterName: string;
  teamName: string;
  averageScore: number;
  trend: 'rising' | 'stable' | 'falling';
  trendValue?: number;
}

interface TrendAnalysisCardProps {
  shooters: TopShooter[];
}

export function TrendAnalysisCard({ shooters }: TrendAnalysisCardProps) {
  // Gruppiere Schützen nach Trend
  const risingShooters = shooters.filter(shooter => shooter.trend === 'rising');
  const stableShooters = shooters.filter(shooter => shooter.trend === 'stable');
  const fallingShooters = shooters.filter(shooter => shooter.trend === 'falling');

  // Sortiere nach Durchschnitt
  risingShooters.sort((a, b) => b.averageScore - a.averageScore);
  stableShooters.sort((a, b) => b.averageScore - a.averageScore);
  fallingShooters.sort((a, b) => b.averageScore - a.averageScore);

  const renderTrendIcon = (trend: 'rising' | 'stable' | 'falling') => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-amber-500" />;
      case 'falling':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const renderTrendText = (trend: 'rising' | 'stable' | 'falling') => {
    switch (trend) {
      case 'rising':
        return <span className="text-green-600">Steigend</span>;
      case 'stable':
        return <span className="text-amber-600">Stabil</span>;
      case 'falling':
        return <span className="text-red-600">Fallend</span>;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Trendanalyse
        </CardTitle>
        <CardDescription>
          Leistungsentwicklung der Schützen über die Saison
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Steigende Leistung */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-600 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Steigende Leistung
            </h3>
            
            {risingShooters.length > 0 ? (
              <ul className="space-y-4">
                {risingShooters.map(shooter => (
                  <li key={shooter.shooterId} className="border-b pb-3">
                    <div className="font-medium">{shooter.shooterName}</div>
                    <div className="text-sm text-muted-foreground">({shooter.teamName})</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="font-semibold">Ø {shooter.averageScore.toFixed(1)}</div>
                      <div className="flex items-center text-green-600">
                        {renderTrendIcon(shooter.trend)}
                        <span className="ml-1">Steigend</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Keine Schützen mit steigender Leistung gefunden.
              </p>
            )}
          </div>
          
          {/* Stabile Leistung */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-600 flex items-center">
              <Minus className="mr-2 h-5 w-5" />
              Stabile Leistung
            </h3>
            
            {stableShooters.length > 0 ? (
              <ul className="space-y-4">
                {stableShooters.map(shooter => (
                  <li key={shooter.shooterId} className="border-b pb-3">
                    <div className="font-medium">{shooter.shooterName}</div>
                    <div className="text-sm text-muted-foreground">({shooter.teamName})</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="font-semibold">Ø {shooter.averageScore.toFixed(1)}</div>
                      <div className="flex items-center text-amber-600">
                        {renderTrendIcon(shooter.trend)}
                        <span className="ml-1">Stabil</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Keine Schützen mit stabiler Leistung gefunden.
              </p>
            )}
          </div>
          
          {/* Fallende Leistung */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center">
              <TrendingDown className="mr-2 h-5 w-5" />
              Fallende Leistung
            </h3>
            
            {fallingShooters.length > 0 ? (
              <ul className="space-y-4">
                {fallingShooters.map(shooter => (
                  <li key={shooter.shooterId} className="border-b pb-3">
                    <div className="font-medium">{shooter.shooterName}</div>
                    <div className="text-sm text-muted-foreground">({shooter.teamName})</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="font-semibold">Ø {shooter.averageScore.toFixed(1)}</div>
                      <div className="flex items-center text-red-600">
                        {renderTrendIcon(shooter.trend)}
                        <span className="ml-1">Fallend</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Keine Schützen mit fallender Leistung gefunden.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

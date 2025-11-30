"use client";

import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart as LineChartIcon } from 'lucide-react';

interface MobileShooterCardsProps {
  shooters: any[];
  numRounds: number;
  onShooterClick: (shooterData: any) => void;
}

export const MobileShooterCards: React.FC<MobileShooterCardsProps> = ({
  shooters,
  numRounds,
  onShooterClick
}) => {
  return (
    <div className="space-y-4">
      {shooters.map((shooter) => (
        <Card key={shooter.shooterId} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {shooter.teamOutOfCompetition ? 'AK' : shooter.rank}
                </div>
                <div>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left font-semibold text-foreground hover:text-primary"
                    onClick={() => onShooterClick(shooter)}
                  >
                    {shooter.shooterName}
                  </Button>
                  <div className="text-sm text-muted-foreground">{shooter.teamName}</div>
                  {shooter.teamOutOfCompetition && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                      AK: {shooter.teamOutOfCompetitionReason || 'Außer Konkurrenz'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-bold text-primary">{shooter.totalScore}</div>
                  <div className="text-xs text-muted-foreground">
                    {shooter.averageScore ? shooter.averageScore.toFixed(1) : '-'}
                  </div>
                </div>
                <LineChartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {[...Array(numRounds)].map((_, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">DG {i + 1}:</span>
                  <span className="font-mono">
                    {shooter.results?.[`dg${i + 1}`] !== null ? 
                      shooter.results?.[`dg${i + 1}`] : 
                      <span className="text-muted-foreground">-</span>
                    }
                  </span>
                </div>
              ))}
              <div className="col-span-2 flex justify-between text-sm font-semibold border-t pt-2 mt-1">
                <span className="text-primary">Gesamt:</span>
                <span className="text-primary">{shooter.totalScore}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

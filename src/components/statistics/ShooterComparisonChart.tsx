"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Shooter } from './ShooterComparisonSelector';

interface ShooterComparisonChartProps {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  selectedShooters: Shooter[];
  isLoading?: boolean;
  onExport?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ShooterComparisonChart({
  data,
  selectedShooters,
  isLoading = false,
  onExport
}: ShooterComparisonChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Schützenvergleich</CardTitle>
          <CardDescription>Vergleich der ausgewählten Schützen über alle Durchgänge</CardDescription>
        </div>
        {onExport && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : selectedShooters.length > 0 && data.length > 0 ? (
          <div id="shooter-comparison-chart" className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[260, 300]} />
                <Tooltip />
                <Legend />
                {selectedShooters.map((shooter, index) => (
                  <Line 
                    key={shooter.id}
                    type="monotone" 
                    dataKey={shooter.id} 
                    name={shooter.name}
                    stroke={COLORS[index % COLORS.length]} 
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">
              {selectedShooters.length === 0 
                ? "Bitte wählen Sie Schützen zum Vergleich aus" 
                : "Keine Daten für die ausgewählten Schützen verfügbar"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

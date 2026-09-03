"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatData {
  label: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface EnhancedStatsCardProps {
  title: string;
  stats: StatData[];
  className?: string;
}

export function EnhancedStatsCard({ title, stats, className }: EnhancedStatsCardProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'red':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {stats.map((stat, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getColorClasses(stat.color)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                {stat.trend && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(stat.trend)}
                    {stat.trendPercentage && (
                      <span className={`text-xs font-medium ${getTrendColor(stat.trend)}`}>
                        {stat.trendPercentage > 0 ? '+' : ''}{stat.trendPercentage}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('de-DE') : stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-sm text-muted-foreground">{stat.unit}</span>
                  )}
                </div>
                
                {stat.previousValue !== undefined && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Vorher: {stat.previousValue.toLocaleString('de-DE')} {stat.unit}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

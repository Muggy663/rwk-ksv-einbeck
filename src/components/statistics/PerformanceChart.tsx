"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3 } from "lucide-react";

interface ChartDataPoint {
  date: string;
  score: number;
  rings: number;
  average?: number;
}

interface PerformanceChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar';
  showAverage?: boolean;
  className?: string;
}

export function PerformanceChart({ 
  title, 
  data, 
  type = 'line', 
  showAverage = true, 
  className 
}: PerformanceChartProps) {
  
  const averageScore = data.length > 0 
    ? data.reduce((sum, point) => sum + point.score, 0) / data.length 
    : 0;

  const trend = data.length >= 2 
    ? data[data.length - 1].score - data[0].score 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Punkte: {payload[0].value}
          </p>
          {payload[1] && (
            <p className="text-green-600">
              Ringe: {payload[1].value}
            </p>
          )}
          {showAverage && payload[2] && (
            <p className="text-gray-600">
              Durchschnitt: {payload[2].value.toFixed(1)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {type === 'line' ? <TrendingUp className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Ø {averageScore.toFixed(1)} Punkte
            </Badge>
            {trend !== 0 && (
              <Badge 
                variant={trend > 0 ? "default" : "secondary"}
                className={`text-xs ${trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Daten verfügbar</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {type === 'line' ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  
                  {showAverage && (
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#6b7280" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </LineChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Bar 
                    dataKey="score" 
                    fill="#3b82f6" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
        
        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Beste Leistung</p>
              <p className="font-semibold">
                {Math.max(...data.map(d => d.score))} Punkte
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Durchschnitt</p>
              <p className="font-semibold">
                {averageScore.toFixed(1)} Punkte
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Letzte Leistung</p>
              <p className="font-semibold">
                {data[data.length - 1]?.score || 0} Punkte
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

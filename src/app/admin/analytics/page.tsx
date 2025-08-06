// src/app/admin/analytics/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, AlertTriangle, Users, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { usageTracker } from '@/lib/analytics/usage-tracker';
import { performanceMonitor } from '@/lib/analytics/performance-monitor';
import { errorTracker } from '@/lib/analytics/error-tracker';

export default function AdminAnalyticsPage() {
  const [usageStats, setUsageStats] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadAnalyticsData = () => {
    // Usage Statistics
    const usage = usageTracker.getStats();
    if (usage) {
      const pageStats: { [page: string]: number } = {};
      usage.pages.forEach((page: any) => {
        pageStats[page.page] = (pageStats[page.page] || 0) + 1;
      });
      
      const featureStats: { [feature: string]: number } = {};
      usage.features.forEach((feature: any) => {
        featureStats[feature.feature] = (featureStats[feature.feature] || 0) + 1;
      });
      
      setUsageStats({
        totalPageViews: usage.pages.length,
        totalFeatureUsage: usage.features.length,
        pageStats,
        featureStats,
        recentPages: usage.pages.slice(-10).reverse()
      });
    }

    // Performance Statistics
    const performance = performanceMonitor.getMetrics();
    const avgLoadTimes = performanceMonitor.getAverageLoadTimes();
    setPerformanceStats({
      totalMetrics: performance.length,
      averageLoadTimes: avgLoadTimes,
      recentMetrics: performance.slice(-10).reverse()
    });

    // Error Statistics
    const errors = errorTracker.getErrorReports();
    const errorStatsData = errorTracker.getErrorStats();
    setErrorStats({
      ...errorStatsData,
      recentErrors: errors.slice(-5).reverse()
    });

    setLastUpdate(new Date());
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const clearAllData = () => {
    if (confirm('Alle Analytics-Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
      localStorage.removeItem('usage-stats-pages');
      localStorage.removeItem('usage-stats-features');
      localStorage.removeItem('performance-metrics');
      errorTracker.clearErrorReports();
      loadAnalyticsData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Letzte Aktualisierung: {lastUpdate.toLocaleString('de-DE')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Zurück zum Dashboard
            </Button>
          </Link>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Aktualisieren
          </Button>
          <Button onClick={clearAllData} variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Daten löschen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seitenaufrufe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.totalPageViews || 0}</div>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature-Nutzung</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.totalFeatureUsage || 0}</div>
            <p className="text-xs text-muted-foreground">Aktionen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fehler</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {errorStats?.recent || 0} heute
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meistbesuchte Seiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usageStats?.pageStats ? (
                Object.entries(usageStats.pageStats)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([page, count]) => (
                    <div key={page} className="flex justify-between items-center">
                      <span className="text-sm truncate">{page}</span>
                      <Badge variant="secondary">{count as number}</Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">Keine Daten verfügbar</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceStats?.averageLoadTimes ? (
                Object.entries(performanceStats.averageLoadTimes)
                  .sort(([,a], [,b]) => (b as any).avg - (a as any).avg)
                  .slice(0, 10)
                  .map(([page, stats]) => (
                    <div key={page} className="flex justify-between items-center">
                      <span className="text-sm truncate">{page}</span>
                      <Badge variant={
                        (stats as any).avg > 3000 ? "destructive" : 
                        (stats as any).avg > 1000 ? "secondary" : "default"
                      }>
                        {(stats as any).avg}ms
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">Keine Performance-Daten</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {errorStats?.recentErrors && errorStats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Aktuelle Fehler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorStats.recentErrors.map((error: any, index: number) => (
                <div key={index} className="border-l-4 border-l-destructive pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{error.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {error.page} • {new Date(error.timestamp).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <Badge variant="destructive">{error.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hinweise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Alle Daten werden lokal im Browser gespeichert</p>
            <p>• Keine personenbezogenen Daten werden erfasst</p>
            <p>• Daten werden automatisch nach 100 Einträgen bereinigt</p>
            <p>• Performance-Werte über 3000ms sind kritisch (rot)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

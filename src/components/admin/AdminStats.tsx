"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, AlertTriangle, Activity, Users } from 'lucide-react';
import { newsService } from '@/lib/services/news-service';
import { protestService } from '@/lib/services/protest-service';
import { auditLogService } from '@/lib/services/audit-service';

export function AdminStats() {
  const [stats, setStats] = useState({
    news: { total: 0, published: 0, drafts: 0 },
    protests: { total: 0, eingereicht: 0, inBearbeitung: 0, entschieden: 0 },
    audit: { total: 0, creates: 0, updates: 0, deletes: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [newsStats, protestStats, auditStats] = await Promise.all([
          newsService.getNewsStats(),
          protestService.getProtestStats(),
          auditLogService.getAuditStats()
        ]);

        setStats({
          news: newsStats,
          protests: protestStats,
          audit: auditStats
        });
      } catch (error) {
        console.error('Fehler beim Laden der Admin-Statistiken:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Lade Statistiken...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">News-Artikel</CardTitle>
          <Newspaper className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.news.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.news.published} veröffentlicht, {stats.news.drafts} Entwürfe
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proteste</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.protests.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.protests.eingereicht} eingereicht, {stats.protests.entschieden} entschieden
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Audit-Logs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.audit.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.audit.creates} erstellt, {stats.audit.updates} geändert
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
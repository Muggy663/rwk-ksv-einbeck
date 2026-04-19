"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ShieldX, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLoginStats } from '@/lib/services/login-monitor-service';
import type { LoginEvent } from '@/lib/services/login-monitor-service';
import { Timestamp } from 'firebase/firestore';

interface Stats {
  success: number;
  failed: number;
  blocked: number;
  failedReasons: Record<string, number>;
  blockedReasons: Record<string, number>;
  suspiciousAccounts: { email: string; count: number }[];
  recent: LoginEvent[];
  total: number;
}

function formatTime(ts: Timestamp) {
  return ts.toDate().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

function errorLabel(code?: string) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials': return 'Falsches Passwort';
    case 'auth/user-not-found': return 'User nicht gefunden';
    case 'auth/too-many-requests': return 'Zu viele Versuche';
    case 'auth/user-disabled': return 'Account deaktiviert';
    default: return code ?? 'Unbekannt';
  }
}

export function LoginMonitor() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLoginStats(days);
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          Login-Monitoring
        </CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value={1}>24 Stunden</option>
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
          </select>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground text-center py-4">Lade...</p>}

        {!loading && stats && (
          <>
            {/* Zahlen */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                <ShieldCheck className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-700">{stats.success}</div>
                <div className="text-xs text-green-600">Erfolgreich</div>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                <ShieldX className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-amber-700">{stats.failed}</div>
                <div className="text-xs text-amber-600">Fehlgeschlagen</div>
                {stats.failedReasons && Object.entries(stats.failedReasons).map(([reason, count]) => (
                  <div key={reason} className="text-xs text-amber-500 mt-1">{errorLabel(reason)}: {count}x</div>
                ))}
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                <ShieldAlert className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-700">{stats.blocked}</div>
                <div className="text-xs text-red-600">Gesperrt</div>
                {stats.blockedReasons && Object.entries(stats.blockedReasons).map(([reason, count]) => (
                  <div key={reason} className="text-xs text-red-500 mt-1">{errorLabel(reason)}: {count}x</div>
                ))}
              </div>
            </div>

            {/* Verdächtige Accounts */}
            {stats.suspiciousAccounts.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-3 w-3" /> Auffällige Accounts (≥3 Fehlversuche)
                </p>
                <div className="space-y-1">
                  {stats.suspiciousAccounts.map(a => (
                    <div key={a.email} className="flex justify-between text-xs">
                      <span className="text-red-800 font-mono">{maskEmail(a.email)}</span>
                      <span className="text-red-600 font-bold">{a.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Letzte Events */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Letzte Ereignisse</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {stats.recent.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Keine Ereignisse</p>
                )}
                {stats.recent.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      {e.type === 'success' && <span className="text-green-600">✅</span>}
                      {e.type === 'failed' && <span className="text-amber-600">⚠️</span>}
                      {e.type === 'blocked' && <span className="text-red-600">🚫</span>}
                      <span className="font-mono text-muted-foreground">{maskEmail(e.email)}</span>
                      {e.errorCode && (
                        <span className="text-muted-foreground/70 italic">{errorLabel(e.errorCode)}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">{formatTime(e.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

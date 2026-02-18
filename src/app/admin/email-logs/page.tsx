"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, RefreshCw, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkResendDashboard = () => {
    const newWindow = window.open('https://resend.com/emails', '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const testEmailAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: new FormData()
      });
      
      const result = await response.json();

      
      toast({
        title: 'API-Test',
        description: 'Siehe Browser-Konsole für Details',
      });
    } catch (error) {
      logError('API-Test Fehler:', error);
      toast({
        title: 'API-Test Fehler',
        description: 'Siehe Browser-Konsole für Details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Mail className="h-8 w-8" />
          E-Mail Logs & Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          Überwachung und Nachverfolgung von E-Mail-Versendungen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Resend Dashboard
            </CardTitle>
            <CardDescription>
              Offizielle Resend-Konsole für detaillierte E-Mail-Statistiken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📊 Im Resend Dashboard siehst du:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Alle gesendeten E-Mails</li>
                  <li>• Zustellstatus (Delivered/Bounced)</li>
                  <li>• Öffnungsraten und Klicks</li>
                  <li>• Fehlerdetails und Bounce-Gründe</li>
                  <li>• API-Nutzung und Limits</li>
                </ul>
              </div>
              <Button onClick={checkResendDashboard} className="w-full" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Resend Dashboard öffnen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
            <CardDescription>
              Häufige Probleme und Lösungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-medium text-yellow-900 text-sm">🚨 E-Mails nicht angekommen?</h4>
                <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                  <li>• Spam-Ordner prüfen</li>
                  <li>• <strong>422 Error:</strong> Max. 50 Empfänger pro E-Mail</li>
                  <li>• Rate Limiting (60s Pause zwischen Batches)</li>
                  <li>• Ungültige E-Mail-Adressen</li>
                  <li>• Domain-Verifikation ausstehend</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900 text-sm">✅ Batch-Versendung (Optimiert):</h4>
                <ul className="text-xs text-green-800 mt-1 space-y-1">
                  <li>• <strong>25 E-Mails pro Batch</strong> (Bounce-Optimiert)</li>
                  <li>• <strong>60 Sekunden Pause</strong> zwischen Batches</li>
                  <li>• Detailliertes Logging</li>
                  <li>• Fehler-Behandlung pro Batch</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Browser-Konsole Logs</CardTitle>
          <CardDescription>
            E-Mail-Versand wird jetzt detailliert in der Browser-Konsole geloggt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
              <div className="text-green-600">📧 Starte E-Mail-Versand an 56 Empfänger in Batches von 25</div>
              <div className="text-blue-600">✅ Batch 1 gesendet: id: re_abc123, recipients: 25</div>
              <div className="text-blue-600">✅ Batch 2 gesendet: id: re_def456, recipients: 25</div>
              <div className="text-blue-600">✅ Batch 3 gesendet: id: re_ghi789, recipients: 6</div>
              <div className="text-gray-600">📊 E-Mail-Versand abgeschlossen: 56 erfolgreich, 0 fehlgeschlagen</div>
              <div className="text-orange-600">⚠️ Bounce-Optimierung: 25 statt 50 E-Mails pro Batch</div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>
                Seite neu laden
              </Button>
              <Button onClick={testEmailAPI} disabled={loading}>
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                API testen
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              💡 <strong>Tipp:</strong> Öffne die Browser-Entwicklertools (F12) → Konsole-Tab, um Live-Logs zu sehen.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

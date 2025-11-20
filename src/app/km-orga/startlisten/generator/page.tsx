"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configId = searchParams.get('id');
  const [meldungen, setMeldungen] = React.useState([]);
  const [startliste, setStartliste] = React.useState([]);
  const [config, setConfig] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [geminiLoading, setGeminiLoading] = React.useState(false);
  const [showGemini, setShowGemini] = React.useState(false);
  const [geminiResult, setGeminiResult] = React.useState(null);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simuliere Daten laden
      const mockMeldungen = [
        { id: '1', schuetzeName: 'Max Mustermann', verein: 'SV Test', disziplin: 'KK liegend', wettkampfklasse: 'Herren I', gewehrSharing: false },
        { id: '2', schuetzeName: 'Anna Schmidt', verein: 'SV Test', disziplin: 'KK liegend', wettkampfklasse: 'Damen I', gewehrSharing: true },
        { id: '3', schuetzeName: 'Klaus Weber', verein: 'SV Test', disziplin: 'KK liegend', wettkampfklasse: 'Herren I', gewehrSharing: false },
        { id: '4', schuetzeName: 'Maria Müller', verein: 'SV Test', disziplin: 'KK liegend', wettkampfklasse: 'Damen II', gewehrSharing: false },
        { id: '5', schuetzeName: 'Peter Müller', verein: 'SG Beispiel', disziplin: 'KK liegend', wettkampfklasse: 'Herren II', gewehrSharing: false },
        { id: '6', schuetzeName: 'Lisa Bauer', verein: 'SG Beispiel', disziplin: 'KK liegend', wettkampfklasse: 'Damen I', gewehrSharing: false }
      ];
      
      const mockConfig = {
        verfuegbareStaende: ['1', '2', '3', '4', '5'],
        startzeit: '09:00',
        durchgangsDauer: 30,
        wechselzeit: 10,
        pausen: [{ nach: 3, dauer: 15 }]
      };
      
      setMeldungen(mockMeldungen);
      setConfig(mockConfig);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const generiereKlassisch = () => {
    // Klassische Sortierung
    const sortiert = [...meldungen].sort((a, b) => {
      if (a.verein !== b.verein) return a.verein.localeCompare(b.verein);
      return a.schuetzeName.localeCompare(b.schuetzeName);
    });
    
    const liste = sortiert.map((m, i) => ({
      id: `start_${i}`,
      schuetzeId: m.id,
      name: m.schuetzeName,
      verein: m.verein,
      disziplin: m.disziplin,
      wettkampfklasse: m.wettkampfklasse,
      stand: config.verfuegbareStaende[i % config.verfuegbareStaende.length],
      startzeit: `${9 + Math.floor(i / config.verfuegbareStaende.length)}:${(i % 2) * 30 < 10 ? '0' : ''}${(i % 2) * 30}`,
      durchgang: Math.floor(i / config.verfuegbareStaende.length) + 1,
      hinweise: m.gewehrSharing ? 'Gewehr geteilt' : ''
    }));
    
    setStartliste(liste);
  };

  const generiereGemini = async () => {
    setGeminiLoading(true);
    try {
      const response = await fetch('/api/gemini/startlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldungen,
          config,
          aktion: 'generieren'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeminiResult(result.data);
        setStartliste(result.data.startliste || []);
      } else {
        alert('Gemini Fehler: ' + result.error);
      }
    } catch (error) {
      alert('Fehler: ' + error.message);
    } finally {
      setGeminiLoading(false);
    }
  };

  const optimiereGemini = async () => {
    if (startliste.length === 0) return;
    
    setGeminiLoading(true);
    try {
      const response = await fetch('/api/gemini/startlisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meldungen: startliste,
          config,
          aktion: 'optimieren'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeminiResult(result.data);
      } else {
        alert('Gemini Fehler: ' + result.error);
      }
    } catch (error) {
      alert('Fehler: ' + error.message);
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">🎯 Startlisten generieren</h1>
          <p className="text-muted-foreground">Config ID: {configId} • {meldungen.length} Meldungen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generator-Optionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={generiereKlassisch} disabled={loading}>
                📋 Klassisch sortieren
              </Button>
              <Button 
                onClick={() => setShowGemini(!showGemini)}
                variant={showGemini ? 'default' : 'outline'}
              >
                🤖 Gemini AI {showGemini ? 'aktiv' : ''}
              </Button>
            </div>
            
            {showGemini && (
              <div className="p-4 bg-blue-50 rounded border space-y-3">
                <h4 className="font-medium text-blue-900">🤖 Gemini AI Generator</h4>
                <p className="text-sm text-blue-700">
                  KI-basierte Startlisten-Optimierung mit Vereins-Limits & Sportgeräte-Regeln
                </p>
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  • Max. 2 Starter pro Verein pro Durchgang<br/>
                  • Gewehr-Sharing Erkennung<br/>
                  • Stand-Zeit-Konflikt Vermeidung
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={generiereGemini} 
                    disabled={geminiLoading}
                    size="sm"
                  >
                    {geminiLoading ? '⏳ Generiere...' : '✨ Neu generieren'}
                  </Button>
                  <Button 
                    onClick={optimiereGemini} 
                    disabled={geminiLoading || startliste.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    {geminiLoading ? '⏳ Analysiere...' : '🔍 Optimieren'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Gemini Analyse */}
            {geminiResult && (
              <div className="p-4 bg-green-50 rounded border">
                <h4 className="font-medium text-green-900 mb-2">🤖 Gemini Analyse</h4>
                {geminiResult.konflikte?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-700">⚠️ Konflikte ({geminiResult.konflikte.length}):</p>
                    {geminiResult.konflikte.map((k, i) => (
                      <div key={i} className="text-xs text-red-600 mb-1">
                        <div className="font-medium">• {k.typ || 'Konflikt'}: {k.beschreibung || k}</div>
                        {k.betroffene && <div className="ml-2 text-red-500">Betroffen: {k.betroffene.join(', ')}</div>}
                        {k.loesungen && k.loesungen.map((l, j) => (
                          <div key={j} className="ml-2 text-red-400">→ {l}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {geminiResult.optimierungen?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700">✅ Optimierungen:</p>
                    {geminiResult.optimierungen.map((o, i) => (
                      <p key={i} className="text-xs text-green-600">• {o.beschreibung || o}</p>
                    ))}
                  </div>
                )}
                {geminiResult.score && (
                  <p className="text-sm font-medium text-blue-700 mt-2">
                    Score: {geminiResult.score}/100
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Startliste */}
        <Card>
          <CardHeader>
            <CardTitle>Generierte Startliste ({startliste.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {startliste.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {startliste.map((starter, i) => (
                  <div key={starter.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">{starter.name}</div>
                    <div className="text-gray-600">
                      {starter.verein} • Stand {starter.stand} • {starter.startzeit}
                      {starter.hinweise && <span className="text-orange-600"> • {starter.hinweise}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Noch keine Startliste generiert
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

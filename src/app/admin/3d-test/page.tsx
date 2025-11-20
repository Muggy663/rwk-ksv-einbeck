"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamisch laden um SSR-Probleme mit Three.js zu vermeiden
const TargetVisualization = dynamic(
  () => import('@/components/3d/TargetVisualization'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 border rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Lade 3D-Komponente...</p>
        </div>
      </div>
    )
  }
);

export default function Admin3DTestPage() {
  const [selectedDemo, setSelectedDemo] = useState('demo1');

  // Verschiedene Demo-Datensätze
  const demoData = {
    demo1: {
      title: "Perfekte Serie - 10x 10er",
      shots: [
        { x: 0.05, y: 0.02, ring: 10, series: 1 },
        { x: -0.03, y: 0.08, ring: 10, series: 1 },
        { x: 0.07, y: -0.04, ring: 10, series: 1 },
        { x: -0.02, y: -0.06, ring: 10, series: 1 },
        { x: 0.04, y: 0.09, ring: 10, series: 1 },
        { x: -0.08, y: 0.01, ring: 10, series: 2 },
        { x: 0.06, y: -0.07, ring: 10, series: 2 },
        { x: -0.01, y: 0.05, ring: 10, series: 2 },
        { x: 0.09, y: -0.02, ring: 10, series: 2 },
        { x: 0.00, y: 0.00, ring: 10, series: 2 }
      ]
    },
    demo2: {
      title: "Realistische Wettkampf-Serie",
      shots: [
        { x: 0.2, y: 0.1, ring: 10, series: 1 },
        { x: -0.1, y: 0.3, ring: 9, series: 1 },
        { x: 0.4, y: -0.2, ring: 8, series: 1 },
        { x: -0.3, y: -0.1, ring: 10, series: 1 },
        { x: 0.1, y: -0.4, ring: 9, series: 1 },
        { x: 0.5, y: 0.3, ring: 7, series: 2 },
        { x: -0.2, y: 0.4, ring: 9, series: 2 },
        { x: 0.3, y: 0.2, ring: 10, series: 2 },
        { x: -0.4, y: -0.3, ring: 8, series: 2 },
        { x: 0.15, y: 0.05, ring: 9, series: 2 }
      ]
    },
    demo3: {
      title: "Schlechter Tag - Viele Ausreißer",
      shots: [
        { x: 0.8, y: 0.6, ring: 5, series: 1 },
        { x: -0.7, y: 0.9, ring: 4, series: 1 },
        { x: 1.2, y: -0.8, ring: 3, series: 1 },
        { x: -0.9, y: -0.5, ring: 6, series: 1 },
        { x: 0.6, y: -1.1, ring: 2, series: 1 },
        { x: 1.0, y: 0.7, ring: 4, series: 2 },
        { x: -0.8, y: 1.0, ring: 3, series: 2 },
        { x: 0.9, y: 0.4, ring: 7, series: 2 },
        { x: -1.1, y: -0.6, ring: 2, series: 2 },
        { x: 0.3, y: 0.2, ring: 8, series: 2 }
      ]
    },
    demo4: {
      title: "Luftpistole - Typisches Ergebnis",
      shots: [
        { x: 0.3, y: 0.2, ring: 9, series: 1 },
        { x: -0.2, y: 0.4, ring: 8, series: 1 },
        { x: 0.5, y: -0.3, ring: 7, series: 1 },
        { x: -0.4, y: -0.2, ring: 9, series: 1 },
        { x: 0.2, y: -0.5, ring: 8, series: 1 },
        { x: 0.6, y: 0.4, ring: 6, series: 2 },
        { x: -0.3, y: 0.5, ring: 8, series: 2 },
        { x: 0.4, y: 0.3, ring: 9, series: 2 },
        { x: -0.5, y: -0.4, ring: 7, series: 2 },
        { x: 0.1, y: 0.1, ring: 10, series: 2 }
      ]
    }
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">🎯 3D Trefferbild Test</h1>
          <p className="text-muted-foreground">
            Test der Three.js 3D-Visualisierung für Schießergebnisse
          </p>
        </div>
      </div>

      {/* Demo Auswahl */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Demo-Datensätze</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(demoData).map(([key, data]) => (
              <Button
                key={key}
                variant={selectedDemo === key ? "default" : "outline"}
                onClick={() => setSelectedDemo(key)}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold text-sm">{data.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {data.shots.length} Schüsse
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ⌀ {(data.shots.reduce((sum, shot) => sum + shot.ring, 0) / data.shots.length).toFixed(1)} Ringe
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3D Visualization */}
      <div className="space-y-6">
        <TargetVisualization
          shots={demoData[selectedDemo].shots}
          title={demoData[selectedDemo].title}
          showAnimation={true}
        />

        {/* Technische Infos */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Technische Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Features:</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ 3D-Scheibe mit konzentrischen Ringen</li>
                  <li>✅ Animierte Schuss-Einschläge</li>
                  <li>✅ Farbkodierung nach Ringwerten</li>
                  <li>✅ Live-Statistiken</li>
                  <li>✅ Interaktive Steuerung</li>
                  <li>✅ Responsive Design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technologie:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Three.js für 3D-Rendering</li>
                  <li>• WebGL für Hardware-Beschleunigung</li>
                  <li>• React Hooks für State-Management</li>
                  <li>• Dynamic Import für SSR-Kompatibilität</li>
                  <li>• Responsive Canvas-Größenanpassung</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Einsatzmöglichkeiten:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Statistik-Seiten:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Persönliche Schießergebnisse</li>
                    <li>• Wettkampf-Auswertungen</li>
                    <li>• Trainings-Analyse</li>
                  </ul>
                </div>
                <div>
                  <strong>Startseite:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Eye-Catcher Element</li>
                    <li>• Demo der App-Features</li>
                    <li>• Interaktive Präsentation</li>
                  </ul>
                </div>
                <div>
                  <strong>Schießsport-Erklärung:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Visualisierung der Ringwerte</li>
                    <li>• Interaktive Scheiben-Demo</li>
                    <li>• Lernhilfe für Anfänger</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Info */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Performance & Browser-Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Browser-Kompatibilität:</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ Chrome/Edge (WebGL 2.0)</li>
                  <li>✅ Firefox (WebGL 2.0)</li>
                  <li>✅ Safari (WebGL 1.0)</li>
                  <li>✅ Mobile Browser (iOS/Android)</li>
                  <li>⚠️ Fallback für ältere Browser</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Optimierungen:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Lazy Loading mit Dynamic Import</li>
                  <li>• Effiziente Geometrie-Wiederverwendung</li>
                  <li>• Optimierte Render-Loop</li>
                  <li>• Memory-Management für Cleanup</li>
                  <li>• Responsive Canvas-Anpassung</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

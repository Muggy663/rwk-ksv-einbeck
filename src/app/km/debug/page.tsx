"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function KMDebug() {
  const [meldungen, setMeldungen] = useState([]);
  const [mannschaften, setMannschaften] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMeldungen = async () => {
    try {
      const res = await fetch('/api/km/meldungen?jahr=2026');
      const data = await res.json();
      setMeldungen(data.data || []);
      console.log('📋 Meldungen:', data.data);
    } catch (error) {
      console.error('Error loading meldungen:', error);
    }
  };

  const loadMannschaften = async () => {
    try {
      const res = await fetch('/api/km/mannschaften');
      const data = await res.json();
      setMannschaften(data.data || []);
      console.log('👥 Mannschaften:', data.data);
    } catch (error) {
      console.error('Error loading mannschaften:', error);
    }
  };

  const generateTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/km/mannschaften/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saison: '2026' })
      });
      const result = await res.json();
      console.log('🚀 Generation result:', result);
      await loadMannschaften();
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeldungen();
    loadMannschaften();
  }, []);

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 KM Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📋 Meldungen ({meldungen.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={loadMeldungen} className="mb-4">Neu laden</Button>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {meldungen.map((m, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                  <div>Schütze: {m.schuetzeId}</div>
                  <div>Disziplin: {m.disziplinId}</div>
                  <div>Club: {m.kmClubId || m.clubId}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>👥 Mannschaften ({mannschaften.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button onClick={loadMannschaften}>Neu laden</Button>
              <Button onClick={generateTeams} disabled={loading}>
                {loading ? 'Generiere...' : '🚀 Generieren'}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mannschaften.map((m, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                  <div>Team: {m.name}</div>
                  <div>Verein: {m.vereinId}</div>
                  <div>Schützen: {m.schuetzenIds?.length || 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
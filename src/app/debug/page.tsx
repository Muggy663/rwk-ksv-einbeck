"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const rebuildShooters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/rebuild-shooters', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/collections');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const importMissing = async () => {
    if (!file) {
      setResult({ error: 'Bitte Excel-Datei auswählen' });
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/debug/import-missing', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const removeDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/remove-duplicates', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const debugTeamShooters = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/team-shooters');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 Debug Tools</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={checkCollections} disabled={loading}>
          📊 Collections prüfen
        </Button>
        
        <Button onClick={rebuildShooters} disabled={loading} className="bg-green-600 hover:bg-green-700">
          ➕ Fehlende RWK-Schützen hinzufügen
        </Button>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">📄 Excel-Import (nur fehlende)</h3>
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-2"
          />
          <br />
          <Button onClick={importMissing} disabled={loading || !file} className="bg-blue-600 hover:bg-blue-700">
            📈 Fehlende aus Excel importieren
          </Button>
        </div>
        
        <Button onClick={removeDuplicates} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          🔄 Duplikate entfernen (RWK bevorzugt)
        </Button>
        
        <Button onClick={debugTeamShooters} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          👥 Team-Debug (Schützen & Teams)
        </Button>
      </div>

      {loading && <div>⏳ Lädt...</div>}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
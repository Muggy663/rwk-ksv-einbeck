"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AddFieldsPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const addFieldsToAllShooters = async () => {
    setLoading(true);
    setResult('🚀 Füge Adressfelder zu ALLEN shooters hinzu...\n\n');
    
    try {
      // Lade alle shooters
      const shootersSnapshot = await getDocs(collection(db, 'shooters'));
      const totalShooters = shootersSnapshot.docs.length;
      
      setResult(prev => prev + `📊 ${totalShooters} shooters gefunden\n\n`);
      
      let updated = 0;
      let alreadyHad = 0;
      let batchCount = 0;
      
      // Batch-Update für bessere Performance
      let batch = writeBatch(db);
      
      for (const docSnapshot of shootersSnapshot.docs) {
        try {
          const data = docSnapshot.data();
          
          // Prüfe welche Felder fehlen
          const missingFields = {};
          
          if (!data.hasOwnProperty('strasse')) missingFields.strasse = '';
          if (!data.hasOwnProperty('plz')) missingFields.plz = '';
          if (!data.hasOwnProperty('ort')) missingFields.ort = '';
          if (!data.hasOwnProperty('mobil')) missingFields.mobil = '';
          if (!data.hasOwnProperty('telefon')) missingFields.telefon = '';
          if (!data.hasOwnProperty('email')) missingFields.email = '';
          
          // Nur updaten wenn Felder fehlen
          if (Object.keys(missingFields).length > 0) {
            batch.update(docSnapshot.ref, {
              ...missingFields,
              updatedAt: new Date()
            });
            
            batchCount++;
            updated++;
            
            if (updated % 100 === 0) {
              setResult(prev => prev + `📝 ${updated} shooters bearbeitet...\n`);
            }
            
            // Batch alle 500 Operationen committen
            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(db);
              batchCount = 0;
            }
          } else {
            alreadyHad++;
          }
          
        } catch (error) {
          setResult(prev => prev + `❌ Fehler bei ${docSnapshot.id}: ${error.message}\n`);
        }
      }
      
      // Letzten Batch committen
      if (batchCount > 0) {
        await batch.commit();
      }
      
      setResult(prev => prev + '\n📊 Felder-Update Statistik:\n');
      setResult(prev => prev + `✅ Felder hinzugefügt: ${updated}\n`);
      setResult(prev => prev + `📋 Hatten schon alle Felder: ${alreadyHad}\n`);
      setResult(prev => prev + `📊 Gesamt: ${totalShooters}\n\n`);
      
      setResult(prev => prev + '🎉 Alle shooters haben jetzt diese Felder:\n');
      setResult(prev => prev + '   • strasse (leer)\n');
      setResult(prev => prev + '   • plz (leer)\n');
      setResult(prev => prev + '   • ort (leer)\n');
      setResult(prev => prev + '   • mobil (leer)\n');
      setResult(prev => prev + '   • telefon (leer)\n');
      setResult(prev => prev + '   • email (leer)\n\n');
      
      setResult(prev => prev + '📱 Jetzt funktioniert die Mobil-Spalte überall!\n');
      
    } catch (error) {
      setResult(prev => prev + `❌ Hauptfehler: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Adressfelder zu allen shooters hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-semibold mb-2">⚠️ Was passiert:</h3>
              <p>Dieser Vorgang fügt zu ALLEN shooters (~1000+) die fehlenden Felder hinzu:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>strasse:</strong> '' (leer)</li>
                <li><strong>plz:</strong> '' (leer)</li>
                <li><strong>ort:</strong> '' (leer)</li>
                <li><strong>mobil:</strong> '' (leer)</li>
                <li><strong>telefon:</strong> '' (falls nicht vorhanden)</li>
                <li><strong>email:</strong> '' (falls nicht vorhanden)</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">✅ Warum das wichtig ist:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Vereinssoftware zeigt Mobil-Spalte bei ALLEN Mitgliedern</li>
                <li>Keine Fehler mehr bei fehlenden Feldern</li>
                <li>Einheitliche Datenstruktur für alle shooters</li>
                <li>Bessere Performance bei Abfragen</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold mb-2">🛡️ Sicherheit:</h3>
              <p>Bestehende Daten werden NICHT überschrieben. Nur fehlende Felder werden als leer hinzugefügt.</p>
            </div>
            
            <Button onClick={addFieldsToAllShooters} disabled={loading} className="w-full">
              {loading ? 'Felder werden hinzugefügt...' : 'Adressfelder zu allen shooters hinzufügen'}
            </Button>
            
            {result && (
              <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-2">Fortschritt:</h3>
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}
            
            <div className="flex gap-2">
              <a href="/vereinssoftware/mitglieder">
                <Button variant="outline">
                  Zur Mitgliederverwaltung
                </Button>
              </a>
              <a href="/dashboard-auswahl">
                <Button variant="outline">
                  Zum Dashboard
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
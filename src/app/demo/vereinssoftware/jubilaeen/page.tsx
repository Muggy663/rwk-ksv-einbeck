"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DemoJubilaeenPage() {
  const [selectedYear, setSelectedYear] = useState(2025);
  
  const demoJubilare = [
    { name: 'Klaus Bauer', alter: 65, jahreImVerein: 40, aktion: 'Gold', typ: 'Jubilar' },
    { name: 'Anna Schmidt', alter: 60, jahreImVerein: 15, aktion: 'Gutschein', typ: 'Geburtstag' },
    { name: 'Peter Weber', alter: 45, jahreImVerein: 20, aktion: 'Silber', typ: 'Jubilar' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-primary">Demo: Jubiläen-System</h1>
          <a href="/demo/vereinssoftware">
            <Button variant="outline">Zurück zur Demo</Button>
          </a>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-900 mb-2">🎭 Demo-Modus</h3>
          <p className="text-orange-700 text-sm">
            Dies ist eine Demo des Jubiläen-Systems. In der echten Version können Sie die Konfiguration 
            individuell anpassen und 5 Jahre im Voraus planen.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Jahresauswahl */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>🎉 Jubiläre {selectedYear}</CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Jahr:</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Name</th>
                    <th className="text-center p-3">Alter</th>
                    <th className="text-center p-3">Jahre im Verein</th>
                    <th className="text-center p-3">Aktion</th>
                    <th className="text-center p-3">Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {demoJubilare.map((person, index) => (
                    <tr key={index} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{person.name}</td>
                      <td className="p-3 text-center">{person.alter + (selectedYear - 2025)}</td>
                      <td className="p-3 text-center">{person.jahreImVerein + (selectedYear - 2025)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          person.aktion === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          person.aktion === 'Silber' ? 'bg-gray-100 text-gray-800' :
                          person.aktion === 'Gutschein' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {person.aktion}
                        </span>
                      </td>
                      <td className="p-3 text-center">{person.typ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Konfiguration Demo */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Konfiguration (Demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">🎂 Geburtstage:</h4>
                <ul className="list-disc pl-5 text-sm text-green-700">
                  <li>Karte: 18, 50 Jahre</li>
                  <li>Gutschein: 60, 70 Jahre</li>
                  <li>Ab 70: alle 5 Jahre</li>
                  <li>Benutzerdefiniert: + Button</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">🏆 Jubiläen:</h4>
                <ul className="list-disc pl-5 text-sm text-blue-700">
                  <li>Bronze: 10 Jahre</li>
                  <li>Silber: 20 Jahre</li>
                  <li>Gold: 40, 50, 60 Jahre</li>
                  <li>Spezial: Individuell</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">🚀 Echte Version Features:</h3>
        <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
          <li>Individualisierbare Jubiläen-Konfiguration für jeden Verein</li>
          <li>5-Jahres-Vorausplanung (2023-2030) für Ehrungen</li>
          <li>Benutzerdefinierte Geburtstags-Alter und Jubiläums-Jahre</li>
          <li>Automatische Berechnung basierend auf echten Daten</li>
          <li>+ Button zum Hinzufügen eigener Regeln</li>
          <li>Spezial-Kategorie für vereinsspezifische Ehrungen</li>
        </ul>
      </div>
    </div>
  );
}
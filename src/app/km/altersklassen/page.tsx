"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KMAltersklassen() {
  const sportjahr = 2026;

  const auflageKlassen = [
    { name: 'Schüler I m', alter: '12-14', geburtsjahre: '2012-2014' },
    { name: 'Schüler I w', alter: '12-14', geburtsjahre: '2012-2014' },
    { name: 'Senioren 0', alter: '41-50', geburtsjahre: '1976-1985', gemischt: true },
    { name: 'Senioren I m', alter: '51-60', geburtsjahre: '1966-1975' },
    { name: 'Seniorinnen I', alter: '51-60', geburtsjahre: '1966-1975' },
    { name: 'Senioren II m', alter: '61-65', geburtsjahre: '1961-1965' },
    { name: 'Seniorinnen II', alter: '61-65', geburtsjahre: '1961-1965' },
    { name: 'Senioren III m', alter: '66-70', geburtsjahre: '1956-1960' },
    { name: 'Seniorinnen III', alter: '66-70', geburtsjahre: '1956-1960' },
    { name: 'Senioren IV m', alter: '71-75', geburtsjahre: '1951-1955' },
    { name: 'Seniorinnen IV', alter: '71-75', geburtsjahre: '1951-1955' },
    { name: 'Senioren V m', alter: '76-80', geburtsjahre: '1946-1950' },
    { name: 'Seniorinnen V', alter: '76-80', geburtsjahre: '1946-1950' },
    { name: 'Senioren VI m', alter: '81+', geburtsjahre: '1945 und früher' },
    { name: 'Seniorinnen VI', alter: '81+', geburtsjahre: '1945 und früher' }
  ];

  const freihandKlassen = [
    { name: 'Schüler I m', alter: '12-14', geburtsjahre: '2012-2014' },
    { name: 'Schüler I w', alter: '12-14', geburtsjahre: '2012-2014' },
    { name: 'Jugend m', alter: '15-16', geburtsjahre: '2010-2011' },
    { name: 'Jugend w', alter: '15-16', geburtsjahre: '2010-2011' },
    { name: 'Junioren II m', alter: '17-18', geburtsjahre: '2008-2009' },
    { name: 'Junioren II w', alter: '17-18', geburtsjahre: '2008-2009' },
    { name: 'Junioren I m', alter: '19-20', geburtsjahre: '2006-2007' },
    { name: 'Junioren I w', alter: '19-20', geburtsjahre: '2006-2007' },
    { name: 'Herren I', alter: '21-40', geburtsjahre: '1986-2005' },
    { name: 'Damen I', alter: '21-40', geburtsjahre: '1986-2005' },
    { name: 'Herren II', alter: '41-50', geburtsjahre: '1976-1985' },
    { name: 'Damen II', alter: '41-50', geburtsjahre: '1976-1985' },
    { name: 'Herren III', alter: '51-60', geburtsjahre: '1966-1975' },
    { name: 'Damen III', alter: '51-60', geburtsjahre: '1966-1975' },
    { name: 'Herren IV', alter: '61-70', geburtsjahre: '1956-1965' },
    { name: 'Damen IV', alter: '61-70', geburtsjahre: '1956-1965' },
    { name: 'Herren V', alter: '71+', geburtsjahre: '1955 und früher' },
    { name: 'Damen V', alter: '71+', geburtsjahre: '1955 und früher' }
  ];

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/km">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu KM
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-primary">📋 Altersklassen KM {sportjahr}</h1>
        <p className="text-muted-foreground">
          Übersicht aller Wettkampfklassen für Auflage- und Freihand-Disziplinen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auflage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-blue-600">🎯 Auflage-Disziplinen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm text-orange-700 font-medium">
                ⚠️ Nicht teilnahmeberechtigt: 15-40 Jahre (Geburtsjahre 1986-2011)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Wettkampfklasse</th>
                    <th className="text-left p-2">Alter {sportjahr}</th>
                    <th className="text-left p-2">Geburtsjahre</th>
                  </tr>
                </thead>
                <tbody>
                  {auflageKlassen.map((klasse, index) => (
                    <tr key={index} className={`border-b ${klasse.gemischt ? 'bg-green-50' : ''}`}>
                      <td className="p-2 font-medium">
                        {klasse.name}
                        {klasse.gemischt && <span className="ml-2 text-xs text-green-600">(gemischt)</span>}
                      </td>
                      <td className="p-2">{klasse.alter}</td>
                      <td className="p-2 text-gray-600">{klasse.geburtsjahre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Freihand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-green-600">🎯 Freihand-Disziplinen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700 font-medium">
                ✅ Alle Altersgruppen teilnahmeberechtigt
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Wettkampfklasse</th>
                    <th className="text-left p-2">Alter {sportjahr}</th>
                    <th className="text-left p-2">Geburtsjahre</th>
                  </tr>
                </thead>
                <tbody>
                  {freihandKlassen.map((klasse, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{klasse.name}</td>
                      <td className="p-2">{klasse.alter}</td>
                      <td className="p-2 text-gray-600">{klasse.geburtsjahre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Wichtige Hinweise</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Sportjahr {sportjahr}:</strong> Entscheidend ist das Geburtsjahr, nicht das Geburtsdatum</li>
          <li>• <strong>Auflage:</strong> Nur Schüler (12-14) und Senioren (41+) teilnahmeberechtigt</li>
          <li>• <strong>Senioren 0:</strong> Gemischte Altersklasse (männlich und weiblich zusammen)</li>
          <li>• <strong>Automatische Berechnung:</strong> Das System ordnet Schützen automatisch der korrekten Klasse zu</li>
        </ul>
      </div>
    </div>
  );
}
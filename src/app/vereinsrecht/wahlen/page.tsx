"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { 
  Vote, 
  Plus, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface Wahl {
  id: string;
  titel: string;
  datum: string;
  position: string;
  kandidaten: string[];
  wahlberechtigt: number;
  abgegebeneStimmen: number;
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
  gewinner?: string;
}

const mockWahlen: Wahl[] = [
  {
    id: '1',
    titel: 'Vorstandswahl 2025',
    datum: '2025-03-15',
    position: '1. Vorsitzender',
    kandidaten: ['Hans Müller', 'Anna Schmidt'],
    wahlberechtigt: 47,
    abgegebeneStimmen: 45,
    status: 'Abgeschlossen',
    gewinner: 'Hans Müller'
  },
  {
    id: '2',
    titel: 'Kassenwart-Wahl',
    datum: '2025-08-15',
    position: 'Kassenwart',
    kandidaten: ['Peter Weber'],
    wahlberechtigt: 8,
    abgegebeneStimmen: 8,
    status: 'Abgeschlossen',
    gewinner: 'Peter Weber'
  },
  {
    id: '3',
    titel: 'Schriftführer-Wahl',
    datum: '2025-12-10',
    position: 'Schriftführer',
    kandidaten: ['Maria Klein', 'Thomas Berg'],
    wahlberechtigt: 52,
    abgegebeneStimmen: 0,
    status: 'Geplant'
  }
];

export default function WahlenPage() {
  const [wahlen] = useState<Wahl[]>(mockWahlen);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedWahl, setSelectedWahl] = useState<Wahl | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Geplant': return 'bg-blue-100 text-blue-800';
      case 'Laufend': return 'bg-yellow-100 text-yellow-800';
      case 'Abgeschlossen': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Geplant': return <Clock className="h-4 w-4" />;
      case 'Laufend': return <Vote className="h-4 w-4" />;
      case 'Abgeschlossen': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container py-4 px-2 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/vereinsrecht" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Vote className="h-8 w-8" />
            Wahlen & Abstimmungen
          </h1>
        </div>
        <p className="text-muted-foreground">
          Digitale Durchführung von Vorstandswahlen und Abstimmungen
        </p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Vote className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">5</div>
            <div className="text-sm text-muted-foreground">Wahlen insgesamt</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-muted-foreground">Abgeschlossen</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">94%</div>
            <div className="text-sm text-muted-foreground">Wahlbeteiligung</div>
          </CardContent>
        </Card>
      </div>

      {/* Aktionen */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setShowNewDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Neue Wahl
        </Button>
      </div>

      {/* Wahlen-Liste */}
      <div className="grid gap-4">
        {wahlen.map((wahl) => (
          <Card key={wahl.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{wahl.titel}</h3>
                    <Badge className={getStatusColor(wahl.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(wahl.status)}
                        {wahl.status}
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(wahl.datum).toLocaleDateString('de-DE')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Position: {wahl.position}
                    </div>
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4" />
                      {wahl.kandidaten.length} Kandidat(en)
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {wahl.abgegebeneStimmen}/{wahl.wahlberechtigt} Stimmen
                    </div>
                  </div>

                  {/* Kandidaten */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Kandidaten:</p>
                    <div className="flex flex-wrap gap-2">
                      {wahl.kandidaten.map((kandidat, index) => (
                        <Badge key={index} variant="outline" className={
                          wahl.gewinner === kandidat ? 'bg-green-50 border-green-300 text-green-800' : ''
                        }>
                          {kandidat}
                          {wahl.gewinner === kandidat && ' ✓'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Ergebnis */}
                  {wahl.status === 'Abgeschlossen' && wahl.gewinner && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-green-800">
                        Gewählt: {wahl.gewinner}
                      </p>
                      <p className="text-xs text-green-600">
                        Wahlbeteiligung: {Math.round((wahl.abgegebeneStimmen / wahl.wahlberechtigt) * 100)}%
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedWahl(wahl)}
                  >
                    Details
                  </Button>
                  {wahl.status === 'Geplant' && (
                    <Button size="sm">
                      Starten
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Neue Wahl Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Neue Wahl erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titel">Titel</Label>
                <Input id="titel" placeholder="z.B. Kassenwart-Wahl 2025" />
              </div>
              
              <div>
                <Label htmlFor="position">Position</Label>
                <select id="position" className="w-full p-2 border rounded">
                  <option value="">Position wählen...</option>
                  <option value="1. Vorsitzender">1. Vorsitzender</option>
                  <option value="2. Vorsitzender">2. Vorsitzender</option>
                  <option value="Kassenwart">Kassenwart</option>
                  <option value="Schriftführer">Schriftführer</option>
                  <option value="Sportleiter">Sportleiter</option>
                  <option value="Jugendwart">Jugendwart</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="datum">Wahldatum</Label>
                <Input id="datum" type="date" />
              </div>
              
              <div>
                <Label htmlFor="wahlberechtigt">Wahlberechtigte</Label>
                <Input id="wahlberechtigt" type="number" placeholder="Anzahl wahlberechtigter Mitglieder" />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowNewDialog(false)} variant="outline" className="flex-1">
                  Abbrechen
                </Button>
                <Button onClick={() => setShowNewDialog(false)} className="flex-1">
                  Erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wahl Details Dialog */}
      {selectedWahl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{selectedWahl.titel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium">Position</p>
                  <p className="text-sm text-muted-foreground">{selectedWahl.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Datum</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedWahl.datum).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Wahlberechtigt</p>
                  <p className="text-sm text-muted-foreground">{selectedWahl.wahlberechtigt} Mitglieder</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Abgegebene Stimmen</p>
                  <p className="text-sm text-muted-foreground">{selectedWahl.abgegebeneStimmen}</p>
                </div>
              </div>

              {selectedWahl.status === 'Abgeschlossen' && (
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-green-800 mb-2">Wahlergebnis</h4>
                  <p className="text-sm text-green-700">
                    <strong>{selectedWahl.gewinner}</strong> wurde mit {selectedWahl.abgegebeneStimmen} Stimmen gewählt.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Wahlbeteiligung: {Math.round((selectedWahl.abgegebeneStimmen / selectedWahl.wahlberechtigt) * 100)}%
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setSelectedWahl(null)} variant="outline" className="flex-1">
                  Schließen
                </Button>
                <Button className="flex-1">
                  Protokoll erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
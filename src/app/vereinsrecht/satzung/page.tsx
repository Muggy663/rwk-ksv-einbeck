"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  Calendar,
  Download,
  Edit,
  History,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface Dokument {
  id: string;
  titel: string;
  typ: 'Satzung' | 'Geschäftsordnung' | 'Ordnung';
  version: string;
  datum: string;
  status: 'Aktuell' | 'Veraltet' | 'Entwurf';
  beschreibung: string;
}



interface Aenderung {
  id: string;
  dokument: string;
  datum: string;
  beschreibung: string;
  beschlossen: boolean;
}

// BEISPIELDATEN - Satzungsänderungen
const aenderungen: Aenderung[] = [
  {
    id: '1',
    dokument: 'Vereinssatzung (Beispieldaten)',
    datum: '2024-03-15',
    beschreibung: '§12 Mitgliedsbeiträge - Anpassung der Beitragshöhe (Beispieldaten)',
    beschlossen: true
  },
  {
    id: '2',
    dokument: 'Beitragsordnung (Beispieldaten)',
    datum: '2025-03-15',
    beschreibung: 'Einführung von Familienbeiträgen (Beispieldaten)',
    beschlossen: false
  }
];

export default function SatzungPage() {
  const [selectedTab, setSelectedTab] = useState('dokumente');
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDokumente();
  }, []);

  const loadDokumente = async () => {
    try {
      const response = await fetch('/api/vereinsrecht/satzung');
      const data = await response.json();
      setDokumente(data.dokumente || []);
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktuell': return 'bg-green-100 text-green-800';
      case 'Veraltet': return 'bg-red-100 text-red-800';
      case 'Entwurf': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aktuell': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Veraltet': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'Entwurf': return <Edit className="h-4 w-4 text-yellow-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container py-4 px-2 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/vereinsrecht" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Satzung & Ordnungen
          </h1>
        </div>
        <p className="text-muted-foreground">
          Verwaltung von Vereinssatzung, Geschäftsordnungen und Regelwerken
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('dokumente')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            selectedTab === 'dokumente' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Dokumente</span>
        </button>
        <button
          onClick={() => setSelectedTab('aenderungen')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            selectedTab === 'aenderungen' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Änderungen</span>
        </button>
      </div>

      {/* Dokumente Tab */}
      {selectedTab === 'dokumente' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Lade Dokumente...</p>
            </div>
          ) : dokumente.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Noch keine Dokumente vorhanden</p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Neues Dokument erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            dokumente.map((dokument) => (
            <Card key={dokument.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(dokument.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{dokument.titel}</h3>
                        <Badge variant="outline">{dokument.typ}</Badge>
                        <Badge className={getStatusColor(dokument.status)}>
                          {dokument.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version:</span>
                          <span>{dokument.version}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(dokument.datum).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{dokument.beschreibung}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Bearbeiten
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Löschen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>
      )}

      {/* Änderungen Tab */}
      {selectedTab === 'aenderungen' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geplante Satzungsänderungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aenderungen.map((aenderung) => (
                  <div key={aenderung.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{aenderung.dokument}</h4>
                        <Badge className={aenderung.beschlossen ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {aenderung.beschlossen ? 'Beschlossen' : 'Geplant'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{aenderung.beschreibung}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(aenderung.datum).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Änderungshistorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border-l-4 border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Vereinssatzung v3.2 (Beispieldaten)</p>
                    <p className="text-xs text-muted-foreground">15.03.2024 - §12 Mitgliedsbeiträge angepasst (Beispieldaten)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Schießordnung v1.8 (Beispieldaten)</p>
                    <p className="text-xs text-muted-foreground">10.01.2024 - Neue Sicherheitsbestimmungen (Beispieldaten)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 border-l-4 border-purple-500 bg-purple-50">
                  <Edit className="h-4 w-4 text-purple-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Geschäftsordnung v2.1 (Beispieldaten)</p>
                    <p className="text-xs text-muted-foreground">20.08.2023 - Digitale Vorstandssitzungen erlaubt (Beispieldaten)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hilfe-Bereich */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Rechtliche Hinweise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Satzungsänderungen</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Beschluss in Mitgliederversammlung erforderlich</li>
                <li>• 3/4-Mehrheit der anwesenden Mitglieder</li>
                <li>• Eintragung ins Vereinsregister binnen 3 Monaten</li>
                <li>• Benachrichtigung des Finanzamts bei Zweckänderung</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Geschäftsordnungen</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Können vom Vorstand beschlossen werden</li>
                <li>• Müssen der Satzung entsprechen</li>
                <li>• Regelmäßige Überprüfung empfohlen</li>
                <li>• Dokumentation aller Änderungen wichtig</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
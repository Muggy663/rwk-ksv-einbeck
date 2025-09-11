"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  FileText, 
  Euro, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  Plus,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  titel: string;
  status: 'OK' | 'Warnung' | 'Kritisch';
  ablauf?: string;
  beschreibung: string;
}



export default function GemeinnuetzigkeitPage() {
  const [selectedTab, setSelectedTab] = useState('compliance');
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [spenden, setSpenden] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/vereinsrecht/gemeinnuetzigkeit');
      const data = await response.json();
      setComplianceItems(data.compliance || []);
      setSpenden(data.spenden || []);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-100 text-green-800';
      case 'Warnung': return 'bg-yellow-100 text-yellow-800';
      case 'Kritisch': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Warnung': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Kritisch': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const complianceScore = Math.round((complianceItems.filter(item => item.status === 'OK').length / complianceItems.length) * 100);

  return (
    <div className="container py-4 px-2 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/vereinsrecht" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Gemeinnützigkeit & Steuerrecht
          </h1>
        </div>
        <p className="text-muted-foreground">
          Compliance-Überwachung und steuerrechtliche Verwaltung
        </p>
      </div>

      {/* Compliance Score */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Compliance-Status</h3>
              <p className="text-sm text-muted-foreground">Aktuelle Rechtssicherheit des Vereins</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{complianceScore}%</div>
              <div className="text-sm text-muted-foreground">Compliance-Score</div>
            </div>
          </div>
          <Progress value={complianceScore} className="h-2" />
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('compliance')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            selectedTab === 'compliance' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Compliance</span>
        </button>
        <button
          onClick={() => setSelectedTab('spenden')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            selectedTab === 'spenden' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Euro className="h-4 w-4" />
          <span>Spenden</span>
        </button>
        <button
          onClick={() => setSelectedTab('berichte')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            selectedTab === 'berichte' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Berichte</span>
        </button>
      </div>

      {/* Compliance Tab */}
      {selectedTab === 'compliance' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Lade Compliance-Daten...</p>
            </div>
          ) : complianceItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Noch keine Compliance-Einträge vorhanden</p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Neuen Eintrag erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            complianceItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <h4 className="font-medium">{item.titel}</h4>
                      <p className="text-sm text-muted-foreground">{item.beschreibung}</p>
                      {item.ablauf && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ablauf: {new Date(item.ablauf).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
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

      {/* Spenden Tab */}
      {selectedTab === 'spenden' && (
        <div className="space-y-6">
          {/* Spenden-Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Euro className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">12.450€</div>
                <div className="text-sm text-muted-foreground">Spenden 2025 (Beispieldaten)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">23</div>
                <div className="text-sm text-muted-foreground">Bescheinigungen (Beispieldaten)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">+15%</div>
                <div className="text-sm text-muted-foreground">vs. Vorjahr</div>
              </CardContent>
            </Card>
          </div>

          {/* Spendenbescheinigungen */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spendenbescheinigungen</CardTitle>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Neue Bescheinigung
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Hans Müller (Beispieldaten)</p>
                    <p className="text-sm text-muted-foreground">500€ - Geldspende (Beispieldaten)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Versendet</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Anna Schmidt (Beispieldaten)</p>
                    <p className="text-sm text-muted-foreground">250€ - Sachspende (Beispieldaten)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Entwurf</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Berichte Tab */}
      {selectedTab === 'berichte' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tätigkeitsbericht 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Frist beachten</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Der Tätigkeitsbericht muss bis zum 28.02.2025 beim Finanzamt eingereicht werden.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Vereinsaktivitäten 2024</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 24 Rundenwettkämpfe durchgeführt (Beispieldaten)</li>
                      <li>• 3 Kreismeisterschaften organisiert (Beispieldaten)</li>
                      <li>• 12 Jugendtrainings abgehalten (Beispieldaten)</li>
                      <li>• 1 Vereinsausflug veranstaltet (Beispieldaten)</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Mitgliederentwicklung</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 89 Mitglieder (Stand 31.12.2024) (Beispieldaten)</li>
                      <li>• 7 Neuaufnahmen (Beispieldaten)</li>
                      <li>• 3 Austritte (Beispieldaten)</li>
                      <li>• 12 Jugendliche unter 18 Jahren (Beispieldaten)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Bericht generieren
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Vorlage herunterladen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finanzübersicht 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Einnahmen</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mitgliedsbeiträge (Beispieldaten)</span>
                      <span className="font-medium">8.900€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spenden (Beispieldaten)</span>
                      <span className="font-medium">2.450€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Startgelder (Beispieldaten)</span>
                      <span className="font-medium">1.200€</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Gesamt (Beispieldaten)</span>
                      <span>12.550€</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Ausgaben</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Miete Schießstand (Beispieldaten)</span>
                      <span className="font-medium">4.800€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Versicherungen (Beispieldaten)</span>
                      <span className="font-medium">1.200€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material & Ausrüstung (Beispieldaten)</span>
                      <span className="font-medium">2.100€</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Gesamt (Beispieldaten)</span>
                      <span>8.100€</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  Überschuss 2024: 4.450€ (unter Freibetrag von 45.000€) (Beispieldaten)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
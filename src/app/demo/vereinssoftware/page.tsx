"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, CreditCard, Calendar, Award, Search, Plus, Edit, Trash2, Download, FileText, AlertTriangle } from 'lucide-react';

export default function VereinssoftwareDemo() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data - Realistische Vereinsdaten
  const mockMembers = [
    { id: 1, firstName: 'Marcel', lastName: 'Bünger', mitgliedsnummer: '80170025', geburtsdatum: '1988-03-15', eintrittsdatum: '2015-01-01', status: 'Aktiv', beitrag: 120, zahlungsart: 'SEPA', iban: 'DE89370400440532013000', vereinsjahre: 10 },
    { id: 2, firstName: 'Anna', lastName: 'Schmidt', mitgliedsnummer: '80170026', geburtsdatum: '1995-07-22', eintrittsdatum: '2018-03-01', status: 'Aktiv', beitrag: 80, zahlungsart: 'Überweisung', iban: '', vereinsjahre: 7 },
    { id: 3, firstName: 'Klaus', lastName: 'Weber', mitgliedsnummer: '80170027', geburtsdatum: '1962-11-08', eintrittsdatum: '1985-09-01', status: 'Aktiv', beitrag: 100, zahlungsart: 'SEPA', iban: 'DE89370400440532013001', vereinsjahre: 40 },
    { id: 4, firstName: 'Lisa', lastName: 'Müller', mitgliedsnummer: '80170028', geburtsdatum: '1992-04-12', eintrittsdatum: '2020-01-01', status: 'Aktiv', beitrag: 80, zahlungsart: 'SEPA', iban: 'DE89370400440532013002', vereinsjahre: 5 },
    { id: 5, firstName: 'Hans', lastName: 'Meier', mitgliedsnummer: '80170029', geburtsdatum: '1978-09-30', eintrittsdatum: '2010-05-01', status: 'Aktiv', beitrag: 120, zahlungsart: 'Dauerauftrag', iban: '', vereinsjahre: 15 }
  ];

  const mockLizenzen = [
    { id: 1, firstName: 'Marcel', lastName: 'Bünger', mitgliedsnummer: '80170025', vereinsfunktion: '1. Vorsitzender', lizenznummer: 'DSüB-T-C-1 176 022', ausbildungen: [
      { bezeichnung: 'Waffensachkunde', ablaufdatum: null, status: 'aktiv' },
      { bezeichnung: 'Schieß- und Standaufsicht', ablaufdatum: null, status: 'aktiv' },
      { bezeichnung: 'Trainer C Basis', ablaufdatum: '2027-11-27', status: 'aktiv' }
    ]},
    { id: 2, firstName: 'Klaus', lastName: 'Weber', mitgliedsnummer: '80170027', vereinsfunktion: 'Kassenwart', lizenznummer: 'DSB-12345', ausbildungen: [
      { bezeichnung: 'Waffensachkunde', ablaufdatum: '2025-03-15', status: 'läuft_bald_ab' }
    ]}
  ];

  const mockJubilaeen = [
    { name: 'Klaus Weber', typ: 'Vereinsjubiläum', jahre: 40, kategorie: 'Gold', datum: '2025-09-01' },
    { name: 'Anna Schmidt', typ: 'Geburtstag', jahre: 30, kategorie: 'Geburtstag', datum: '2025-07-22' },
    { name: 'Hans Meier', typ: 'Vereinsjubiläum', jahre: 15, kategorie: 'Bronze', datum: '2025-05-01' }
  ];

  const mockBeitraege = [
    { id: 1, name: 'Marcel Bünger', beitrag: 120, status: 'Bezahlt', zahlungsart: 'SEPA', mandatsdatum: '2015-01-01', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX' },
    { id: 2, name: 'Anna Schmidt', beitrag: 80, status: 'Offen', zahlungsart: 'Überweisung', mandatsdatum: '', iban: '', bic: '' },
    { id: 3, name: 'Klaus Weber', beitrag: 100, status: 'Bezahlt', zahlungsart: 'SEPA', mandatsdatum: '1985-09-01', iban: 'DE89370400440532013001', bic: 'COBADEFFXXX' },
    { id: 4, name: 'Lisa Müller', beitrag: 80, status: 'Mahnung', zahlungsart: 'SEPA', mandatsdatum: '2020-01-01', iban: 'DE89370400440532013002', bic: 'COBADEFFXXX' },
    { id: 5, name: 'Hans Meier', beitrag: 120, status: 'Bezahlt', zahlungsart: 'Dauerauftrag', mandatsdatum: '', iban: '', bic: '' }
  ];

  const filteredMembers = mockMembers.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.mitgliedsnummer.includes(searchTerm)
  );

  const stats = {
    totalMembers: mockMembers.length,
    activeMembers: mockMembers.filter(m => m.status === 'Aktiv').length,
    sepaMembers: mockMembers.filter(m => m.zahlungsart === 'SEPA').length,
    paidMembers: mockBeitraege.filter(b => b.status === 'Bezahlt').length,
    openPayments: mockBeitraege.filter(b => b.status === 'Offen' || b.status === 'Mahnung').length,
    totalLicenses: mockLizenzen.reduce((sum, m) => sum + m.ausbildungen.length, 0),
    expiringLicenses: mockLizenzen.reduce((sum, m) => sum + m.ausbildungen.filter(a => a.status === 'läuft_bald_ab').length, 0),
    upcomingJubilees: mockJubilaeen.length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/dashboard-auswahl">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              </a>
              <h1 className="text-2xl font-bold text-primary">👥 Vereinssoftware Demo</h1>
              <Badge className="bg-orange-500 text-white">DEMO</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Globale Suche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 space-y-2">
            <Button
              variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('dashboard')}
            >
              📊 Dashboard
            </Button>
            <Button
              variant={activeSection === 'members' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('members')}
            >
              👥 Mitglieder
            </Button>
            <Button
              variant={activeSection === 'beitraege' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('beitraege')}
            >
              💳 Beiträge & SEPA
            </Button>
            <Button
              variant={activeSection === 'jubilaeen' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('jubilaeen')}
            >
              🎂 Geburtstage & Jubiläen
            </Button>
            <Button
              variant={activeSection === 'lizenzen' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('lizenzen')}
            >
              🏆 Lizenzen & Ausbildungen
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Dashboard */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Demo-Modus aktiv</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Sie sehen eine realistische Demo der Vereinssoftware v1.5.8 mit echten Funktionen und Mockdaten.
                  </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
                          <p className="text-sm text-gray-600">Mitglieder gesamt</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{stats.paidMembers}</div>
                          <p className="text-sm text-gray-600">Beiträge bezahlt</p>
                        </div>
                        <CreditCard className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{stats.sepaMembers}</div>
                          <p className="text-sm text-gray-600">SEPA-Mandate</p>
                        </div>
                        <FileText className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-orange-600">{stats.upcomingJubilees}</div>
                          <p className="text-sm text-gray-600">Anstehende Jubiläen</p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💳 SEPA-Beitragsverwaltung v1.5.8</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2">
                        <li>✅ Automatische BIC-Berechnung aus IBAN</li>
                        <li>✅ Multi-Bank-Export (Sparkasse, Volksbank, etc.)</li>
                        <li>✅ Professionelle Mahnbriefe mit Schützenbruder-Anrede</li>
                        <li>✅ SEPA-XML Export für alle deutschen Banken</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🎂 Jubiläen-System v1.5.8</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2">
                        <li>✅ 5-Jahres-Vorausplanung (2025-2030)</li>
                        <li>✅ Konfigurierbare Bronze/Silber/Gold-Ehrungen</li>
                        <li>✅ Automatische Alters- und Vereinsjahre-Berechnung</li>
                        <li>✅ Professionelle Urkunden mit Vereinslogo</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🏆 Lizenzen & Ausbildungen v1.5.8</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2">
                        <li>✅ 8 echte Schießsport-Ausbildungen</li>
                        <li>✅ 12 Vorstandspositionen mit Ablauf-Überwachung</li>
                        <li>✅ 90-Tage-Warnung mit Status-Ampel</li>
                        <li>✅ DSB-Lizenznummern-Integration</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Mitglieder */}
            {activeSection === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">👥 Mitgliederverwaltung</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Mitglied hinzufügen
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4">Name</th>
                            <th className="text-left p-4">Mitgliedsnr.</th>
                            <th className="text-center p-4">Alter</th>
                            <th className="text-center p-4">Vereinsjahre</th>
                            <th className="text-center p-4">Status</th>
                            <th className="text-center p-4">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map(member => {
                            const age = new Date().getFullYear() - new Date(member.geburtsdatum).getFullYear();
                            return (
                              <tr key={member.id} className="border-b hover:bg-muted/20">
                                <td className="p-4">
                                  <div>
                                    <div className="font-medium">{member.firstName} {member.lastName}</div>
                                    <div className="text-sm text-gray-500">Eintritt: {new Date(member.eintrittsdatum).toLocaleDateString('de-DE')}</div>
                                  </div>
                                </td>
                                <td className="p-4 font-mono text-sm">{member.mitgliedsnummer}</td>
                                <td className="p-4 text-center">{age}</td>
                                <td className="p-4 text-center">{member.vereinsjahre}</td>
                                <td className="p-4 text-center">
                                  <Badge variant={member.status === 'Aktiv' ? 'default' : 'secondary'}>
                                    {member.status}
                                  </Badge>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Beiträge & SEPA */}
            {activeSection === 'beitraege' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">💳 Beiträge & SEPA-Lastschrift</h2>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      SEPA-XML Export
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Mahnbriefe
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.paidMembers}</div>
                      <p className="text-sm text-gray-600">Beiträge bezahlt</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">{stats.openPayments}</div>
                      <p className="text-sm text-gray-600">Offene Beiträge</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{stats.sepaMembers}</div>
                      <p className="text-sm text-gray-600">SEPA-Mandate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {mockBeitraege.reduce((sum, b) => sum + b.beitrag, 0)}€
                      </div>
                      <p className="text-sm text-gray-600">Gesamtbeiträge</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Beitragsliste mit SEPA-Mandaten</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4">Name</th>
                            <th className="text-center p-4">Beitrag</th>
                            <th className="text-center p-4">Status</th>
                            <th className="text-center p-4">Zahlungsart</th>
                            <th className="text-left p-4">IBAN</th>
                            <th className="text-center p-4">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockBeitraege.map(beitrag => (
                            <tr key={beitrag.id} className="border-b hover:bg-muted/20">
                              <td className="p-4 font-medium">{beitrag.name}</td>
                              <td className="p-4 text-center">{beitrag.beitrag}€</td>
                              <td className="p-4 text-center">
                                <Badge variant={
                                  beitrag.status === 'Bezahlt' ? 'default' :
                                  beitrag.status === 'Mahnung' ? 'destructive' : 'secondary'
                                }>
                                  {beitrag.status}
                                </Badge>
                              </td>
                              <td className="p-4 text-center">
                                <Badge variant="outline">{beitrag.zahlungsart}</Badge>
                              </td>
                              <td className="p-4 font-mono text-sm">
                                {beitrag.iban ? `${beitrag.iban.slice(0, 8)}****${beitrag.iban.slice(-4)}` : '-'}
                              </td>
                              <td className="p-4 text-center">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Jubiläen */}
            {activeSection === 'jubilaeen' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🎂 Geburtstage & Jubiläen</h2>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Urkunden generieren
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">{mockJubilaeen.length}</div>
                      <p className="text-sm text-gray-600">Anstehende Jubiläen 2025</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-gold-600">1</div>
                      <p className="text-sm text-gray-600">Gold-Ehrungen (40+ Jahre)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-bronze-600">1</div>
                      <p className="text-sm text-gray-600">Bronze-Ehrungen (10+ Jahre)</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Anstehende Jubiläen 2025</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockJubilaeen.map((jubilae, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              jubilae.kategorie === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                              jubilae.kategorie === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {jubilae.typ === 'Geburtstag' ? '🎂' : '🏆'}
                            </div>
                            <div>
                              <h4 className="font-medium">{jubilae.name}</h4>
                              <p className="text-sm text-gray-600">
                                {jubilae.typ === 'Geburtstag' ? `${jubilae.jahre}. Geburtstag` : `${jubilae.jahre} Jahre Vereinsmitglied`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{new Date(jubilae.datum).toLocaleDateString('de-DE')}</p>
                            <Button size="sm" variant="outline" className="mt-2">
                              🏆 Urkunde erstellen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lizenzen & Ausbildungen */}
            {activeSection === 'lizenzen' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🏆 Lizenzen & Ausbildungen</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Ausbildung
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{mockLizenzen.length}</div>
                      <p className="text-sm text-gray-600">Mitglieder mit Lizenzen</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.totalLicenses}</div>
                      <p className="text-sm text-gray-600">Ausbildungen gesamt</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-600">{stats.expiringLicenses}</div>
                      <p className="text-sm text-gray-600">Läuft bald ab</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">2</div>
                      <p className="text-sm text-gray-600">Vorstandspositionen</p>
                    </CardContent>
                  </Card>
                </div>

                {stats.expiringLicenses > 0 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold text-yellow-800">Aufmerksamkeit erforderlich</h3>
                      </div>
                      <p className="text-sm text-yellow-700">
                        • {stats.expiringLicenses} Ausbildung(en) laufen in den nächsten 90 Tagen ab
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {mockLizenzen.map(lizenz => (
                    <Card key={lizenz.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {lizenz.firstName} {lizenz.lastName}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>#{lizenz.mitgliedsnummer}</span>
                              {lizenz.vereinsfunktion && (
                                <Badge variant="outline">{lizenz.vereinsfunktion}</Badge>
                              )}
                              {lizenz.lizenznummer && (
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                  {lizenz.lizenznummer}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Bearbeiten
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {lizenz.ausbildungen.map((ausbildung, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{ausbildung.bezeichnung}</h4>
                                <Badge className={
                                  ausbildung.status === 'aktiv' ? 'bg-green-100 text-green-800' :
                                  ausbildung.status === 'läuft_bald_ab' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {ausbildung.status === 'aktiv' ? 'Aktiv' :
                                   ausbildung.status === 'läuft_bald_ab' ? 'Läuft bald ab' : 'Abgelaufen'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {ausbildung.ablaufdatum ? 
                                    `bis ${new Date(ausbildung.ablaufdatum).toLocaleDateString('de-DE')}` : 
                                    'unbegrenzt'
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call to Action Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">🚀 Vereinssoftware für Ihren Verein?</h3>
              <p className="text-muted-foreground mb-4">
                Kontaktieren Sie uns für eine Freischaltung der Vereinssoftware v1.5.8 mit allen Features.
              </p>
              <div className="flex gap-2 justify-center">
                <a href="/dashboard-auswahl">
                  <Button>Zurück zur Auswahl</Button>
                </a>
                <Button variant="outline">
                  📧 rwk-leiter-ksve@gmx.de
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
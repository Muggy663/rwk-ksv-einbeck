"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DemoMitgliederPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  const demoMembers = [
    {
      id: '1',
      firstName: 'Max',
      lastName: 'Mustermann',
      name: 'Max Mustermann',
      alter: 35,
      mitgliedsnummer: '001',
      email: 'max@demo.de',
      telefon: '05561-123456',
      mobil: '0170-123456',
      strasse: 'Musterstraße 1',
      plz: '37574',
      ort: 'Einbeck',
      geburtstag: '15.03.1990',
      vereinseintritt: 2010,
      dsbeintritt: 2010,
      isActive: true,
      gender: 'male'
    },
    {
      id: '2',
      firstName: 'Anna',
      lastName: 'Schmidt',
      name: 'Anna Schmidt',
      alter: 28,
      mitgliedsnummer: '002',
      email: 'anna@demo.de',
      telefon: '05561-987654',
      mobil: '0170-987654',
      strasse: 'Beispielweg 5',
      plz: '37574',
      ort: 'Einbeck',
      geburtstag: '22.07.1997',
      vereinseintritt: 2015,
      dsbeintritt: 2015,
      isActive: true,
      gender: 'female'
    },
    {
      id: '3',
      firstName: 'Peter',
      lastName: 'Weber',
      name: 'Peter Weber',
      alter: 52,
      mitgliedsnummer: '003',
      email: 'peter@demo.de',
      telefon: '05561-555666',
      mobil: '0170-555666',
      strasse: 'Teststraße 10',
      plz: '37574',
      ort: 'Einbeck',
      geburtstag: '08.11.1973',
      vereinseintritt: 2005,
      dsbeintritt: 2005,
      isActive: false,
      gender: 'male'
    },
    {
      id: '4',
      firstName: 'Lisa',
      lastName: 'Müller',
      name: 'Lisa Müller',
      alter: 30,
      mitgliedsnummer: '004',
      email: 'lisa@demo.de',
      telefon: '05561-111222',
      mobil: '0170-111222',
      strasse: 'Damenweg 3',
      plz: '37574',
      ort: 'Einbeck',
      geburtstag: '12.05.1995',
      vereinseintritt: 2020,
      dsbeintritt: 2020,
      isActive: true,
      gender: 'female'
    },
    {
      id: '5',
      firstName: 'Klaus',
      lastName: 'Bauer',
      name: 'Klaus Bauer',
      alter: 65,
      mitgliedsnummer: '005',
      email: 'klaus@demo.de',
      telefon: '05561-333444',
      mobil: '0170-333444',
      strasse: 'Seniorenweg 12',
      plz: '37574',
      ort: 'Einbeck',
      geburtstag: '30.09.1960',
      vereinseintritt: 1985,
      dsbeintritt: 1987,
      isActive: true,
      gender: 'male'
    }
  ];
  
  const filteredMembers = demoMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.mitgliedsnummer && member.mitgliedsnummer.includes(searchTerm)) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = showInactive ? !member.isActive : member.isActive;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-primary">Demo: Mitgliederverwaltung</h1>
          <a href="/demo/vereinssoftware">
            <Button variant="outline">Zurück zur Demo</Button>
          </a>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-900 mb-2">🎭 Demo-Modus</h3>
          <p className="text-orange-700 text-sm">
            Dies ist eine Demo der Mitgliederverwaltung. In der echten Version können Sie alle Daten bearbeiten, 
            neue Mitglieder hinzufügen und Geburtstage/Eintrittsdaten importieren.
          </p>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{demoMembers.length}</div>
            <p className="text-sm text-gray-600">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {demoMembers.filter(m => m.isActive).length}
            </div>
            <p className="text-sm text-gray-600">Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {demoMembers.filter(m => m.alter >= 25).length}
            </div>
            <p className="text-sm text-gray-600">25+ Jahre</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {demoMembers.filter(m => m.email).length}
            </div>
            <p className="text-sm text-gray-600">Mit E-Mail</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {demoMembers.filter(m => m.mitgliedsnummer).length}
            </div>
            <p className="text-sm text-gray-600">Mit Mitgl.-Nr.</p>
          </CardContent>
        </Card>
      </div>

      {/* Suche und Aktionen */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Suchen (Name, Mitgl.-Nr., E-Mail)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded"
                />
                Ausgetretene anzeigen
              </label>
            </div>
            <Button disabled>
              + Neues Mitglied (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mitgliederliste */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demo-Mitgliederliste ({filteredMembers.length})</CardTitle>
            <Input
              type="text"
              placeholder="Schnellsuche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-1">Nr.</th>
                  <th className="text-left p-1">Vorname</th>
                  <th className="text-left p-1">Nachname</th>
                  <th className="text-left p-1">Adresse</th>
                  <th className="text-left p-1">PLZ/Ort</th>
                  <th className="text-left p-1">Geburtstag</th>
                  <th className="text-center p-1">Alter</th>
                  <th className="text-center p-1">G</th>
                  <th className="text-left p-1">E-Mail</th>
                  <th className="text-left p-1">Telefon</th>
                  <th className="text-left p-1">Mobil</th>
                  <th className="text-center p-1">Verein</th>
                  <th className="text-center p-1">DSB</th>
                  <th className="text-center p-1">Status</th>
                  <th className="text-left p-1">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id} className="border-b hover:bg-muted/20">
                    <td className="p-1 font-mono text-sm font-bold">
                      {member.mitgliedsnummer ? `0${member.mitgliedsnummer}` : '-'}
                    </td>
                    <td className="p-1 font-medium">{member.firstName}</td>
                    <td className="p-1 font-medium">{member.lastName}</td>
                    <td className="p-1 text-sm">{member.strasse || '-'}</td>
                    <td className="p-1 text-sm">
                      <span>{member.plz} {member.ort}</span>
                    </td>
                    <td className="p-1">
                      <span className="text-xs">{member.geburtstag || '-'}</span>
                    </td>
                    <td className="p-1 text-center font-medium">{member.alter}</td>
                    <td className="p-1 text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        member.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                        member.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.gender === 'male' ? 'M' : member.gender === 'female' ? 'W' : '-'}
                      </span>
                    </td>
                    <td className="p-1">
                      <span className="text-sm">{member.email || '-'}</span>
                    </td>
                    <td className="p-1">
                      <span className="text-sm">{member.telefon || '-'}</span>
                    </td>
                    <td className="p-1">
                      <span className="text-sm">{member.mobil || '-'}</span>
                    </td>
                    <td className="p-1 text-center font-medium">
                      <span className="text-xs">{member.vereinseintritt || '-'}</span>
                    </td>
                    <td className="p-1 text-center font-medium">
                      <span className="text-xs">{member.dsbeintritt || '-'}</span>
                    </td>
                    <td className="p-1 text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="p-1">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled>
                          Demo
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">🚀 Echte Version Features:</h3>
        <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
          <li>Editierbare Tabelle - Alle Felder direkt bearbeitbar</li>
          <li>99 Geburtstage importiert aus Geburtstage.txt</li>
          <li>90 Eintrittsdaten importiert aus Eintritt.txt</li>
          <li>Neue Mitglieder hinzufügen mit Formular</li>
          <li>Geschlechts-Auswahl (Männlich/Weiblich)</li>
          <li>Statistik-Dashboard mit Auswertungen</li>
        </ul>
      </div>
    </div>
  );
}
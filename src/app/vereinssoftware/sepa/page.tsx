"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Download, FileText, Search } from 'lucide-react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  mitgliedsnummer: string;
  email: string;
  zahlungsart: 'sepa_lastschrift' | 'ueberweisung' | 'barzahlung';
  sepaMandat?: {
    mandatsreferenz: string;
    mandatsdatum: string;
    iban: string;
    bic: string;
    kontoinhaber: string;
    bankname: string;
    sepaAusfuehrung: 'erst_lastschrift' | 'folge_lastschrift' | 'einmalig';
    verwendungszweck: string;
  };
  vereinsfunktion?: string;
  lizenznummer?: string;
  ausbildung?: {
    bezeichnung: string;
    ablaufdatum: string;
  };
}

export default function SEPAPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZahlungsart, setFilterZahlungsart] = useState<string>('alle');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchTerm, filterZahlungsart]);

  const loadMembers = () => {
    const mockMembers: Member[] = [
      {
        id: '1',
        firstName: 'Max',
        lastName: 'Mustermann',
        mitgliedsnummer: '001',
        email: 'max@sgi-einbeck.de',
        zahlungsart: 'sepa_lastschrift',
        sepaMandat: {
          mandatsreferenz: 'SGI-001-2024',
          mandatsdatum: '2024-01-15',
          iban: 'DE89370400440532013000',
          bic: 'COBADEFFXXX',
          kontoinhaber: 'Max Mustermann',
          bankname: 'Commerzbank AG',
          sepaAusfuehrung: 'folge_lastschrift',
          verwendungszweck: 'Mitgliedsbeitrag SGi Einbeck'
        },
        vereinsfunktion: 'Schießwart',
        lizenznummer: 'DSB-12345',
        ausbildung: {
          bezeichnung: 'Übungsleiter C',
          ablaufdatum: '2025-12-31'
        }
      },
      {
        id: '2',
        firstName: 'Anna',
        lastName: 'Schmidt',
        mitgliedsnummer: '002',
        email: 'anna@sgi-einbeck.de',
        zahlungsart: 'ueberweisung',
        vereinsfunktion: 'Kassiererin',
        lizenznummer: 'DSB-67890'
      },
      {
        id: '3',
        firstName: 'Peter',
        lastName: 'Weber',
        mitgliedsnummer: '003',
        email: 'peter@sgi-einbeck.de',
        zahlungsart: 'sepa_lastschrift',
        sepaMandat: {
          mandatsreferenz: 'SGI-003-2023',
          mandatsdatum: '2023-06-01',
          iban: 'DE12500105170648489890',
          bic: 'INGDDEFFXXX',
          kontoinhaber: 'Peter Weber',
          bankname: 'ING-DiBa AG',
          sepaAusfuehrung: 'folge_lastschrift',
          verwendungszweck: 'Vereinsbeitrag'
        }
      },
      {
        id: '4',
        firstName: 'Lisa',
        lastName: 'Müller',
        mitgliedsnummer: '004',
        email: 'lisa@sgi-einbeck.de',
        zahlungsart: 'barzahlung',
        ausbildung: {
          bezeichnung: 'Jugendleiter',
          ablaufdatum: '2024-08-15'
        }
      },
      {
        id: '5',
        firstName: 'Klaus',
        lastName: 'Bauer',
        mitgliedsnummer: '005',
        email: 'klaus@sgi-einbeck.de',
        zahlungsart: 'sepa_lastschrift',
        sepaMandat: {
          mandatsreferenz: 'SGI-005-2024',
          mandatsdatum: '2024-03-10',
          iban: 'DE75512108001245126199',
          bic: 'SOGEDEFF512',
          kontoinhaber: 'Klaus Bauer',
          bankname: 'Postbank',
          sepaAusfuehrung: 'folge_lastschrift',
          verwendungszweck: 'Mitgliedsbeitrag 2024'
        },
        vereinsfunktion: '1. Vorsitzender',
        lizenznummer: 'DSB-11111',
        ausbildung: {
          bezeichnung: 'Vereinsmanager C',
          ablaufdatum: '2026-05-20'
        }
      }
    ];
    
    setMembers(mockMembers);
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.mitgliedsnummer.includes(searchTerm)
      );
    }

    if (filterZahlungsart !== 'alle') {
      filtered = filtered.filter(member => member.zahlungsart === filterZahlungsart);
    }

    setFilteredMembers(filtered);
  };

  const getZahlungsartBadge = (zahlungsart: string) => {
    switch (zahlungsart) {
      case 'sepa_lastschrift':
        return <Badge className="bg-green-100 text-green-800">SEPA-Lastschrift</Badge>;
      case 'ueberweisung':
        return <Badge className="bg-blue-100 text-blue-800">Überweisung</Badge>;
      case 'barzahlung':
        return <Badge className="bg-orange-100 text-orange-800">Barzahlung</Badge>;
      default:
        return <Badge variant="secondary">Unbekannt</Badge>;
    }
  };

  const getSepaAusfuehrungText = (ausfuehrung: string) => {
    switch (ausfuehrung) {
      case 'erst_lastschrift': return 'Erst-Lastschrift';
      case 'folge_lastschrift': return 'Folge-Lastschrift';
      case 'einmalig': return 'Einmalige Lastschrift';
      default: return ausfuehrung;
    }
  };

  const stats = {
    sepaMembers: members.filter(m => m.zahlungsart === 'sepa_lastschrift').length,
    ueberweisungMembers: members.filter(m => m.zahlungsart === 'ueberweisung').length,
    barMembers: members.filter(m => m.zahlungsart === 'barzahlung').length,
    withLicense: members.filter(m => m.lizenznummer).length,
    withAusbildung: members.filter(m => m.ausbildung).length,
    expiringSoon: members.filter(m => 
      m.ausbildung && new Date(m.ausbildung.ablaufdatum) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    ).length
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <a href="/vereinssoftware">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            </a>
            <h1 className="text-4xl font-bold text-primary">SEPA-Lastschrift & Lizenzen</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              SEPA-Export
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Lizenz-Report
            </Button>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Verwaltung von SEPA-Mandaten, Zahlungsarten und Mitglieder-Lizenzen
        </p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.sepaMembers}</div>
            <p className="text-sm text-gray-600">SEPA-Lastschrift</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.ueberweisungMembers}</div>
            <p className="text-sm text-gray-600">Überweiser</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.barMembers}</div>
            <p className="text-sm text-gray-600">Barzahler</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.withLicense}</div>
            <p className="text-sm text-gray-600">Mit Lizenz</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.withAusbildung}</div>
            <p className="text-sm text-gray-600">Mit Ausbildung</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
            <p className="text-sm text-gray-600">Läuft bald ab</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter und Suche */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Suche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name oder Mitgliedsnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="filter">Zahlungsart</Label>
              <Select value={filterZahlungsart} onValueChange={setFilterZahlungsart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Zahlungsarten</SelectItem>
                  <SelectItem value="sepa_lastschrift">SEPA-Lastschrift</SelectItem>
                  <SelectItem value="ueberweisung">Überweisung</SelectItem>
                  <SelectItem value="barzahlung">Barzahlung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mitgliederliste */}
      <Card>
        <CardHeader>
          <CardTitle>Mitglieder mit SEPA & Lizenz-Daten ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Mitglied</th>
                  <th className="text-left p-3">Zahlungsart</th>
                  <th className="text-left p-3">SEPA-Mandat</th>
                  <th className="text-left p-3">Vereinsfunktion</th>
                  <th className="text-left p-3">Lizenz</th>
                  <th className="text-left p-3">Ausbildung</th>
                  <th className="text-center p-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id} className="border-b hover:bg-muted/20">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{member.firstName} {member.lastName}</div>
                        <div className="text-sm text-gray-500">#{member.mitgliedsnummer}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      {getZahlungsartBadge(member.zahlungsart)}
                    </td>
                    <td className="p-3">
                      {member.sepaMandat ? (
                        <div className="text-sm">
                          <div className="font-medium">{member.sepaMandat.mandatsreferenz}</div>
                          <div className="text-gray-500">{getSepaAusfuehrungText(member.sepaMandat.sepaAusfuehrung)}</div>
                          <div className="text-gray-500">{member.sepaMandat.bankname}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {member.vereinsfunktion ? (
                        <Badge variant="outline">{member.vereinsfunktion}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {member.lizenznummer ? (
                        <div className="text-sm font-mono">{member.lizenznummer}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {member.ausbildung ? (
                        <div className="text-sm">
                          <div className="font-medium">{member.ausbildung.bezeichnung}</div>
                          <div className={`text-xs ${
                            new Date(member.ausbildung.ablaufdatum) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            bis {new Date(member.ausbildung.ablaufdatum).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Dialog open={isEditDialogOpen && selectedMember?.id === member.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedMember(member)}
                          >
                            Bearbeiten
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              SEPA & Lizenz-Daten bearbeiten: {member.firstName} {member.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Zahlungsart */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Zahlungsart</h3>
                              <div>
                                <Label>Zahlungsart</Label>
                                <Select defaultValue={member.zahlungsart}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sepa_lastschrift">SEPA-Lastschrift</SelectItem>
                                    <SelectItem value="ueberweisung">Überweisung</SelectItem>
                                    <SelectItem value="barzahlung">Barzahlung</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* SEPA-Mandat */}
                            {member.sepaMandat && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">SEPA-Mandat</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Mandatsreferenz</Label>
                                    <Input defaultValue={member.sepaMandat.mandatsreferenz} />
                                  </div>
                                  <div>
                                    <Label>Mandatsdatum</Label>
                                    <Input type="date" defaultValue={member.sepaMandat.mandatsdatum} />
                                  </div>
                                  <div>
                                    <Label>IBAN</Label>
                                    <Input defaultValue={member.sepaMandat.iban} />
                                  </div>
                                  <div>
                                    <Label>BIC</Label>
                                    <Input defaultValue={member.sepaMandat.bic} />
                                  </div>
                                  <div>
                                    <Label>Kontoinhaber</Label>
                                    <Input defaultValue={member.sepaMandat.kontoinhaber} />
                                  </div>
                                  <div>
                                    <Label>Bankname</Label>
                                    <Input defaultValue={member.sepaMandat.bankname} />
                                  </div>
                                  <div>
                                    <Label>SEPA-Ausführung</Label>
                                    <Select defaultValue={member.sepaMandat.sepaAusfuehrung}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="erst_lastschrift">Erst-Lastschrift</SelectItem>
                                        <SelectItem value="folge_lastschrift">Folge-Lastschrift</SelectItem>
                                        <SelectItem value="einmalig">Einmalige Lastschrift</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-2">
                                    <Label>Verwendungszweck</Label>
                                    <Input defaultValue={member.sepaMandat.verwendungszweck} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Vereinsfunktion & Lizenz */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Vereinsfunktion & Lizenz</h3>
                              <div>
                                <Label>Vereinsfunktion</Label>
                                <Input defaultValue={member.vereinsfunktion || ''} placeholder="z.B. Schießwart, Kassier..." />
                              </div>
                              <div>
                                <Label>Lizenznummer</Label>
                                <Input defaultValue={member.lizenznummer || ''} placeholder="z.B. DSB-12345" />
                              </div>
                            </div>

                            {/* Ausbildung */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Ausbildung</h3>
                              <div>
                                <Label>Ausbildungsbezeichnung</Label>
                                <Input 
                                  defaultValue={member.ausbildung?.bezeichnung || ''} 
                                  placeholder="z.B. Übungsleiter C, Jugendleiter..."
                                />
                              </div>
                              <div>
                                <Label>Ablaufdatum</Label>
                                <Input 
                                  type="date" 
                                  defaultValue={member.ausbildung?.ablaufdatum || ''} 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Abbrechen
                            </Button>
                            <Button onClick={() => setIsEditDialogOpen(false)}>
                              Speichern
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
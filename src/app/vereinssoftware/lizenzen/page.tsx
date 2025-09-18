"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, AlertTriangle, Calendar, Award, Plus } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useClubId } from '@/hooks/useClubId';

interface LicenseData {
  id: string;
  firstName: string;
  lastName: string;
  mitgliedsnummer: string;
  vereinsfunktion?: string;
  lizenznummer?: string;
  ausbildungen: {
    id: string;
    bezeichnung: string;
    ablaufdatum: string;
    status: 'aktiv' | 'abgelaufen' | 'läuft_bald_ab';
  }[];
}

export default function LizenzenPage() {
  const { user } = useAuthContext();
  const { clubId, loading: clubLoading } = useClubId();
  const [members, setMembers] = useState<LicenseData[]>([]);
  const [selectedMember, setSelectedMember] = useState<LicenseData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewTrainingDialogOpen, setIsNewTrainingDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allMembers, setAllMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    if (user && clubId && !clubLoading) {
      loadLicenseData();
      loadAllMembers();
    }
  }, [user, clubId, clubLoading]);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const loadAllMembers = async () => {
    if (!clubId) return;
    
    try {
      // Lade Mitglieder aus club-spezifischer Collection
      const mitgliederCollection = `clubs/${clubId}/mitglieder`;
      const membersSnapshot = await getDocs(collection(db, mitgliederCollection));
        
      const membersList = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          mitgliedsnummer: data.mitgliedsnummer || ''
        };
      });
      
      setAllMembers(membersList);
    } catch (error) {
      console.error('Fehler beim Laden aller Mitglieder:', error);
    }
  };

  const loadLicenseData = async () => {
    if (!clubId) return;
    
    try {
      // Lade Mitglieder aus club-spezifischer Collection
      const mitgliederCollection = `clubs/${clubId}/mitglieder`;
      const membersSnapshot = await getDocs(collection(db, mitgliederCollection));
        
      const membersList: LicenseData[] = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Lade echte Ausbildungen aus Firebase (falls vorhanden)
        const ausbildungen = data.ausbildungen || [];
        const processedAusbildungen = ausbildungen.map((ausbildung: any, index: number) => {
          let status: 'aktiv' | 'läuft_bald_ab' | 'abgelaufen' = 'aktiv';
          
          // Nur Status berechnen wenn Ablaufdatum vorhanden
          if (ausbildung.ablaufdatum) {
            const ablauf = new Date(ausbildung.ablaufdatum);
            const heute = new Date();
            const in90Tagen = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            
            if (ablauf < heute) {
              status = 'abgelaufen';
            } else if (ablauf < in90Tagen) {
              status = 'läuft_bald_ab';
            }
          }
          
          return {
            id: `${doc.id}-${index}`,
            bezeichnung: ausbildung.bezeichnung,
            ablaufdatum: ausbildung.ablaufdatum || null,
            status
          };
        });
        
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          mitgliedsnummer: data.mitgliedsnummer || '',
          vereinsfunktion: data.vereinsfunktion || undefined,
          lizenznummer: data.lizenznummer || undefined,
          ausbildungen: processedAusbildungen
        };
      });
      
      // Nur Mitglieder mit Lizenzen oder Ausbildungen anzeigen
      const membersWithLicenses = membersList.filter(member => 
        member.lizenznummer || 
        member.vereinsfunktion || 
        member.ausbildungen.length > 0
      );
      
      setMembers(membersWithLicenses);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMemberData = async (memberId: string, updates: Partial<LicenseData>) => {
    if (!clubId) return;
    
    try {
      const mitgliederCollection = `clubs/${clubId}/mitglieder`;
      const memberRef = doc(db, mitgliederCollection, memberId);
      await updateDoc(memberRef, {
        vereinsfunktion: updates.vereinsfunktion,
        lizenznummer: updates.lizenznummer,
        updatedAt: new Date()
      });
      
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, ...updates } : m
      ));
    } catch (error) {
      console.error('Fehler beim Update:', error);
      alert('Fehler beim Speichern');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktiv':
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>;
      case 'läuft_bald_ab':
        return <Badge className="bg-yellow-100 text-yellow-800">Läuft bald ab</Badge>;
      case 'abgelaufen':
        return <Badge className="bg-red-100 text-red-800">Abgelaufen</Badge>;
      default:
        return <Badge variant="secondary">Unbekannt</Badge>;
    }
  };

  const stats = {
    totalMembers: members.length,
    withLicense: members.filter(m => m.lizenznummer).length,
    withAusbildung: members.filter(m => m.ausbildungen.length > 0).length,
    expiringSoon: members.filter(m => 
      m.ausbildungen.some(a => a.status === 'läuft_bald_ab')
    ).length,
    expired: members.filter(m => 
      m.ausbildungen.some(a => a.status === 'abgelaufen')
    ).length,
    totalAusbildungen: members.reduce((sum, m) => sum + m.ausbildungen.length, 0)
  };

  if (loading) {
    return (
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Lizenz-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 md:gap-4">
            <BackButton className="mr-2" fallbackHref="/vereinssoftware" />
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-primary">Lizenzen & Ausbildungen</h1>
          </div>
          <div className="flex gap-2">
            <Button className="no-print text-sm" onClick={() => setIsNewTrainingDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Neue Ausbildung</span>
              <span className="sm:hidden">Neu</span>
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="no-print text-sm">
              <span className="hidden sm:inline">Liste drucken</span>
              <span className="sm:hidden">Drucken</span>
            </Button>
          </div>
        </div>
        <p className="text-sm md:text-lg text-muted-foreground">
          Verwaltung von Lizenzen, Ausbildungen und Ablaufdaten
        </p>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-4 md:mb-8">
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <p className="text-xs md:text-sm text-gray-600">Mitglieder gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-purple-600">{stats.withLicense}</div>
            <p className="text-xs md:text-sm text-gray-600">Mit Lizenz</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-green-600">{stats.totalAusbildungen}</div>
            <p className="text-xs md:text-sm text-gray-600">Ausbildungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-indigo-600">{stats.withAusbildung}</div>
            <p className="text-xs md:text-sm text-gray-600">Mit Ausbildung</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs md:text-sm text-gray-600">Läuft bald ab</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 md:p-4">
            <div className="text-lg md:text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs md:text-sm text-gray-600">Abgelaufen</p>
          </CardContent>
        </Card>
      </div>

      {/* Warnungen */}
      {(stats.expiringSoon > 0 || stats.expired > 0) && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Aufmerksamkeit erforderlich</h3>
            </div>
            <div className="text-sm text-yellow-700">
              {stats.expiringSoon > 0 && (
                <p>• {stats.expiringSoon} Ausbildung(en) laufen in den nächsten 90 Tagen ab</p>
              )}
              {stats.expired > 0 && (
                <p>• {stats.expired} Ausbildung(en) sind bereits abgelaufen</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mitgliederliste */}
      <Card className="print-area">
        <CardHeader>
          <CardTitle>Lizenzen & Ausbildungen Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map(member => (
              <Card key={member.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                    <div>
                      <h3 className="font-semibold text-base md:text-lg">
                        {member.firstName} {member.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                        <span>#{member.mitgliedsnummer}</span>
                        {member.vereinsfunktion && (
                          <Badge variant="outline" className="text-xs">{member.vereinsfunktion}</Badge>
                        )}
                        {member.lizenznummer && (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {member.lizenznummer}
                          </span>
                        )}
                      </div>
                    </div>
                    <Dialog open={isEditDialogOpen && selectedMember?.id === member.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs md:text-sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          Bearbeiten
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            Lizenzen & Ausbildungen bearbeiten: {member.firstName} {member.lastName}
                          </DialogTitle>
                          <DialogDescription>
                            Bearbeiten Sie Vereinsfunktion, Lizenznummer und Ausbildungen für dieses Mitglied.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Grunddaten */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Grunddaten</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Vereinsfunktion</Label>
                                <select 
                                  id={`vereinsfunktion-${member.id}`}
                                  className="w-full border rounded px-3 py-2" 
                                  defaultValue={member.vereinsfunktion || ''}
                                >
                                  <option value="">Keine Funktion</option>
                                  <option value="1. Vorsitzender">1. Vorsitzender</option>
                                  <option value="2. Vorsitzender">2. Vorsitzender</option>
                                  <option value="Kassenwart">Kassenwart</option>
                                  <option value="Schriftführer">Schriftführer</option>
                                  <option value="Schießwart">Schießwart</option>
                                  <option value="Jugendwart">Jugendwart</option>
                                  <option value="Damenwart">Damenwart</option>
                                  <option value="Zeugwart">Zeugwart</option>
                                  <option value="Pressewart">Pressewart</option>
                                  <option value="Beisitzer">Beisitzer</option>
                                  <option value="Ehrenvorsitzender">Ehrenvorsitzender</option>
                                  <option value="Kassenprüfer">Kassenprüfer</option>
                                </select>
                              </div>
                              <div>
                                <Label>Lizenznummer</Label>
                                <Input defaultValue={member.lizenznummer || ''} placeholder="z.B. DSB-12345" />
                              </div>
                            </div>
                          </div>

                          {/* Ausbildungen */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Ausbildungen</h3>
                              <Button size="sm" variant="outline" onClick={() => {
                                // Schließe Edit-Dialog und öffne Neue-Ausbildung-Dialog mit vorausgewähltem Mitglied
                                setIsEditDialogOpen(false);
                                setTimeout(() => {
                                  const memberSelect = document.getElementById('member-select') as HTMLSelectElement;
                                  if (memberSelect && selectedMember) {
                                    memberSelect.value = selectedMember.id;
                                    
                                    // Vorhandene Ausbildungen anhaken
                                    selectedMember.ausbildungen.forEach(ausbildung => {
                                      const checkbox = document.querySelector(`.training-checkbox[value="${ausbildung.bezeichnung}"]`) as HTMLInputElement;
                                      if (checkbox) {
                                        checkbox.checked = true;
                                        const dateInput = document.getElementById(`training-date-${ausbildung.bezeichnung.replace(/\s+/g, '-')}`) as HTMLInputElement;
                                        if (dateInput) {
                                          dateInput.disabled = false;
                                          if (ausbildung.ablaufdatum) {
                                            dateInput.value = ausbildung.ablaufdatum;
                                          }
                                        }
                                      }
                                    });
                                    
                                    // Vorhandene Vorstandsposition anhaken
                                    if (selectedMember.vereinsfunktion) {
                                      const boardCheckbox = document.querySelector(`.board-checkbox[value="${selectedMember.vereinsfunktion}"]`) as HTMLInputElement;
                                      if (boardCheckbox) {
                                        boardCheckbox.checked = true;
                                        const dateInput = document.getElementById(`board-date-${selectedMember.vereinsfunktion.replace(/\s+/g, '-')}`) as HTMLInputElement;
                                        if (dateInput) {
                                          dateInput.disabled = false;
                                        }
                                      }
                                    }
                                  }
                                }, 100);
                                setIsNewTrainingDialogOpen(true);
                              }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Hinzufügen
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              {member.ausbildungen.map(ausbildung => (
                                <div key={ausbildung.id} className="border rounded-lg p-3">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label>Bezeichnung</Label>
                                      <select 
                                        id={`ausbildung-typ-${ausbildung.id}`}
                                        className="w-full border rounded px-3 py-2" 
                                        defaultValue={ausbildung.bezeichnung}
                                      >
                                        <option value="Waffensachkunde">Waffensachkunde</option>
                                        <option value="Schieß und Standaufsicht">Schieß und Standaufsicht</option>
                                        <option value="JugendBasisLizenz">JugendBasisLizenz</option>
                                        <option value="Schießsportleiter">Schießsportleiter</option>
                                        <option value="Fachschießsportleiter">Fachschießsportleiter</option>
                                        <option value="Trainer C Basis">Trainer C Basis</option>
                                        <option value="Kampfrichter B">Kampfrichter B</option>
                                        <option value="Trainer C Leistung">Trainer C Leistung</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label>Ablaufdatum</Label>
                                      <Input 
                                        id={`ausbildung-datum-${ausbildung.id}`}
                                        type="date" 
                                        defaultValue={ausbildung.ablaufdatum || ''} 
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-600"
                                        onClick={() => {
                                          if (selectedMember && confirm('Ausbildung wirklich entfernen?')) {
                                            const updatedAusbildungen = selectedMember.ausbildungen.filter(a => a.id !== ausbildung.id);
                                            setSelectedMember({
                                              ...selectedMember,
                                              ausbildungen: updatedAusbildungen
                                            });
                                          }
                                        }}
                                      >
                                        Entfernen
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Abbrechen
                          </Button>
                          <Button onClick={async () => {
                            if (selectedMember) {
                              const vereinsfunktionSelect = document.getElementById(`vereinsfunktion-${selectedMember.id}`) as HTMLSelectElement;
                              const lizenznummerInput = document.querySelector(`input[placeholder*="DSB-12345"]`) as HTMLInputElement;
                              
                              // Sammle alle Ausbildungen
                              const updatedAusbildungen = selectedMember.ausbildungen.map(ausbildung => {
                                const typSelect = document.getElementById(`ausbildung-typ-${ausbildung.id}`) as HTMLSelectElement;
                                const datumInput = document.getElementById(`ausbildung-datum-${ausbildung.id}`) as HTMLInputElement;
                                
                                return {
                                  bezeichnung: typSelect?.value || ausbildung.bezeichnung,
                                  ablaufdatum: datumInput?.value || null,
                                  status: 'aktiv' as const
                                };
                              });
                              
                              // Update Firebase
                              try {
                                const mitgliederCollection = `clubs/${clubId}/mitglieder`;
                                const memberRef = doc(db, mitgliederCollection, selectedMember.id);
                                await updateDoc(memberRef, {
                                  vereinsfunktion: vereinsfunktionSelect?.value || undefined,
                                  lizenznummer: lizenznummerInput?.value || undefined,
                                  ausbildungen: updatedAusbildungen,
                                  updatedAt: new Date()
                                });
                                
                                // Lokale Liste aktualisieren
                                loadLicenseData();
                                setIsEditDialogOpen(false);
                              } catch (error) {
                                console.error('Fehler beim Speichern:', error);
                                alert('Fehler beim Speichern');
                              }
                            }
                          }}>
                            Speichern
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Ausbildungen */}
                  {member.ausbildungen.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                      {member.ausbildungen.map(ausbildung => (
                        <div key={ausbildung.id} className="bg-gray-50 rounded-lg p-2 md:p-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-1">
                            <h4 className="font-medium text-xs md:text-sm">{ausbildung.bezeichnung}</h4>
                            {getStatusBadge(ausbildung.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{ausbildung.ablaufdatum ? `bis ${new Date(ausbildung.ablaufdatum).toLocaleDateString('de-DE')}` : 'unbegrenzt'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Keine Ausbildungen erfasst
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Neue Ausbildung Dialog */}
      <Dialog open={isNewTrainingDialogOpen} onOpenChange={setIsNewTrainingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Ausbildung hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie eine neue Ausbildung oder Vorstandsposition für ein Mitglied hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mitglied auswählen</Label>
              <Input 
                type="text"
                placeholder="Mitglied suchen..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="mb-2"
              />
              <select 
                id="member-select"
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="">Mitglied wählen...</option>
                {allMembers
                  .filter(member => 
                    memberSearch === '' || 
                    `${member.firstName} ${member.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
                    member.mitgliedsnummer.includes(memberSearch)
                  )
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.mitgliedsnummer})
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <Label>Ausbildungen/Lizenzen (Mehrfachauswahl)</Label>
              <div className="border rounded p-2 mt-1 max-h-32 overflow-y-auto">
                {['Waffensachkunde', 'Schieß und Standaufsicht', 'JugendBasisLizenz', 'Schießsportleiter', 'Fachschießsportleiter', 'Trainer C Basis', 'Kampfrichter B', 'Trainer C Leistung'].map(type => (
                  <div key={type} className="border-b pb-2 mb-2 last:border-b-0">
                    <label className="flex items-center gap-2 p-1">
                      <input 
                        type="checkbox" 
                        value={type} 
                        className="training-checkbox" 
                        onChange={(e) => {
                          const dateInput = document.getElementById(`training-date-${type.replace(/\s+/g, '-')}`) as HTMLInputElement;
                          dateInput.disabled = !e.target.checked;
                        }}
                      />
                      <span className="text-sm font-medium">{type}</span>
                    </label>
                    <div className="ml-6 mt-1">
                      <Input 
                        type="date" 
                        className="text-xs h-8"
                        placeholder="Ablaufdatum (optional)"
                        id={`training-date-${type.replace(/\s+/g, '-')}`}
                        disabled
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Vorstandspositionen (Mehrfachauswahl)</Label>
              <div className="border rounded p-2 mt-1 max-h-32 overflow-y-auto">
                {['1. Vorsitzender', '2. Vorsitzender', 'Kassenwart', 'Schriftführer', 'Schießwart', 'Jugendwart', 'Damenwart', 'Zeugwart', 'Pressewart', 'Beisitzer', 'Ehrenvorsitzender', 'Kassenprüfer'].map(position => (
                  <div key={position} className="border-b pb-2 mb-2 last:border-b-0">
                    <label className="flex items-center gap-2 p-1">
                      <input 
                        type="checkbox" 
                        value={position} 
                        className="board-checkbox" 
                        onChange={(e) => {
                          const dateInput = document.getElementById(`board-date-${position.replace(/\s+/g, '-')}`) as HTMLInputElement;
                          dateInput.disabled = !e.target.checked;
                        }}
                      />
                      <span className="text-sm font-medium">{position}</span>
                    </label>
                    <div className="ml-6 mt-1">
                      <Input 
                        type="date" 
                        className="text-xs h-8"
                        placeholder="Ablaufdatum (optional)"
                        id={`board-date-${position.replace(/\s+/g, '-')}`}
                        disabled
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsNewTrainingDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={async () => {
              const memberSelect = document.getElementById('member-select') as HTMLSelectElement;
              
              if (!memberSelect.value) {
                alert('Bitte Mitglied auswählen');
                return;
              }
              
              const trainingCheckboxes = document.querySelectorAll('.training-checkbox:checked') as NodeListOf<HTMLInputElement>;
              const boardCheckboxes = document.querySelectorAll('.board-checkbox:checked') as NodeListOf<HTMLInputElement>;
              
              if (trainingCheckboxes.length === 0 && boardCheckboxes.length === 0) {
                alert('Bitte mindestens eine Ausbildung oder Vorstandsposition auswählen');
                return;
              }
              
              const memberName = memberSelect.options[memberSelect.selectedIndex].text;
              let summary = [];
              
              // Ausbildungen sammeln
              trainingCheckboxes.forEach(cb => {
                const dateInput = document.getElementById(`training-date-${cb.value.replace(/\s+/g, '-')}`) as HTMLInputElement;
                const ablauf = dateInput.value ? ` (bis ${dateInput.value})` : ' (unbegrenzt)';
                summary.push(`Ausbildung: ${cb.value}${ablauf}`);
              });
              
              // Vorstandspositionen sammeln
              boardCheckboxes.forEach(cb => {
                const dateInput = document.getElementById(`board-date-${cb.value.replace(/\s+/g, '-')}`) as HTMLInputElement;
                const ablauf = dateInput.value ? ` (bis ${dateInput.value})` : ' (unbegrenzt)';
                summary.push(`Vorstand: ${cb.value}${ablauf}`);
              });
              
              // Speichere in Firebase
              try {
                const mitgliederCollection = `clubs/${clubId}/mitglieder`;
                const memberRef = doc(db, mitgliederCollection, memberSelect.value);
                
                // Sammle neue Ausbildungen
                const newAusbildungen = [];
                trainingCheckboxes.forEach(cb => {
                  const dateInput = document.getElementById(`training-date-${cb.value.replace(/\s+/g, '-')}`) as HTMLInputElement;
                  newAusbildungen.push({
                    bezeichnung: cb.value,
                    ablaufdatum: dateInput.value || null,
                    status: 'aktiv'
                  });
                });
                
                // Sammle Vorstandsposition (nur eine)
                let vereinsfunktion = undefined;
                if (boardCheckboxes.length > 0) {
                  vereinsfunktion = boardCheckboxes[0].value;
                }
                
                // Update Firebase
                const updateData: any = {
                  updatedAt: new Date()
                };
                
                if (newAusbildungen.length > 0) {
                  updateData.ausbildungen = newAusbildungen;
                }
                
                if (vereinsfunktion) {
                  updateData.vereinsfunktion = vereinsfunktion;
                }
                
                await updateDoc(memberRef, updateData);
                
                // Liste neu laden
                loadLicenseData();
                setIsNewTrainingDialogOpen(false);
              } catch (error) {
                console.error('Fehler beim Speichern:', error);
                alert('Fehler beim Speichern in Firebase');
              }
            }}>
              Hinzufügen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
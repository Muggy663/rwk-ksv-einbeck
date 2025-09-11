"use client";

import React, { useState, useEffect } from 'react';
import { useClubId } from '@/hooks/useClubId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Users, 
  Calendar,
  Download,
  Edit,
  Search,
  CheckCircle
} from 'lucide-react';

interface Protokoll {
  id: string;
  titel: string;
  datum: string;
  typ: 'Vorstandssitzung' | 'Mitgliederversammlung' | 'Jahreshauptversammlung';
  anwesende: number;
  beschluesse: number;
  status: 'Entwurf' | 'Fertig' | 'Versendet';
}



export default function ProtokollePage() {
  const { clubId, loading: clubLoading } = useClubId();
  const [protokolle, setProtokolle] = useState<Protokoll[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProtokoll, setNewProtokoll] = useState({
    titel: '',
    typ: 'Vorstandssitzung',
    datum: '',
    ort: ''
  });
  const [editProtokoll, setEditProtokoll] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedProtokoll, setSelectedProtokoll] = useState(null);
  const [newTagesordnung, setNewTagesordnung] = useState('');
  const [newAnwesende, setNewAnwesende] = useState('');
  const [newBeschluss, setNewBeschluss] = useState('');

  useEffect(() => {
    if (clubId && !clubLoading) {
      loadProtokolle();
    }
  }, [clubId, clubLoading]);

  const loadProtokolle = async () => {
    if (!clubId) return;
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/vereinsrecht/protokolle`);
      if (response.ok) {
        const data = await response.json();
        setProtokolle(data.data || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Protokolle:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProtokoll = async () => {
    if (!newProtokoll.titel || !newProtokoll.datum || !clubId) {
      alert('Bitte Titel und Datum eingeben');
      return;
    }

    try {
      const response = await fetch(`/api/clubs/${clubId}/vereinsrecht/protokolle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProtokoll)
      });

      if (response.ok) {
        await loadProtokolle();
        setShowNewDialog(false);
        setNewProtokoll({ titel: '', typ: 'Vorstandssitzung', datum: '', ort: '' });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    }
  };

  const updateProtokoll = async () => {
    if (!editProtokoll.titel || !editProtokoll.datum) {
      alert('Bitte Titel und Datum eingeben');
      return;
    }

    try {
      const response = await fetch(`/api/clubs/${clubId}/vereinsrecht/protokolle/${editProtokoll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProtokoll)
      });

      if (response.ok) {
        await loadProtokolle();
        setShowEditDialog(false);
        setEditProtokoll(null);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const startEdit = (protokoll) => {
    setEditProtokoll({
      id: protokoll.id,
      titel: protokoll.titel,
      typ: protokoll.typ,
      datum: protokoll.datum,
      ort: protokoll.ort || ''
    });
    setShowEditDialog(true);
  };

  const openProtokoll = (protokoll) => {
    setSelectedProtokoll({
      ...protokoll,
      tagesordnung: protokoll.tagesordnung || [],
      anwesende: protokoll.anwesende || [],
      beschluesse: protokoll.beschluesse || []
    });
    setShowDetailDialog(true);
  };

  const updateProtokollStatus = async (id, status) => {
    if (!clubId) return;
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/vereinsrecht/protokolle/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await loadProtokolle();
        setSelectedProtokoll({...selectedProtokoll, status});
      }
    } catch (error) {
      console.error('Fehler beim Status-Update:', error);
    }
  };

  const addTagesordnung = async () => {
    if (!newTagesordnung.trim()) return;
    
    const updatedTagesordnung = [...selectedProtokoll.tagesordnung, newTagesordnung];
    await updateProtokollContent('tagesordnung', updatedTagesordnung);
    setSelectedProtokoll({...selectedProtokoll, tagesordnung: updatedTagesordnung});
    setNewTagesordnung('');
  };

  const addAnwesende = async () => {
    if (!newAnwesende.trim()) return;
    
    const updatedAnwesende = [...selectedProtokoll.anwesende, newAnwesende];
    await updateProtokollContent('anwesende', updatedAnwesende);
    setSelectedProtokoll({...selectedProtokoll, anwesende: updatedAnwesende});
    setNewAnwesende('');
  };

  const addBeschluss = async () => {
    if (!newBeschluss.trim()) return;
    
    const updatedBeschluesse = [...selectedProtokoll.beschluesse, newBeschluss];
    await updateProtokollContent('beschluesse', updatedBeschluesse);
    setSelectedProtokoll({...selectedProtokoll, beschluesse: updatedBeschluesse});
    setNewBeschluss('');
  };

  const updateProtokollContent = async (field, value) => {
    if (!clubId) return;
    
    try {
      await fetch(`/api/clubs/${clubId}/vereinsrecht/protokolle/${selectedProtokoll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (error) {
      console.error('Fehler beim Update:', error);
    }
  };

  const filteredProtokolle = protokolle.filter(p => 
    p.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.typ.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entwurf': return 'bg-yellow-100 text-yellow-800';
      case 'Fertig': return 'bg-blue-100 text-blue-800';
      case 'Versendet': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container py-4 px-2 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/vereinsrecht" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Protokoll-Management
          </h1>
        </div>
        <p className="text-muted-foreground">
          Sitzungsprotokolle digital erstellen und verwalten
        </p>
      </div>

      {/* Aktionen */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button onClick={() => setShowNewDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Neues Protokoll
        </Button>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Protokolle durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {(loading || clubLoading) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Protokolle...</p>
        </div>
      )}

      {/* Protokoll-Liste */}
      {!loading && !clubLoading && clubId && (
        <div className="grid gap-4">
          {filteredProtokolle.map((protokoll) => (
          <Card key={protokoll.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{protokoll.titel}</h3>
                    <Badge className={getStatusColor(protokoll.status)}>
                      {protokoll.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(protokoll.datum).toLocaleDateString('de-DE')}
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {protokoll.typ}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {protokoll.anwesende?.length || 0} Anwesende
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {protokoll.beschluesse?.length || 0} Beschlüsse
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => openProtokoll(protokoll)}>
                    <FileText className="h-4 w-4 mr-1" />
                    Öffnen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(protokoll)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!loading && !clubLoading && clubId && filteredProtokolle.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Keine Protokolle gefunden.' : 'Noch keine Protokolle erstellt.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Neues Protokoll Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Neues Protokoll erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titel">Titel</Label>
                <Input 
                  id="titel" 
                  placeholder="z.B. Vorstandssitzung September"
                  value={newProtokoll.titel}
                  onChange={(e) => setNewProtokoll({...newProtokoll, titel: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="typ">Typ</Label>
                <select 
                  id="typ" 
                  className="w-full p-2 border rounded"
                  value={newProtokoll.typ}
                  onChange={(e) => setNewProtokoll({...newProtokoll, typ: e.target.value})}
                >
                  <option value="Vorstandssitzung">Vorstandssitzung</option>
                  <option value="Mitgliederversammlung">Mitgliederversammlung</option>
                  <option value="Jahreshauptversammlung">Jahreshauptversammlung</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="datum">Datum</Label>
                <Input 
                  id="datum" 
                  type="date"
                  value={newProtokoll.datum}
                  onChange={(e) => setNewProtokoll({...newProtokoll, datum: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="ort">Ort</Label>
                <Input 
                  id="ort" 
                  placeholder="z.B. Vereinsheim"
                  value={newProtokoll.ort}
                  onChange={(e) => setNewProtokoll({...newProtokoll, ort: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowNewDialog(false)} variant="outline" className="flex-1">
                  Abbrechen
                </Button>
                <Button onClick={createProtokoll} className="flex-1">
                  Erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bearbeiten Dialog */}
      {showEditDialog && editProtokoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Protokoll bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-titel">Titel</Label>
                <Input 
                  id="edit-titel" 
                  value={editProtokoll.titel}
                  onChange={(e) => setEditProtokoll({...editProtokoll, titel: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-typ">Typ</Label>
                <select 
                  id="edit-typ" 
                  className="w-full p-2 border rounded"
                  value={editProtokoll.typ}
                  onChange={(e) => setEditProtokoll({...editProtokoll, typ: e.target.value})}
                >
                  <option value="Vorstandssitzung">Vorstandssitzung</option>
                  <option value="Mitgliederversammlung">Mitgliederversammlung</option>
                  <option value="Jahreshauptversammlung">Jahreshauptversammlung</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="edit-datum">Datum</Label>
                <Input 
                  id="edit-datum" 
                  type="date"
                  value={editProtokoll.datum}
                  onChange={(e) => setEditProtokoll({...editProtokoll, datum: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-ort">Ort</Label>
                <Input 
                  id="edit-ort" 
                  value={editProtokoll.ort}
                  onChange={(e) => setEditProtokoll({...editProtokoll, ort: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowEditDialog(false)} variant="outline" className="flex-1">
                  Abbrechen
                </Button>
                <Button onClick={updateProtokoll} className="flex-1">
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Protokoll Details Dialog */}
      {showDetailDialog && selectedProtokoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedProtokoll.titel}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedProtokoll.status)}>
                    {selectedProtokoll.status}
                  </Badge>
                  {selectedProtokoll.status === 'Entwurf' && (
                    <Button size="sm" onClick={() => updateProtokollStatus(selectedProtokoll.id, 'Fertig')}>
                      Als fertig markieren
                    </Button>
                  )}
                  {selectedProtokoll.status === 'Fertig' && (
                    <Button size="sm" onClick={() => updateProtokollStatus(selectedProtokoll.id, 'Versendet')}>
                      Als versendet markieren
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basis-Infos */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded">
                <div><strong>Typ:</strong> {selectedProtokoll.typ}</div>
                <div><strong>Datum:</strong> {new Date(selectedProtokoll.datum).toLocaleDateString('de-DE')}</div>
                <div><strong>Ort:</strong> {selectedProtokoll.ort || 'Nicht angegeben'}</div>
                <div><strong>Status:</strong> {selectedProtokoll.status}</div>
              </div>

              {/* Tagesordnung */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Tagesordnung</h3>
                <div className="space-y-2">
                  {selectedProtokoll.tagesordnung.length === 0 ? (
                    <p className="text-muted-foreground italic">Noch keine Tagesordnungspunkte hinzugefügt</p>
                  ) : (
                    selectedProtokoll.tagesordnung.map((punkt, index) => (
                      <div key={index} className="p-2 border rounded">
                        {index + 1}. {punkt}
                      </div>
                    ))
                  )}
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Neuer Tagesordnungspunkt"
                      value={newTagesordnung}
                      onChange={(e) => setNewTagesordnung(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTagesordnung()}
                    />
                    <Button variant="outline" size="sm" onClick={addTagesordnung}>
                      <Plus className="h-4 w-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>
              </div>

              {/* Anwesende */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Anwesende</h3>
                <div className="space-y-2">
                  {selectedProtokoll.anwesende.length === 0 ? (
                    <p className="text-muted-foreground italic">Noch keine Anwesenden hinzugefügt</p>
                  ) : (
                    selectedProtokoll.anwesende.map((person, index) => (
                      <div key={index} className="p-2 border rounded">
                        {person}
                      </div>
                    ))
                  )}
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Name der anwesenden Person"
                      value={newAnwesende}
                      onChange={(e) => setNewAnwesende(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAnwesende()}
                    />
                    <Button variant="outline" size="sm" onClick={addAnwesende}>
                      <Plus className="h-4 w-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>
              </div>

              {/* Beschlüsse */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Beschlüsse</h3>
                <div className="space-y-2">
                  {selectedProtokoll.beschluesse.length === 0 ? (
                    <p className="text-muted-foreground italic">Noch keine Beschlüsse hinzugefügt</p>
                  ) : (
                    selectedProtokoll.beschluesse.map((beschluss, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="font-medium">Beschluss {index + 1}</div>
                        <div className="text-sm text-muted-foreground">{beschluss}</div>
                      </div>
                    ))
                  )}
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Beschlusstext eingeben..."
                      value={newBeschluss}
                      onChange={(e) => setNewBeschluss(e.target.value)}
                      rows={3}
                    />
                    <Button variant="outline" size="sm" onClick={addBeschluss}>
                      <Plus className="h-4 w-4 mr-1" />
                      Beschluss hinzufügen
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowDetailDialog(false)} variant="outline" className="flex-1">
                  Schließen
                </Button>
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  PDF generieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
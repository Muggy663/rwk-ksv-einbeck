"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMAdminMitglieder() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [shooters, setShooters] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [filter, setFilter] = useState({ verein: '', search: '', showIncomplete: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShooter, setNewShooter] = useState<any>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  useEffect(() => {
    if (hasFullAccess && !authLoading) {
      loadData();
    }
  }, [hasFullAccess, authLoading]);

  const loadData = async () => {
    try {
      // Lade Schützen direkt aus Firebase
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const [shootersSnapshot, clubsRes] = await Promise.all([
        getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc'))),
        fetch('/api/clubs')
      ]);
      
      const shootersData = shootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setShooters(shootersData);

      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubs(data.data || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (shooter: any) => {
    setEditingId(shooter.id);
    setEditData({
      firstName: shooter.firstName || '',
      lastName: shooter.lastName || '',
      birthYear: shooter.birthYear || '',
      gender: shooter.gender || '',
      mitgliedsnummer: shooter.mitgliedsnummer || '',
      kmClubId: shooter.kmClubId || ''
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      // Get Firebase auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        toast({ title: 'Fehler', description: 'Nicht angemeldet', variant: 'destructive' });
        return;
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`/api/shooters/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Schütze aktualisiert' });
        setEditingId(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast({ title: 'Fehler', description: errorData.error || 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
    }
  };

  const deleteShooter = async (shooterId: string, shooterName: string) => {
    if (!confirm(`Schütze "${shooterName}" wirklich löschen?`)) return;

    try {
      // Get Firebase auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        toast({ title: 'Fehler', description: 'Nicht angemeldet', variant: 'destructive' });
        return;
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`/api/shooters/${shooterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Schütze gelöscht' });
        loadData();
      } else {
        const errorData = await response.json();
        toast({ title: 'Fehler', description: errorData.error || 'Löschen fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const addShooter = async () => {
    if (!newShooter.firstName?.trim() || !newShooter.lastName?.trim()) {
      toast({ title: 'Fehler', description: 'Vor- und Nachname sind erforderlich', variant: 'destructive' });
      return;
    }

    try {
      const shooterData = {
        firstName: newShooter.firstName.trim(),
        lastName: newShooter.lastName.trim(),
        birthYear: newShooter.birthYear ? parseInt(newShooter.birthYear) : undefined,
        gender: newShooter.gender || undefined,
        mitgliedsnummer: newShooter.mitgliedsnummer?.trim() || undefined,
        clubId: newShooter.kmClubId || undefined
      };

      const response = await fetch('/api/shooters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shooterData)
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Schütze hinzugefügt' });
        setShowAddForm(false);
        setNewShooter({});
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Hinzufügen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const getClubName = (shooter: any) => {
    const clubId = shooter.kmClubId || shooter.rwkClubId || shooter.clubId;
    if (!clubId) return '-';
    const club = clubs.find(c => c.id === clubId);
    return club?.name || 'Unbekannt';
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortValue = (shooter: any, key: string) => {
    switch (key) {
      case 'firstName': return shooter.firstName || shooter.name?.split(' ')[0] || '';
      case 'lastName': return shooter.lastName || shooter.name?.split(' ').slice(1).join(' ') || '';
      case 'verein': return getClubName(shooter);
      case 'birthYear': return shooter.birthYear || 0;
      case 'gender': return shooter.gender || 'unknown';
      case 'mitgliedsnummer': return shooter.mitgliedsnummer || '';
      default: return '';
    }
  };

  const filteredAndSortedShooters = shooters.filter(shooter => {
    // Vereinsfilter
    if (filter.verein) {
      const clubId = shooter.kmClubId || shooter.rwkClubId || shooter.clubId;
      if (clubId !== filter.verein) return false;
    }

    // Suchfilter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const fullName = `${shooter.firstName || ''} ${shooter.lastName || ''}`.toLowerCase();
      const name = (shooter.name || '').toLowerCase();
      const mitgliedsnummer = (shooter.mitgliedsnummer || '').toLowerCase();
      
      if (!fullName.includes(searchLower) && 
          !name.includes(searchLower) && 
          !mitgliedsnummer.includes(searchLower)) {
        return false;
      }
    }

    // Unvollständige Daten Filter
    if (filter.showIncomplete) {
      const hasIncompleteData = !shooter.gender || !shooter.birthYear || !shooter.firstName || !shooter.lastName;
      if (!hasIncompleteData) return false;
    }

    return true;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);
    
    if (sortConfig.key === 'birthYear') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade alle KM-Mitglieder...</p>
        </div>
      </div>
    );
  }

  if (!hasFullAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">👥 Alle KM-Mitglieder</h1>
          <p className="text-muted-foreground">Verwaltung aller Schützen für die Kreismeisterschaft</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>+ Neuer Schütze</Button>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Verein</label>
              <select
                value={filter.verein}
                onChange={(e) => setFilter(prev => ({ ...prev, verein: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Alle Vereine</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Suche</label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Name, Mitgliedsnummer..."
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.showIncomplete}
                  onChange={(e) => setFilter(prev => ({ ...prev, showIncomplete: e.target.checked }))}
                />
                <span className="text-sm">Nur unvollständige Daten</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Neuer Schütze Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Neuen Schützen hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Vorname *"
                value={newShooter.firstName || ''}
                onChange={(e) => setNewShooter(prev => ({ ...prev, firstName: e.target.value }))}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Nachname *"
                value={newShooter.lastName || ''}
                onChange={(e) => setNewShooter(prev => ({ ...prev, lastName: e.target.value }))}
                className="p-2 border rounded"
              />
              <select
                value={newShooter.kmClubId || ''}
                onChange={(e) => setNewShooter(prev => ({ ...prev, kmClubId: e.target.value }))}
                className="p-2 border rounded"
              >
                <option value="">Verein wählen</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Geburtsjahr"
                value={newShooter.birthYear || ''}
                onChange={(e) => setNewShooter(prev => ({ ...prev, birthYear: e.target.value }))}
                className="p-2 border rounded"
                min="1920"
                max="2020"
              />
              <select
                value={newShooter.gender || ''}
                onChange={(e) => setNewShooter(prev => ({ ...prev, gender: e.target.value }))}
                className="p-2 border rounded"
              >
                <option value="">Geschlecht</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
              </select>
              <input
                type="text"
                placeholder="Mitgliedsnummer"
                value={newShooter.mitgliedsnummer || ''}
                onChange={(e) => setNewShooter(prev => ({ ...prev, mitgliedsnummer: e.target.value }))}
                className="p-2 border rounded"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addShooter}>Hinzufügen</Button>
              <Button variant="outline" onClick={() => { setShowAddForm(false); setNewShooter({}); }}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mitglieder Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Mitglieder ({filteredAndSortedShooters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('firstName')}>
                    Vorname {sortConfig?.key === 'firstName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('lastName')}>
                    Nachname {sortConfig?.key === 'lastName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('verein')}>
                    Verein {sortConfig?.key === 'verein' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('birthYear')}>
                    Geburtsjahr {sortConfig?.key === 'birthYear' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('gender')}>
                    Geschlecht {sortConfig?.key === 'gender' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('mitgliedsnummer')}>
                    Mitgl.-Nr. {sortConfig?.key === 'mitgliedsnummer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedShooters.map(shooter => (
                  <tr key={shooter.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <input
                          type="text"
                          value={editData.firstName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full p-1 border rounded text-sm"
                        />
                      ) : (
                        shooter.firstName || shooter.name?.split(' ')[0] || ''
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <input
                          type="text"
                          value={editData.lastName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full p-1 border rounded text-sm"
                        />
                      ) : (
                        shooter.lastName || shooter.name?.split(' ').slice(1).join(' ') || ''
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <select
                          value={editData.kmClubId || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, kmClubId: e.target.value }))}
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value="">Verein wählen</option>
                          {clubs.map(club => (
                            <option key={club.id} value={club.id}>{club.name}</option>
                          ))}
                        </select>
                      ) : (
                        getClubName(shooter)
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <input
                          type="number"
                          value={editData.birthYear || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, birthYear: parseInt(e.target.value) || undefined }))}
                          className="w-20 p-1 border rounded text-sm"
                          min="1920"
                          max="2020"
                        />
                      ) : (
                        shooter.birthYear || '?'
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <select
                          value={editData.gender || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                          className="p-1 border rounded text-sm"
                        >
                          <option value="">Unbekannt</option>
                          <option value="male">Männlich</option>
                          <option value="female">Weiblich</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${
                          shooter.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                          shooter.gender === 'female' ? 'bg-pink-100 text-pink-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {shooter.gender === 'male' ? 'M' :
                           shooter.gender === 'female' ? 'W' : '?'}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <input
                          type="text"
                          value={editData.mitgliedsnummer || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, mitgliedsnummer: e.target.value }))}
                          className="w-20 p-1 border rounded text-sm"
                        />
                      ) : (
                        shooter.mitgliedsnummer || '-'
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit}>✓</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>✗</Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => startEdit(shooter)}>
                            Bearbeiten
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteShooter(shooter.id, shooter.name)}
                          >
                            Löschen
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAndSortedShooters.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Mitglieder gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

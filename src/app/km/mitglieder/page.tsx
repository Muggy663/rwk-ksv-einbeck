"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';

interface Shooter {
  id: string;
  name: string;
  rwkClubId?: string;      // Für Rundenwettkampf
  kmClubId?: string;       // Für Kreismeisterschaft
  birthYear?: number;
  gender?: 'male' | 'female';
  mitgliedsnummer?: string;
  genderGuessed?: boolean;
}

interface Club {
  id: string;
  name: string;
}

export default function KMMitglieder() {
  const { toast } = useToast();
  const { hasKMAccess, userClubIds, loading: authLoading } = useKMAuth();
  const [shooters, setShooters] = useState<Shooter[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Shooter>>({});
  const [filter, setFilter] = useState('');
  const [vereinFilter, setVereinFilter] = useState('');
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShooter, setNewShooter] = useState<Partial<Shooter>>({});
  const [selectedShooters, setSelectedShooters] = useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading ALL shooters in batches (1500+ expected)...');
      
      const { collection, getDocs, query, orderBy, limit, startAfter } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      // Batch-Abfrage für alle Schützen

      
      const allShooters = [];
      let lastDoc = null;
      let batchCount = 0;
      
      // Lade in Batches von 500 (unter Firestore-Limit)
      while (true) {
        batchCount++;
        console.log(`📦 Batch ${batchCount} loading...`);
        
        let batchQuery;
        
        // Wenn wir einen lastDoc haben, starte nach diesem
        if (lastDoc) {
          batchQuery = query(
            collection(db, 'km_shooters'),
            orderBy('name'),
            startAfter(lastDoc),
            limit(500)
          );
        } else {
          batchQuery = query(
            collection(db, 'km_shooters'),
            orderBy('name'),
            limit(500)
          );
        }
        
        const batchSnapshot = await getDocs(batchQuery);
        const batchShooters = batchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`📦 Batch ${batchCount}: ${batchShooters.length} shooters loaded`);
        allShooters.push(...batchShooters);
        
        // Wenn weniger als 500 zurückkommen, sind wir fertig
        if (batchShooters.length < 500) {
          console.log('✅ All batches loaded!');
          break;
        }
        
        // Setze lastDoc für nächste Iteration
        lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];
      }
      
      console.log('🎉 Total shooters loaded:', allShooters.length);
      
      // Duplikate entfernen - bevorzuge Schützen mit kmClubId
      const uniqueShooters = new Map();
      allShooters.forEach(shooter => {
        const key = `${shooter.name}_${shooter.firstName || ''}_${shooter.lastName || ''}`;
        const existing = uniqueShooters.get(key);
        
        if (!existing) {
          uniqueShooters.set(key, shooter);
        } else {
          // Bevorzuge Schützen mit kmClubId über die ohne
          if (shooter.kmClubId && !existing.kmClubId) {
            uniqueShooters.set(key, shooter);
          }
        }
      });
      
      const shooters = Array.from(uniqueShooters.values());
      console.log(`🔧 Duplikate entfernt: ${allShooters.length} → ${shooters.length}`);
      console.log(`📊 Davon mit kmClubId: ${shooters.filter(s => s.kmClubId).length}`);
      
      const clubsRes = await fetch('/api/clubs');
      

      
      // Suche nach bekannten Schützen
      const marcelBuenger = shooters.find(s => s.name && s.name.toLowerCase().includes('marcel') && s.name.toLowerCase().includes('bünger'));
      const stephanieBuenger = shooters.find(s => s.name && s.name.toLowerCase().includes('stephanie') && s.name.toLowerCase().includes('bünger'));
      const melinaBrinckmann = shooters.find(s => s.name && s.name.toLowerCase().includes('melina') && s.name.toLowerCase().includes('brinckmann'));
      
      console.log('✅ Marcel Bünger gefunden:', marcelBuenger ? marcelBuenger.name : '❌ NICHT GEFUNDEN!');
      console.log('✅ Stephanie Bünger gefunden:', stephanieBuenger ? stephanieBuenger.name : '❌ NICHT GEFUNDEN!');
      console.log('✅ Melina Brinckmann gefunden:', melinaBrinckmann ? melinaBrinckmann.name : '❌ NICHT GEFUNDEN!');
      
      // Prüfe ob Firestore-Abfrage limitiert ist
      const sortedNames = shooters.map(s => s.name).sort();
      console.log('🔍 Erste 5 Namen:', sortedNames.slice(0, 5));
      console.log('🔍 Letzte 5 Namen:', sortedNames.slice(-5));
      
      // Zähle RWK vs KM Schützen
      const rwkShooters = shooters.filter(s => s.clubId);
      const kmShooters = shooters.filter(s => s.kmClubId && !s.clubId);
      console.log('📊 RWK-Schützen (mit clubId):', rwkShooters.length);
      console.log('📊 KM-Schützen (nur kmClubId):', kmShooters.length);
      console.log('📊 Gemischte (beide IDs):', shooters.filter(s => s.clubId && s.kmClubId).length);
      
      // KRITISCH: Prüfe ob 881 ein Firestore-Limit ist
      if (shooters.length === 881) {
        console.log('⚠️ WARNUNG: Genau 881 Schützen - möglicherweise Firestore-Limit erreicht!');
      }
      
      // LÖSUNG: Füge searchableText zu allen Schützen hinzu
      const shootersWithSearch = shooters.map(shooter => {
        const clubId = shooter.kmClubId || shooter.rwkClubId || (shooter as any).clubId;
        const clubName = clubs.find(c => c.id === clubId)?.name || '';
        
        return {
          ...shooter,
          searchableText: [
            shooter.name || '',
            shooter.firstName || '',
            shooter.lastName || '',
            shooter.mitgliedsnummer || '',
            clubName,
            clubId || '',
            shooter.gender || ''
          ].join(' ').toLowerCase()
        };
      });
      
      console.log('🔍 Beispiel searchableText:', shootersWithSearch[0]?.searchableText);
      
      // DEBUG: Prüfe userClubIds
      console.log('🔑 userClubIds:', userClubIds);
      console.log('🔍 Beispiel Schütze Club-IDs:', {
        clubId: shootersWithSearch[0]?.clubId,
        rwkClubId: shootersWithSearch[0]?.rwkClubId,
        kmClubId: shootersWithSearch[0]?.kmClubId
      });
      
      setShooters(shootersWithSearch);
      
      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubs(data.data || []);
      }
    } catch (error) {
      console.error('LoadData error:', error);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (shooter: Shooter) => {
    setEditingId(shooter.id);
    setEditData({
      firstName: shooter.firstName || shooter.name?.split(' ')[0] || '',
      lastName: shooter.lastName || shooter.name?.split(' ').slice(1).join(' ') || '',
      birthYear: shooter.birthYear,
      gender: shooter.gender,
      mitgliedsnummer: shooter.mitgliedsnummer
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const { ShooterSyncService } = await import('@/lib/services/shooter-sync-service');
      
      const updateData: any = {};
      if (editData.firstName !== undefined) updateData.firstName = editData.firstName;
      if (editData.lastName !== undefined) updateData.lastName = editData.lastName;
      if (editData.firstName && editData.lastName) {
        updateData.name = `${editData.firstName} ${editData.lastName}`;
      }
      if (editData.birthYear !== undefined) updateData.birthYear = editData.birthYear;
      if (editData.gender !== undefined) updateData.gender = editData.gender;
      if (editData.mitgliedsnummer !== undefined) updateData.mitgliedsnummer = editData.mitgliedsnummer;

      await ShooterSyncService.updateShooter(editingId, updateData, 'km_shooters');
      
      toast({ title: 'Erfolg', description: 'Schütze in beiden Systemen aktualisiert' });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: 'Fehler', description: `Aktualisierung fehlgeschlagen: ${error}`, variant: 'destructive' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const addShooter = async () => {
    if (!newShooter.name?.trim()) {
      toast({ title: 'Fehler', description: 'Name ist erforderlich', variant: 'destructive' });
      return;
    }

    try {
      const { ShooterSyncService } = await import('@/lib/services/shooter-sync-service');
      
      const shooterData = {
        name: newShooter.name.trim(),
        birthYear: newShooter.birthYear,
        gender: newShooter.gender,
        mitgliedsnummer: newShooter.mitgliedsnummer?.trim(),
        kmClubId: newShooter.kmClubId || userClubIds[0]
      };

      await ShooterSyncService.createShooter(shooterData, 'km_shooters');
      
      toast({ title: 'Erfolg', description: 'Schütze in beiden Systemen hinzugefügt' });
      setShowAddForm(false);
      setNewShooter({});
      loadData();
    } catch (error) {
      console.error('Add error:', error);
      toast({ title: 'Fehler', description: `Hinzufügen fehlgeschlagen: ${error}`, variant: 'destructive' });
    }
  };

  const deleteShooter = async (shooterId: string, shooterName: string) => {
    if (!confirm(`Schütze "${shooterName}" wirklich aus beiden Systemen löschen?`)) return;

    try {
      const { ShooterSyncService } = await import('@/lib/services/shooter-sync-service');
      
      await ShooterSyncService.deleteShooter(shooterId, 'km_shooters');
      
      toast({ title: 'Erfolg', description: 'Schütze aus beiden Systemen gelöscht' });
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Fehler', description: `Löschen fehlgeschlagen: ${error}`, variant: 'destructive' });
    }
  };

  const bulkDeleteShooters = async () => {
    const shooterNames = Array.from(selectedShooters).map(id => 
      shooters.find(s => s.id === id)?.name || 'Unbekannt'
    ).join(', ');
    
    if (!confirm(`${selectedShooters.size} Schützen wirklich löschen?\n\n${shooterNames}`)) return;

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const deletePromises = Array.from(selectedShooters).map(shooterId => 
        deleteDoc(doc(db, 'km_shooters', shooterId))
      );
      
      await Promise.all(deletePromises);
      
      toast({ title: 'Erfolg', description: `${selectedShooters.size} Schützen gelöscht` });
      setSelectedShooters(new Set());
      setBulkDeleteMode(false);
      loadData();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({ title: 'Fehler', description: `Löschen fehlgeschlagen: ${error}`, variant: 'destructive' });
    }
  };

  const toggleShooterSelection = (shooterId: string) => {
    const newSelection = new Set(selectedShooters);
    if (newSelection.has(shooterId)) {
      newSelection.delete(shooterId);
    } else {
      newSelection.add(shooterId);
    }
    setSelectedShooters(newSelection);
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(filteredAndSortedShooters.map(s => s.id));
    setSelectedShooters(visibleIds);
  };

  const deselectAll = () => {
    setSelectedShooters(new Set());
  };

  const selectByClub = (clubName: string) => {
    const matchingIds = new Set(
      filteredAndSortedShooters
        .filter(shooter => getClubName(shooter) === clubName)
        .map(s => s.id)
    );
    setSelectedShooters(matchingIds);
  };

  const selectOnlyNames = () => {
    const onlyNameIds = new Set(
      filteredAndSortedShooters
        .filter(shooter => {
          const name = shooter.name || '';
          // Nur Nachname (kein Leerzeichen) oder sehr kurze Namen
          return !name.includes(' ') || name.trim().length < 5;
        })
        .map(s => s.id)
    );
    setSelectedShooters(onlyNameIds);
  };

  const getClubName = (shooter: Shooter) => {
    // Robuste Suche: Prüfe kmClubId, dann rwkClubId, dann clubId
    const clubId = shooter.kmClubId || shooter.rwkClubId || (shooter as any).clubId;
    if (!clubId) return '-';
    const club = clubs.find(c => c.id === clubId);
    return club?.name || 'Unbekannt';
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedShooters = shooters.filter(shooter => {
    // Alle möglichen Club-IDs sammeln
    const schuetzeClubIds = [
      shooter.clubId,     // Hauptfeld für RWK-Teilnehmer
      shooter.rwkClubId,  // Fallback
      shooter.kmClubId    // KM-spezifisch
    ].filter(Boolean);
    
    // Nur Schützen der eigenen Vereine anzeigen
    const belongsToUserClub = schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
    if (!belongsToUserClub) return false;
    
    // Vereinsfilter (innerhalb der eigenen Vereine)
    if (vereinFilter) {
      const matchesVerein = schuetzeClubIds.includes(vereinFilter);
      if (!matchesVerein) return false;
    }
    
    // Verwende searchableText für robuste Suche
    const matchesSearch = !filter || (shooter as any).searchableText?.includes(filter.toLowerCase()) || false;
    
    if (showIncomplete) {
      const hasIncompleteData = !shooter.gender || !shooter.birthYear || shooter.genderGuessed || !shooter.kmClubId;
      return matchesSearch && hasIncompleteData;
    }
    
    return matchesSearch;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'firstName':
        aValue = a.firstName || a.name?.split(' ')[0] || '';
        bValue = b.firstName || b.name?.split(' ')[0] || '';
        break;
      case 'lastName':
        aValue = a.lastName || a.name?.split(' ').slice(1).join(' ') || '';
        bValue = b.lastName || b.name?.split(' ').slice(1).join(' ') || '';
        break;
      case 'verein':
        aValue = getClubName(a);
        bValue = getClubName(b);
        break;
      case 'birthYear':
        aValue = a.birthYear || 0;
        bValue = b.birthYear || 0;
        break;
      case 'gender':
        aValue = a.gender || '';
        bValue = b.gender || '';
        break;
      case 'mitgliedsnummer':
        aValue = a.mitgliedsnummer || '';
        bValue = b.mitgliedsnummer || '';
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const result = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? result : -result;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (authLoading || loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Mitglieder...</p>
          <p className="text-sm text-gray-400 mt-2">Schützendaten werden geladen</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">👥 Mitglieder bearbeiten</h1>
          <p className="text-muted-foreground">Importierte Schützen-Daten korrigieren</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Schützen ({filteredAndSortedShooters.length} von {shooters.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={bulkDeleteMode ? "destructive" : "outline"}
                onClick={() => {
                  setBulkDeleteMode(!bulkDeleteMode);
                  setSelectedShooters(new Set());
                }}
              >
                {bulkDeleteMode ? "❌ Abbrechen" : "🗑️ Mehrfach löschen"}
              </Button>
              {bulkDeleteMode && selectedShooters.size > 0 && (
                <Button 
                  variant="destructive"
                  onClick={() => bulkDeleteShooters()}
                >
                  🗑️ {selectedShooters.size} Schützen löschen
                </Button>
              )}
              <Button onClick={() => setShowAddForm(true)}>+ Neuer Schütze</Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={vereinFilter}
              onChange={(e) => setVereinFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="">Meine Vereine</option>
              {clubs.filter(c => userClubIds.includes(c.id)).map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Name suchen..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showIncomplete}
                onChange={(e) => setShowIncomplete(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Nur unvollständige Daten</span>
            </label>
            <Button variant="outline" onClick={() => { setFilter(''); setVereinFilter(''); setShowIncomplete(false); }}>Zurücksetzen</Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-3">Neuen Schützen hinzufügen</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Name *"
                  value={newShooter.name || ''}
                  onChange={(e) => setNewShooter(prev => ({ ...prev, name: e.target.value }))}
                  className="p-2 border rounded"
                />
                <select
                  value={newShooter.kmClubId || userClubIds[0] || ''}
                  onChange={(e) => setNewShooter(prev => ({ ...prev, kmClubId: e.target.value }))}
                  className="p-2 border rounded"
                >
                  {clubs.filter(c => userClubIds.includes(c.id)).map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Geburtsjahr"
                  value={newShooter.birthYear || ''}
                  onChange={(e) => setNewShooter(prev => ({ ...prev, birthYear: parseInt(e.target.value) || undefined }))}
                  className="p-2 border rounded"
                  min="1920"
                  max="2020"
                />
                <select
                  value={newShooter.gender || ''}
                  onChange={(e) => setNewShooter(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | undefined }))}
                  className="p-2 border rounded"
                >
                  <option value="">Geschlecht</option>
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
                <input
                  type="text"
                  placeholder="Mitgl.-Nr."
                  value={newShooter.mitgliedsnummer || ''}
                  onChange={(e) => setNewShooter(prev => ({ ...prev, mitgliedsnummer: e.target.value }))}
                  className="p-2 border rounded"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={addShooter}>Hinzufügen</Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); setNewShooter({}); }}>Abbrechen</Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {bulkDeleteMode && (
                    <th className="text-left p-2 w-12">
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="outline" onClick={selectAllVisible}>
                          ✓ Alle
                        </Button>
                        <Button size="sm" variant="outline" onClick={deselectAll}>
                          ✗ Keine
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => selectByClub('Unbekannt')}>
                          ? Unbekannt ({filteredAndSortedShooters.filter(s => getClubName(s) === 'Unbekannt').length})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => selectOnlyNames()}>
                          📝 Nur Namen ({filteredAndSortedShooters.filter(s => {
                            const name = s.name || '';
                            return !name.includes(' ') || name.trim().length < 5;
                          }).length})
                        </Button>
                      </div>
                    </th>
                  )}
                  <th className="text-left p-2">
                    <button 
                      onClick={() => handleSort('firstName')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Vorname
                      {sortBy === 'firstName' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">
                    <button 
                      onClick={() => handleSort('lastName')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Nachname
                      {sortBy === 'lastName' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">
                    <button 
                      onClick={() => handleSort('verein')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Verein
                      {sortBy === 'verein' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">
                    <button 
                      onClick={() => handleSort('birthYear')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Geburtsjahr
                      {sortBy === 'birthYear' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">
                    <button 
                      onClick={() => handleSort('gender')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Geschlecht
                      {sortBy === 'gender' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">
                    <button 
                      onClick={() => handleSort('mitgliedsnummer')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Mitgl.-Nr.
                      {sortBy === 'mitgliedsnummer' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedShooters.map((shooter, index) => (
                  <tr key={`${shooter.id}_${index}`} className={`border-b hover:bg-gray-50 ${
                    selectedShooters.has(shooter.id) ? 'bg-red-50' : ''
                  }`}>
                    {bulkDeleteMode && (
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedShooters.has(shooter.id)}
                          onChange={() => toggleShooterSelection(shooter.id)}
                          className="w-4 h-4"
                        />
                      </td>
                    )}
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <input
                          type="text"
                          value={editData.firstName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full p-1 border rounded text-sm"
                          placeholder="Vorname"
                        />
                      ) : (
                        <span>{shooter.firstName || shooter.name?.split(' ')[0] || ''}</span>
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === shooter.id ? (
                        <input
                          type="text"
                          value={editData.lastName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full p-1 border rounded text-sm"
                          placeholder="Nachname"
                        />
                      ) : (
                        <span>{shooter.lastName || shooter.name?.split(' ').slice(1).join(' ') || ''}</span>
                      )}
                    </td>
                    <td className="p-2">{getClubName(shooter)}</td>
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
                          onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | undefined }))}
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
                          {shooter.genderGuessed && !shooter.gender ? ' (?)' : ''}
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
                          <Button size="sm" variant="outline" onClick={cancelEdit}>✗</Button>
                        </div>
                      ) : bulkDeleteMode ? (
                        <span className="text-sm text-gray-500">Mehrfach-Modus aktiv</span>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => startEdit(shooter)}>
                            Bearbeiten
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteShooter(shooter.id, shooter.name)}>
                            Löschen
                          </Button>
                        </div>
                      )}
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
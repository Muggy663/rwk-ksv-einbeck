"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowUpDown, ArrowUp, ArrowDown, PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function KMMitglieder() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading, userClubIds } = useKMAuth();
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<any>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasKMAccess && !authLoading) {
      loadSchuetzen();
    }
  }, [hasKMAccess, authLoading]);

  const loadSchuetzen = async () => {
    try {
      const clubId = userClubIds[0];
      if (!clubId) {
        setSchuetzen([]);
        setLoading(false);
        return;
      }

      // Lade Schützen und Vereine parallel
      const [shootersSnapshot, clubsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc'))),
        getDocs(collection(db, 'clubs'))
      ]);

      const allSchuetzen = shootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const allClubs = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setClubs(allClubs);

      // Client-seitige Filterung nach Verein
      const vereinsSchuetzen = allSchuetzen.filter(s => 
        s.clubId === clubId || s.kmClubId === clubId
      );

      setSchuetzen(vereinsSchuetzen);
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Schützen konnten nicht geladen werden', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortedSchuetzen = [...schuetzen].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (sortField === 'clubName') {
      const aClub = clubs.find(c => c.id === (a.clubId || a.kmClubId));
      const bClub = clubs.find(c => c.id === (b.clubId || b.kmClubId));
      aValue = aClub?.name || '';
      bValue = bClub?.name || '';
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleAddNew = () => {
    const clubId = userClubIds[0];
    setCurrentShooter({
      firstName: '',
      lastName: '',
      clubId: clubId,
      gender: 'male',
      birthYear: '',
      teamIds: []
    });
    setFormMode('new');
    setIsFormOpen(true);
  };

  const handleEdit = (shooter: any) => {
    setCurrentShooter(shooter);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShooter?.firstName?.trim() || !currentShooter?.lastName?.trim()) {
      toast({ title: 'Fehler', description: 'Vor- und Nachname sind erforderlich', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const shooterData = {
        firstName: currentShooter.firstName.trim(),
        lastName: currentShooter.lastName.trim(),
        name: `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`,
        clubId: currentShooter.clubId,
        gender: currentShooter.gender,
        birthYear: currentShooter.birthYear ? parseInt(currentShooter.birthYear) : null,
        teamIds: currentShooter.teamIds || [],
        isActive: true,
        updatedAt: new Date()
      };

      if (formMode === 'new') {
        await addDoc(collection(db, 'shooters'), {
          ...shooterData,
          createdAt: new Date()
        });
        toast({ title: 'Erfolg', description: 'Schütze wurde angelegt' });
      } else {
        await updateDoc(doc(db, 'shooters', currentShooter.id), shooterData);
        toast({ title: 'Erfolg', description: 'Schütze wurde aktualisiert' });
      }

      setIsFormOpen(false);
      setCurrentShooter(null);
      loadSchuetzen();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Vorgang fehlgeschlagen', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shooter: any) => {
    try {
      await deleteDoc(doc(db, 'shooters', shooter.id));
      toast({ title: 'Erfolg', description: 'Schütze wurde gelöscht' });
      loadSchuetzen();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade KM-Mitglieder...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">
            Sie haben keine Berechtigung für den KM-Bereich.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/km">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu KM
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-primary">👥 KM-Mitglieder</h1>
        <p className="text-muted-foreground">
          Übersicht aller registrierten KM-Schützen
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Alle KM-Schützen ({sortedSchuetzen.length})</CardTitle>
            <Button onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Neuen Schützen anlegen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort('firstName')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Vorname {getSortIcon('firstName')}
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort('lastName')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Nachname {getSortIcon('lastName')}
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort('clubName')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Verein {getSortIcon('clubName')}
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort('birthYear')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Geburtsjahr {getSortIcon('birthYear')}
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort('gender')} className="h-auto p-0 font-semibold hover:bg-transparent">
                      Geschlecht {getSortIcon('gender')}
                    </Button>
                  </th>
                  <th className="p-2 text-left">AK Auflage 2026</th>
                  <th className="p-2 text-left">AK Freihand 2026</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchuetzen.map(schuetze => (
                  <tr key={schuetze.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{schuetze.firstName || '-'}</td>
                    <td className="p-2 font-medium">{schuetze.lastName || '-'}</td>
                    <td className="p-2">{(() => {
                      const clubId = schuetze.clubId || schuetze.kmClubId;
                      const club = clubs.find(c => c.id === clubId);
                      return club?.name || 'Unbekannt';
                    })()}</td>
                    <td className="p-2">{schuetze.birthYear || '-'}</td>
                    <td className="p-2">{schuetze.gender === 'male' ? 'M' : schuetze.gender === 'female' ? 'W' : '-'}</td>
                    <td className="p-2 text-xs">
                      {schuetze.birthYear && schuetze.gender ? (() => {
                        const sportjahr = 2026; // Sportjahr KM 2026
                        const age = sportjahr - schuetze.birthYear;
                        const gender = schuetze.gender;
                        // Auflage: Schüler und Senioren-Klassen
                        if (age >= 12 && age <= 14) return gender === 'male' ? 'Schüler I m' : 'Schüler I w';
                        if (age < 41) return '-'; // 15-40 nicht teilnahmeberechtigt
                        if (age <= 50) return 'Senioren 0'; // 41-50 gemischt
                        if (age <= 60) return gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
                        if (age <= 65) return gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
                        if (age <= 70) return gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
                        if (age <= 75) return gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
                        if (age <= 80) return gender === 'male' ? 'Senioren V m' : 'Seniorinnen V';
                        return gender === 'male' ? 'Senioren VI m' : 'Seniorinnen VI';
                      })() : '-'}
                    </td>
                    <td className="p-2 text-xs">
                      {schuetze.birthYear && schuetze.gender ? (() => {
                        const sportjahr = 2026; // Sportjahr KM 2026
                        const age = sportjahr - schuetze.birthYear;
                        const gender = schuetze.gender;
                        if (age <= 14) return gender === 'male' ? 'Schüler I m' : 'Schüler I w';
                        if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
                        if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                        if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                        if (age <= 40) return gender === 'male' ? 'Herren I' : 'Damen I';
                        if (age <= 50) return gender === 'male' ? 'Herren II' : 'Damen II';
                        if (age <= 60) return gender === 'male' ? 'Herren III' : 'Damen III';
                        if (age <= 70) return gender === 'male' ? 'Herren IV' : 'Damen IV';
                        return gender === 'male' ? 'Herren V' : 'Damen V';
                      })() : '-'}
                    </td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Aktiv
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(schuetze)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Schütze löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie {schuetze.firstName} {schuetze.lastName} wirklich löschen?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(schuetze)}>
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>



          {sortedSchuetzen.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine KM-Schützen gefunden
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  value={currentShooter?.firstName || ''}
                  onChange={(e) => setCurrentShooter(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  value={currentShooter?.lastName || ''}
                  onChange={(e) => setCurrentShooter(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Geschlecht</Label>
                <Select value={currentShooter?.gender || 'male'} onValueChange={(value) => setCurrentShooter(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Männlich</SelectItem>
                    <SelectItem value="female">Weiblich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birthYear">Geburtsjahr</Label>
                <Input
                  id="birthYear"
                  type="number"
                  min="1920"
                  max="2020"
                  value={currentShooter?.birthYear || ''}
                  onChange={(e) => setCurrentShooter(prev => ({ ...prev, birthYear: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Speichere...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
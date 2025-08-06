"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';

interface KMUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'km_admin' | 'km_organizer' | 'verein_vertreter';
  clubId?: string;
  isActive: boolean;
}

interface Club {
  id: string;
  name: string;
}

export default function KMUserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [kmUsers, setKmUsers] = useState<KMUser[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    displayName: '',
    role: 'km_organizer' as const,
    clubId: 'none'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [kmUsersSnap, clubsSnap] = await Promise.all([
        getDocs(collection(db, 'km_user_permissions')),
        getDocs(collection(db, 'clubs'))
      ]);

      setKmUsers(kmUsersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as KMUser)));
      setClubs(clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if (!formData.uid || !formData.email) {
      toast({ title: 'Fehler', description: 'UID und E-Mail sind erforderlich', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const kmUserData: any = {
        email: formData.email,
        role: formData.role,
        isActive: true
      };
      
      if (formData.displayName) {
        kmUserData.displayName = formData.displayName;
      }
      
      if (formData.clubId && formData.clubId !== 'none') {
        kmUserData.clubId = formData.clubId;
      }
      

      await setDoc(doc(db, 'km_user_permissions', formData.uid), kmUserData);

      
      toast({ title: 'Erfolg', description: 'KM-Benutzer erstellt' });
      setFormData({ uid: '', email: '', displayName: '', role: 'km_organizer', clubId: 'none' });
      loadData();
    } catch (error) {
      console.error('Error creating KM user:', error);
      toast({ title: 'Fehler', description: `Benutzer konnte nicht erstellt werden: ${error}`, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Benutzer wirklich löschen?')) return;

    try {
      await deleteDoc(doc(db, 'km_user_permissions', uid));
      toast({ title: 'Erfolg', description: 'Benutzer gelöscht' });
      loadData();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Benutzer konnte nicht gelöscht werden', variant: 'destructive' });
    }
  };

  if (user?.email !== 'admin@rwk-einbeck.de') {
    return <div className="text-center py-10">Zugriff verweigert</div>;
  }

  if (loading) {
    return <div className="text-center py-10">Lädt...</div>;
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-primary hover:text-primary/80">← Zurück</Link>
        <h1 className="text-3xl font-bold text-primary">KM-Benutzerverwaltung</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Neuen KM-Benutzer erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="uid">User ID (UID)</Label>
                <Input
                  id="uid"
                  value={formData.uid}
                  onChange={(e) => setFormData(prev => ({ ...prev, uid: e.target.value }))}
                  placeholder="Firebase Auth UID"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="displayName">Anzeigename</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="role">Rolle</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km_admin">KM Admin</SelectItem>
                    <SelectItem value="km_organizer">KM Organisator</SelectItem>
                    <SelectItem value="verein_vertreter">Vereinsvertreter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="clubId">Verein (optional)</Label>
                <Select value={formData.clubId} onValueChange={(value) => setFormData(prev => ({ ...prev, clubId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Verein auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Verein</SelectItem>
                    {clubs.map(club => (
                      <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Erstelle...' : 'Benutzer erstellen'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bestehende KM-Benutzer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kmUsers.map(user => (
                <div key={user.uid} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{user.displayName || user.email}</div>
                    <div className="text-sm text-gray-500">{user.role}</div>
                    {user.clubId && (
                      <div className="text-xs text-gray-400">
                        {clubs.find(c => c.id === user.clubId)?.name}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(user.uid)}
                  >
                    Löschen
                  </Button>
                </div>
              ))}
              {kmUsers.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Keine KM-Benutzer vorhanden
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

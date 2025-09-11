"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/components/auth/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MitgliederCardsPage() {
  const { user } = useAuthContext();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userClub, setUserClub] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (user) {
      loadMembers();
    }
  }, [user]);

  useEffect(() => {
    const filtered = members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.mitgliedsnummer && member.mitgliedsnummer.includes(searchTerm)) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = showInactive ? !member.isActive : member.isActive;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredMembers(filtered);
  }, [members, searchTerm, showInactive]);

  const loadMembers = async () => {
    try {
      const clubsQuery = query(collection(db, 'clubs'));
      const clubsSnapshot = await getDocs(clubsQuery);
      
      if (!clubsSnapshot.empty) {
        const firstClub = clubsSnapshot.docs[0];
        const clubData = firstClub.data();
        setUserClub({ id: firstClub.id, ...clubData });
        
        const membersQuery = query(
          collection(db, 'shooters'),
          where('clubId', '==', firstClub.id),
          orderBy('lastName')
        );
        const membersSnapshot = await getDocs(membersQuery);
        
        const membersList = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          alter: new Date().getFullYear() - (doc.data().birthYear || 0)
        }));
        
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (memberId, updates) => {
    try {
      const memberRef = doc(db, 'shooters', memberId);
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, ...updates } : m
      ));
      
      setEditingMember(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Speichern der Änderungen');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Mitgliederdaten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-primary">Mitgliederverwaltung</h1>
          <a href="/vereinssoftware">
            <Button variant="outline">
              Zurück zur Übersicht
            </Button>
          </a>
        </div>
        <p className="text-lg text-muted-foreground">
          {userClub ? `Mitglieder von ${userClub.name}` : 'Vereinsmitglieder verwalten'}
        </p>
      </div>

      {/* Suche und Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
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
          </div>
        </CardContent>
      </Card>

      {/* Mitgliederliste als Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Mitgliederliste ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map(member => (
              <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Name & Grunddaten */}
                  <div>
                    <div className="font-mono text-sm text-blue-600 font-bold">
                      {member.mitgliedsnummer ? `0${member.mitgliedsnummer}` : '-'}
                    </div>
                    <div className="font-semibold text-lg">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.alter} Jahre • {member.gender === 'male' ? 'Männlich' : member.gender === 'female' ? 'Weiblich' : '-'}
                    </div>
                  </div>
                  
                  {/* Adresse */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">📍 Adresse</div>
                    {editingMember === member.id ? (
                      <div className="space-y-2">
                        <Input
                          defaultValue={member.strasse || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { strasse: e.target.value })}
                          placeholder="Straße"
                          className="text-sm h-8"
                        />
                        <div className="flex gap-1">
                          <Input
                            defaultValue={member.plz || ''}
                            onBlur={(e) => handleUpdateMember(member.id, { plz: e.target.value })}
                            placeholder="PLZ"
                            className="w-20 text-sm h-8"
                          />
                          <Input
                            defaultValue={member.ort || ''}
                            onBlur={(e) => handleUpdateMember(member.id, { ort: e.target.value })}
                            placeholder="Ort"
                            className="text-sm h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div>{member.strasse || '-'}</div>
                        <div>{member.plz} {member.ort}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Kontakt */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">📞 Kontakt</div>
                    {editingMember === member.id ? (
                      <div className="space-y-2">
                        <Input
                          type="email"
                          defaultValue={member.email || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { email: e.target.value })}
                          placeholder="E-Mail"
                          className="text-sm h-8"
                        />
                        <Input
                          type="tel"
                          defaultValue={member.telefon || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { telefon: e.target.value })}
                          placeholder="Telefon"
                          className="text-sm h-8"
                        />
                        <Input
                          type="tel"
                          defaultValue={member.mobil || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { mobil: e.target.value })}
                          placeholder="Mobil"
                          className="text-sm h-8"
                        />
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        <div>📧 {member.email || '-'}</div>
                        <div>📞 {member.telefon || '-'}</div>
                        <div>📱 {member.mobil || '-'}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Status</div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? '✅ Aktiv' : '❌ Inaktiv'}
                    </span>
                  </div>
                  
                  {/* Aktionen */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Aktionen</div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                        className="text-sm"
                      >
                        {editingMember === member.id ? '✅ Fertig' : '✏️ Bearbeiten'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (confirm(`${member.firstName} ${member.lastName} als ausgetreten markieren?`)) {
                            try {
                              const memberRef = doc(db, 'shooters', member.id);
                              await updateDoc(memberRef, { 
                                isActive: false,
                                austrittsdatum: new Date().toISOString().split('T')[0],
                                updatedAt: new Date()
                              });
                              setMembers(prev => prev.map(m => 
                                m.id === member.id ? { ...m, isActive: false } : m
                              ));
                              alert('Mitglied als ausgetreten markiert');
                            } catch (error) {
                              console.error('Fehler:', error);
                              alert('Fehler beim Markieren als ausgetreten');
                            }
                          }
                        }}
                        className="text-sm"
                      >
                        👋 Austritt
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
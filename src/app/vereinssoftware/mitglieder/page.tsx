"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/components/auth/AuthContext';
import { useClubId } from '@/hooks/useClubId';
import { useClubPermissions } from '@/hooks/useClubPermissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MitgliederPage() {
  const { user } = useAuthContext();
  const { clubId, loading: clubLoading } = useClubId();
  const { canAccessMembers, userClubRole, hasLegacyAccess } = useClubPermissions();
  
  // Berechtigungsprüfung
  if (!clubLoading && !canAccessMembers && !hasLegacyAccess) {
    return (
      <AccessDenied 
        requiredRole="Vorstand, Kassenwart, Schriftführer oder Sportleiter"
        currentRole={userClubRole || 'Keine Berechtigung'}
        message="Sie haben keine Berechtigung zur Mitgliederverwaltung."
      />
    );
  }
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userClub, setUserClub] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState([]);
  const fileInputRef = useRef(null);
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    if (user && clubId && !clubLoading) {
      loadMembers();
    }
  }, [user, clubId, clubLoading]);

  useEffect(() => {
    // URL-Parameter für Suche auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      // Scroll zum ersten Ergebnis nach kurzer Verzögerung
      setTimeout(() => {
        const firstResult = document.querySelector('tbody tr');
        if (firstResult) {
          firstResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstResult.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
          setTimeout(() => {
            firstResult.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
          }, 3000);
        }
      }, 500);
    }
  }, [members]);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  useEffect(() => {
    // Filter and sort members
    let filtered = members.filter(member => {
      const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.mitgliedsnummer && member.mitgliedsnummer.includes(searchTerm)) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.telefon && member.telefon.includes(searchTerm)) ||
        (member.strasse && member.strasse.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.ort && member.ort.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = showInactive ? member.isActive === false : member.isActive !== false;
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort filtered members
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Special handling for different field types
      if (sortField === 'alter') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (sortField === 'geburtstag' || sortField === 'vereinseintritt' || sortField === 'dsbeintritt') {
        aVal = new Date(aVal || '1900-01-01');
        bVal = new Date(bVal || '1900-01-01');
      } else if (sortField === 'isActive') {
        aVal = a.isActive ? 1 : 0;
        bVal = b.isActive ? 1 : 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredMembers(filtered);
  }, [members, searchTerm, showInactive, sortField, sortDirection]);

  const loadMembers = async () => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    
    try {
      
      // Lade Club-Daten
      const clubQuery = query(collection(db, 'clubs'), where('__name__', '==', clubId));
      const clubSnapshot = await getDocs(clubQuery);
      
      if (!clubSnapshot.empty) {
        const clubData = clubSnapshot.docs[0].data();
        setUserClub({ id: clubId, ...clubData });
      }
      
      // Lade Mitglieder aus club-spezifischer Collection
      const mitgliederCollection = `clubs/${clubId}/mitglieder`;
      const membersSnapshot = await getDocs(collection(db, mitgliederCollection));
      
      const membersList = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          alter: data.geburtstag ? 
            (() => {
              const heute = new Date();
              const geburtstag = new Date(data.geburtstag);
              let alter = heute.getFullYear() - geburtstag.getFullYear();
              const hatGeburtstagGehabt = heute.getMonth() > geburtstag.getMonth() || 
                (heute.getMonth() === geburtstag.getMonth() && heute.getDate() >= geburtstag.getDate());
              return hatGeburtstagGehabt ? alter : alter - 1;
            })() :
            new Date().getFullYear() - (data.birthYear || 0),
          // Feldname-Mapping für migrierte Daten
          firstName: data.firstName || data.vorname || data.name?.split(' ')[0] || '',
          lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
          mitgliedsnummer: data.mitgliedsnummer || '',
          strasse: data.strasse || data.adresse?.strasse || '',
          plz: data.plz || data.adresse?.plz || '',
          ort: data.ort || data.adresse?.ort || '',
          email: data.email || '',
          telefon: data.telefon || '',
          mobil: data.mobil || '',
          geburtstag: data.geburtstag || data.geburtsdatum || '',
          vereinseintritt: data.vereinseintritt || data.eintrittsdatum || '',
          dsbeintritt: data.dsbeintritt || '',
          gender: data.gender || data.geschlecht || 'male',
          geschlecht: data.geschlecht || data.gender || 'male',
          isActive: data.isActive !== false && data.status !== 'inaktiv'
        };
      });
      
      setMembers(membersList);
      
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };
  


  const handleUpdateMember = async (memberId, updates) => {
    try {
      // Echte Firebase-Update in club-spezifischer Collection
      const mitgliederCollection = `clubs/${userClub?.id}/mitglieder`;
      const memberRef = doc(db, mitgliederCollection, memberId);
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, ...updates } : m
      ));
      
      console.log('Firebase: Updated member', memberId, updates);
      
      setEditingMember(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Speichern der Änderungen');
    }
  };

  const handleExcelImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        const parsedData = lines.slice(1).map((line, index) => {
          const [vorname, nachname, mitgliedsnummer, strasse, plz, ort, email, telefon, mobil, geburtstag, geschlecht, vereinseintritt, dsbeintritt, status, iban, bic, kontoinhaber, mandatsdatum] = line.split(';');
          
          return {
            id: `import_${index}`,
            firstName: (vorname || '').trim(),
            lastName: (nachname || '').trim(),
            name: `${(vorname || '').trim()} ${(nachname || '').trim()}`,
            mitgliedsnummer: (mitgliedsnummer || '').trim(),
            strasse: (strasse || '').trim(),
            plz: (plz || '').trim(),
            ort: (ort || '').trim(),
            email: (email || '').trim(),
            telefon: (telefon || '').trim(),
            mobil: (mobil || '').trim(),
            geburtstag: (geburtstag || '').trim(),
            geburtsdatum: (geburtstag || '').trim(),
            gender: (geschlecht || '').toLowerCase().includes('w') || (geschlecht || '').toLowerCase().includes('f') ? 'female' : 'male',
            vereinseintritt: (vereinseintritt || '').trim(),
            eintrittsdatum: (vereinseintritt || '').trim(),
            dsbeintritt: (dsbeintritt || '').trim(),
            isActive: (status || '').toLowerCase() !== 'inaktiv',
            status: (status || '').toLowerCase() === 'inaktiv' ? 'inaktiv' : 'aktiv',
            // SEPA-Daten
            sepa: {
              iban: (iban || '').trim(),
              bic: (bic || '').trim(),
              kontoinhaber: (kontoinhaber || '').trim(),
              mandatsdatum: (mandatsdatum || '').trim(),
              mandatsreferenz: mitgliedsnummer ? `SGI-${mitgliedsnummer}-2025` : '',
              verwendungszweck: 'Mitgliedsbeitrag'
            },
            clubId: userClub?.id
          };
        }).filter(item => item.firstName && item.lastName);
        
        setImportData(parsedData);
        setShowImportDialog(true);
      } catch (error) {
        console.error('Fehler beim Import:', error);
        alert('Fehler beim Lesen der CSV-Datei');
      }
    };
    reader.readAsText(file);
  };

  const applyImportData = async () => {
    try {
      let updated = 0;
      let created = 0;
      
      for (const importMember of importData) {
        // Suche existierendes Mitglied nach Name oder Mitgliedsnummer
        const existingMember = members.find(m => 
          (m.firstName === importMember.firstName && m.lastName === importMember.lastName) ||
          (importMember.mitgliedsnummer && m.mitgliedsnummer === importMember.mitgliedsnummer)
        );
        
        if (existingMember) {
          // Aktualisiere nur fehlende Daten
          const updates = {};
          
          if ((!existingMember.mitgliedsnummer || existingMember.mitgliedsnummer === '') && importMember.mitgliedsnummer) updates.mitgliedsnummer = importMember.mitgliedsnummer;
          if ((!existingMember.strasse || existingMember.strasse === '') && importMember.strasse) updates.strasse = importMember.strasse;
          if ((!existingMember.plz || existingMember.plz === '') && importMember.plz) updates.plz = importMember.plz;
          if ((!existingMember.ort || existingMember.ort === '') && importMember.ort) updates.ort = importMember.ort;
          if ((!existingMember.email || existingMember.email === '') && importMember.email) updates.email = importMember.email;
          if ((!existingMember.telefon || existingMember.telefon === '') && importMember.telefon) updates.telefon = importMember.telefon;
          if ((!existingMember.mobil || existingMember.mobil === '') && importMember.mobil) updates.mobil = importMember.mobil;
          if ((!existingMember.geburtstag || existingMember.geburtstag === '') && importMember.geburtstag) {
            updates.geburtstag = importMember.geburtstag;
            updates.geburtsdatum = importMember.geburtstag;
          }
          if ((!existingMember.vereinseintritt || existingMember.vereinseintritt === '') && importMember.vereinseintritt) {
            updates.vereinseintritt = importMember.vereinseintritt;
            updates.eintrittsdatum = importMember.vereinseintritt;
          }
          if ((!existingMember.dsbeintritt || existingMember.dsbeintritt === '') && importMember.dsbeintritt) updates.dsbeintritt = importMember.dsbeintritt;
          
          // SEPA-Daten aktualisieren
          if (importMember.sepa && (importMember.sepa.iban || importMember.sepa.bic)) {
            const currentSepa = existingMember.sepa || {};
            const newSepa = { ...currentSepa };
            
            if ((!currentSepa.iban || currentSepa.iban === '') && importMember.sepa.iban) newSepa.iban = importMember.sepa.iban;
            if ((!currentSepa.bic || currentSepa.bic === '') && importMember.sepa.bic) newSepa.bic = importMember.sepa.bic;
            if ((!currentSepa.kontoinhaber || currentSepa.kontoinhaber === '') && importMember.sepa.kontoinhaber) newSepa.kontoinhaber = importMember.sepa.kontoinhaber;
            if ((!currentSepa.mandatsdatum || currentSepa.mandatsdatum === '') && importMember.sepa.mandatsdatum) newSepa.mandatsdatum = importMember.sepa.mandatsdatum;
            if ((!currentSepa.mandatsreferenz || currentSepa.mandatsreferenz === '') && importMember.sepa.mandatsreferenz) newSepa.mandatsreferenz = importMember.sepa.mandatsreferenz;
            if ((!currentSepa.verwendungszweck || currentSepa.verwendungszweck === '') && importMember.sepa.verwendungszweck) newSepa.verwendungszweck = importMember.sepa.verwendungszweck;
            
            updates.sepa = newSepa;
          }
          
          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date();
            
            const mitgliederCollection = `clubs/${userClub?.id}/mitglieder`;
            const memberRef = doc(db, mitgliederCollection, existingMember.id);
            await updateDoc(memberRef, updates);
            
            // Update local state
            setMembers(prev => prev.map(m => 
              m.id === existingMember.id ? { ...m, ...updates } : m
            ));
            
            updated++;
          }
        } else {
          // Erstelle neues Mitglied nur wenn es nicht existiert
          const newMember = {
            ...importMember,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          delete newMember.id;
          
          const mitgliederCollection = `clubs/${userClub?.id}/mitglieder`;
          const docRef = await addDoc(collection(db, mitgliederCollection), newMember);
          setMembers(prev => [...prev, { id: docRef.id, ...newMember }]);
          created++;
        }
      }
      
      setShowImportDialog(false);
      setImportData([]);
      alert(`Import abgeschlossen!\n${updated} Mitglieder aktualisiert\n${created} neue Mitglieder erstellt`);
    } catch (error) {
      console.error('Fehler beim Import:', error);
      alert('Fehler beim Importieren der Mitglieder');
    }
  };

  if (loading || clubLoading) {
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
    <div className="w-full px-4 py-8">
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

      {/* Statistiken */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{members.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {members.filter(m => m.isActive).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {members.filter(m => !m.isActive).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Inaktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {members.filter(m => m.email).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mit E-Mail</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {members.filter(m => m.mitgliedsnummer).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mit Mitgl.-Nr.</p>
          </CardContent>
        </Card>
      </div>

      {/* Suche und Aktionen */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Suchen (Name, Mitgl.-Nr., E-Mail, Adresse)..."
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
                Ausgetretene einblenden
              </label>
            </div>
            <Button onClick={() => setEditingMember('new')}>
              + Neues Mitglied
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelImport}
              accept=".csv,.txt"
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              📊 CSV Import
            </Button>
            <a href="/mitglieder-import-vorlage.csv" download>
              <Button variant="outline" size="sm">
                📄 Vorlage
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Neues Mitglied Dialog */}
      {editingMember === 'new' && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Neues Mitglied hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input placeholder="Vorname" id="new-firstName" className="bg-white" />
              <Input placeholder="Nachname" id="new-lastName" className="bg-white" />
              <Input placeholder="Mitgliedsnummer" id="new-mitgliedsnummer" className="bg-white" />
              <Input placeholder="Straße" id="new-strasse" className="bg-white" />
              <Input placeholder="PLZ" id="new-plz" className="bg-white" />
              <Input placeholder="Ort" id="new-ort" className="bg-white" />
              <Input placeholder="E-Mail" type="email" id="new-email" className="bg-white" />
              <Input placeholder="Telefon" id="new-telefon" className="bg-white" />
              <Input placeholder="Mobil" id="new-mobil" className="bg-white" />
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Geburtstag</label>
                <Input type="date" id="new-geburtstag" className="bg-white" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Geschlecht</label>
                <select id="new-gender" className="bg-white border rounded px-3 py-2">
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Vereinseintritt</label>
                <Input type="date" id="new-vereinseintritt" className="bg-white" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">DSB-Eintritt</label>
                <Input type="date" id="new-dsbeintritt" className="bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={async () => {
                try {
                  const firstName = document.getElementById('new-firstName').value;
                  const lastName = document.getElementById('new-lastName').value;
                  
                  if (!firstName || !lastName) {
                    alert('Vor- und Nachname sind erforderlich');
                    return;
                  }
                  
                  const newMember = {
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`,
                    mitgliedsnummer: document.getElementById('new-mitgliedsnummer').value || '',
                    strasse: document.getElementById('new-strasse').value || '',
                    plz: document.getElementById('new-plz').value || '',
                    ort: document.getElementById('new-ort').value || '',
                    email: document.getElementById('new-email').value || '',
                    telefon: document.getElementById('new-telefon').value || '',
                    mobil: document.getElementById('new-mobil').value || '',
                    geburtstag: document.getElementById('new-geburtstag').value || '',
                    gender: document.getElementById('new-gender').value || 'male',
                    vereinseintritt: document.getElementById('new-vereinseintritt').value || '',
                    dsbeintritt: document.getElementById('new-dsbeintritt').value || '',
                    clubId: userClub.id,
                    isActive: true,
                    birthYear: null,
                    alter: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  
                  // Verwende club-spezifische Collection
                  const mitgliederCollection = `clubs/${userClub.id}/mitglieder`;
                  const docRef = await addDoc(collection(db, mitgliederCollection), newMember);
                  setMembers(prev => [...prev, { id: docRef.id, ...newMember }]);
                  setEditingMember(null);
                  alert('Neues Mitglied erfolgreich hinzugefügt!');
                } catch (error) {
                  console.error('Fehler:', error);
                  alert('Fehler beim Hinzufügen des Mitglieds');
                }
              }}>
                ✅ Mitglied hinzufügen
              </Button>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                ❌ Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mitgliederliste */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mitgliederliste ({filteredMembers.length})</CardTitle>
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
                  <th className="text-left p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('mitgliedsnummer')}>Nr. {sortField === 'mitgliedsnummer' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-16 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('firstName')}>Vorname {sortField === 'firstName' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('lastName')}>Nachname {sortField === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-28 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('strasse')}>Adresse {sortField === 'strasse' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-24 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('ort')}>PLZ/Ort {sortField === 'ort' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('geburtstag')}>Geburtstag {sortField === 'geburtstag' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 w-12 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('alter')}>Alter {sortField === 'alter' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 w-12 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('gender')}>G {sortField === 'gender' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-28 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('email')}>E-Mail {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('telefon')}>Telefon {sortField === 'telefon' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('mobil')}>Mobil {sortField === 'mobil' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('vereinseintritt')}>Verein {sortField === 'vereinseintritt' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 w-20 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('dsbeintritt')}>DSB {sortField === 'dsbeintritt' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-center p-1 w-16 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('isActive')}>Status {sortField === 'isActive' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="text-left p-1 w-32">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id} className="border-b hover:bg-muted/20">
                    <td className="p-1 font-mono text-sm font-bold">
                      {editingMember === member.id ? (
                        <Input
                          defaultValue={member.mitgliedsnummer || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { mitgliedsnummer: e.target.value })}
                          className="w-24 text-xs"
                        />
                      ) : (
                        member.mitgliedsnummer ? `0${member.mitgliedsnummer}` : '-'
                      )}
                    </td>
                    <td className="p-1 font-medium">{member.firstName}</td>
                    <td className="p-1 font-medium">{member.lastName}</td>
                    <td className="p-1 text-sm">
                      {editingMember === member.id ? (
                        <Input
                          defaultValue={member.strasse || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { strasse: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        member.strasse || '-'
                      )}
                    </td>
                    <td className="p-1 text-sm">
                      {editingMember === member.id ? (
                        <div className="flex gap-1">
                          <Input
                            defaultValue={member.plz || ''}
                            onBlur={(e) => handleUpdateMember(member.id, { plz: e.target.value })}
                            className="w-16"
                          />
                          <Input
                            defaultValue={member.ort || ''}
                            onBlur={(e) => handleUpdateMember(member.id, { ort: e.target.value })}
                            className="w-20"
                          />
                        </div>
                      ) : (
                        <span>{member.plz} {member.ort}</span>
                      )}
                    </td>
                    <td className="p-1">
                      {editingMember === member.id ? (
                        <Input
                          type="date"
                          defaultValue={member.geburtstag || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { geburtstag: e.target.value })}
                          className="w-32 text-xs"
                        />
                      ) : (
                        <span className="text-xs">{member.geburtstag ? new Date(member.geburtstag).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</span>
                      )}
                    </td>
                    <td className="p-1 text-center font-medium">{member.alter}</td>
                    <td className="p-1 text-center">
                      {editingMember === member.id ? (
                        <select
                          defaultValue={member.gender || 'male'}
                          onBlur={(e) => handleUpdateMember(member.id, { gender: e.target.value })}
                          className="w-16 text-xs border rounded px-1 py-1"
                        >
                          <option value="male">M</option>
                          <option value="female">W</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-sm ${
                          member.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                          member.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.gender === 'male' ? 'M' : member.gender === 'female' ? 'W' : '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-1">
                      {editingMember === member.id ? (
                        <Input
                          type="email"
                          defaultValue={member.email || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { email: e.target.value })}
                          className="w-40"
                        />
                      ) : (
                        <span className="text-sm">{member.email || '-'}</span>
                      )}
                    </td>
                    <td className="p-1">
                      {editingMember === member.id ? (
                        <Input
                          type="tel"
                          defaultValue={member.telefon || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { telefon: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        <span className="text-sm">{member.telefon || '-'}</span>
                      )}
                    </td>
                    <td className="p-1">
                      {editingMember === member.id ? (
                        <Input
                          type="tel"
                          defaultValue={member.mobil || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { mobil: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        <span className="text-sm">{member.mobil || '-'}</span>
                      )}
                    </td>
                    <td className="p-1 text-center">
                      {editingMember === member.id ? (
                        <Input
                          type="date"
                          defaultValue={member.vereinseintritt || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { vereinseintritt: e.target.value })}
                          className="w-32 text-xs"
                        />
                      ) : (
                        <span className="text-xs">{member.vereinseintritt ? new Date(member.vereinseintritt).getFullYear() : '-'}</span>
                      )}
                    </td>
                    <td className="p-1 text-center">
                      {editingMember === member.id ? (
                        <Input
                          type="date"
                          defaultValue={member.dsbeintritt || ''}
                          onBlur={(e) => handleUpdateMember(member.id, { dsbeintritt: e.target.value })}
                          className="w-32 text-xs"
                        />
                      ) : (
                        <span className="text-xs">{member.dsbeintritt ? new Date(member.dsbeintritt).getFullYear() : '-'}</span>
                      )}
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                        >
                          {editingMember === member.id ? 'Fertig' : 'Bearbeiten'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (confirm(`${member.firstName} ${member.lastName} als ausgetreten markieren?`)) {
                              try {
                                const mitgliederCollection = `clubs/${userClub?.id}/mitglieder`;
                                const memberRef = doc(db, mitgliederCollection, member.id);
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
                        >
                          Austritt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (confirm(`${member.firstName} ${member.lastName} ENDGÜLTIG löschen?\n\nDies kann nicht rückgängig gemacht werden!`)) {
                              try {
                                const mitgliederCollection = `clubs/${userClub?.id}/mitglieder`;
                                const memberRef = doc(db, mitgliederCollection, member.id);
                                await deleteDoc(memberRef);
                                setMembers(prev => prev.filter(m => m.id !== member.id));
                                alert('Mitglied endgültig gelöscht');
                              } catch (error) {
                                console.error('Fehler beim Löschen:', error);
                                alert('Fehler beim Löschen des Mitglieds');
                              }
                            }
                          }}
                        >
                          Löschen
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
      
      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📊 CSV Import Vorschau</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {importData.length} Mitglieder zum Import gefunden.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                <p className="text-sm text-blue-800">
                  💡 <strong>CSV-Format:</strong> Vorname;Nachname;Mitgliedsnummer;Strasse;PLZ;Ort;Email;Telefon;Mobil;Geburtstag;Geschlecht;Vereinseintritt;DSB-Eintritt;Status;IBAN;BIC;Kontoinhaber;Mandatsdatum
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  📄 <strong>Vorlage:</strong> <a href="/mitglieder-import-vorlage.csv" download className="underline">mitglieder-import-vorlage.csv herunterladen</a>
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Vorname</th>
                    <th className="text-left p-2">Nachname</th>
                    <th className="text-left p-2">Geburtstag</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Telefon</th>
                    <th className="text-left p-2">Adresse</th>
                    <th className="text-left p-2">Geschlecht</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 10).map((member, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{member.firstName}</td>
                      <td className="p-2">{member.lastName}</td>
                      <td className="p-2">{member.geburtstag}</td>
                      <td className="p-2">{member.email}</td>
                      <td className="p-2">{member.telefon}</td>
                      <td className="p-2">{member.strasse} {member.plz} {member.ort}</td>
                      <td className="p-2">
                        <Badge variant={member.gender === 'female' ? 'secondary' : 'default'}>
                          {member.gender === 'female' ? 'W' : 'M'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {importData.length > 10 && (
                    <tr>
                      <td colSpan="7" className="p-2 text-center text-gray-500">
                        ... und {importData.length - 10} weitere
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={applyImportData}>
                {importData.length} Mitglieder importieren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
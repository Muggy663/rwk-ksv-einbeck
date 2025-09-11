"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useClubId } from '@/hooks/useClubId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UrkundenGenerator } from '@/components/urkunden/UrkundenGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

export default function JubilaeenPage() {
  const [geburtstageConfig, setGeburtstageConfig] = useState({
    karte: [18, 50],
    gutschein: [60, 70],
    ab70Intervall: 5,
    custom: [] // Benutzerdefinierte Alter
  });

  const [jubilareConfig, setJubilareConfig] = useState({
    bronze: [10],
    silber: [20], 
    gold: [40, 50, 60],
    custom: [] // Benutzerdefinierte Jahre
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newGeburtstagAlter, setNewGeburtstagAlter] = useState('');
  const [newJubilarJahre, setNewJubilarJahre] = useState('');
  const [sortField, setSortField] = useState('geburtstag');
  const [sortDirection, setSortDirection] = useState('asc');

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clubId, loading: clubLoading } = useClubId();

  useEffect(() => {
    console.log('clubId:', clubId, 'clubLoading:', clubLoading);
    if (clubId && !clubLoading) {
      loadMembers();
    }
  }, [clubId, clubLoading]);

  const loadMembers = async () => {
    if (!clubId) return;
    console.log('Loading members for clubId:', clubId);
    
    try {
      // Lade Mitglieder aus club-spezifischer Collection
      const mitgliederCollection = `clubs/${clubId}/mitglieder`;
      console.log('Loading from collection:', mitgliederCollection);
      const membersSnapshot = await getDocs(collection(db, mitgliederCollection));
        
        const membersList = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          const currentYear = new Date().getFullYear();
          
          // Berechne korrektes Alter
          let alter = 0;
          let birthYear = 0;
          
          if (data.geburtsdatum) {
            birthYear = new Date(data.geburtsdatum).getFullYear();
            alter = currentYear - birthYear;
          } else if (data.geburtstag) {
            birthYear = new Date(data.geburtstag).getFullYear();
            alter = currentYear - birthYear;
          } else if (data.birthYear) {
            birthYear = data.birthYear;
            alter = currentYear - birthYear;
          }
          
          // Berechne korrekte Vereinsjahre
          let jahreImVerein = 0;
          if (data.eintrittsdatum) {
            jahreImVerein = currentYear - new Date(data.eintrittsdatum).getFullYear();
          } else if (data.vereinseintritt) {
            jahreImVerein = currentYear - new Date(data.vereinseintritt).getFullYear();
          }
          
          return {
            id: doc.id,
            name: `${data.firstName || data.vorname || ''} ${data.lastName || data.nachname || ''}`.trim(),
            alter,
            geburtstag: data.geburtsdatum ? new Date(data.geburtsdatum).toLocaleDateString('de-DE') : 
                       data.geburtstag ? new Date(data.geburtstag).toLocaleDateString('de-DE') : 
                       birthYear ? `${birthYear}` : '-',
            birthYear,
            jahreImVerein,
            vereinseintritt: data.eintrittsdatum || data.vereinseintritt,
            dsbeintritt: data.dsbeintritt,
            gender: data.gender || data.geschlecht
          };
        });
        
        console.log('Loaded members:', membersList.length);
        setMembers(membersList);
        setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setLoading(false);
    }
  };



  const getGeburtstagAktion = (alter) => {
    if (geburtstageConfig.karte.includes(alter)) return { typ: 'Karte', farbe: 'bg-blue-100 text-blue-800' };
    if (geburtstageConfig.gutschein.includes(alter)) return { typ: 'Gutschein', farbe: 'bg-green-100 text-green-800' };
    if (alter >= 70 && (alter - 70) % geburtstageConfig.ab70Intervall === 0) return { typ: 'Gutschein', farbe: 'bg-green-100 text-green-800' };
    return null;
  };

  const getJubilarAktion = (jahre) => {
    if (jubilareConfig.bronze.includes(jahre)) return { typ: 'Bronze', farbe: 'bg-amber-100 text-amber-800' };
    if (jubilareConfig.silber.includes(jahre)) return { typ: 'Silber', farbe: 'bg-gray-100 text-gray-800' };
    if (jubilareConfig.gold.includes(jahre)) return { typ: 'Gold', farbe: 'bg-yellow-100 text-yellow-800' };
    if (jubilareConfig.custom.includes(jahre)) return { typ: 'Spezial', farbe: 'bg-purple-100 text-purple-800' };
    return null;
  };

  const getGeburtstagAktionCustom = (alter) => {
    if (geburtstageConfig.karte.includes(alter)) return { typ: 'Karte', farbe: 'bg-blue-100 text-blue-800' };
    if (geburtstageConfig.gutschein.includes(alter)) return { typ: 'Gutschein', farbe: 'bg-green-100 text-green-800' };
    if (geburtstageConfig.custom.includes(alter)) return { typ: 'Spezial', farbe: 'bg-purple-100 text-purple-800' };
    if (alter >= 70 && (alter - 70) % geburtstageConfig.ab70Intervall === 0) return { typ: 'Gutschein', farbe: 'bg-green-100 text-green-800' };
    return null;
  };

  const addCustomGeburtstag = () => {
    const alter = parseInt(newGeburtstagAlter);
    if (alter && !geburtstageConfig.custom.includes(alter)) {
      setGeburtstageConfig(prev => ({
        ...prev,
        custom: [...prev.custom, alter].sort((a, b) => a - b)
      }));
      setNewGeburtstagAlter('');
    }
  };

  const addCustomJubilar = () => {
    const jahre = parseInt(newJubilarJahre);
    if (jahre && !jubilareConfig.custom.includes(jahre)) {
      setJubilareConfig(prev => ({
        ...prev,
        custom: [...prev.custom, jahre].sort((a, b) => a - b)
      }));
      setNewJubilarJahre('');
    }
  };

  const removeCustomGeburtstag = (alter) => {
    setGeburtstageConfig(prev => ({
      ...prev,
      custom: prev.custom.filter(a => a !== alter)
    }));
  };

  const removeCustomJubilar = (jahre) => {
    setJubilareConfig(prev => ({
      ...prev,
      custom: prev.custom.filter(j => j !== jahre)
    }));
  };

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-primary">Geburtstage & Jubiläen</h1>
          <a href="/vereinssoftware">
            <Button variant="outline">
              Zurück zur Übersicht
            </Button>
          </a>
        </div>
        <p className="text-lg text-muted-foreground">
          Konfiguration für SGi Einbeck - individuell anpassbar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Geburtstage Konfiguration */}
        <Card>
          <CardHeader>
            <CardTitle>🎂 Geburtstage Konfiguration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Karte senden bei Alter:</Label>
              <div className="flex gap-2 mt-1">
                {geburtstageConfig.karte.map((alter, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={alter}
                    onChange={(e) => {
                      const newKarte = [...geburtstageConfig.karte];
                      newKarte[index] = parseInt(e.target.value);
                      setGeburtstageConfig({...geburtstageConfig, karte: newKarte});
                    }}
                    className="w-20"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label>Gutschein senden bei Alter:</Label>
              <div className="flex gap-2 mt-1">
                {geburtstageConfig.gutschein.map((alter, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={alter}
                    onChange={(e) => {
                      const newGutschein = [...geburtstageConfig.gutschein];
                      newGutschein[index] = parseInt(e.target.value);
                      setGeburtstageConfig({...geburtstageConfig, gutschein: newGutschein});
                    }}
                    className="w-20"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label>Ab 70 alle X Jahre:</Label>
              <Input
                type="number"
                value={geburtstageConfig.ab70Intervall}
                onChange={(e) => setGeburtstageConfig({...geburtstageConfig, ab70Intervall: parseInt(e.target.value)})}
                className="w-20 mt-1"
              />
            </div>
            
            <div>
              <Label>Benutzerdefinierte Alter:</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={newGeburtstagAlter}
                  onChange={(e) => setNewGeburtstagAlter(e.target.value)}
                  placeholder="Alter"
                  className="w-20"
                />
                <Button size="sm" onClick={addCustomGeburtstag}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {geburtstageConfig.custom.map(alter => (
                  <span key={alter} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm flex items-center gap-1">
                    {alter}
                    <button onClick={() => removeCustomGeburtstag(alter)} className="text-purple-600 hover:text-purple-800">×</button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jubiläre Konfiguration */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Jubiläre Konfiguration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bronze Ehrung bei Jahren:</Label>
              <div className="flex gap-2 mt-1">
                {jubilareConfig.bronze.map((jahre, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={jahre}
                    onChange={(e) => {
                      const newBronze = [...jubilareConfig.bronze];
                      newBronze[index] = parseInt(e.target.value);
                      setJubilareConfig({...jubilareConfig, bronze: newBronze});
                    }}
                    className="w-20"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label>Silber Ehrung bei Jahren:</Label>
              <div className="flex gap-2 mt-1">
                {jubilareConfig.silber.map((jahre, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={jahre}
                    onChange={(e) => {
                      const newSilber = [...jubilareConfig.silber];
                      newSilber[index] = parseInt(e.target.value);
                      setJubilareConfig({...jubilareConfig, silber: newSilber});
                    }}
                    className="w-20"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label>Gold Ehrung bei Jahren:</Label>
              <div className="flex gap-2 mt-1">
                {jubilareConfig.gold.map((jahre, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={jahre}
                    onChange={(e) => {
                      const newGold = [...jubilareConfig.gold];
                      newGold[index] = parseInt(e.target.value);
                      setJubilareConfig({...jubilareConfig, gold: newGold});
                    }}
                    className="w-20"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label>Benutzerdefinierte Jahre:</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={newJubilarJahre}
                  onChange={(e) => setNewJubilarJahre(e.target.value)}
                  placeholder="Jahre"
                  className="w-20"
                />
                <Button size="sm" onClick={addCustomJubilar}>+</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {jubilareConfig.custom.map(jahre => (
                  <span key={jahre} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm flex items-center gap-1">
                    {jahre}
                    <button onClick={() => removeCustomJubilar(jahre)} className="text-purple-600 hover:text-purple-800">×</button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{members.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mitglieder gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {members.filter(m => {
                const alterImJahr = selectedYear - (m.birthYear || 0);
                return getGeburtstagAktionCustom(alterImJahr);
              }).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Geburtstag-Aktionen {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {members.filter(m => {
                const jahreImVereinImJahr = m.vereinseintritt ? 
                  selectedYear - new Date(m.vereinseintritt).getFullYear() : 0;
                return getJubilarAktion(jahreImVereinImJahr);
              }).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Jubilar-Ehrungen {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Aktuelle Jubiläre */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🎂 Geburtstage {selectedYear}</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Jahr:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {Array.from({length: 8}, (_, i) => new Date().getFullYear() + i - 2).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('name')}>
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('geburtstag')}>
                    Geburtstag {sortField === 'geburtstag' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('alter')}>
                    Alter {sortField === 'alter' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3">Geburtstag-Aktion</th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('jahreImVerein')}>
                    Jahre im Verein {sortField === 'jahreImVerein' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3">Jubilar-Ehrung</th>
                </tr>
              </thead>
              <tbody>
                {members.filter(member => {
                  // Berechne Alter für das gewählte Jahr
                  let alterImJahr = member.birthYear ? selectedYear - member.birthYear : 0;
                  
                  // Berechne Vereinsjahre für das gewählte Jahr
                  const jahreImVereinImJahr = member.vereinseintritt ? 
                    selectedYear - new Date(member.vereinseintritt).getFullYear() : 0;
                  
                  const geburtstagAktion = getGeburtstagAktionCustom(alterImJahr);
                  const jubilarAktion = getJubilarAktion(jahreImVereinImJahr);
                  
                  // Zeige nur Mitglieder mit Geburtstag-Aktion (keine Jubilare)
                  return geburtstagAktion;
                }).sort((a, b) => {
                  let aValue, bValue;
                  
                  if (sortField === 'name') {
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                  } else if (sortField === 'geburtstag') {
                    // Parse German date format DD.MM.YYYY and sort by month and day
                    const parseGermanDate = (dateStr) => {
                      if (!dateStr || dateStr === '-') return { month: 0, day: 0 };
                      const parts = dateStr.split('.');
                      if (parts.length === 3) {
                        return { month: parseInt(parts[1]), day: parseInt(parts[0]) };
                      }
                      return { month: 0, day: 0 };
                    };
                    const aDate = parseGermanDate(a.geburtstag);
                    const bDate = parseGermanDate(b.geburtstag);
                    aValue = (aDate.month * 100) + aDate.day;
                    bValue = (bDate.month * 100) + bDate.day;
                  } else if (sortField === 'alter') {
                    // Calculate age turning in selected year
                    const getAgeInYear = (member) => {
                      if (member.geburtstag && member.geburtstag !== '' && member.geburtstag !== '-') {
                        const parts = member.geburtstag.split('.');
                        if (parts.length === 3) {
                          return selectedYear - parseInt(parts[2]);
                        }
                      }
                      return selectedYear - (member.birthYear || 0);
                    };
                    aValue = getAgeInYear(a);
                    bValue = getAgeInYear(b);
                  } else if (sortField === 'jahreImVerein') {
                    aValue = a.vereinseintritt ? selectedYear - new Date(a.vereinseintritt).getFullYear() : 0;
                    bValue = b.vereinseintritt ? selectedYear - new Date(b.vereinseintritt).getFullYear() : 0;
                  }
                  
                  if (sortDirection === 'asc') {
                    return aValue > bValue ? 1 : -1;
                  } else {
                    return aValue < bValue ? 1 : -1;
                  }
                }).map(member => {
                  // Berechne Werte für das gewählte Jahr
                  let alterImJahr = 0;
                  if (member.geburtstag && member.geburtstag !== '' && member.geburtstag !== '-') {
                    const parts = member.geburtstag.split('.');
                    if (parts.length === 3) {
                      alterImJahr = selectedYear - parseInt(parts[2]);
                    }
                  } else if (member.birthYear && !isNaN(member.birthYear)) {
                    alterImJahr = selectedYear - member.birthYear;
                  }
                  
                  const jahreImVereinImJahr = member.vereinseintritt ? 
                    selectedYear - new Date(member.vereinseintritt).getFullYear() : 0;
                  
                  const geburtstagAktion = getGeburtstagAktionCustom(alterImJahr);
                  const jubilarAktion = getJubilarAktion(jahreImVereinImJahr);
                  
                  const memberForYear = {
                    ...member,
                    alter: alterImJahr,
                    jahreImVerein: jahreImVereinImJahr
                  };
                  
                  return (
                    <tr key={member.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{memberForYear.name}</td>
                      <td className="p-3 text-center">{memberForYear.geburtstag}</td>
                      <td className="p-3 text-center">{memberForYear.alter || 0}</td>
                      <td className="p-3 text-center">
                        {geburtstagAktion ? (
                          <span className={`px-2 py-1 rounded text-sm ${geburtstagAktion.farbe}`}>
                            {geburtstagAktion.typ}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">{memberForYear.jahreImVerein || 0}</td>
                      <td className="p-3 text-center">
                        {jubilarAktion ? (
                          <span className={`px-2 py-1 rounded text-sm ${jubilarAktion.farbe}`}>
                            {jubilarAktion.typ}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Separate Jubilare Liste für Mitgliederversammlung */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🏆 Jubilare für Mitgliederversammlung {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Name</th>
                  <th className="text-center p-3">Geschlecht</th>
                  <th className="text-left p-3">Jahre im Verein</th>
                  <th className="text-left p-3">Ehrung</th>
                  <th className="text-left p-3">Eintrittsjahr</th>
                </tr>
              </thead>
              <tbody>
                {members.filter(member => {
                  const jahreImVereinImJahr = member.vereinseintritt ? 
                    selectedYear - new Date(member.vereinseintritt).getFullYear() : 0;
                  return getJubilarAktion(jahreImVereinImJahr);
                }).sort((a, b) => {
                  const jahreA = a.vereinseintritt ? selectedYear - new Date(a.vereinseintritt).getFullYear() : 0;
                  const jahreB = b.vereinseintritt ? selectedYear - new Date(b.vereinseintritt).getFullYear() : 0;
                  return jahreB - jahreA; // Absteigende Sortierung (meiste Jahre zuerst)
                }).map(member => {
                  const jahreImVereinImJahr = member.vereinseintritt ? 
                    selectedYear - new Date(member.vereinseintritt).getFullYear() : 0;
                  const jubilarAktion = getJubilarAktion(jahreImVereinImJahr);
                  const eintrittsjahr = member.vereinseintritt ? new Date(member.vereinseintritt).getFullYear() : '-';
                  
                  return (
                    <tr key={`jubilar-${member.id}`} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{member.name}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          member.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                          member.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.gender === 'male' ? 'M' : member.gender === 'female' ? 'W' : '-'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-lg">{jahreImVereinImJahr}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded font-medium ${jubilarAktion.farbe}`}>
                          {jubilarAktion.typ}
                        </span>
                      </td>
                      <td className="p-3 text-center">{eintrittsjahr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-4">
        <Button>Konfiguration speichern</Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Jubiläums-Urkunden generieren</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Jubiläums-Urkunden erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie professionelle Urkunden für alle Jubilare des ausgewählten Jahres.
              </DialogDescription>
            </DialogHeader>
            <UrkundenGenerator 
              jubilare={members.filter(member => {
                const jahreImVereinImJahr = member.vereinseintritt ? 
                  selectedYear - new Date(member.vereinseintritt).getFullYear() : 0;
                const jubilarAktion = getJubilarAktion(jahreImVereinImJahr);
                return jubilarAktion;
              }).map(member => {
                const jahreImVereinImJahr = member.vereinseintritt ? 
                  selectedYear - new Date(member.vereinseintritt).getFullYear() : 0;
                const jubilarAktion = getJubilarAktion(jahreImVereinImJahr);
                return {
                  name: member.name,
                  jahre: jahreImVereinImJahr,
                  ehrung: jubilarAktion?.typ as 'Bronze' | 'Silber' | 'Gold',
                  datum: '', // Wird im Generator manuell gesetzt
                  gender: member.gender
                };
              })}
            />
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" disabled>
          Geburtstagsbriefe generieren (kommt in späterem Update)
        </Button>
      </div>
    </div>
  );
}
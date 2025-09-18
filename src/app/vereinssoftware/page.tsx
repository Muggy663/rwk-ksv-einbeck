"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useAuthContext } from '@/components/auth/AuthContext';
import { useClubId } from '@/hooks/useClubId';
import { useClubPermissions } from '@/hooks/useClubPermissions';
import { AccessDenied } from '@/components/ui/access-denied';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getClubCollection, CLUB_COLLECTIONS } from '@/lib/utils/club-utils';

export default function VereinssoftwarePage() {
  const { user, userAppPermissions } = useAuthContext();
  const { clubId, loading: clubLoading } = useClubId();
  const { canAccessClubArea } = useClubPermissions();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState(null);
  const [sortField, setSortField] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAgeColors, setShowAgeColors] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  useEffect(() => {
    if (user && clubId && !clubLoading) {
      loadMembersFromClubCollection(clubId);
    }
  }, [user, clubId, clubLoading]);

  const loadMembersFromClubCollection = async () => {
    if (!clubId) return;
    
    try {
      // Lade Club-Daten
      const clubQuery = query(collection(db, 'clubs'), where('__name__', '==', clubId));
      const clubSnapshot = await getDocs(clubQuery);
      
      if (!clubSnapshot.empty) {
        const clubData = clubSnapshot.docs[0].data();
        setUserClub({ id: clubId, ...clubData });
      }
      
      // Lade Mitglieder aus club-spezifischer Collection
      const mitgliederCollection = getClubCollection(clubId, CLUB_COLLECTIONS.MITGLIEDER);
      const mitgliederSnapshot = await getDocs(collection(db, mitgliederCollection));
      
      const membersList = mitgliederSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          alter: data.alter || calculateAge(data.geburtsdatum),
          jahreImVerein: data.jahreImVerein || calculateYearsInClub(data.eintrittsdatum),
          firstName: data.firstName || data.vorname?.split(' ')[0] || data.name?.split(' ')[0] || '',
          lastName: data.lastName || data.nachname || (data.vorname?.includes(' ') ? data.vorname.split(' ').slice(1).join(' ') : data.name?.split(' ').slice(1).join(' ')) || '',
          isActive: data.status === 'aktiv' || data.isActive !== false,
          gender: data.geschlecht || data.gender || 'unbekannt'
        };
      });
      
      setMembers(membersList);
      
    } catch (error) {
      console.error('Fehler beim Laden der Club-Mitglieder:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (geburtsdatum) => {
    if (!geburtsdatum) return 0;
    const heute = new Date();
    const geburtstag = new Date(geburtsdatum);
    let alter = heute.getFullYear() - geburtstag.getFullYear();
    const hatGeburtstagGehabt = heute.getMonth() > geburtstag.getMonth() || 
      (heute.getMonth() === geburtstag.getMonth() && heute.getDate() >= geburtstag.getDate());
    if (!hatGeburtstagGehabt) alter--;
    return alter;
  };

  const calculateYearsInClub = (eintrittsdatum) => {
    if (!eintrittsdatum) return 0;
    const heute = new Date();
    const eintritt = new Date(eintrittsdatum);
    return heute.getFullYear() - eintritt.getFullYear();
  };

  const loadMembersBasic = async () => {
    try {
      const clubsQuery = query(collection(db, 'clubs'));
      const clubsSnapshot = await getDocs(clubsQuery);
      
      if (!clubsSnapshot.empty) {
        const firstClub = clubsSnapshot.docs[0];
        const clubData = firstClub.data();
        setUserClub({ id: firstClub.id, ...clubData });
        
        const membersQuery = query(
          collection(db, 'shooters'),
          where('clubId', '==', firstClub.id)
        );
        const membersSnapshot = await getDocs(membersQuery);
        
        const membersList = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          let alter = 0;
          if (data.geburtstag && data.geburtstag !== '') {
            const heute = new Date();
            const geburtstag = new Date(data.geburtstag);
            alter = heute.getFullYear() - geburtstag.getFullYear();
            const hatGeburtstagGehabt = heute.getMonth() > geburtstag.getMonth() || 
              (heute.getMonth() === geburtstag.getMonth() && heute.getDate() >= geburtstag.getDate());
            if (!hatGeburtstagGehabt) alter--;
          } else if (data.birthYear && !isNaN(data.birthYear)) {
            alter = new Date().getFullYear() - data.birthYear;
          }
          
          let jahreImVerein = 0;
          if (data.vereinseintritt && data.vereinseintritt !== '') {
            if (typeof data.vereinseintritt === 'string' && data.vereinseintritt.includes('-')) {
              jahreImVerein = new Date().getFullYear() - new Date(data.vereinseintritt).getFullYear();
            } else {
              jahreImVerein = new Date().getFullYear() - parseInt(data.vereinseintritt);
            }
          }
          
          return {
            id: doc.id,
            ...data,
            alter,
            jahreImVerein
          };
        });
        
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Basis-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMemberList = () => {
    setShowMemberList(!showMemberList);
    if (!showMemberList && !membersLoaded) {
      setMembersLoaded(true);
    }
  };


  

  
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };
  
  const sortedMembers = [...members].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Spezielle Behandlung für verschiedene Felder
    if (sortField === 'mitgliedsnummer') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else if (sortField === 'firstName' || sortField === 'lastName') {
      aValue = aValue?.toLowerCase() || '';
      bValue = bValue?.toLowerCase() || '';
    } else if (sortField === 'eintrittsdatum') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const { hasVereinssoftwareLicense } = useClubPermissions();
  
  if (!canAccessClubArea()) {
    if (!hasVereinssoftwareLicense) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Vereinssoftware</h2>
            <p className="text-gray-600 mb-6">
              Die Vereinssoftware ist ein <strong>kostenpflichtiges Zusatzmodul</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Funktionen:</h3>
              <ul className="text-sm text-blue-700 text-left space-y-1">
                <li>• Vollständige Mitgliederverwaltung</li>
                <li>• SEPA-Beitragsverwaltung</li>
                <li>• Geburtstage & Jubiläen</li>
                <li>• Lizenzen & Ausbildungen</li>
                <li>• Aufgaben-Management</li>
                <li>• Vereinsrecht & Protokolle</li>
              </ul>
            </div>
            <div className="space-y-3">
              <a href="/license-request">
                <button className="w-full bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 mb-2">
                  🚀 Testlizenz beantragen (3 Monate kostenlos)
                </button>
              </a>
              <a href="/license-request">
                <button className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mb-2">
                  💰 Vollversion anfragen
                </button>
              </a>
              <p className="text-xs text-gray-500 text-center">
                Kontakt: <strong>rwk-leiter-ksve@gmx.de</strong>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return <AccessDenied requiredRoles={['SPORTLEITER', 'VORSTAND', 'KASSENWART', 'SCHRIFTFUEHRER']} />;
  }

  if (loading || clubLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Vereinsdaten...</p>
          </div>
        </div>
      </div>
    );
  }

  // Kein Zugang verfügbar
  if (!clubId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Kein Zugang</h2>
          <p className="text-gray-600 mb-6">
            Sie haben derzeit keinen Zugang zur Vereinssoftware.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Mögliche Lösungen:</h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Support-Code vom Verein anfordern</li>
              <li>• Vereinsrolle vom Vorstand zuweisen lassen</li>
              <li>• Kontakt mit dem Support aufnehmen</li>
            </ul>
          </div>
          <div className="space-y-3">
            <a href="/admin/support-access">
              <button className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mb-2">
                🔑 Support-Code eingeben
              </button>
            </a>
            <a href="/dashboard-auswahl">
              <button className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                ← Zurück zum Dashboard
              </button>
            </a>
            <p className="text-xs text-gray-500 text-center">
              Support: <strong>rwk-leiter-ksve@gmx.de</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BackButton className="mr-2" fallbackHref="/dashboard-auswahl" />
          <h1 className="text-4xl font-bold text-primary">Vereinssoftware</h1>
        </div>
        <div className="text-muted-foreground">
          <p className="text-lg mb-2">
            {userClub ? `Vereinsverwaltung für ${userClub.name}` : 'Vollständige Vereinsverwaltung für moderne Schützenvereine'}
          </p>
          <div className="text-sm space-y-1">
            <p>• <strong>Mitgliederverwaltung:</strong> Vollständige Stammdaten, Import/Export, Statistiken</p>
            <p>• <strong>Beitragsverwaltung:</strong> SEPA-Lastschrift, Mahnwesen, Zahlungsabgleich</p>
            <p>• <strong>Aufgaben-Management:</strong> Vorstand-Dashboard, To-Do-Listen, Terminüberwachung</p>
          </div>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{members.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mitglieder gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{members.filter(m => m.isActive).length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Mitglieder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(members.reduce((sum, m) => sum + m.alter, 0) / members.length) || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Durchschnittsalter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold">
              <span className="text-blue-600">{members.filter(m => m.gender === 'male').length}M</span>
              <span className="mx-1">/</span>
              <span className="text-pink-600">{members.filter(m => m.gender === 'female').length}W</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Männer/Frauen</p>
          </CardContent>
        </Card>

      </div>

      {/* Info-Box über Rollen-System */}
      <Card className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 text-lg">🎯</div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Rollen-basierte Bereiche:</p>
              <p className="text-blue-800 dark:text-blue-300">
                Sie sehen nur die Bereiche, für die Sie berechtigt sind. Ihre aktuelle Rolle: 
                <strong>{Object.values(userAppPermissions?.clubRoles || {}).join(', ') || 'Keine Rolle'}</strong>. 
                Kontaktieren Sie den Vorstand für weitere Berechtigungen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation - Rollen-spezifisch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Mitgliederverwaltung - Alle Rollen */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">👥 Mitgliederverwaltung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {(userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) || 
               (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('KASSENWART')) 
                ? 'Vollständige Mitgliederdaten verwalten' 
                : 'Mitgliederdaten einsehen'}
            </p>
            <a href="/vereinssoftware/mitglieder">
              <Button className="w-full">
                Zu den Mitgliedern
              </Button>
            </a>
          </CardContent>
        </Card>
        
        {/* Beitragsverwaltung - Nur Vorstand & Kassenwart */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) || 
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('KASSENWART')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">💰 Beitragsverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                SEPA-Lastschrift, Beiträge und Mahnwesen
              </p>
              <a href="/vereinssoftware/beitraege">
                <Button className="w-full">
                  Beiträge verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Geburtstage & Jubiläen - Vorstand, Kassenwart, Schriftführer */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) || 
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('KASSENWART')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('SCHRIFTFUEHRER')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">🎂 Geburtstage & Jubiläen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Geburtstage und Vereinsjubiläen verwalten
              </p>
              <a href="/vereinssoftware/jubilaeen">
                <Button className="w-full">
                  Jubiläen verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Lizenzen & Ausbildung - Vorstand, Sportleiter */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) || 
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('SPORTLEITER')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">🏆 Lizenzen & Ausbildung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Lizenzen, Ausbildungen und Ablaufdaten
              </p>
              <a href="/vereinssoftware/lizenzen">
                <Button className="w-full">
                  Lizenzen verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Aufgaben-Management - Nur Vorstand */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">📋 Aufgaben-Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                To-Do-Listen und Aufgaben für den Vorstand
              </p>
              <a href="/vereinssoftware/aufgaben">
                <Button className="w-full">
                  Aufgaben verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Vereinsrecht - Vorstand & Schriftführer */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) || 
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('SCHRIFTFUEHRER')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">⚖️ Vereinsrecht</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Protokolle, Wahlen, Satzung und Gemeinnützigkeit
              </p>
              <a href="/vereinsrecht">
                <Button className="w-full">
                  Vereinsrecht verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Phase 2 Bereiche */}
        
        {/* Jugendbereich - Jugendwart */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('JUGENDWART')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow border-orange-200">
            <CardHeader>
              <CardTitle className="text-xl">🧒 Jugendbereich</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Jugend-Mitglieder, Ausbildungen und Nachwuchsförderung
              </p>
              <a href="/vereinssoftware/jugend">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Jugendbereich verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Damenbereich - Damenwart */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('DAMENWART')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow border-pink-200">
            <CardHeader>
              <CardTitle className="text-xl">👩 Damenbereich</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Damen-Events, Termine und spezielle Aktivitäten
              </p>
              <a href="/vereinssoftware/damen">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  Damenbereich verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Inventar & Waffen - Zeugwart */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('ZEUGWART')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow border-gray-300">
            <CardHeader>
              <CardTitle className="text-xl">🔧 Inventar & Waffen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Waffen, Ausrüstung, Inventar und Wartungspläne
              </p>
              <a href="/vereinssoftware/inventar">
                <Button className="w-full bg-gray-600 hover:bg-gray-700">
                  Inventar verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Öffentlichkeitsarbeit - Pressewart */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('PRESSEWART')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl">📰 Öffentlichkeitsarbeit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                News, Berichte, Fotos und Pressearbeit
              </p>
              <a href="/vereinssoftware/presse">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Pressebereich verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Training & Ausbildung - Trainer & Ausbilder */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('TRAINER')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('AUSBILDER')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader>
              <CardTitle className="text-xl">🏃 Training & Ausbildung</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Trainingspläne, Schulungen und Prüfungswesen
              </p>
              <a href="/vereinssoftware/training">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Training verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        
        {/* Vereinsgeschichte - Ehrenmitglied */}
        {((userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('EHRENMITGLIED')) ||
          (userAppPermissions?.clubRoles && Object.values(userAppPermissions.clubRoles).includes('VORSTAND')) ||
          user?.email === 'admin@rwk-einbeck.de') && (
          <Card className="hover:shadow-lg transition-shadow border-yellow-200">
            <CardHeader>
              <CardTitle className="text-xl">🏅 Vereinsgeschichte</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Chronik, Ehrungen und historische Daten
              </p>
              <a href="/vereinssoftware/geschichte">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Geschichte verwalten
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
        

      </div>

      {/* Mitgliederliste */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button 
              onClick={handleToggleMemberList}
              className="flex items-center gap-2 text-left hover:text-primary transition-colors"
            >
              <span className="text-lg">{showMemberList ? '▼' : '▶'}</span>
              <CardTitle>Mitgliederliste ({members.length})</CardTitle>
            </button>
            {showMemberList && (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showAgeColors}
                    onChange={(e) => setShowAgeColors(e.target.checked)}
                    className="rounded"
                  />
                  Altersgruppen farblich
                </label>
                <div className="text-xs text-muted-foreground bg-yellow-50 px-2 py-1 rounded">
                  📊 Vereinssoftware-Datenbank (getrennt von RWK/KM)
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        {showMemberList && (
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('mitgliedsnummer')}>
                    Mitgl.-Nr. {sortField === 'mitgliedsnummer' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('firstName')}>
                    Vorname {sortField === 'firstName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('lastName')}>
                    Nachname {sortField === 'lastName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('birthYear')}>
                    Geburtsjahr {sortField === 'birthYear' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('alter')}>
                    Alter {new Date().getFullYear()} {sortField === 'alter' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('eintrittsdatum')}>
                    Eintritt {sortField === 'eintrittsdatum' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('jahreImVerein')}>
                    Jahre im Verein {sortField === 'jahreImVerein' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3 cursor-pointer hover:bg-muted/70" onClick={() => handleSort('isActive')}>
                    Status {sortField === 'isActive' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map(member => {
                  let rowClass = "border-b hover:bg-muted/20";
                  
                  if (showAgeColors) {
                    if (member.alter < 21) {
                      rowClass += " bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30";
                    } else if (member.gender === 'male') {
                      rowClass += " bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30";
                    } else if (member.gender === 'female') {
                      rowClass += " bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/20 dark:hover:bg-pink-900/30";
                    }
                  }
                  
                  return (
                  <tr key={member.id} className={rowClass}>
                    <td className="p-3 font-mono text-sm font-bold">
                      {member.mitgliedsnummer ? `0${member.mitgliedsnummer}` : '-'}
                    </td>
                    <td className="p-3 font-medium">{member.firstName}</td>
                    <td className="p-3 font-medium">{member.lastName}</td>
                    <td className="p-3 text-center">
                      {member.geburtsdatum ? new Date(member.geburtsdatum).getFullYear() : 
                       member.geburtstag ? new Date(member.geburtstag).getFullYear() : 
                       member.birthYear ? member.birthYear : '-'}
                    </td>
                    <td className="p-3 text-center font-medium">
                      {member.geburtsdatum ? calculateAge(member.geburtsdatum) : 
                       member.geburtstag ? calculateAge(member.geburtstag) : 
                       member.birthYear ? new Date().getFullYear() - member.birthYear : '-'}
                    </td>
                    <td className="p-3 text-center font-medium">
                      {member.eintrittsdatum ? new Date(member.eintrittsdatum).getFullYear() : 
                       member.vereinseintritt ? 
                        (typeof member.vereinseintritt === 'string' && member.vereinseintritt.includes('-') ? 
                          new Date(member.vereinseintritt).getFullYear() : 
                          member.vereinseintritt
                        ) : '-'
                      }
                    </td>
                    <td className="p-3 text-center font-medium">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {member.eintrittsdatum ? calculateYearsInClub(member.eintrittsdatum) : 
                         member.vereinseintritt ? calculateYearsInClub(member.vereinseintritt) : 0} Jahre
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
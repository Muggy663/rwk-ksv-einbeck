"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function GlobalSearch() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (searchTerm.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm, user]);

  const performSearch = async () => {
    setIsSearching(true);
    const results = [];

    try {
      // Suche in Mitgliedern
      const membersQuery = query(collection(db, 'shooters'));
      const membersSnapshot = await getDocs(membersQuery);
      
      membersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const searchText = `${data.firstName} ${data.lastName} ${data.email} ${data.mitgliedsnummer} ${data.telefon} ${data.strasse} ${data.ort}`.toLowerCase();
        
        if (searchText.includes(searchTerm.toLowerCase())) {
          results.push({
            id: doc.id,
            type: 'member',
            title: `${data.firstName} ${data.lastName}`,
            subtitle: `Mitgl.-Nr. ${data.mitgliedsnummer || '-'} | ${data.email || data.telefon || 'Keine Kontaktdaten'}`,
            link: `/vereinssoftware/mitglieder?search=${encodeURIComponent(data.firstName + ' ' + data.lastName)}`,
            icon: '👤',
            highlight: true
          });
        }
      });

      // Erweiterte Suche in Tabellen-Inhalten
      const tableSearches = [
        // Beitrags-spezifische Suchen
        {
          keywords: ['sepa', 'lastschrift', 'beitrag', 'zahlung', 'offen', 'bezahlt'],
          type: 'finance',
          title: 'SEPA-Lastschrift Verwaltung',
          subtitle: 'Beitragsverwaltung | SEPA-Mandate und Zahlungen',
          link: '/vereinssoftware/beitraege?tab=sepa',
          icon: '💳'
        },
        {
          keywords: ['mahnung', 'überfällig', 'säumig'],
          type: 'finance',
          title: 'Mahnwesen',
          subtitle: 'Beitragsverwaltung | Mahnungen und überfällige Beiträge',
          link: '/vereinssoftware/beitraege?filter=offen',
          icon: '📧'
        },
        // Aufgaben-spezifische Suchen
        {
          keywords: ['aufgabe', 'todo', 'task', 'vorstand', 'kassenwart', 'überfällig'],
          type: 'task',
          title: 'Aufgaben-Management',
          subtitle: 'Vorstand-Dashboard | To-Do-Listen und Termine',
          link: '/vereinssoftware/aufgaben',
          icon: '📋'
        },
        {
          keywords: ['jahreshauptversammlung', 'jhv', 'versammlung'],
          type: 'task',
          title: 'Jahreshauptversammlung vorbereiten',
          subtitle: 'Aufgabe | Fällig: 15.03.2025 | Vorstand',
          link: '/vereinssoftware/aufgaben?filter=hoch',
          icon: '🏛️'
        },
        // Lizenzen-spezifische Suchen
        {
          keywords: ['lizenz', 'ausbildung', 'schein', 'ablauf', 'gültig'],
          type: 'license',
          title: 'Lizenzen & Ausbildungen',
          subtitle: 'Schießsport-Lizenzen | Ablaufdaten überwachen',
          link: '/vereinssoftware/lizenzen',
          icon: '🏆'
        },
        {
          keywords: ['vorstand', 'position', 'amt', 'funktion'],
          type: 'license',
          title: 'Vorstandsposten',
          subtitle: 'Lizenzen-Verwaltung | Vereinsfunktionen und Ämter',
          link: '/vereinssoftware/lizenzen?tab=vorstand',
          icon: '👔'
        },
        // Jubiläen-spezifische Suchen
        {
          keywords: ['jubiläum', 'geburtstag', 'ehrung', 'urkunde'],
          type: 'jubilee',
          title: 'Jubiläen & Ehrungen',
          subtitle: 'Geburtstage und Vereinsjubiläen verwalten',
          link: '/vereinssoftware/jubilaeen',
          icon: '🎂'
        },
        // Mitglieder-spezifische Suchen
        {
          keywords: ['mitglied', 'member', 'aktiv', 'inaktiv', 'austritt'],
          type: 'member_mgmt',
          title: 'Mitgliederverwaltung',
          subtitle: 'Vollständige Mitgliederdaten verwalten',
          link: '/vereinssoftware/mitglieder',
          icon: '👥'
        },
        {
          keywords: ['import', 'export', 'csv', 'excel'],
          type: 'member_mgmt',
          title: 'Mitglieder Import/Export',
          subtitle: 'CSV-Import und Excel-Export für Mitgliederdaten',
          link: '/vereinssoftware/mitglieder?tab=berichte',
          icon: '📊'
        }
      ];

      // Suche in Tabellen-Keywords
      tableSearches.forEach(search => {
        const matches = search.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
          searchTerm.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (matches) {
          results.push({
            type: search.type,
            title: search.title,
            subtitle: search.subtitle,
            link: search.link,
            icon: search.icon,
            highlight: false
          });
        }
      });

      // Spezielle Suchbegriffe
      const specialSearches = {
        'dashboard': {
          title: 'Vereinssoftware Dashboard',
          subtitle: 'Hauptübersicht | Alle Bereiche der Vereinsverwaltung',
          link: '/vereinssoftware',
          icon: '🏠'
        },
        'statistik': {
          title: 'Mitglieder-Statistiken',
          subtitle: 'Dashboard | Grafiken, Trends und Auswertungen',
          link: '/vereinssoftware/mitglieder?tab=dashboard',
          icon: '📈'
        },
        'backup': {
          title: 'Daten-Export',
          subtitle: 'Berichte | Jahresberichte und Backup-Funktionen',
          link: '/vereinssoftware/mitglieder?tab=berichte',
          icon: '💾'
        }
      };

      Object.entries(specialSearches).forEach(([keyword, data]) => {
        if (searchTerm.toLowerCase().includes(keyword)) {
          results.push({
            type: 'special',
            title: data.title,
            subtitle: data.subtitle,
            link: data.link,
            icon: data.icon,
            highlight: false
          });
        }
      });

    } catch (error) {
      console.error('Suchfehler:', error);
    }

    setSearchResults(results.slice(0, 10)); // Max 10 Ergebnisse
    setShowResults(true);
    setIsSearching(false);
  };
  
  // Wenn nicht eingeloggt, zeige vereinfachte Suche nur für Tabellen
  if (!user) {
    return (
      <div className="relative">
        <Input
          type="text"
          placeholder="🔍 Suche in RWK-Tabellen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 text-base min-w-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm.trim()) {
              window.location.href = `/rwk-tabellen?search=${encodeURIComponent(searchTerm.trim())}`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="🔍 Globale Suche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 h-10 text-base min-w-0"
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        {searchTerm && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setShowResults(false);
            }}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Suchergebnisse */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-xl">
          <CardContent className="p-3">
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <a
                  key={index}
                  href={result.link}
                  className={`block p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                    result.highlight ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setShowResults(false)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{result.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-base">{result.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.subtitle}</div>
                    </div>
                    <Badge variant={result.highlight ? 'default' : 'outline'} className="text-sm px-2 py-1">
                      {result.type === 'member' ? 'Mitglied' :
                       result.type === 'task' ? 'Aufgabe' :
                       result.type === 'finance' ? 'Finanzen' :
                       result.type === 'license' ? 'Lizenzen' :
                       result.type === 'jubilee' ? 'Jubiläen' :
                       result.type === 'member_mgmt' ? 'Verwaltung' :
                       result.type === 'special' ? 'System' : 'Bereich'}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
            
            {searchResults.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Keine Ergebnisse für "{searchTerm}" gefunden
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay zum Schließen */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        ></div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Info, Lock, Calendar, Filter, LogIn } from 'lucide-react';
import { LigaGrouping } from './LigaGrouping';
import { SearchBar } from './SearchBar';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import Link from 'next/link';
import { DocumentCard } from './DocumentCard';
import { Document } from '@/lib/services/document-service';
import { useAuth } from '@/hooks/use-auth';

export default function DokumentePage() {
  const [activeTab, setActiveTab] = useState<string>('ausschreibungen');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Jahre für den Filter (aktuelles Jahr und 2 Jahre zurück)
  const years = [
    new Date().getFullYear().toString(),
    (new Date().getFullYear() - 1).toString(),
    (new Date().getFullYear() - 2).toString()
  ];

  // Auth-Kontext verwenden
  const { user, userAppPermissions } = useAuth();
  
  // Prüfen, ob der Benutzer Vereinsvertreter, Mannschaftsführer oder Admin ist
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Prüfen, ob der Benutzer ein Admin ist
  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  // Benutzerrolle prüfen
  useEffect(() => {
    // Prüfen, ob der Benutzer eingeloggt ist
    if (user) {
      // Admin-Prüfung
      if (isAdmin) {
        setIsAuthorized(true);
        return;
      }
      
      // Prüfen, ob der Benutzer Vereinsvertreter oder Mannschaftsführer ist
      if (userAppPermissions && 
          (userAppPermissions.role === 'vereinsvertreter' || 
           userAppPermissions.role === 'mannschaftsfuehrer')) {
        setIsAuthorized(true);
        return;
      }
    }
    
    // Standardmäßig nicht autorisiert
    setIsAuthorized(false);
  }, [user, userAppPermissions, isAdmin]);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        setError(null);
        
        // Versuche zuerst, Dokumente von der MongoDB-API zu laden
        try {
          const apiResponse = await fetch('/api/documents');
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            if (apiData.documents && apiData.documents.length > 0) {
              console.log('Dokumente aus MongoDB geladen:', apiData.documents.length);
              
              // Filtere Dokumente basierend auf Benutzerrolle
              const filteredDocs = apiData.documents.filter((doc: Document) => {
                // Aktive Dokumente
                if (!doc.active) return false;
                
                // Wenn eingeschränkt und Benutzer nicht autorisiert ist, nicht anzeigen
                if (doc.restricted && !isAuthorized) return false;
                
                return true;
              });
              
              setDocuments(filteredDocs);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Fehler beim Laden der Dokumente aus MongoDB, fallback zu JSON:', apiErr);
        }
        
        // Fallback: Lade Dokumente aus der JSON-Datei
        const jsonResponse = await fetch('/data/documents.json');
        if (!jsonResponse.ok) {
          throw new Error('Fehler beim Laden der Dokumente');
        }
        const jsonData = await jsonResponse.json();
        console.log('Dokumente aus JSON geladen:', jsonData.documents.length);
        
        // Filtere Dokumente basierend auf Benutzerrolle
        const filteredDocs = jsonData.documents.filter((doc: Document) => {
          // Aktive Dokumente
          if (!doc.active) return false;
          
          // Wenn eingeschränkt und Benutzer nicht autorisiert ist, nicht anzeigen
          if (doc.restricted && !isAuthorized) return false;
          
          return true;
        });
        
        setDocuments(filteredDocs);
      } catch (err) {
        console.error('Fehler beim Laden der Dokumente:', err);
        setError('Die Dokumente konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [isAuthorized]);

  // Filtere Dokumente basierend auf der Suchanfrage
  const filterBySearch = (docs: Document[]) => {
    if (!searchQuery) return docs;
    
    const query = searchQuery.toLowerCase();
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      doc.description.toLowerCase().includes(query)
    );
  };

  const ausschreibungen = filterBySearch(documents.filter(doc => doc.category === 'ausschreibung'));
  const formulare = filterBySearch(documents.filter(doc => doc.category === 'formular'));
  const ordnungen = filterBySearch(documents.filter(doc => doc.category === 'ordnung'));
  const ligalisten = documents.filter(doc => doc.category === 'ligaliste');
  
  // Gefilterte Ligalisten basierend auf Jahr und Suchanfrage
  const filteredLigalisten = filterBySearch(ligalisten.filter(doc => 
    doc.title.includes(selectedYear) || 
    doc.description.includes(selectedYear) ||
    // Wenn kein Jahr im Titel oder in der Beschreibung gefunden wird, zeige es trotzdem an
    (!doc.title.match(/\b20\d{2}\b/) && !doc.description.match(/\b20\d{2}\b/))
  ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Dokumente & Ausschreibungen</h1>
          <p className="text-sm md:text-base text-muted-foreground">Offizielle Dokumente und Formulare des KSV Einbeck</p>
        </div>
        <SearchBar 
          onSearch={(query) => setSearchQuery(query)} 
          placeholder="Dokumente durchsuchen..." 
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Dokumente werden geladen...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="ausschreibungen" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
            <TabsTrigger value="ausschreibungen">Ausschreibungen</TabsTrigger>
            <TabsTrigger value="formulare">Formulare</TabsTrigger>
            <TabsTrigger value="ligalisten">Ligalisten</TabsTrigger>
            <TabsTrigger value="ordnungen">Regelwerke & Hilfen</TabsTrigger>
          </TabsList>

          <TabsContent value="ausschreibungen" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Aktuelle Ausschreibungen</h2>
            {ausschreibungen.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Keine aktuellen Ausschreibungen verfügbar.
                </CardContent>
              </Card>
            ) : (
              ausschreibungen.map(doc => (
                <DocumentCard key={doc.id} document={doc} />
              ))
            )}
          </TabsContent>

          <TabsContent value="formulare" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Formulare</h2>
            {formulare.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Keine Formulare verfügbar.
                </CardContent>
              </Card>
            ) : (
              formulare.map(doc => (
                <DocumentCard key={doc.id} document={doc} />
              ))
            )}
          </TabsContent>

          <TabsContent value="ligalisten" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-xl">Ligalisten & Handtabellen</CardTitle>
                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-[120px] h-8 text-sm">
                        <SelectValue placeholder="Jahr wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">Jahr filtern</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ligalisten.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Keine Ligalisten oder Handtabellen verfügbar.
                  </div>
                ) : filteredLigalisten.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Keine Ligalisten oder Handtabellen für {selectedYear} verfügbar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start">
                      <Filter className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800">
                          Zeige Ligalisten & Handtabellen für <span className="font-medium">{selectedYear}</span>
                        </p>
                      </div>
                    </div>
                    
                    <LigaGrouping documents={filteredLigalisten} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ordnungen" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Regelwerke & Hilfen</h2>
            {ordnungen.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Keine Ordnungen verfügbar.
                </CardContent>
              </Card>
            ) : (
              ordnungen.map(doc => (
                <DocumentCard key={doc.id} document={doc} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Info className="h-5 w-5 mr-2" />
            Hinweis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Alle offiziellen Dokumente werden hier zentral bereitgestellt. Bei Fragen zu den Dokumenten wenden Sie sich bitte an den Rundenwettkampfleiter oder nutzen Sie das <Link href="/support" className="text-primary hover:underline">Support-Formular</Link>.
          </p>
          
          {!user && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
              <LogIn className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Eingeschränkte Dokumente</p>
                <p className="text-sm text-blue-700">
                  Einige Dokumente sind nur für angemeldete Vereinsvertreter und Mannschaftsführer sichtbar. 
                  <Link href="/login" className="ml-1 text-primary hover:underline">Jetzt anmelden</Link>
                </p>
              </div>
            </div>
          )}
          
          {isAuthorized && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <Lock className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Vereinsvertreter/Mannschaftsführer-Zugang</p>
                <p className="text-sm text-amber-700">
                  Sie sehen zusätzliche Dokumente, die nur für Vereinsvertreter und Mannschaftsführer sichtbar sind.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
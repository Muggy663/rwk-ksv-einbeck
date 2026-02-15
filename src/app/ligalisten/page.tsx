"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Calendar, Filter } from 'lucide-react';
import { LigaGrouping } from '../dokumente/LigaGrouping';
import { NativeSelect } from '@/components/ui/native-select';
import Link from 'next/link';
import { Document } from '@/lib/services/document-service';
import { useAuth } from '@/hooks/use-auth';
import { BackButton } from '@/components/ui/back-button';
import { logError } from '@/lib/utils/secure-logger';

export default function LigalistenPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  const years = [
    new Date().getFullYear().toString(),
    (new Date().getFullYear() - 1).toString(),
    (new Date().getFullYear() - 2).toString()
  ];

  const { user, userAppPermissions } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  useEffect(() => {
    if (user) {
      if (isAdmin || userAppPermissions?.role === 'vereinsvertreter' || userAppPermissions?.role === 'mannschaftsfuehrer') {
        setIsAuthorized(true);
        return;
      }
    }
    setIsAuthorized(false);
  }, [user, userAppPermissions, isAdmin]);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        
        try {
          const apiResponse = await fetch('/api/documents');
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            if (apiData.documents && apiData.documents.length > 0) {
              const filteredDocs = apiData.documents.filter((doc: Document) => {
                if (!doc.active) return false;
                if (doc.restricted && !isAuthorized) return false;
                if (doc.category !== 'ligaliste') return false;
                return true;
              });
              setDocuments(filteredDocs);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          logError('Fehler beim Laden der Dokumente aus MongoDB:', apiErr);
        }
        
        const jsonResponse = await fetch('/data/documents.json');
        if (!jsonResponse.ok) {
          throw new Error('Fehler beim Laden der Dokumente');
        }
        const jsonData = await jsonResponse.json();
        
        const filteredDocs = jsonData.documents.filter((doc: Document) => {
          if (!doc.active) return false;
          if (doc.restricted && !isAuthorized) return false;
          if (doc.category !== 'ligaliste') return false;
          return true;
        });
        
        setDocuments(filteredDocs);
      } catch (err) {
        logError('Fehler beim Laden der Dokumente:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [isAuthorized]);

  const filteredLigalisten = documents.filter(doc => 
    doc.title.includes(selectedYear) || 
    doc.description.includes(selectedYear) ||
    (!doc.title.match(/\b20\d{2}\b/) && !doc.description.match(/\b20\d{2}\b/))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <BackButton className="mr-2" fallbackHref="/" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Ligalisten & Handtabellen</h1>
          <p className="text-muted-foreground">Übersichten und Meldebögen für alle Ligen</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Dokumente werden geladen...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-6">
              <CardTitle className="text-xl">Ligalisten & Handtabellen</CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Durchgangs-Meldebögen</h3>
                        <p className="text-sm text-muted-foreground mb-4">Erstellen Sie Handzettel für einzelne Durchgänge</p>
                        <Link href="/handzettel-generator">
                          <Button className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            Handzettel erstellen
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <BarChart3 className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Gesamtergebnislisten</h3>
                        <p className="text-sm text-muted-foreground mb-4">Übersichten für alle 5 Durchgänge</p>
                        <Link href="/gesamtergebnisliste-generator">
                          <Button className="w-full">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Gesamtergebnisliste erstellen
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <NativeSelect
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  placeholder="Jahr wählen"
                  options={years.map(year => ({ value: year, label: year }))}
                  className="w-[140px] h-10 text-base"
                />
                <span className="text-xs text-muted-foreground">Jahr für hochgeladene Dokumente filtern</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Keine Ligalisten oder Handtabellen verfügbar.
              </div>
            ) : filteredLigalisten.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Keine Ligalisten oder Handtabellen für {selectedYear} verfügbar.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-start">
                  <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Zeige Ligalisten & Handtabellen für <span className="font-medium">{selectedYear}</span>
                    </p>
                  </div>
                </div>
                
                <LigaGrouping documents={filteredLigalisten} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

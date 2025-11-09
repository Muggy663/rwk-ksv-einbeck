"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, Plus, Search, Trash2, Calendar, Target as TargetIcon, Trophy, BarChart3, Eye } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag, DISZIPLINEN } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function EinträgePage() {
  const { toast } = useToast();
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [filteredEinträge, setFilteredEinträge] = useState<SchießEintrag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTyp, setFilterTyp] = useState<string>("alle");
  const [filterDisziplin, setFilterDisziplin] = useState<string>("alle");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEintrag, setSelectedEintrag] = useState<SchießEintrag | null>(null);

  useEffect(() => {
    loadEinträge();
  }, []);

  useEffect(() => {
    filterEinträge();
  }, [einträge, searchTerm, filterTyp, filterDisziplin]);

  const loadEinträge = () => {
    setIsLoading(true);
    try {
      const data = SchießnachweisService.getEinträge();
      // Sortiere nach Datum (neueste zuerst)
      const sortedData = data.sort((a, b) => b.datum.getTime() - a.datum.getTime());
      setEinträge(sortedData);
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
      toast({
        title: "Fehler",
        description: "Einträge konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEinträge = () => {
    let filtered = [...einträge];

    // Text-Suche
    if (searchTerm) {
      filtered = filtered.filter(eintrag => 
        eintrag.disziplin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eintrag.standort.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eintrag.notizen && eintrag.notizen.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Typ-Filter
    if (filterTyp !== "alle") {
      filtered = filtered.filter(eintrag => eintrag.typ === filterTyp);
    }

    // Disziplin-Filter
    if (filterDisziplin !== "alle") {
      filtered = filtered.filter(eintrag => eintrag.disziplin === filterDisziplin);
    }

    setFilteredEinträge(filtered);
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      try {
        SchießnachweisService.deleteEintrag(id);
        loadEinträge();
        toast({
          title: "Gelöscht",
          description: "Eintrag wurde erfolgreich gelöscht.",
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Eintrag konnte nicht gelöscht werden.",
          variant: "destructive"
        });
      }
    }
  };

  const getTypBadge = (typ: string) => {
    return typ === 'training' ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <TargetIcon className="h-3 w-3" />
        Training
      </Badge>
    ) : (
      <Badge variant="default" className="flex items-center gap-1">
        <Trophy className="h-3 w-3" />
        Wettkampf
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Alle Einträge</h1>
            <p className="text-muted-foreground">
              {filteredEinträge.length} von {einträge.length} Einträgen
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/schiessnachweis/statistiken">
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistiken
              </Link>
            </Button>
            <Button asChild>
              <Link href="/schiessnachweis/neuer-eintrag">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Eintrag
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter und Suche */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <NativeSelect
                value={filterTyp}
                onValueChange={setFilterTyp}
                placeholder="Alle Aktivitäten"
                options={[
                  { value: "alle", label: "Alle Aktivitäten" },
                  { value: "training", label: "Nur Training" },
                  { value: "wettkampf", label: "Nur Wettkämpfe" }
                ]}
              />
            </div>
            <div>
              <NativeSelect
                value={filterDisziplin}
                onValueChange={setFilterDisziplin}
                placeholder="Alle Disziplinen"
                options={[
                  { value: "alle", label: "Alle Disziplinen" },
                  { value: "KK liegend 50m", label: "KK liegend 50m" },
                  { value: "Luftgewehr 10m", label: "Luftgewehr 10m" },
                  { value: "Luftpistole 10m", label: "Luftpistole 10m" },
                  { value: "Sportpistole 25m", label: "Sportpistole 25m" },
                  { value: "Recurvebogen 70m", label: "Recurvebogen 70m" },
                  { value: "Sonstige Disziplin", label: "Sonstige Disziplin" }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Einträge-Liste */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Lade Einträge...</p>
        </div>
      ) : filteredEinträge.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Einträge gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {einträge.length === 0 
                ? "Sie haben noch keine Schießaktivitäten eingetragen."
                : "Keine Einträge entsprechen den aktuellen Filterkriterien."
              }
            </p>
            <Button asChild>
              <Link href="/schiessnachweis/neuer-eintrag">
                <Plus className="h-4 w-4 mr-2" />
                Ersten Eintrag erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEinträge.map((eintrag) => (
            <Card key={eintrag.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedEintrag(eintrag)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(eintrag.datum, 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                      {getTypBadge(eintrag.typ)}
                      <Eye className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Disziplin:</span>
                        <div className="font-medium">{eintrag.disziplin}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Schüsse:</span>
                        <div className="font-medium">{eintrag.schussAnzahl}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ergebnis:</span>
                        <div className="font-medium">{eintrag.ergebnis} Ringe</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Standort:</span>
                        <div className="font-medium">{eintrag.standort}</div>
                      </div>
                    </div>
                    
                    {eintrag.notizen && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Notizen:</span>
                        <div className="text-muted-foreground italic">{eintrag.notizen}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(eintrag.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEintrag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEintrag(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Eintrag Details</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEintrag(null)}>
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Datum</label>
                  <div className="text-lg font-semibold">
                    {format(selectedEintrag.datum, 'EEEE, dd. MMMM yyyy', { locale: de })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Aktivität</label>
                  <div className="mt-1">{getTypBadge(selectedEintrag.typ)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Disziplin</label>
                  <div className="text-lg font-semibold">{selectedEintrag.disziplin}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Standort</label>
                  <div className="text-lg">{selectedEintrag.standort}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Schussanzahl</label>
                  <div className="text-lg font-semibold">{selectedEintrag.schussAnzahl} Schuss</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ergebnis</label>
                  <div className="text-2xl font-bold text-primary">{selectedEintrag.ergebnis} Ringe</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Durchschnitt pro Schuss</label>
                  <div className="text-lg">{(selectedEintrag.ergebnis / selectedEintrag.schussAnzahl).toFixed(2)} Ringe</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Maximale Ringzahl</label>
                  <div className="text-lg">{selectedEintrag.schussAnzahl * 10} Ringe</div>
                </div>
              </div>
              
              {selectedEintrag.notizen && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notizen</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">{selectedEintrag.notizen}</div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(selectedEintrag.id);
                    setSelectedEintrag(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
                <Button onClick={() => setSelectedEintrag(null)}>Schließen</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
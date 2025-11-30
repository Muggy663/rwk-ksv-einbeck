"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, Save, Trash2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag, KATEGORIEN, getDisziplinenByKategorie, getDisziplinConfig, WETTKAMPF_TYPEN, ZehnerSerie } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ErgebnisaufnahmeForm } from "@/components/schiessnachweis/ErgebnisaufnahmeForm";

export default function EintragBearbeitenPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [eintrag, setEintrag] = useState<SchießEintrag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showDetailedEntry, setShowDetailedEntry] = useState(false);
  const [serien, setSerien] = useState<ZehnerSerie[]>([]);
  const [availableDisziplinen, setAvailableDisziplinen] = useState<string[]>([]);
  const [selectedKategorie, setSelectedKategorie] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      loadEintrag(params.id as string);
    }
  }, [params.id]);

  const loadEintrag = async (id: string) => {
    setIsLoading(true);
    try {
      const einträge = await SchießnachweisService.getEinträge();
      const gefundenerEintrag = einträge.find(e => e.id === id);
      
      if (!gefundenerEintrag) {
        toast({
          title: "Eintrag nicht gefunden",
          description: "Der angeforderte Eintrag existiert nicht.",
          variant: "destructive"
        });
        router.push("/schiessnachweis/eintraege");
        return;
      }
      
      setEintrag(gefundenerEintrag);
      
      // Serien laden falls vorhanden
      if (gefundenerEintrag.serien) {
        setSerien(gefundenerEintrag.serien);
        setShowDetailedEntry(true);
      }
      
      // Kategorie ermitteln
      const kategorie = KATEGORIEN.find(k => 
        getDisziplinenByKategorie(k).some(d => d.name === gefundenerEintrag.disziplin)
      );
      if (kategorie) {
        setSelectedKategorie(kategorie);
        setAvailableDisziplinen(getDisziplinenByKategorie(kategorie).map(d => d.name));
      }
      
      // Optionale Felder anzeigen wenn ausgefüllt
      if (gefundenerEintrag.schiessstand || gefundenerEintrag.wetter || 
          gefundenerEintrag.munition || gefundenerEintrag.waffe) {
        setShowOptionalFields(true);
      }
    } catch (error) {
      logError('Fehler beim Laden des Eintrags:', error);
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eintrag) return;

    setIsSaving(true);
    try {
      logDebug('Speichere Eintrag mit Standort:', eintrag.standort);
      const updated = SchießnachweisService.updateEintrag(eintrag.id, {
        datum: eintrag.datum,
        typ: eintrag.typ,
        disziplin: eintrag.disziplin,
        schussAnzahl: eintrag.schussAnzahl,
        ergebnis: eintrag.ergebnis, // Zehntel-Ergebnis
        ergebnisGanzeRinge: eintrag.ergebnisGanzeRinge, // Ganze Ringe
        serien: serien.length > 0 ? serien : undefined,
        standort: eintrag.standort || 'Unbekannt',
        schiessstand: eintrag.schiessstand || '',
        wetter: eintrag.wetter || '',
        munition: eintrag.munition || '',
        waffe: eintrag.waffe || '',
        notizen: eintrag.notizen || ''
      });

      if (updated) {

        
        toast({
          title: "✅ Gespeichert",
          description: "Eintrag wurde erfolgreich aktualisiert.",
        });
        router.push("/schiessnachweis/eintraege");
      } else {
        throw new Error("Update fehlgeschlagen");
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eintrag) return;
    
    if (confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      try {
        await SchießnachweisService.deleteEintrag(eintrag.id);
        toast({
          title: "Gelöscht",
          description: "Eintrag wurde erfolgreich gelöscht.",
        });
        router.push("/schiessnachweis/eintraege");
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Eintrag konnte nicht gelöscht werden.",
          variant: "destructive"
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Lade Eintrag...</p>
        </div>
      </div>
    );
  }

  if (!eintrag) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Eintrag nicht gefunden</p>
          <Button asChild className="mt-4">
            <Link href="/schiessnachweis/eintraege">Zurück zu den Einträgen</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis/eintraege">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu den Einträgen
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold">Eintrag bearbeiten</h1>
        <p className="text-muted-foreground">
          Erstellt am {format(eintrag.createdAt, 'dd.MM.yyyy HH:mm')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eintrag-Details</CardTitle>
          <CardDescription>
            Bearbeiten Sie die Details Ihres Schießeintrags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="datum">Datum *</Label>
                <Input
                  id="datum"
                  type="date"
                  value={format(eintrag.datum, 'yyyy-MM-dd')}
                  onChange={(e) => setEintrag({
                    ...eintrag,
                    datum: new Date(e.target.value)
                  })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="typ">Art der Aktivität *</Label>
                <NativeSelect
                  value={eintrag.typ}
                  onValueChange={(value) => setEintrag({
                    ...eintrag,
                    typ: value as SchießEintrag['typ']
                  })}
                  options={WETTKAMPF_TYPEN.map(typ => ({
                    value: typ.value,
                    label: `${typ.icon} ${typ.label}`
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="kategorie">Kategorie *</Label>
              <NativeSelect
                value={selectedKategorie}
                onValueChange={(value) => {
                  setSelectedKategorie(value);
                  const disziplinen = getDisziplinenByKategorie(value);
                  setAvailableDisziplinen(disziplinen.map(d => d.name));
                }}
                options={KATEGORIEN.map(kategorie => ({
                  value: kategorie,
                  label: kategorie
                }))}
              />
            </div>
            
            {selectedKategorie && (
              <div>
                <Label htmlFor="disziplin">Disziplin *</Label>
                <NativeSelect
                  value={eintrag.disziplin}
                  onValueChange={(value) => setEintrag({
                    ...eintrag,
                    disziplin: value
                  })}
                  options={availableDisziplinen.map(disziplin => ({
                    value: disziplin,
                    label: disziplin
                  }))}
                />
              </div>
            )}

            {eintrag.disziplin && (() => {
              const config = getDisziplinConfig(eintrag.disziplin);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schussAnzahl">Anzahl Schüsse *</Label>
                    <Input
                      id="schussAnzahl"
                      type="number"
                      min="1"
                      max="1000"
                      value={eintrag.schussAnzahl}
                      onChange={(e) => setEintrag({
                        ...eintrag,
                        schussAnzahl: parseInt(e.target.value) || 0
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ergebnis">Ergebnis *</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="ergebnisGanzeRinge" className="text-sm font-medium text-blue-700">Ergebnis (Ganze Ringe) *</Label>
                        <Input
                          id="ergebnisGanzeRinge"
                          type="number"
                          min="0"
                          max="1000"
                          value={eintrag.ergebnisGanzeRinge || ''}
                          onChange={(e) => setEintrag({
                            ...eintrag,
                            ergebnisGanzeRinge: parseInt(e.target.value) || 0
                          })}
                          required
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ergebnisZehntel" className="text-sm font-medium text-green-700">Ergebnis (mit Zehntel) - Optional</Label>
                        <Input
                          id="ergebnisZehntel"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1000"
                          value={eintrag.ergebnis || ''}
                          onChange={(e) => setEintrag({
                            ...eintrag,
                            ergebnis: parseFloat(e.target.value) || 0
                          })}
                          disabled={showDetailedEntry && serien.length > 0}
                          className="border-green-200 focus:border-green-400"
                        />
                      </div>
                    </div>
                    {config && (
                      <p className="text-xs text-muted-foreground mt-2">
                        🎯 Max. {config.maxRinge} Ringe pro Schuss<br/>
                        📊 <strong>Ganze Ringe:</strong> Pflichtfeld für alle Einträge<br/>
                        🎯 <strong>Zehntel-Ergebnis:</strong> Optional für Leistungsschützen (z.B. detaillierte Analyse)
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standort">Ort/Stadt *</Label>
                <Input
                  id="standort"
                  value={eintrag.standort}
                  onChange={(e) => setEintrag({
                    ...eintrag,
                    standort: e.target.value
                  })}
                  placeholder="z.B. Einbeck"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="schiessstand">Schießstand</Label>
                <Input
                  id="schiessstand"
                  value={eintrag.schiessstand || ''}
                  onChange={(e) => setEintrag({
                    ...eintrag,
                    schiessstand: e.target.value
                  })}
                  placeholder="z.B. Einbecker Schützengilde"
                />
              </div>
            </div>
            
            {/* Optionale Details */}
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                <Label className="text-base font-semibold">Zusätzliche Details (optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="w-full sm:w-auto"
                >
                  <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`} />
                  {showOptionalFields ? 'Weniger' : 'Mehr Details'}
                </Button>
              </div>
              
              {showOptionalFields && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="wetter">Wetter</Label>
                    <NativeSelect
                      value={eintrag.wetter || ''}
                      onValueChange={(value) => setEintrag({
                        ...eintrag,
                        wetter: value
                      })}
                      placeholder="Wetter wählen..."
                      options={[
                        { value: "Sonnig", label: "☀️ Sonnig" },
                        { value: "Bewölkt", label: "☁️ Bewölkt" },
                        { value: "Regen", label: "🌧️ Regen" },
                        { value: "Wind", label: "💨 Windig" },
                        { value: "Halle", label: "🏢 Halle" }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="munition">Munition</Label>
                    <Input
                      id="munition"
                      value={eintrag.munition || ''}
                      onChange={(e) => setEintrag({
                        ...eintrag,
                        munition: e.target.value
                      })}
                      placeholder="z.B. RWS R50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="waffe">Waffe</Label>
                    <Input
                      id="waffe"
                      value={eintrag.waffe || ''}
                      onChange={(e) => setEintrag({
                        ...eintrag,
                        waffe: e.target.value
                      })}
                      placeholder="z.B. Anschütz 1827"
                    />
                  </div>
                </div>
              )}
            </div>

            {eintrag.disziplin && (
              <div className="border-t pt-4 space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                    <div>
                      <Label className="text-base font-semibold">Detaillierte Serien-Erfassung (optional)</Label>
                      <p className="text-sm text-muted-foreground mt-1">Das Gesamtergebnis oben reicht zum Speichern - Serien sind nur für detaillierte Analyse</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetailedEntry(!showDetailedEntry)}
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showDetailedEntry ? 'rotate-180' : ''}`} />
                      {showDetailedEntry ? 'Einfache Eingabe' : 'Serien erfassen'}
                    </Button>
                  </div>
                  
                  {showDetailedEntry && (
                    <ErgebnisaufnahmeForm
                      disziplin={eintrag.disziplin}
                      onSerienChange={(newSerien) => {
                        setSerien(newSerien);
                        if (newSerien.length > 0) {
                          const gesamtErgebnis = newSerien.reduce((sum, serie) => sum + serie.summe, 0);
                          setEintrag(prev => ({ ...prev!, ergebnis: gesamtErgebnis }));
                        }
                      }}
                      initialSerien={serien}
                      schussAnzahl={eintrag.schussAnzahl}
                    />
                  )}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notizen">Notizen (optional)</Label>
              <Textarea
                id="notizen"
                value={eintrag.notizen || ''}
                onChange={(e) => setEintrag({
                  ...eintrag,
                  notizen: e.target.value
                })}
                placeholder="Zusätzliche Bemerkungen..."
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  "Speichert..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
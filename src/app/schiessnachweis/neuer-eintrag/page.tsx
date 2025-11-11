"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, Save, Target, ChevronDown } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { KATEGORIEN, getDisziplinenByKategorie, getDisziplinConfig, WETTKAMPF_TYPEN, BELIEBTE_SCHIESSSTAENDE, ZehnerSerie } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { ErgebnisaufnahmeForm } from "@/components/schiessnachweis/ErgebnisaufnahmeForm";
import { DigitalAnlageImport } from "@/components/schiessnachweis/DigitalAnlageImport";

export default function NeuerEintragPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split('T')[0],
    typ: 'training' as any,
    kategorie: '',
    disziplin: '',
    schussAnzahl: '',
    ergebnis: '',
    standort: '',
    schiessstand: '',
    wetter: '',
    munition: '',
    waffe: '',
    notizen: ''
  });
  
  const [serien, setSerien] = useState<ZehnerSerie[]>([]);
  const [showDetailedEntry, setShowDetailedEntry] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [availableDisziplinen, setAvailableDisziplinen] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (formData.kategorie) {
      const disziplinen = getDisziplinenByKategorie(formData.kategorie);
      console.log('Kategorie:', formData.kategorie, 'Disziplinen:', disziplinen);
      setAvailableDisziplinen(disziplinen.map(d => d.name));
      setFormData(prev => ({ ...prev, disziplin: '' }));
    } else {
      setAvailableDisziplinen([]);
    }
  }, [formData.kategorie]);
  
  useEffect(() => {
    if (formData.disziplin) {
      const config = getDisziplinConfig(formData.disziplin);
      if (config && config.schussAnzahl.length === 1) {
        setFormData(prev => ({ ...prev, schussAnzahl: config.schussAnzahl[0].toString() }));
      }
    }
  }, [formData.disziplin]);
  
  useEffect(() => {
    if (serien.length > 0 && showDetailedEntry) {
      const gesamtErgebnis = serien.reduce((sum, serie) => sum + serie.summe, 0);
      // Nur Ergebnis aktualisieren, nicht Schussanzahl (die ist bereits gesetzt)
      if (gesamtErgebnis > 0) {
        setFormData(prev => ({ 
          ...prev, 
          ergebnis: gesamtErgebnis.toString()
        }));
      }
    }
  }, [serien, showDetailedEntry]);

  const handleSubmit = async () => {
    
    if (!formData.disziplin || !formData.schussAnzahl || !formData.ergebnis || !formData.standort) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }
    
    // Prüfe ob Ergebnis > 0 ist
    if (parseFloat(formData.ergebnis) <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie ein gültiges Ergebnis ein.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      SchießnachweisService.saveEintrag({
        datum: new Date(formData.datum),
        typ: formData.typ,
        disziplin: formData.disziplin,
        schussAnzahl: parseInt(formData.schussAnzahl),
        ergebnis: parseFloat(formData.ergebnis),
        serien: serien.length > 0 ? serien : undefined,
        standort: formData.standort,
        schiessstand: formData.schiessstand || undefined,
        wetter: formData.wetter || undefined,
        munition: formData.munition || undefined,
        waffe: formData.waffe || undefined,
        notizen: formData.notizen || undefined
      });

      toast({
        title: "Erfolgreich gespeichert",
        description: `${WETTKAMPF_TYPEN.find(t => t.value === formData.typ)?.label} wurde hinzugefügt.`,
      });

      router.push('/schiessnachweis');
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Neuer Eintrag</h1>
        </div>
        <p className="text-muted-foreground">
          Professionelle Ergebniserfassung für alle DSB-Disziplinen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schießaktivität erfassen</CardTitle>
          <CardDescription>
            Alle Felder mit * sind Pflichtfelder
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
                  value={formData.datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="typ">Art der Aktivität *</Label>
                <NativeSelect
                  value={formData.typ}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, typ: value }))}
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
                value={formData.kategorie}
                onValueChange={(value) => setFormData(prev => ({ ...prev, kategorie: value }))}
                placeholder="Kategorie auswählen..."
                options={KATEGORIEN.map(kategorie => ({
                  value: kategorie,
                  label: kategorie
                }))}
              />
            </div>
            
            {formData.kategorie && (
              <div>
                <Label htmlFor="disziplin">Disziplin *</Label>
                <NativeSelect
                  value={formData.disziplin}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, disziplin: value }))}
                  placeholder="Disziplin auswählen..."
                  options={availableDisziplinen.map(disziplin => ({
                    value: disziplin,
                    label: disziplin
                  }))}
                />
              </div>
            )}

            {formData.disziplin && (() => {
              const config = getDisziplinConfig(formData.disziplin);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schussAnzahl">Anzahl Schüsse *</Label>
                    {config && config.schussAnzahl.length > 1 ? (
                      <NativeSelect
                        value={formData.schussAnzahl}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, schussAnzahl: value }))}
                        placeholder="Schussanzahl wählen..."
                        options={config.schussAnzahl.map(anzahl => ({
                          value: anzahl.toString(),
                          label: `${anzahl} Schuss`
                        }))}
                      />
                    ) : (
                      <Input
                        id="schussAnzahl"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.schussAnzahl}
                        onChange={(e) => setFormData(prev => ({ ...prev, schussAnzahl: e.target.value }))}
                        placeholder={config ? config.schussAnzahl[0].toString() : "z.B. 40"}
                        required
                      />
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="ergebnis">Ergebnis (Ringe) *</Label>
                    <Input
                      id="ergebnis"
                      type="number"
                      step={config?.kommastellen ? "0.1" : "1"}
                      min="0"
                      max="1000"
                      value={formData.ergebnis}
                      onChange={(e) => setFormData(prev => ({ ...prev, ergebnis: e.target.value }))}
                      placeholder={config?.kommastellen ? "385.2" : "385"}
                      required
                      disabled={showDetailedEntry && serien.length > 0}
                    />
                    {config && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Max. {config.maxRinge} Ringe pro Schuss
                        {config.kommastellen && " • Kommastellen möglich"}
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
                  value={formData.standort}
                  onChange={(e) => setFormData(prev => ({ ...prev, standort: e.target.value }))}
                  placeholder="z.B. Einbeck"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="schiessstand">Schießstand</Label>
                <Input
                  id="schiessstand"
                  value={formData.schiessstand}
                  onChange={(e) => setFormData(prev => ({ ...prev, schiessstand: e.target.value }))}
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
                      value={formData.wetter}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, wetter: value }))}
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
                      value={formData.munition}
                      onChange={(e) => setFormData(prev => ({ ...prev, munition: e.target.value }))}
                      placeholder="z.B. RWS R50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="waffe">Waffe</Label>
                    <Input
                      id="waffe"
                      value={formData.waffe}
                      onChange={(e) => setFormData(prev => ({ ...prev, waffe: e.target.value }))}
                      placeholder="z.B. Anschütz 1827"
                    />
                  </div>
                </div>
              )}
            </div>

            {formData.disziplin && (
              <div className="border-t pt-4 space-y-6">
                {/* Digital Import */}
                <DigitalAnlageImport
                  disziplin={formData.disziplin}
                  onImport={(importedSerien) => {
                    setSerien(importedSerien);
                    setShowDetailedEntry(true);
                  }}
                />
                
                {/* Manuelle Erfassung */}
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
                      disziplin={formData.disziplin}
                      onSerienChange={setSerien}
                      initialSerien={serien}
                      schussAnzahl={parseInt(formData.schussAnzahl) || undefined}
                    />
                  )}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notizen">Notizen (optional)</Label>
              <Textarea
                id="notizen"
                value={formData.notizen}
                onChange={(e) => setFormData(prev => ({ ...prev, notizen: e.target.value }))}
                placeholder="Zusätzliche Bemerkungen..."
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Speichere...' : 'Eintrag speichern'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/schiessnachweis">
                  Abbrechen
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
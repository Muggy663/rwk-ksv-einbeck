"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Target, ChevronDown, Users } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { UnifiedTrainingService } from "@/lib/services/unified-training-service";
import { TrainingGroupsService } from "@/lib/services/training-groups-service";
import { KATEGORIEN, getDisziplinenByKategorie, getDisziplinConfig, WETTKAMPF_TYPEN, BELIEBTE_SCHIESSSTAENDE, ZehnerSerie } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ErgebnisaufnahmeForm } from "@/components/schiessnachweis/ErgebnisaufnahmeForm";
import { DigitalAnlageImport } from "@/components/schiessnachweis/DigitalAnlageImport";
import { TrainingGroup } from "@/types/social";
import { CompetitionSelector } from "@/components/schiessnachweis/CompetitionSelector";

export default function NeuerEintragPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [socialTraining, setSocialTraining] = useState(searchParams?.get('social') === 'true');
  const [selectedGroupId, setSelectedGroupId] = useState(searchParams?.get('group') || '');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<TrainingGroup[]>([]);
  
  const [formData, setFormData] = useState({
    datum: (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    typ: 'training' as any,
    kategorie: '',
    disziplin: '',
    schussAnzahl: '',
    ergebnis: '',
    ergebnisGanzeRinge: '',
    standort: '',
    schiessstand: '',
    wetter: '',
    munition: '',
    waffe: '',
    notizen: ''
  });
  
  const [serien, setSerien] = useState<ZehnerSerie[]>([]);
  const [showDetailedEntry, setShowDetailedEntry] = useState(false);
  const [berechneteErgebnisse, setBerechneteErgebnisse] = useState<{
    mitZehntel: number;
    ohneZehntel: number;
  } | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [availableDisziplinen, setAvailableDisziplinen] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lade Benutzer-Gruppen wenn Social Training aktiviert ist
  useEffect(() => {
    if (socialTraining && user) {
      loadUserGroups();
    }
  }, [socialTraining, user]);
  
  const loadUserGroups = async () => {
    if (!user) return;
    try {
      const groups = await TrainingGroupsService.getUserGroups(user.uid);
      setUserGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };
  
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
      // Berechne Ergebnis mit Zehntel (exakt)
      const mitZehntel = serien.reduce((sum, serie) => sum + serie.summe, 0);
      // Berechne ganze Ringe (jeder Schuss einzeln abgerundet)
      const ohneZehntel = serien.reduce((sum, serie) => {
        return sum + serie.schuesse.reduce((serieSum, schuss) => {
          return serieSum + Math.floor(schuss.wert);
        }, 0);
      }, 0);
      
      setBerechneteErgebnisse({ mitZehntel, ohneZehntel });
      
      // Setze beide Ergebnisse
      if (mitZehntel > 0) {
        setFormData(prev => ({ 
          ...prev, 
          ergebnis: mitZehntel.toString(),
          ergebnisGanzeRinge: ohneZehntel.toString()
        }));
      }
    } else {
      setBerechneteErgebnisse(null);
    }
  }, [serien, showDetailedEntry]);

  const handleSubmit = async () => {
    
    // Detaillierte Validierung mit spezifischen Fehlermeldungen
    const missingFields = [];
    if (!formData.disziplin) missingFields.push('Disziplin');
    if (!formData.schussAnzahl) missingFields.push('Anzahl Schüsse');
    if (!formData.ergebnisGanzeRinge) missingFields.push('Ergebnis (Ganze Ringe)');
    if (!formData.standort || !formData.standort.trim()) missingFields.push('Ort/Stadt');
    
    if (missingFields.length > 0) {
      toast({
        title: "Pflichtfelder fehlen",
        description: `Bitte ausfüllen: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    // Prüfe ob Ergebnis > 0 ist
    if (parseFloat(formData.ergebnisGanzeRinge) <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie ein gültiges Ergebnis ein.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Debug: Prüfe Ergebnis-Felder
      console.log('🔍 Debug - ergebnisGanzeRinge:', formData.ergebnisGanzeRinge);
      console.log('🔍 Debug - ergebnis (Zehntel):', formData.ergebnis);
      console.log('🔍 Debug - selectedGroupId:', selectedGroupId);
      console.log('🔍 Debug - socialTraining:', socialTraining);
      
      const ganzeRinge = parseFloat(formData.ergebnisGanzeRinge);
      const zehntelErgebnis = formData.ergebnis ? parseFloat(formData.ergebnis) : undefined;
      
      console.log('🔍 Parsed - ganzeRinge:', ganzeRinge);
      console.log('🔍 Parsed - zehntelErgebnis:', zehntelErgebnis);
      
      // Verwende Unified Training Service für nahtlose Integration
      const result = await UnifiedTrainingService.saveTrainingResult({
        datum: new Date(formData.datum),
        typ: formData.typ,
        disziplin: formData.disziplin,
        schussAnzahl: parseInt(formData.schussAnzahl),
        ergebnis: zehntelErgebnis || ganzeRinge, // Zehntel-Ergebnis oder Ganze Ringe als Fallback
        ergebnisGanzeRinge: ganzeRinge, // Ganze Ringe
        standort: formData.standort,
        schiessstand: formData.schiessstand || undefined,
        wetter: formData.wetter || undefined,
        munition: formData.munition || undefined,
        waffe: formData.waffe || undefined,
        notizen: formData.notizen || undefined,
        serien: serien || undefined,
        socialTraining,
        groupId: selectedGroupId || undefined,
        competitionId: selectedCompetitionId || undefined,
        proofType: 'verified'
      });
      
      console.log('✅ Ergebnis gespeichert:', result);
      
      // Debug: Prüfe ob Social Training Ergebnis erstellt wurde
      if (result.socialTraining) {
        console.log('✅ Social Training Ergebnis ID:', result.socialTraining.id);
        console.log('✅ Social Training groupId:', result.socialTraining.groupId);
      } else {
        console.log('❌ Kein Social Training Ergebnis erstellt');
      }
      
      // Daten sind bereits in der Datenbank gespeichert
      console.log('✅ Daten automatisch in Datenbank gespeichert');



      toast({
        title: "Erfolgreich gespeichert",
        description: result.socialTraining 
          ? `${WETTKAMPF_TYPEN.find(t => t.value === formData.typ)?.label} wurde in Schießnachweis und Social Training gespeichert.`
          : `${WETTKAMPF_TYPEN.find(t => t.value === formData.typ)?.label} wurde hinzugefügt.`,
      });

      router.push(socialTraining ? '/social' : '/schiessnachweis');
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="ergebnis">Ergebnis *</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="ergebnisGanzeRinge" className="text-sm font-medium text-blue-700">Ergebnis (Ganze Ringe) *</Label>
                        <Input
                          id="ergebnisGanzeRinge"
                          type="number"
                          min="0"
                          max="1000"
                          value={formData.ergebnisGanzeRinge}
                          onChange={(e) => setFormData(prev => ({ ...prev, ergebnisGanzeRinge: e.target.value }))}
                          required
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ergebnis" className="text-sm font-medium text-green-700">Ergebnis (mit Zehntel) - Optional</Label>
                        <Input
                          id="ergebnis"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1000"
                          value={formData.ergebnis}
                          onChange={(e) => setFormData(prev => ({ ...prev, ergebnis: e.target.value }))}
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
                    
                    {/* Berechnetes Ergebnis anzeigen */}
                    {berechneteErgebnisse && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">🎯 Aus Serien berechnet:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded border text-center">
                            <div className="text-blue-700 font-medium text-sm">Ganze Ringe:</div>
                            <div className="text-lg font-bold text-blue-900">{berechneteErgebnisse.ohneZehntel}</div>
                          </div>
                          <div className="bg-white p-2 rounded border text-center">
                            <div className="text-green-700 font-medium text-sm">Mit Zehntel:</div>
                            <div className="text-lg font-bold text-green-900">{berechneteErgebnisse.mitZehntel}</div>
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          ✅ Beide Ergebnisse automatisch übernommen
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div>
              <Label htmlFor="schiessstand">Schießstand (optional)</Label>
              <Input
                id="schiessstand"
                value={formData.schiessstand}
                onChange={(e) => setFormData(prev => ({ ...prev, schiessstand: e.target.value }))}
                placeholder="z.B. Einbecker Schützengilde"
              />
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

            {/* Social Training Checkbox */}
            <div className="border-t pt-4">
              <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="socialTraining" 
                    checked={socialTraining}
                    onCheckedChange={(checked) => {
                      setSocialTraining(checked);
                      if (checked && user) {
                        loadUserGroups();
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="socialTraining" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Auch in Social Training speichern</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ergebnis wird für Community-Features gespeichert. Alle Daten werden in der Datenbank gesichert.
                    </p>
                  </div>
                </div>
                
                {/* Gruppen-Auswahl */}
                {socialTraining && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupSelection">Trainingsgruppe (optional)</Label>
                      <NativeSelect
                        value={selectedGroupId}
                        onValueChange={setSelectedGroupId}
                        placeholder="Keine Gruppe auswählen..."
                        options={[
                          { value: '', label: 'Keine Gruppe (nur persönlich)' },
                          ...userGroups.map(group => ({
                            value: group.id!,
                            label: `${group.name} (${group.members?.length || 0} Mitglieder)`
                          }))
                        ]}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedGroupId 
                          ? 'Ergebnis wird in der ausgewählten Gruppe geteilt und für Vergleiche verwendet.'
                          : 'Ergebnis wird nur in Ihrem persönlichen Social Training Profil gespeichert.'}
                      </p>
                      {userGroups.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          Sie sind noch keiner Trainingsgruppe beigetreten. <Link href="/training-groups" className="underline">Gruppe erstellen oder beitreten</Link>
                        </p>
                      )}
                    </div>
                    
                    {/* Wettkampf-Auswahl */}
                    {selectedGroupId && (
                      <CompetitionSelector 
                        groupId={selectedGroupId}
                        discipline={formData.disziplin}
                        onCompetitionChange={(competitionId) => {
                          setSelectedCompetitionId(competitionId);
                          console.log('🏆 Selected competition ID:', competitionId);
                          console.log('🏆 Expected competition ID: Kg8GG35V5Z8b0OAy5jtQ');
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
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

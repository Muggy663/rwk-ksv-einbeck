"use client";

import { useState, useEffect } from "react";
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, Save, Camera, Hash, List, ChevronRight, ChevronLeft, MapPin, FileText } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { KATEGORIEN, getDisziplinenByKategorie, getDisziplinConfig, WETTKAMPF_TYPEN, BELIEBTE_SCHIESSSTAENDE, ZehnerSerie } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ErgebnisaufnahmeForm } from "@/components/schiessnachweis/ErgebnisaufnahmeForm";
import { ScheibenScanner } from "@/components/schiessnachweis/ScheibenScanner";
import { DigitalAnlageImport } from "@/components/schiessnachweis/DigitalAnlageImport";

type WizardStep = 'disziplin' | 'methode' | 'ergebnis' | 'details';
type InputMethod = 'schnell' | 'serien' | 'foto' | 'digital';

export function NeuerEintragContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>('disziplin');
  const [inputMethod, setInputMethod] = useState<InputMethod>('schnell');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split('T')[0],
    typ: 'training' as string,
    kategorie: '',
    disziplin: '',
    schussAnzahl: '',
    ergebnis: '',
    ergebnisGanzeRinge: '',
    standort: '',
    notizen: '',
    wetter: '',
    waffe: '',
    munition: '',
  });

  const [serien, setSerien] = useState<ZehnerSerie[]>([]);
  const [berechneteErgebnisse, setBerechneteErgebnisse] = useState<{
    mitZehntel: number;
    ohneZehntel: number;
  } | null>(null);
  const [availableDisziplinen, setAvailableDisziplinen] = useState<string[]>([]);

  // Disziplinen laden wenn Kategorie gewählt
  useEffect(() => {
    if (formData.kategorie) {
      const disziplinen = getDisziplinenByKategorie(formData.kategorie);
      setAvailableDisziplinen(disziplinen.map(d => d.name));
      setFormData(prev => ({ ...prev, disziplin: '' }));
    }
  }, [formData.kategorie]);

  // Schussanzahl automatisch setzen
  useEffect(() => {
    if (formData.disziplin) {
      const config = getDisziplinConfig(formData.disziplin);
      if (config?.defaultSchussanzahl) {
        setFormData(prev => ({ ...prev, schussAnzahl: config.defaultSchussanzahl.toString() }));
      }
    }
  }, [formData.disziplin]);

  // Serien-Berechnung
  useEffect(() => {
    if (serien.length > 0) {
      let mitZehntel = 0;
      let ohneZehntel = 0;
      serien.forEach(serie => {
        if (Array.isArray(serie.schuesse)) {
          serie.schuesse.forEach(schuss => {
            // Schuss kann ein Objekt {wert, ring, zehntel} oder eine Zahl sein
            const wert = typeof schuss === 'number' ? schuss : (schuss?.wert || 0);
            if (wert && !isNaN(wert)) {
              mitZehntel += wert;
              ohneZehntel += Math.floor(wert);
            }
          });
        }
        // Fallback: verwende serie.summe wenn vorhanden
        if (mitZehntel === 0 && serie.summe > 0) {
          mitZehntel += serie.summe;
          ohneZehntel += Math.floor(serie.summe);
        }
      });
      const mitZehntelRounded = Math.round(mitZehntel * 10) / 10;
      setBerechneteErgebnisse({ mitZehntel: mitZehntelRounded || 0, ohneZehntel: ohneZehntel || 0 });
      setFormData(prev => ({
        ...prev,
        ergebnis: (mitZehntelRounded || 0).toString(),
        ergebnisGanzeRinge: (ohneZehntel || 0).toString()
      }));
    } else {
      setBerechneteErgebnisse(null);
    }
  }, [serien]);

  const handleSubmit = async () => {
    if (!formData.disziplin || !formData.schussAnzahl || (!formData.ergebnisGanzeRinge && !berechneteErgebnisse)) {
      toast({ title: "Pflichtfelder fehlen", description: "Disziplin, Schussanzahl und Ergebnis sind erforderlich.", variant: "destructive" });
      return;
    }

    const ganzeRinge = berechneteErgebnisse?.ohneZehntel || parseFloat(formData.ergebnisGanzeRinge);
    if (ganzeRinge <= 0) {
      toast({ title: "Ungültiges Ergebnis", description: "Bitte ein gültiges Ergebnis eingeben.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await SchießnachweisService.addEintrag({
        datum: new Date(formData.datum),
        typ: formData.typ as any,
        kategorie: formData.kategorie,
        disziplin: formData.disziplin,
        schussAnzahl: parseInt(formData.schussAnzahl),
        ergebnis: ganzeRinge,
        ergebnisZehntel: berechneteErgebnisse?.mitZehntel || (formData.ergebnis ? parseFloat(formData.ergebnis) : undefined),
        standort: (formData.standort && formData.standort !== '__custom__') ? formData.standort : undefined,
        notizen: formData.notizen || undefined,
        wetter: formData.wetter || undefined,
        waffe: formData.waffe || undefined,
        munition: formData.munition || undefined,
        serien: serien.length > 0 ? serien : undefined,
        socialTraining: false,
        groupId: undefined,
        competitionId: undefined,
      });
      logDebug('✅ Ergebnis gespeichert:', result);
      toast({ title: "✅ Gespeichert", description: `${ganzeRinge} Ringe erfolgreich eingetragen.` });
      router.push('/schiessnachweis');
    } catch (error) {
      logError('Fehler beim Speichern:', error);
      toast({ title: "Fehler", description: "Eintrag konnte nicht gespeichert werden.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fortschrittsanzeige
  const steps: WizardStep[] = ['disziplin', 'methode', 'ergebnis', 'details'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-lg md:max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/schiessnachweis">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-primary">Neuer Eintrag</h1>
      </div>

      {/* Fortschrittsbalken */}
      <div className="flex gap-1 mb-5">
        {steps.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {/* SCHRITT 1: Disziplin */}
      {step === 'disziplin' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Was hast du geschossen?</h2>

            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                value={formData.datum}
                onChange={(e) => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {WETTKAMPF_TYPEN.map(typ => (
                <button
                  key={typ.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, typ: typ.value }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.typ === typ.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-card text-card-foreground hover:border-primary/50'
                  }`}
                >
                  {typ.label}
                </button>
              ))}
            </div>

            <div>
              <Label>Kategorie</Label>
              <NativeSelect
                value={formData.kategorie}
                onValueChange={(v) => setFormData(prev => ({ ...prev, kategorie: v }))}
                placeholder="Kategorie wählen..."
                options={KATEGORIEN.map(k => ({ value: k, label: k }))}
              />
            </div>

            {formData.kategorie && (
              <div>
                <Label>Disziplin</Label>
                <NativeSelect
                  value={formData.disziplin}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, disziplin: v }))}
                  placeholder="Disziplin wählen..."
                  options={availableDisziplinen.map(d => ({ value: d, label: d }))}
                />
              </div>
            )}

            {formData.disziplin && (
              <div>
                <Label>Anzahl Schüsse</Label>
                <Input
                  type="number"
                  value={formData.schussAnzahl}
                  onChange={(e) => setFormData(prev => ({ ...prev, schussAnzahl: e.target.value }))}
                  placeholder="z.B. 40"
                  className="text-lg h-12"
                />
              </div>
            )}

            <Button
              className="w-full h-12 text-base"
              disabled={!formData.disziplin || !formData.schussAnzahl}
              onClick={() => setStep('methode')}
            >
              Weiter <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SCHRITT 2: Eingabemethode */}
      {step === 'methode' && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h2 className="text-lg font-semibold">Wie möchtest du eingeben?</h2>
            <p className="text-sm text-muted-foreground">{formData.disziplin} — {formData.schussAnzahl} Schuss</p>

            <button
              type="button"
              onClick={() => { setInputMethod('schnell'); setStep('ergebnis'); }}
              className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary text-left flex items-center gap-4 transition-colors"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg"><Hash className="h-6 w-6 text-green-700 dark:text-green-300" /></div>
              <div>
                <div className="font-medium">Schnelleingabe</div>
                <div className="text-sm text-muted-foreground">Nur Gesamtringzahl eingeben</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setInputMethod('serien'); setStep('ergebnis'); }}
              className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary text-left flex items-center gap-4 transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><List className="h-6 w-6 text-blue-700 dark:text-blue-300" /></div>
              <div>
                <div className="font-medium">Serien erfassen</div>
                <div className="text-sm text-muted-foreground">Einzelne Schüsse / 10er-Serien eintragen</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setInputMethod('foto'); setStep('ergebnis'); }}
              className="w-full p-4 rounded-lg border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 bg-purple-50 dark:bg-purple-950/20 text-left flex items-center gap-4 transition-colors"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg"><Camera className="h-6 w-6 text-purple-700 dark:text-purple-300" /></div>
              <div>
                <div className="font-medium">Scheibe fotografieren <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded ml-1">Beta</span></div>
                <div className="text-sm text-muted-foreground">KI erkennt die Ringe automatisch</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setInputMethod('digital'); setStep('ergebnis'); }}
              className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary text-left flex items-center gap-4 transition-colors"
            >
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg"><FileText className="h-6 w-6 text-orange-700 dark:text-orange-300" /></div>
              <div>
                <div className="font-medium">Ausdruck digitale Anlage <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded ml-1">Beta</span></div>
                <div className="text-sm text-muted-foreground">Meyton, Sius, Disag etc. — Foto scannen</div>
              </div>
            </button>

            <Button variant="ghost" onClick={() => setStep('disziplin')} className="w-full">
              <ChevronLeft className="mr-2 h-4 w-4" /> Zurück
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SCHRITT 3: Ergebnis */}
      {step === 'ergebnis' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {inputMethod === 'schnell' && 'Ergebnis eingeben'}
                {inputMethod === 'serien' && 'Serien erfassen'}
                {inputMethod === 'foto' && 'Scheibe analysieren'}
                {inputMethod === 'digital' && 'Ausdruck scannen'}
              </h2>
              <span className="text-sm text-muted-foreground">{formData.schussAnzahl} Schuss</span>
            </div>

            {/* Schnelleingabe */}
            {inputMethod === 'schnell' && (
              <div className="space-y-3">
                <div>
                  <Label>Gesamtergebnis (ganze Ringe)</Label>
                  <Input
                    type="number"
                    value={formData.ergebnisGanzeRinge}
                    onChange={(e) => setFormData(prev => ({ ...prev, ergebnisGanzeRinge: e.target.value }))}
                    placeholder="z.B. 285"
                    className="text-2xl h-14 text-center font-bold"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mit Zehntel (optional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.ergebnis}
                    onChange={(e) => setFormData(prev => ({ ...prev, ergebnis: e.target.value }))}
                    placeholder="z.B. 285.3"
                    className="h-10"
                  />
                </div>
              </div>
            )}

            {/* Serien */}
            {inputMethod === 'serien' && (
              <ErgebnisaufnahmeForm
                disziplin={formData.disziplin}
                onSerienChange={setSerien}
                initialSerien={serien}
                schussAnzahl={parseInt(formData.schussAnzahl) || undefined}
              />
            )}

            {/* Foto */}
            {inputMethod === 'foto' && (
              <ScheibenScanner
                discipline={(() => {
                  const d = formData.disziplin.toLowerCase();
                  if (d.includes('luftpistole') || d.includes('sportpistole') || d.includes('schnellfeuer') || d.includes('zentralfeuer')) return 'LP';
                  if (d.includes('kk') || d.includes('kleinkaliber')) return 'KK';
                  return 'LG'; // Default: Luftgewehr
                })()}
                shotCount={parseInt(formData.schussAnzahl) || 10}
                onResult={(result) => {
                  const newSerien: ZehnerSerie[] = [];
                  for (let i = 0; i < result.shots.length; i += 10) {
                    const chunk = result.shots.slice(i, i + 10);
                    newSerien.push({ nummer: Math.floor(i / 10) + 1, schuesse: chunk, summe: chunk.reduce((a, b) => a + b, 0) });
                  }
                  setSerien(newSerien);
                  setFormData(prev => ({ ...prev, ergebnis: result.totalWithDecimal.toString(), ergebnisGanzeRinge: result.totalWholeRings.toString() }));
                  setBerechneteErgebnisse({ mitZehntel: result.totalWithDecimal, ohneZehntel: result.totalWholeRings });
                }}
              />
            )}

            {/* Digital-Anlage Import */}
            {inputMethod === 'digital' && (
              <DigitalAnlageImport
                disziplin={formData.disziplin}
                onImport={(importedSerien) => {
                  setSerien(importedSerien);
                }}
              />
            )}

            {/* Berechnetes Ergebnis anzeigen */}
            {berechneteErgebnisse && (inputMethod === 'serien' || inputMethod === 'foto' || inputMethod === 'digital') && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg p-3 text-center">
                <span className="text-2xl font-bold text-green-700">{berechneteErgebnisse.ohneZehntel || 0}</span>
                <span className="text-sm text-green-600 ml-2">Ringe ({(berechneteErgebnisse.mitZehntel || 0).toFixed(1)} mit Zehntel)</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('methode')} className="flex-1">
                <ChevronLeft className="mr-1 h-4 w-4" /> Zurück
              </Button>
              <Button
                className="flex-1 h-12"
                disabled={!formData.ergebnisGanzeRinge && !berechneteErgebnisse}
                onClick={() => setStep('details')}
              >
                Weiter <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCHRITT 4: Details + Speichern */}
      {step === 'details' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-lg font-semibold">Fast fertig!</h2>

            {/* Zusammenfassung */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div><strong>{formData.disziplin}</strong> — {formData.schussAnzahl} Schuss</div>
              <div className="text-lg font-bold text-primary">
                {berechneteErgebnisse?.ohneZehntel || formData.ergebnisGanzeRinge} Ringe
              </div>
              <div className="text-muted-foreground">{formData.datum} • {WETTKAMPF_TYPEN.find(t => t.value === formData.typ)?.label}</div>
            </div>

            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Ort / Schießstand (optional)</Label>
              <select
                value={formData.standort}
                onChange={(e) => setFormData(prev => ({ ...prev, standort: e.target.value }))}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Standort wählen...</option>
                {BELIEBTE_SCHIESSSTAENDE.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__custom__">✏️ Anderen Standort eingeben...</option>
              </select>
              {(formData.standort === '__custom__' || (formData.standort && !BELIEBTE_SCHIESSSTAENDE.includes(formData.standort as any) && formData.standort !== '')) && (
                <Input
                  className="mt-2 h-12"
                  value={formData.standort === '__custom__' ? '' : formData.standort}
                  onChange={(e) => setFormData(prev => ({ ...prev, standort: e.target.value }))}
                  placeholder="Standort eingeben..."
                  autoFocus
                />
              )}
            </div>

            <div>
              <Label>Notizen (optional)</Label>
              <Textarea
                value={formData.notizen}
                onChange={(e) => setFormData(prev => ({ ...prev, notizen: e.target.value }))}
                placeholder="Bemerkungen zum Training..."
                rows={2}
              />
            </div>

            {/* Optionale Details */}
            <details className="group">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                ▸ Weitere Details (Wetter, Waffe, Munition)
              </summary>
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-muted">
                <div>
                  <Label className="text-xs">Wetter</Label>
                  <Input
                    value={formData.wetter}
                    onChange={(e) => setFormData(prev => ({ ...prev, wetter: e.target.value }))}
                    placeholder="z.B. Sonnig, 20°C"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Waffe</Label>
                  <Input
                    value={formData.waffe}
                    onChange={(e) => setFormData(prev => ({ ...prev, waffe: e.target.value }))}
                    placeholder="z.B. Feinwerkbau 800X"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Munition</Label>
                  <Input
                    value={formData.munition}
                    onChange={(e) => setFormData(prev => ({ ...prev, munition: e.target.value }))}
                    placeholder="z.B. RWS R10 Match"
                    className="h-10"
                  />
                </div>
              </div>
            </details>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('ergebnis')} className="flex-shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                className="flex-1 h-12 text-base"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Speichere...' : 'Eintrag speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

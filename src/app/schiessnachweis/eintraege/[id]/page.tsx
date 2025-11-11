"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag, DISZIPLINEN, WETTKAMPF_TYPEN, BELIEBTE_SCHIESSSTAENDE } from "@/types/schiessnachweis";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function EintragBearbeitenPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [eintrag, setEintrag] = useState<SchießEintrag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadEintrag(params.id as string);
    }
  }, [params.id]);

  const loadEintrag = (id: string) => {
    setIsLoading(true);
    try {
      const einträge = SchießnachweisService.getEinträge();
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
    } catch (error) {
      console.error('Fehler beim Laden des Eintrags:', error);
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
      const updated = SchießnachweisService.updateEintrag(eintrag.id, {
        datum: eintrag.datum,
        typ: eintrag.typ,
        disziplin: eintrag.disziplin,
        schussAnzahl: eintrag.schussAnzahl,
        ergebnis: eintrag.ergebnis,
        standort: eintrag.standort,
        notizen: eintrag.notizen
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

  const handleDelete = () => {
    if (!eintrag) return;
    
    if (confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      try {
        SchießnachweisService.deleteEintrag(eintrag.id);
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="datum">Datum</Label>
              <Input
                id="datum"
                type="date"
                value={format(eintrag.datum, 'yyyy-MM-dd')}
                onChange={(e) => setEintrag({
                  ...eintrag,
                  datum: new Date(e.target.value)
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="typ">Aktivität</Label>
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
            <Label htmlFor="disziplin">Disziplin</Label>
            <NativeSelect
              value={eintrag.disziplin}
              onValueChange={(value) => setEintrag({
                ...eintrag,
                disziplin: value
              })}
              options={DISZIPLINEN.map(d => ({
                value: d.name,
                label: d.name
              }))}
            />
          </div>

          <div>
            <Label htmlFor="standort">Standort</Label>
            <NativeSelect
              value={eintrag.standort}
              onValueChange={(value) => setEintrag({
                ...eintrag,
                standort: value
              })}
              options={BELIEBTE_SCHIESSSTAENDE.map(standort => ({
                value: standort,
                label: standort
              }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schussAnzahl">Schussanzahl</Label>
              <Input
                id="schussAnzahl"
                type="number"
                min="1"
                max="200"
                value={eintrag.schussAnzahl}
                onChange={(e) => setEintrag({
                  ...eintrag,
                  schussAnzahl: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="ergebnis">Ergebnis (Ringe)</Label>
              <Input
                id="ergebnis"
                type="number"
                step="0.1"
                min="0"
                value={eintrag.ergebnis}
                onChange={(e) => setEintrag({
                  ...eintrag,
                  ergebnis: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notizen">Notizen (optional)</Label>
            <Textarea
              id="notizen"
              placeholder="Zusätzliche Informationen..."
              value={eintrag.notizen || ''}
              onChange={(e) => setEintrag({
                ...eintrag,
                notizen: e.target.value
              })}
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
        </CardContent>
      </Card>
    </div>
  );
}
// src/app/admin/kommunikation/page.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessagesSquare, Send, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KommunikationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [rundschreiben, setRundschreiben] = useState({
    betreff: '',
    nachricht: '',
    empfaenger: 'alle',
    prioritaet: 'normal'
  });

  const handleSendRundschreiben = async () => {
    if (!rundschreiben.betreff.trim() || !rundschreiben.nachricht.trim()) {
      toast({
        title: 'Fehler',
        description: 'Betreff und Nachricht sind erforderlich.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Rundschreiben versendet',
        description: `Das Rundschreiben wurde erfolgreich an ${rundschreiben.empfaenger === 'alle' ? 'alle Benutzer' : rundschreiben.empfaenger} versendet.`
      });
      
      setRundschreiben({
        betreff: '',
        nachricht: '',
        empfaenger: 'alle',
        prioritaet: 'normal'
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Versenden',
        description: 'Das Rundschreiben konnte nicht versendet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessagesSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Kommunikation & Rundschreiben</h1>
            <p className="text-muted-foreground">Nachrichten an Vereinsvertreter und Mannschaftsführer versenden</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5" />
              Rundschreiben erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="empfaenger">Empfänger</Label>
                <Select value={rundschreiben.empfaenger} onValueChange={(value) => setRundschreiben(prev => ({...prev, empfaenger: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Empfänger wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Benutzer</SelectItem>
                    <SelectItem value="mannschaftsfuehrer">Nur Mannschaftsführer</SelectItem>
                    <SelectItem value="vereinsvertreter">Nur Vereinsvertreter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="prioritaet">Priorität</Label>
                <Select value={rundschreiben.prioritaet} onValueChange={(value) => setRundschreiben(prev => ({...prev, prioritaet: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priorität wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="niedrig">Niedrig</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="betreff">Betreff</Label>
              <Input
                id="betreff"
                value={rundschreiben.betreff}
                onChange={(e) => setRundschreiben(prev => ({...prev, betreff: e.target.value}))}
                placeholder="z.B. Wichtige Informationen zum nächsten Durchgang"
              />
            </div>

            <div>
              <Label htmlFor="nachricht">Nachricht</Label>
              <Textarea
                id="nachricht"
                value={rundschreiben.nachricht}
                onChange={(e) => setRundschreiben(prev => ({...prev, nachricht: e.target.value}))}
                placeholder="Ihre Nachricht hier eingeben..."
                rows={8}
              />
            </div>

            <Button 
              onClick={handleSendRundschreiben} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>Wird versendet...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Rundschreiben versenden
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Empfänger-Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="font-medium text-blue-900">Alle Benutzer</div>
              <div className="text-sm text-blue-700">Vereinsvertreter + Mannschaftsführer</div>
              <div className="text-xs text-blue-600 mt-1">Ca. 50-80 Empfänger</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-md">
              <div className="font-medium text-green-900">Nur Mannschaftsführer</div>
              <div className="text-sm text-green-700">Direkte Ansprechpartner der Teams</div>
              <div className="text-xs text-green-600 mt-1">Ca. 30-50 Empfänger</div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-md">
              <div className="font-medium text-purple-900">Nur Vereinsvertreter</div>
              <div className="text-sm text-purple-700">Hauptverantwortliche der Vereine</div>
              <div className="text-xs text-purple-600 mt-1">Ca. 15-25 Empfänger</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Vorlagen für Rundschreiben
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setRundschreiben(prev => ({
                ...prev,
                betreff: 'Erinnerung: Ergebnisse für [X]. Durchgang eintragen',
                nachricht: 'Liebe Mannschaftsführer,\n\nbitte denken Sie daran, die Ergebnisse für den [X]. Durchgang bis zum [Datum] einzutragen.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit sportlichen Grüßen\nIhr RWK-Team'
              }))}
            >
              Ergebnisse-Erinnerung
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setRundschreiben(prev => ({
                ...prev,
                betreff: 'Terminänderung: [Durchgang] am [neues Datum]',
                nachricht: 'Liebe Teilnehmer,\n\nhiermit informieren wir Sie über eine Terminänderung:\n\nDer [X]. Durchgang findet nun am [neues Datum] um [Uhrzeit] statt.\n\nBitte passen Sie Ihre Planung entsprechend an.\n\nMit sportlichen Grüßen\nIhr RWK-Team'
              }))}
            >
              Terminänderung
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
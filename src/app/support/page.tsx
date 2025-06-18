"use client";
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle, Send, Loader2, Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { SupportTicket } from '@/types/rwk';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUPPORT_TICKETS_COLLECTION = "support_tickets";

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user, name, email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Datei zu groß",
          description: "Die maximale Dateigröße beträgt 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const sendEmailNotification = async (ticketData: any) => {
    try {
      await fetch('/api/support-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ticketData.name,
          email: ticketData.email,
          subject: ticketData.subject,
          message: ticketData.message,
        }),
      });
      console.log('E-Mail-Benachrichtigung gesendet');
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail-Benachrichtigung:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Fehlende Eingabe",
        description: "Bitte Betreff und Nachricht ausfüllen.",
        variant: "destructive",
      });
      return;
    }
    if (!email.trim()) {
      toast({
        title: "E-Mail erforderlich",
        description: "Bitte gib deine E-Mail-Adresse ein, damit wir dich kontaktieren können.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Erstelle ein Base64-String aus der Datei, falls vorhanden
      let fileData = null;
      if (selectedFile) {
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data);
          };
          reader.readAsDataURL(selectedFile);
        });
      }

      const ticketData: any = {
        name: name.trim() || "Anonym",
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        reportedByUserId: user?.uid || null,
        timestamp: serverTimestamp(),
        status: 'neu',
      };

      // Füge Datei hinzu, falls vorhanden
      if (fileData) {
        ticketData.screenshot = {
          name: selectedFile.name,
          type: selectedFile.type,
          data: fileData,
        };
      }

      // Speichere das Ticket in Firestore
      await addDoc(collection(db, SUPPORT_TICKETS_COLLECTION), ticketData);
      
      // Sende E-Mail-Benachrichtigung
      await sendEmailNotification(ticketData);

      // Zeige Erfolgsmeldung
      setSubmitSuccess(true);
      
      toast({
        title: "Anfrage gesendet",
        description: "Vielen Dank! Deine Anfrage wurde erfolgreich übermittelt.",
      });
      
      // Formular zurücksetzen
      setSubject('');
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error submitting support ticket: ", error);
      toast({
        title: "Fehler beim Senden",
        description: (error as Error).message || "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <HelpCircle className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Kontakt & Support</h1>
          <p className="text-lg text-muted-foreground">
            Hilfe bei Fragen oder Problemen.
          </p>
        </div>
      </div>

      {submitSuccess ? (
        <Alert className="max-w-2xl mx-auto bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Anfrage erfolgreich gesendet!</AlertTitle>
          <AlertDescription className="text-green-700">
            Vielen Dank für deine Nachricht. Wir haben deine Anfrage erhalten und werden uns so schnell wie möglich bei dir melden.
          </AlertDescription>
          <div className="mt-4">
            <Button 
              onClick={() => setSubmitSuccess(false)} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Neue Anfrage erstellen
            </Button>
          </div>
        </Alert>
      ) : (
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-primary font-bold">Support-Anfrage senden</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Fülle das Formular aus, um uns deine Frage oder dein Problem mitzuteilen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="font-medium">Dein Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Max Mustermann" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-medium">Deine E-Mail Adresse</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="max@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="font-medium">Betreff</Label>
                <Input 
                  id="subject" 
                  placeholder="z.B. Problem mit Ergebniserfassung" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="font-medium">Deine Nachricht</Label>
                <Textarea
                  id="message"
                  placeholder="Bitte beschreibe dein Problem möglichst detailliert. Bei Fehlern oder Problemen beschreibe die Schritte, die zum Problem führen."
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hinweis: Wenn du einen Fehler meldest, gib bitte an, welchen Browser und welches Gerät du verwendest.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="screenshot" className="font-medium">Screenshot hochladen (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Datei
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximale Dateigröße: 5MB. Unterstützte Formate: JPG, PNG, GIF.
                </p>
                {selectedFile && (
                  <p className="text-sm text-primary mt-1">
                    Ausgewählte Datei: {selectedFile.name}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Anfrage senden
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
       <p className="text-center text-sm text-muted-foreground max-w-md mx-auto mt-6">
        Wir bemühen uns, deine Anfrage so schnell wie möglich zu bearbeiten.
      </p>
    </div>
  );
}
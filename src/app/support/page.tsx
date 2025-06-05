// src/app/support/page.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { SupportTicket } from '@/types/rwk';

const SUPPORT_TICKETS_COLLECTION = "support_tickets";

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user, name, email]);

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
            description: "Bitte geben Sie Ihre E-Mail-Adresse ein, damit wir Sie kontaktieren können.",
            variant: "destructive",
        });
        return;
    }
    setIsSubmitting(true);
    try {
      const ticketData: Omit<SupportTicket, 'id' | 'timestamp' | 'status'> = {
        name: name.trim() || "Anonym",
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        reportedByUserId: user?.uid || null,
        // timestamp and status will be set by server or default
      };

      await addDoc(collection(db, SUPPORT_TICKETS_COLLECTION), {
        ...ticketData,
        timestamp: serverTimestamp(),
        status: 'neu', // Default status
      });

      toast({
        title: "Anfrage gesendet",
        description: "Vielen Dank! Ihre Anfrage wurde erfolgreich übermittelt.",
      });
      // Formular zurücksetzen
      setSubject('');
      setMessage('');
      // Name und E-Mail nicht zurücksetzen, falls der User sie wiederverwenden will
    } catch (error) {
      console.error("Error submitting support ticket: ", error);
      toast({
        title: "Fehler beim Senden",
        description: (error as Error).message || "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
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

      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-accent">Support-Anfrage senden</CardTitle>
          <CardDescription>
            Füllen Sie das Formular aus, um uns Ihre Frage oder Ihr Problem mitzuteilen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Ihr Name</Label>
                <Input 
                  id="name" 
                  placeholder="Max Mustermann" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Ihre E-Mail Adresse</Label>
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
              <Label htmlFor="subject">Betreff</Label>
              <Input 
                id="subject" 
                placeholder="z.B. Problem mit Ergebniserfassung" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Ihre Nachricht</Label>
              <Textarea
                id="message"
                placeholder="Bitte beschreiben Sie Ihr Problem möglichst detailliert. Sichern Sie ggf. Screenshots für mögliche Nachfragen."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Anfrage senden
            </Button>
          </form>
        </CardContent>
      </Card>
       <p className="text-center text-sm text-muted-foreground max-w-md mx-auto mt-6">
        Wir bemühen uns, Ihre Anfrage so schnell wie möglich zu bearbeiten.
      </p>
    </div>
  );
}

"use client";
import React, { useState, useRef } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle, Send, Loader2, Upload, CheckCircle, Star, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { BackButton } from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

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
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Öffentliche Feedbacks + Durchschnittsbewertung (aus der früheren /feedback-Seite übernommen).
  const [publicFeedbacks, setPublicFeedbacks] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  React.useEffect(() => {
    if (user) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user, name, email]);

  React.useEffect(() => {
    const loadPublicFeedbacks = async () => {
      try {
        const q = query(
          collection(db, 'feedback'),
          where('showPublicly', '==', true),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setPublicFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Durchschnitt über alle abgegebenen Bewertungen (> 0).
        const allSnapshot = await getDocs(collection(db, 'feedback'));
        const ratings = allSnapshot.docs.map(d => d.data().rating).filter((r: number) => r > 0);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
          setAvgRating(Math.round(avg * 10) / 10);
          setRatingCount(ratings.length);
        }
      } catch (error) {
        logError('Fehler beim Laden der öffentlichen Feedbacks:', error);
      }
    };
    loadPublicFeedbacks();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Datei zu groß",
            description: `${file.name} ist größer als 5MB und wurde übersprungen.`,
            variant: "destructive",
          });
          continue;
        }
        validFiles.push(file);
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

    } catch (error) {
      logError('Fehler beim Senden der E-Mail-Benachrichtigung:', error);
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
      // Komprimiere Bilder für Firestore (CORS-Problem mit Storage umgehen)
      let filesData = null;
      if (selectedFiles.length > 0) {
        setUploadProgress(`Verarbeite ${selectedFiles.length} Datei(en)...`);
        
        filesData = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress(`Verarbeite Datei ${i + 1}/${selectedFiles.length}: ${file.name}`);
          
          try {
            if (file.type.startsWith('image/')) {
              // Komprimiere Bilder
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              
              const objectUrl = URL.createObjectURL(file);
              const compressedData = await new Promise<string>((resolve, reject) => {
                img.onload = () => {
                  URL.revokeObjectURL(objectUrl);
                  const maxWidth = 800;
                  const maxHeight = 600;
                  let { width, height } = img;

                  if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                  }

                  canvas.width = width;
                  canvas.height = height;
                  ctx?.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
                img.onerror = () => {
                  URL.revokeObjectURL(objectUrl);
                  reject(new Error('Image load failed'));
                };
                img.src = objectUrl;
              });
              
              filesData.push({
                name: String(file.name).replace(/[<>"'&]/g, ''),
                type: 'image/jpeg',
                data: compressedData,
                originalSize: file.size,
                compressedSize: Math.round(compressedData.length * 0.75)
              });
            } else {
              // Nicht-Bilder: Nur kleine Dateien
              if (file.size <= 100000) { // 100KB Limit
                const reader = new FileReader();
                const fileData = await new Promise<string>((resolve) => {
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
                
                filesData.push({
                  name: String(file.name).replace(/[<>"'&]/g, ''),
                  type: file.type,
                  data: fileData,
                  originalSize: file.size
                });
              } else {
                toast({
                  title: "Datei zu groß",
                  description: `${file.name} ist zu groß (max. 100KB für Nicht-Bilder).`,
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            logError(`Fehler beim Verarbeiten von ${file.name}:`, error);
            toast({
              title: "Verarbeitungsfehler",
              description: `Datei ${file.name} konnte nicht verarbeitet werden.`,
              variant: "destructive",
            });
          }
        }
        setUploadProgress('');
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

      // Füge Datei-URLs hinzu, falls vorhanden
      if (filesData) {
        ticketData.screenshots = filesData;
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
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logError("Error submitting support ticket: ", error);
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
        <BackButton className="mr-2" fallbackHref="/" />
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
                    placeholder="z.B. Max Mustermann" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-medium">E-Mail *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="z.B. max@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="font-medium">Betreff *</Label>
                <Input 
                  id="subject" 
                  placeholder="z.B. Problem mit Ergebniserfassung" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="font-medium">Nachricht *</Label>
                <Textarea
                  id="message"
                  placeholder="Beschreibe dein Problem möglichst detailliert. Bei Fehlern: Welche Schritte führten zum Problem?"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tipp: Bei Fehlern gib bitte Browser und Gerät an.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="screenshot" className="font-medium">Screenshots hochladen (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Dateien
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximale Dateigröße: 5MB pro Datei. Unterstützte Formate: JPG, PNG, GIF.
                </p>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium text-primary">
                      Ausgewählte Dateien ({selectedFiles.length}):
                    </p>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                          <div className="flex-1 truncate">
                            <span className="font-medium">{file.name}</span>
                            <span className="text-muted-foreground ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 h-6 w-6 p-0 ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? (uploadProgress || 'Sende Anfrage...') : 'Anfrage senden'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feedback Widget */}
      <FeedbackWidget />

      {/* Öffentliche Bewertungen / Was andere sagen */}
      {(ratingCount > 0 || publicFeedbacks.length > 0) && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Separator />
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Was andere sagen
          </h2>

          {ratingCount > 0 && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-7 w-7 ${
                          i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{avgRating}</div>
                    <div className="text-sm text-muted-foreground">
                      aus {ratingCount} Bewertung{ratingCount !== 1 ? 'en' : ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {publicFeedbacks.map((fb) => (
            <Card key={fb.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {fb.rating > 0 && (
                      <div className="flex">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                    {(fb.name || fb.club) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>
                          {fb.name}
                          {fb.name && fb.club && ' • '}
                          {fb.club}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {fb.timestamp?.toDate?.()?.toLocaleDateString('de-DE') || ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{fb.feedback}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Konto-Löschung Sektion */}
      <Card className="shadow-lg max-w-2xl mx-auto border-destructive/20">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Konto löschen
          </CardTitle>
          <CardDescription>
            Beantrage die Löschung deines Kontos und aller zugehörigen Daten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">So beantragst du die Kontolöschung:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Sende eine E-Mail an: <strong>rwk-leiter-ksve@gmx.de</strong></li>
              <li>Betreff: "Kontolöschung RWK App"</li>
              <li>Gib deine registrierte E-Mail-Adresse an</li>
              <li>Bestätige deine Identität durch Angabe deines Vereins</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Welche Daten werden gelöscht:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Dein Benutzerkonto und Anmeldedaten</li>
              <li>Persönliche Kontaktdaten (E-Mail, Telefon)</li>
              <li>Login-Berechtigung und Zugriff auf die App</li>
              <li>Persönliche Einstellungen und Präferenzen</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Welche Daten bleiben erhalten:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Wettkampfergebnisse und Tabellenstände (anonymisiert)</li>
              <li>Historische RWK- und KM-Daten für Vereinsstatistiken</li>
              <li>Mannschaftszugehörigkeiten (Name wird anonymisiert)</li>
              <li>Daten, die für Wettkampfintegrität erforderlich sind</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-yellow-800">Bearbeitungszeit:</h3>
            <p className="text-sm text-yellow-700">
              Dein Löschungsantrag wird innerhalb von 30 Tagen bearbeitet. 
              Wettkampfdaten bleiben anonymisiert für Tabellenintegrität erhalten.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground max-w-md mx-auto mt-6">
        Wir bemühen uns, deine Anfrage so schnell wie möglich zu bearbeiten.
      </p>
    </div>
  );
}

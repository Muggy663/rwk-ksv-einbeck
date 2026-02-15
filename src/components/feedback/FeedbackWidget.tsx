"use client";
import { useState } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ReCaptcha } from '@/components/auth/ReCaptcha';
import { useAuth } from '@/hooks/use-auth';

export function FeedbackWidget() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [showPublicly, setShowPublicly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback fehlt",
        description: "Bitte gib dein Feedback ein.",
        variant: "destructive",
      });
      return;
    }

    if (!recaptchaToken) {
      toast({
        title: "Verifizierung erforderlich",
        description: "Bitte bestätige, dass du kein Roboter bist.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        rating,
        feedback: feedback.trim(),
        name: showPublicly && name.trim() ? name.trim() : null,
        club: showPublicly && club.trim() ? club.trim() : null,
        showPublicly,
        userId: user?.uid || null,
        timestamp: serverTimestamp(),
        recaptchaToken,
      });

      toast({
        title: "Feedback gesendet",
        description: "Vielen Dank für dein Feedback!",
      });

      // Seite neu laden
      window.location.reload();
    } catch (error) {
      logError('Fehler beim Senden des Feedbacks:', error);
      toast({
        title: "Fehler",
        description: "Feedback konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-primary flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Feedback & Verbesserungsvorschläge
        </CardTitle>
        <CardDescription>
          Teile uns deine Meinung mit oder schlage Verbesserungen vor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showPublicly"
              checked={showPublicly}
              onCheckedChange={(checked) => setShowPublicly(checked as boolean)}
            />
            <Label htmlFor="showPublicly" className="cursor-pointer">
              Feedback öffentlich anzeigen
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club">Verein (optional)</Label>
              <Input
                id="club"
                placeholder="SV Beispiel"
                value={club}
                onChange={(e) => setClub(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bewertung (optional)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Dein Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Was gefällt dir? Was könnte verbessert werden? Welche Features wünschst du dir?"
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>

          <ReCaptcha onVerify={setRecaptchaToken} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Sende...' : 'Feedback senden'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

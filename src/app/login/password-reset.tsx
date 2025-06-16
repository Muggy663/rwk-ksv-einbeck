"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetProps {
  onBack: () => void;
}

export default function PasswordReset({ onBack }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast({
        title: "E-Mail gesendet",
        description: "Eine Anleitung zum Zurücksetzen Ihres Passworts wurde an Ihre E-Mail-Adresse gesendet.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        setError('Es wurde kein Konto mit dieser E-Mail-Adresse gefunden.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Ungültige E-Mail-Adresse.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
      } else {
        setError('Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      }
      
      toast({
        title: "Fehler",
        description: "Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Passwort zurücksetzen</CardTitle>
        <CardDescription>
          Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {resetSent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">E-Mail gesendet!</h3>
            <p className="text-muted-foreground">
              Wir haben eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts an {email} gesendet.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Wenn Sie keine E-Mail erhalten haben, überprüfen Sie bitte Ihren Spam-Ordner oder versuchen Sie es erneut.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Anmeldung
        </Button>
      </CardFooter>
    </Card>
  );
}
"use client";
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound, AlertCircle, ArrowLeft, CheckIcon } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { PasswordInput } from '@/components/ui/password-input';

const resetSchema = z.object({
  email: z.string().email({ message: "Ungültige E-Mail-Adresse." }),
});

type ResetFormInputs = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  onBack: () => void;
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetFormInputs>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit: SubmitHandler<ResetFormInputs> = async (data) => {
    setFormError(null);
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, data.email);
      setResetSent(true);
      setEmailSent(data.email);
      toast({
        title: "E-Mail gesendet",
        description: "Eine Anleitung zum Zurücksetzen Ihres Passworts wurde an Ihre E-Mail-Adresse gesendet.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        setFormError('Es wurde kein Konto mit dieser E-Mail-Adresse gefunden.');
      } else if (error.code === 'auth/invalid-email') {
        setFormError('Ungültige E-Mail-Adresse.');
      } else if (error.code === 'auth/too-many-requests') {
        setFormError('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
      } else {
        setFormError('Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      }
      
      toast({
        title: "Fehler",
        description: "Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold">Passwort zurücksetzen</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSent ? (
            <div className="text-center py-4">
              <CheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">E-Mail gesendet!</h3>
              <p className="text-muted-foreground">
                Wir haben eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts an {emailSent} gesendet.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Wenn Sie keine E-Mail erhalten haben, überprüfen Sie bitte Ihren Spam-Ordner oder versuchen Sie es erneut.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@beispiel.de"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" onClick={onBack} className="flex items-center" disabled={loading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Anmeldung
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

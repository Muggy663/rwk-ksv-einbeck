"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, { message: "Aktuelles Passwort muss mindestens 6 Zeichen lang sein." }),
  newPassword: z.string().min(8, { message: "Neues Passwort muss mindestens 8 Zeichen lang sein." }),
  confirmPassword: z.string().min(8, { message: "Passwortbestätigung muss mindestens 8 Zeichen lang sein." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein.",
  path: ["confirmPassword"],
});

export function PasswordChangeForm() {
  const { user, changePassword } = useAuth();
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    if (!user) {
      setFormError("Sie müssen angemeldet sein, um Ihr Passwort zu ändern.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await changePassword(data.currentPassword, data.newPassword);
      setIsSuccess(true);
      reset();
      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich geändert.",
        variant: "success"
      });
      
      // Nach 2 Sekunden zur Startseite zurückkehren
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error("Fehler beim Ändern des Passworts:", error);
      
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Das aktuelle Passwort ist nicht korrekt.";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Diese Aktion erfordert eine kürzliche Anmeldung. Bitte melden Sie sich ab und wieder an.";
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Passwort ändern</CardTitle>
          <CardDescription>Ändern Sie Ihr Passwort für mehr Sicherheit.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Passwort erfolgreich geändert</h3>
              <p className="text-muted-foreground">Sie werden zur Startseite weitergeleitet...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                <PasswordInput
                  id="currentPassword"
                  placeholder="********"
                  {...register('currentPassword', { required: "Aktuelles Passwort ist erforderlich" })}
                  className={errors.currentPassword ? 'border-destructive' : ''}
                  aria-invalid={errors.currentPassword ? "true" : "false"}
                />
                {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="********"
                  {...register('newPassword', { required: "Neues Passwort ist erforderlich" })}
                  className={errors.newPassword ? 'border-destructive' : ''}
                  aria-invalid={errors.newPassword ? "true" : "false"}
                />
                {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="********"
                  {...register('confirmPassword', { required: "Passwortbestätigung ist erforderlich" })}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Wird geändert...' : 'Passwort ändern'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground w-full">
            Aus Sicherheitsgründen sollten Sie regelmäßig Ihr Passwort ändern.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
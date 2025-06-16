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
import { AlertTriangle, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const passwordChangeSchema = z.object({
  currentPassword: z.string({ required_error: "Aktuelles Passwort ist erforderlich." }).min(6, { message: "Aktuelles Passwort muss mindestens 6 Zeichen lang sein." }),
  newPassword: z.string({ required_error: "Neues Passwort ist erforderlich." }).min(8, { message: "Neues Passwort muss mindestens 8 Zeichen lang sein." }),
  confirmPassword: z.string({ required_error: "Passwortbestätigung ist erforderlich." }).min(8, { message: "Passwortbestätigung muss mindestens 8 Zeichen lang sein." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein.",
  path: ["confirmPassword"],
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const { user, changePassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // State für Passwort-Sichtbarkeit
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (!user) {
      setFormError("Sie müssen angemeldet sein, um Ihr Passwort zu ändern.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (changePassword) {
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
      } else {
        throw new Error("Passwortänderung ist nicht verfügbar");
      }
    } catch (error: any) {
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
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="********"
                    {...register('currentPassword')}
                    className={errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="********"
                    {...register('newPassword')}
                    className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
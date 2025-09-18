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
import { LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { PasswordResetForm } from './PasswordResetForm';

const loginSchema = z.object({
  email: z.string({
    required_error: "E-Mail ist erforderlich"
  }).email({ message: "Ungültige E-Mail-Adresse." }),
  password: z.string({
    required_error: "Passwort ist erforderlich"
  }).min(6, { message: "Passwort muss mindestens 6 Zeichen lang sein." })
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, loading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await signIn(data.email, data.password);
      // Redirect or further actions will be handled by AuthProvider or page logic if needed
    } catch (e) {
      // error is handled by AuthProvider's toast, but can set local form error if needed
      // setFormError(e.message || "Anmeldung fehlgeschlagen.");
    }
  };

  if (showPasswordReset) {
    return <PasswordResetForm onBack={() => setShowPasswordReset(false)} />;
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold">Anmelden</CardTitle>
          <CardDescription>Melden Sie sich an, um auf Ihr Konto zuzugreifen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                {...register('email', { required: "E-Mail ist erforderlich" })}
                className={errors.email ? 'border-destructive' : ''}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  {...register('password', { required: "Passwort ist erforderlich" })}
                  className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  </span>
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              <div className="text-right">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm" 
                  onClick={() => setShowPasswordReset(true)}
                  type="button"
                >
                  Passwort vergessen?
                </Button>
              </div>
            </div>
            
            <div className="pt-2 text-sm text-muted-foreground">
              (Captcha-Platzhalter - Funktion folgt)
            </div>

            {authError && !formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Anmeldefehler</AlertTitle>
                <AlertDescription>
                  {authError.message && authError.message.includes('auth/invalid-credential') 
                    ? 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.'
                    : (authError.message || 'Ein Fehler ist aufgetreten.')}
                </AlertDescription>
              </Alert>
            )}
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <div className="w-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-700 dark:text-blue-300">
              Bei Problemen mit der Anmeldung oder noch kein Zugang? Kontaktieren Sie uns per E-Mail an{' '}
              <a href="mailto:rwk-leiter-ksve@gmx.de" className="underline font-medium">
                rwk-leiter-ksve@gmx.de
              </a>{' '}
              oder über unser{' '}
              <a href="/support" className="underline font-medium">
                Support-Formular
              </a>.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

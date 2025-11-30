"use client";
import { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '@/lib/auth/rate-limiter';
import { authLogger } from '@/lib/utils/safe-logger';
import { SECURITY_FEATURES } from '@/lib/config/security-features';
import { BotProtection } from '@/lib/auth/bot-protection';
import { ReCaptcha } from './ReCaptcha';
import { sanitizeInput, validateEmail } from '@/lib/utils/input-validator';

const loginSchema = z.object({
  email: z.string({
    required_error: "E-Mail ist erforderlich"
  })
  .email({ message: "Ungültige E-Mail-Adresse." })
  .max(254, { message: "E-Mail zu lang" })
  .refine((email) => validateEmail(email), { message: "Ungültige E-Mail-Adresse" }),
  password: z.string({
    required_error: "Passwort ist erforderlich"
  })
  .min(6, { message: "Passwort muss mindestens 6 Zeichen lang sein." })
  .max(128, { message: "Passwort zu lang" })
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, loading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [sessionId] = useState(() => Math.random().toString(36));
  const [honeypot, setHoneypot] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

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
  
  // Login-Timer starten beim ersten Render
  useEffect(() => {
    BotProtection.startLoginTimer(sessionId);
  }, [sessionId]);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    
    // Sichere Input-Sanitization
    const sanitizedEmail = sanitizeInput(data.email);
    const sanitizedPassword = sanitizeInput(data.password);
    
    // Zusätzliche Validierung
    if (!validateEmail(sanitizedEmail)) {
      setFormError("Ungültige E-Mail-Adresse.");
      return;
    }
    
    // reCAPTCHA prüfen (nur auf Production)
    const isPreview = window.location.hostname.includes('vercel.app');
    if (!recaptchaToken && !isPreview) {
      setFormError("Bitte bestätigen Sie, dass Sie kein Roboter sind.");
      return;
    }
    
    // reCAPTCHA serverseitig validieren (nur auf Production)
    if (recaptchaToken && !isPreview) {
      try {
        const recaptchaResponse = await fetch('/api/auth/verify-recaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken })
        });
        
        const recaptchaResult = await recaptchaResponse.json();
        if (!recaptchaResult.success) {
          setFormError('reCAPTCHA-Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
          return;
        }
      } catch (error) {
        setFormError('Fehler bei der Sicherheitsüberprüfung. Bitte versuchen Sie es erneut.');
        return;
      }
    }
    
    // Bot-Protection prüfen (nur wenn aktiviert)
    if (SECURITY_FEATURES.BOT_PROTECTION) {
      if (!BotProtection.validateHoneypot(honeypot)) {
        setFormError("Verdächtige Aktivität erkannt.");
        return;
      }
      
      if (!BotProtection.validateLoginTiming(sessionId)) {
        setFormError("Bitte versuchen Sie es in einem Moment erneut.");
        return;
      }
    }
    
    // Rate Limiting prüfen (nur wenn aktiviert)
    if (SECURITY_FEATURES.RATE_LIMITING && !checkRateLimit(sanitizedEmail)) {
      setFormError("Zu viele Fehlversuche. Bitte warten Sie 15 Minuten.");
      return;
    }
    
    try {
      await signIn(sanitizedEmail, sanitizedPassword);
      // Bei erfolgreichem Login: Rate Limit zurücksetzen
      if (SECURITY_FEATURES.RATE_LIMITING) {
        clearFailedAttempts(sanitizedEmail);
      }
      if (SECURITY_FEATURES.SAFE_LOGGING) {
        authLogger.loginAttempt(true);
      }
    } catch (e) {
      // Bei Fehler: Fehlversuch registrieren
      if (SECURITY_FEATURES.RATE_LIMITING) {
        recordFailedAttempt(sanitizedEmail);
      }
      if (SECURITY_FEATURES.SAFE_LOGGING) {
        authLogger.loginAttempt(false);
      }
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
            
            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCaptcha onVerify={setRecaptchaToken} />
            </div>
            
            {/* Honeypot - verstecktes Feld für Bot-Detection */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

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

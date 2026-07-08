"use client";

import { useState, useEffect } from "react";
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { auth, db } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { logLoginEvent } from '@/lib/services/login-monitor-service';

const SECURITY_HINTS = [
  "🔒 Verbindung ist SSL-verschlüsselt",
  "📋 Alle Login-Versuche werden protokolliert",
  "⏱️ Fehlversuche führen zur Sperrung",
  "🛡️ Angriffserkennung durch Firebase Security aktiv",
  "🚫 Bei Missbrauch wird die IP-Adresse gesperrt",
];

function SecurityHint() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % SECURITY_HINTS.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className="text-xs text-center text-muted-foreground transition-opacity duration-400"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {SECURITY_HINTS[index]}
    </p>
  );
}

export default function UnifiedLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError("");

    if (!email || !password) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Fehler",
        description: "Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let user;
      
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        if (!user.emailVerified && user.email !== 'admin@rwk-einbeck.de') {
          // Fallback: Prüfe ob Admin das Konto manuell verifiziert hat
          const permDoc = await getDoc(doc(db, 'user_permissions', user.uid));
          const isAdminVerified = permDoc.exists() && permDoc.data()?.emailVerifiedByAdmin === true;
          if (!isAdminVerified) {
            setShowResendVerification(true);
            setLoginError("📧 E-Mail-Adresse noch nicht bestätigt. Bitte prüfe deinen Posteingang (auch Spam).");
            setIsSubmitting(false);
            return;
          }
        }
        await logLoginEvent('success', email);
        toast({
          title: "✅ Anmeldung erfolgreich",
          description: "Willkommen zurück!",
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        
        // user_permissions erstellen
        try {
          const response = await fetch('/api/create-individual-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: displayName || null
            })
          });
          
          if (!response.ok) {
            logError('API-Fehler:', await response.text());
          } else {
            logDebug('user_permissions erfolgreich erstellt');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (apiError) {
          logError('API-Aufruf fehlgeschlagen:', apiError);
        }
        
        // E-Mail-Bestätigung
        try {
          await sendEmailVerification(user);
          toast({
            title: "🎉 Konto erfolgreich erstellt!",
            description: "📧 Bestätigungs-E-Mail gesendet. Bitte auch im Spam-Ordner nachschauen!",
            duration: 8000,
          });
        } catch (emailError) {
          logError('E-Mail-Fehler:', emailError);
        }
      }

      // Automatische Weiterleitung basierend auf Berechtigungen
      await redirectBasedOnPermissions(user.uid);
      
    } catch (error: any) {
      logError('Auth-Fehler:', error);
      let errorMessage = "Anmeldung fehlgeschlagen";
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/invalid-login-credentials':
          errorMessage = "❌ Falsches Passwort oder E-Mail";
          await logLoginEvent('failed', email, error.code);
          break;
        case 'auth/user-not-found':
          errorMessage = "❌ Benutzer nicht gefunden";
          await logLoginEvent('failed', email, error.code);
          break;
        case 'auth/invalid-email':
          errorMessage = "❌ Ungültige E-Mail-Adresse";
          break;
        case 'auth/user-disabled':
          errorMessage = "❌ Benutzerkonto wurde deaktiviert";
          await logLoginEvent('blocked', email, error.code);
          break;
        case 'auth/too-many-requests':
          errorMessage = "⏰ Zu viele Fehlversuche. Bitte später erneut versuchen";
          await logLoginEvent('blocked', email, error.code);
          break;
        case 'auth/network-request-failed':
          errorMessage = "🌐 Netzwerkfehler. Bitte Internetverbindung prüfen";
          break;
        default:
          errorMessage = `❌ Anmeldung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`;
          await logLoginEvent('failed', email, error.code);
      }
      
      setLoginError(errorMessage);
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectBasedOnPermissions = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'user_permissions', uid));
      
      if (!userDoc.exists()) {
        // Kein Dokument = Schießnachweis-User
        router.push('/schiessnachweis');
        return;
      }
      
      const data = userDoc.data();
      
      // Prüfe ob RWK/KM-Berechtigungen
      const hasRWKAccess = data.role || data.clubRoles || data.kvRoles || data.platformRole;
      // INDIVIDUAL nur wenn keine Club/KV/Platform-Rollen vorhanden
      const isIndividual = data.userType === 'INDIVIDUAL' && !data.clubRoles && !data.kvRoles && !data.platformRole;
      
      if (isIndividual || !hasRWKAccess) {
        // Nur Schießnachweis
        router.push('/schiessnachweis');
      } else {
        // Hat RWK/KM-Zugriff
        router.push('/dashboard-auswahl');
      }
    } catch (error) {
      logError('Fehler beim Laden der Berechtigungen:', error);
      // Fallback: Schießnachweis
      router.push('/schiessnachweis');
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      toast({
        title: "📧 Bestätigungs-E-Mail gesendet",
        description: "Bitte auch im Spam-Ordner nachschauen!",
        duration: 8000,
      });
      setShowResendVerification(false);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.code === 'auth/too-many-requests'
          ? "⏰ Zu viele Anfragen. Bitte später erneut versuchen."
          : "E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!resetEmail) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "✅ E-Mail gesendet",
        description: "Passwort-Zurücksetzen-Link wurde an Ihre E-Mail gesendet.",
      });
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      logError('Password reset error:', error);
      let errorMessage = "Fehler beim Senden der E-Mail";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "❌ Keine Benutzer mit dieser E-Mail gefunden";
          break;
        case 'auth/invalid-email':
          errorMessage = "❌ Ungültige E-Mail-Adresse";
          break;
        case 'auth/too-many-requests':
          errorMessage = "⏰ Zu viele Anfragen. Bitte später erneut versuchen";
          break;
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Anmelden' : 'Registrieren'}
          </CardTitle>
          <CardDescription>
            Ein Login für Schießnachweis, Social Training und RWK/KM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="z.B. max.mustermann@email.de"
                  required
                />
              </div>
            </div>
            
            {!isLogin && (
              <div>
                <Label htmlFor="displayName">Name (Optional)</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="password">Passwort *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Wird verarbeitet...' 
                : isLogin ? 'Anmelden' : 'Registrieren'
              }
            </Button>

            <SecurityHint />
          </form>
          
          {loginError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                {loginError}
              </p>
              {showResendVerification && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                  onClick={handleResendVerification}
                  disabled={isSendingVerification}
                >
                  {isSendingVerification ? 'Wird gesendet...' : '📧 Bestätigungs-E-Mail erneut senden'}
                </Button>
              )}
            </div>
          )}

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground block w-full"
            >
              {isLogin 
                ? 'Noch kein Konto? Registrieren' 
                : 'Bereits ein Konto? Anmelden'
              }
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Passwort vergessen?
              </button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                🎯 Ein Login für alles
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>✅ Schießnachweis (Digitales Schießtagebuch)</li>
                <li>✅ Social Training (Community-Features)</li>
                <li>✅ RWK/KM (Bei entsprechender Berechtigung)</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                💡 Neu hier?
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                <strong>Registrierung = Sofort Schießnachweis nutzen!</strong>
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                Nach der Registrierung haben Sie automatisch Zugriff auf Schießnachweis und Social Training.
              </p>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
                  🏆 RWK/KM-Vereinszugang benötigt?
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Erst hier registrieren, dann E-Mail an <strong>rwk-leiter-ksve@gmx.de</strong> mit Ihrer Vereinsrolle. Ich schalte Ihnen dann die entsprechenden Rechte frei.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passwort zurücksetzen Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowResetPassword(false)}>
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Passwort zurücksetzen</CardTitle>
              <CardDescription>
                Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4" onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowResetPassword(false);
                  setResetEmail("");
                }
              }}>
                <div>
                  <Label htmlFor="reset-email">E-Mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      placeholder="z.B. max.mustermann@email.de"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetEmail("");
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Wird gesendet...' : 'Link senden'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

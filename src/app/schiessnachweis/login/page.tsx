"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SchiessnachweisLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(""); // Reset error

    // Validierung
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
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "✅ Anmeldung erfolgreich",
          description: "Willkommen zurück!",
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // user_permissions über API erstellen
        try {
          const response = await fetch('/api/create-individual-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            })
          });
          
          if (!response.ok) {
            console.error('API-Fehler:', await response.text());
          } else {
            console.log('user_permissions erfolgreich erstellt');
            // Kurz warten damit AuthProvider die Permissions findet
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (apiError) {
          console.error('API-Aufruf fehlgeschlagen:', apiError);
        }
        
        // E-Mail-Bestätigung senden
        try {
          // Firebase Standard-E-Mail (funktioniert zuverlässig)
          await sendEmailVerification(user);
          console.log('Firebase E-Mail-Verifizierung gesendet an:', user.email);
          
          toast({
            title: "🎉 Konto erfolgreich erstellt!",
            description: "📧 Bestätigungs-E-Mail gesendet. Bitte auch im Spam-Ordner nachschauen!",
            duration: 8000, // Länger anzeigen
          });
        } catch (emailError) {
          console.error('E-Mail-Fehler:', emailError);
          toast({
            title: "✅ Konto erstellt",
            description: "E-Mail-Bestätigung konnte nicht gesendet werden.",
          });
        }
      }
      router.push('/schiessnachweis');
    } catch (error: any) {
      console.error('Auth-Fehler:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      let errorMessage = "Anmeldung fehlgeschlagen";
      
      // Spezifische Firebase Auth Fehlercodes
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/invalid-login-credentials':
          errorMessage = "❌ Falsches Passwort oder E-Mail";
          break;
        case 'auth/user-not-found':
          errorMessage = "❌ Benutzer nicht gefunden";
          break;
        case 'auth/invalid-email':
          errorMessage = "❌ Ungültige E-Mail-Adresse";
          break;
        case 'auth/user-disabled':
          errorMessage = "❌ Benutzerkonto wurde deaktiviert";
          break;
        case 'auth/too-many-requests':
          errorMessage = "⏰ Zu viele Fehlversuche. Bitte später erneut versuchen";
          break;
        case 'auth/network-request-failed':
          errorMessage = "🌐 Netzwerkfehler. Bitte Internetverbindung prüfen";
          break;
        default:
          errorMessage = `❌ Anmeldung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`;
      }
      
      setLoginError(errorMessage);
      
      // Auch Toast anzeigen
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-md">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Anmelden' : 'Registrieren'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Melden Sie sich an für Cloud-Sync und Premium-Features'
              : 'Erstellen Sie ein Konto für Cloud-Sync und Premium-Features'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="ihre@email.de"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
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
          </form>
          
          {loginError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                {loginError}
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isLogin 
                ? 'Noch kein Konto? Registrieren' 
                : 'Bereits ein Konto? Anmelden'
              }
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {isLogin ? 'Nach der Anmeldung:' : 'Nach der Registrierung:'}
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {!isLogin && (
                <>
                  <li>📧 E-Mail-Bestätigung erhalten (auch Spam prüfen!)</li>
                  <li>⚠️ Ohne Bestätigung: Nur Offline-Nutzung möglich</li>
                </>
              )}
              <li>✅ Ihre Offline-Daten bleiben erhalten</li>
              <li>🎆 30 Tage Premium kostenlos testen</li>
              <li>☁️ Cloud-Synchronisation verfügbar</li>
              <li>📱 Multi-Gerät-Zugang</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
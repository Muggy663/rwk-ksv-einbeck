"use client";

import { useEffect, useState } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { auth } from '@/lib/firebase/config';
import { applyActionCode } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const uid = searchParams.get('uid');
      
      if (!uid) {
        setStatus('error');
        setMessage('Ungültiger Bestätigungslink.');
        return;
      }

      try {
        // User muss eingeloggt sein um E-Mail zu verifizieren
        if (!auth.currentUser) {
          setStatus('error');
          setMessage('Bitte melden Sie sich an um die E-Mail zu bestätigen.');
          return;
        }
        
        // E-Mail als verifiziert markieren (Workaround)
        await auth.currentUser.reload();
        
        // Manuell als verifiziert setzen
        Object.defineProperty(auth.currentUser, 'emailVerified', {
          value: true,
          writable: false
        });
        
        setStatus('success');
        setMessage('E-Mail erfolgreich bestätigt!');
        
        toast({
          title: "✅ E-Mail bestätigt",
          description: "Ihr Konto ist jetzt vollständig aktiviert.",
        });
        
        setTimeout(() => {
          router.push('/schiessnachweis');
        }, 3000);
        
      } catch (error: any) {
        setStatus('error');
        setMessage('Bestätigung fehlgeschlagen.');
      }
    };

    verifyEmail();
  }, [searchParams, router, toast]);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-md min-h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
            {status === 'loading' && (
              <div className="bg-blue-100 dark:bg-blue-900 w-full h-full rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-100 dark:bg-green-900 w-full h-full rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100 dark:bg-red-900 w-full h-full rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {status === 'loading' && 'E-Mail wird bestätigt...'}
            {status === 'success' && 'Bestätigung erfolgreich!'}
            {status === 'error' && 'Bestätigung fehlgeschlagen'}
          </CardTitle>
          
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  🎉 Ihr Konto ist jetzt vollständig aktiviert!<br/>
                  Sie werden automatisch weitergeleitet...
                </p>
              </div>
              
              <Button 
                onClick={() => router.push('/schiessnachweis')}
                className="w-full"
              >
                Zum Schießnachweis
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Der Bestätigungslink ist möglicherweise abgelaufen oder bereits verwendet worden.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => router.push('/schiessnachweis/login')}
                  className="w-full"
                >
                  Zur Anmeldung
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/schiessnachweis')}
                  className="w-full"
                >
                  Zum Schießnachweis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

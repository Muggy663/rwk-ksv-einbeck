"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Konstante für den localStorage-Schlüssel
const PASSWORD_CHANGED_KEY_PREFIX = 'rwk-password-changed-';

export function PasswordChangePrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  
  // Event-Listener für das Öffnen des Dialogs
  useEffect(() => {
    const handleDialogOpen = () => {
      setOpen(true);
    };
    
    document.addEventListener('dialog-open', handleDialogOpen);
    
    return () => {
      document.removeEventListener('dialog-open', handleDialogOpen);
    };
  }, []);

  // Überprüfen, ob der Benutzer das Passwort bereits geändert hat
  useEffect(() => {
    if (!user?.uid) return;
    
    try {
      const passwordChanged = localStorage.getItem(`${PASSWORD_CHANGED_KEY_PREFIX}${user.uid}`);
      setPasswordChanged(!!passwordChanged);
      
      // Dialog niemals automatisch öffnen
      setOpen(false);
      
      // Sicherstellen, dass der Dialog geschlossen bleibt
      const forceCloseDialog = () => setOpen(false);
      const timer = setTimeout(forceCloseDialog, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Fehler beim Zugriff auf localStorage:', error);
      // Fallback: Dialog nicht automatisch öffnen
      setOpen(false);
    }
  }, [user]);

  const validatePasswords = () => {
    if (!currentPassword) {
      setError('Bitte geben Sie Ihr aktuelles Passwort ein.');
      return false;
    }
    
    if (newPassword.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return false;
    }
    
    return true;
  };

  const handlePasswordChange = async () => {
    if (!user) {
      setError('Sie müssen angemeldet sein, um Ihr Passwort zu ändern.');
      return;
    }
    
    if (!validatePasswords()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Reautentifizierung des Benutzers
      const credential = EmailAuthProvider.credential(
        user.email || '',
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Passwort ändern
      await updatePassword(user, newPassword);
      
      // Erfolg speichern
      try {
        localStorage.setItem(`${PASSWORD_CHANGED_KEY_PREFIX}${user.uid}`, 'true');
      } catch (storageError) {
        console.error('Fehler beim Speichern in localStorage:', storageError);
        // Trotzdem fortfahren, da das Passwort erfolgreich geändert wurde
      }
      
      setPasswordChanged(true);
      
      toast({
        title: "Passwort erfolgreich geändert",
        description: "Ihr neues Passwort wurde gespeichert.",
      });
      
      setOpen(false);
      
      // Formular zurücksetzen
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Fehler beim Ändern des Passworts:', error);
      
      if (error.code === 'auth/wrong-password') {
        setError('Das aktuelle Passwort ist nicht korrekt.');
      } else if (error.code === 'auth/weak-password') {
        setError('Das neue Passwort ist zu schwach.');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Aus Sicherheitsgründen müssen Sie sich erneut anmelden, bevor Sie Ihr Passwort ändern können.');
      } else {
        setError(`Fehler beim Ändern des Passworts: ${error.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion zum Schließen des Dialogs entfernt, da der "Später ändern"-Button entfernt wurde

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>
            Aus Sicherheitsgründen empfehlen wir Ihnen, Ihr Passwort zu ändern.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Aktuelles Passwort</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ihr aktuelles Passwort"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Neues Passwort bestätigen</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
            />
          </div>
          
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePasswordChange} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird geändert...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Passwort ändern
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
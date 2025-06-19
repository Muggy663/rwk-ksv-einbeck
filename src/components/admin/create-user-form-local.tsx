"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import type { Club } from '@/types/rwk';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CreateUserFormLocalProps {
  clubs: Club[];
  onUserCreated: () => void;
}

export function CreateUserFormLocal({ clubs, onUserCreated }: CreateUserFormLocalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    displayName: '',
    role: '',
    clubId: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.uid || !formData.email || !formData.role) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive"
      });
      return;
    }

    if ((formData.role === 'vereinsvertreter' || formData.role === 'mannschaftsfuehrer') && !formData.clubId) {
      toast({
        title: "Verein erforderlich",
        description: `Für die Rolle "${formData.role}" muss ein Verein ausgewählt werden.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Speichere die Berechtigungen in Firestore
      const userPermissionRef = doc(db, 'user_permissions', formData.uid.trim());
      await setDoc(userPermissionRef, {
        uid: formData.uid.trim(),
        email: formData.email.trim(),
        displayName: formData.displayName.trim() || null,
        role: formData.role,
        clubId: formData.clubId || null,
        lastUpdated: Timestamp.now(),
      });
      
      toast({
        title: "Berechtigungen gespeichert",
        description: `Berechtigungen für UID ${formData.uid.trim()} erfolgreich gespeichert.`
      });
      
      // Formular zurücksetzen
      setFormData({
        uid: '',
        email: '',
        displayName: '',
        role: '',
        clubId: ''
      });
      
      // Callback zur Aktualisierung der Benutzerliste
      onUserCreated();
    } catch (error: any) {
      console.error("Fehler beim Speichern der Berechtigungen:", error);
      toast({
        title: "Fehler",
        description: error.message || "Beim Speichern der Berechtigungen ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Benutzerberechtigungen erstellen
        </CardTitle>
        <CardDescription>
          Erstellen Sie Berechtigungen für einen neuen Benutzer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Hinweis: Manuelle Benutzeranlage erforderlich</AlertTitle>
          <AlertDescription className="text-amber-700">
            Da Sie den kostenlosen Spark-Plan verwenden, müssen Sie den Benutzer zuerst manuell in der Firebase Console erstellen und dann hier die UID eingeben.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid">Firebase User-ID (UID) *</Label>
            <Input
              id="uid"
              name="uid"
              placeholder="UID aus Firebase Authentication"
              value={formData.uid}
              onChange={handleInputChange}
              required
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Die UID erhalten Sie, nachdem Sie den Benutzer in der Firebase Console erstellt haben.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="benutzer@beispiel.de"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Anzeigename</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Max Mustermann"
                value={formData.displayName}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rolle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange('role', value)}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Rolle auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vereinsvertreter">Vereinsvertreter</SelectItem>
                  <SelectItem value="mannschaftsfuehrer">Mannschaftsführer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clubId">Verein</Label>
              <Select
                value={formData.clubId}
                onValueChange={(value) => handleSelectChange('clubId', value)}
                disabled={!formData.role || clubs.length === 0}
              >
                <SelectTrigger id="clubId">
                  <SelectValue placeholder="Verein auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Berechtigungen werden gespeichert...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Berechtigungen speichern
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <p className="text-xs text-muted-foreground">
          * Pflichtfelder
        </p>
      </CardFooter>
    </Card>
  );
}
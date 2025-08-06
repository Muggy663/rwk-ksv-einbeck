"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserWithRole } from '@/lib/firebase/functions';
import type { Club } from '@/types/rwk';

interface CreateUserFormProps {
  clubs: Club[];
  onUserCreated: () => void;
}

export function CreateUserForm({ clubs, onUserCreated }: CreateUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
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
    
    if (!formData.email || !formData.password || !formData.role) {
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
      const data = await createUserWithRole(
        formData.email,
        formData.password,
        formData.displayName || null,
        formData.role,
        formData.clubId || null
      );
      
      if (data.success) {
        toast({
          title: "Benutzer erstellt",
          description: `Benutzer ${formData.email} wurde erfolgreich erstellt.`
        });
        
        // Formular zurücksetzen
        setFormData({
          email: '',
          displayName: '',
          password: '',
          role: '',
          clubId: ''
        });
        
        // Callback zur Aktualisierung der Benutzerliste
        onUserCreated();
      } else {
        throw new Error(data.message || "Unbekannter Fehler beim Erstellen des Benutzers");
      }
    } catch (error: any) {
      console.error("Fehler beim Erstellen des Benutzers:", error);
      toast({
        title: "Fehler",
        description: error.message || "Beim Erstellen des Benutzers ist ein Fehler aufgetreten.",
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
          Neuen Benutzer erstellen
        </CardTitle>
        <CardDescription>
          Erstellen Sie einen neuen Benutzer direkt in der Weboberfläche und weisen Sie ihm Berechtigungen zu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="password">Passwort *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mindestens 6 Zeichen"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Das Passwort sollte mindestens 6 Zeichen lang sein. Der Benutzer kann es später ändern.
            </p>
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
                Benutzer wird erstellt...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Benutzer erstellen
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

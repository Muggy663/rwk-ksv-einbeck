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
    platformRole: 'NO_PLATFORM_ROLE',
    kvRole: 'NO_KV_ROLE',
    clubRole: 'NO_CLUB_ROLE',
    clubId: '',
    vereinssoftwareLicense: false
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
    
    if (!formData.uid || !formData.email) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive"
      });
      return;
    }

    if (formData.clubRole !== 'NO_CLUB_ROLE' && (!formData.clubId || formData.clubId === 'NO_CLUB')) {
      toast({
        title: "Verein erforderlich",
        description: `Für Club-Rollen muss ein Verein ausgewählt werden.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Speichere die Berechtigungen in Firestore (3-Tier-System)
      const userPermissionRef = doc(db, 'user_permissions', formData.uid.trim());
      const permissionData: any = {
        uid: formData.uid.trim(),
        email: formData.email.trim(),
        displayName: formData.displayName.trim() || null,
        lastUpdated: Timestamp.now(),
        updatedAt: Timestamp.now(),
        migrationVersion: '1.5.9',
      };
      
      // Platform-Rolle
      if (formData.platformRole !== 'NO_PLATFORM_ROLE') {
        permissionData.platformRole = formData.platformRole;
      }
      
      // KV-Rolle
      if (formData.kvRole !== 'NO_KV_ROLE') {
        permissionData.kvRole = formData.kvRole;
      }
      
      // Club-Rolle
      if (formData.clubRole !== 'NO_CLUB_ROLE' && formData.clubId && formData.clubId !== 'NO_CLUB') {
        permissionData.clubRoles = {
          [formData.clubId]: formData.clubRole
        };
        permissionData.representedClubs = [formData.clubId];
      }
      
      // Vereinssoftware-Lizenz
      if (formData.vereinssoftwareLicense) {
        permissionData.vereinssoftwareLicense = true;
        permissionData.vereinssoftwareLicenseActivatedAt = Timestamp.now();
      }
      
      await setDoc(userPermissionRef, permissionData);
      
      toast({
        title: "Berechtigungen gespeichert",
        description: `Berechtigungen für UID ${formData.uid.trim()} erfolgreich gespeichert.`
      });
      
      // Formular zurücksetzen
      setFormData({
        uid: '',
        email: '',
        displayName: '',
        platformRole: 'NO_PLATFORM_ROLE',
        kvRole: 'NO_KV_ROLE',
        clubRole: 'NO_CLUB_ROLE',
        clubId: '',
        vereinssoftwareLicense: false
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
          
          {/* 3-Tier-Rollen-System */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformRole">🌐 Platform-Rolle</Label>
              <Select
                value={formData.platformRole}
                onValueChange={(value) => handleSelectChange('platformRole', value)}
              >
                <SelectTrigger id="platformRole">
                  <SelectValue placeholder="Platform-Rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_PLATFORM_ROLE">Keine Platform-Rolle</SelectItem>
                  <SelectItem value="SUPER_ADMIN">🔥 Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kvRole">🏆 KV-Rolle</Label>
              <Select
                value={formData.kvRole}
                onValueChange={(value) => handleSelectChange('kvRole', value)}
              >
                <SelectTrigger id="kvRole">
                  <SelectValue placeholder="KV-Rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_KV_ROLE">Keine KV-Rolle</SelectItem>
                  <SelectItem value="KV_WETTKAMPFLEITER">🏆 KV-Wettkampfleiter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clubRole">🎯 Club-Rolle</Label>
              <Select
                value={formData.clubRole}
                onValueChange={(value) => handleSelectChange('clubRole', value)}
              >
                <SelectTrigger id="clubRole">
                  <SelectValue placeholder="Club-Rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CLUB_ROLE">Keine Club-Rolle</SelectItem>
                  <SelectItem value="SPORTLEITER">🎯 Sportleiter</SelectItem>
                  <SelectItem value="VORSTAND">👔 Vorstand</SelectItem>
                  <SelectItem value="KASSENWART">💰 Kassenwart</SelectItem>
                  <SelectItem value="SCHRIFTFUEHRER">📝 Schriftführer</SelectItem>
                  <SelectItem value="JUGENDWART">🧒 Jugendwart</SelectItem>
                  <SelectItem value="DAMENWART">👩 Damenwart</SelectItem>
                  <SelectItem value="ZEUGWART">🔧 Zeugwart</SelectItem>
                  <SelectItem value="PRESSEWART">📰 Pressewart</SelectItem>
                  <SelectItem value="TRAINER">🏃 Trainer</SelectItem>
                  <SelectItem value="AUSBILDER">🎓 Ausbilder</SelectItem>
                  <SelectItem value="VEREINSSCHUETZE">🎯 Vereinsschütze</SelectItem>
                  <SelectItem value="EHRENMITGLIED">🏅 Ehrenmitglied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clubId">🏠 Verein</Label>
              <Select
                value={formData.clubId}
                onValueChange={(value) => handleSelectChange('clubId', value)}
                disabled={clubs.length === 0}
              >
                <SelectTrigger id="clubId">
                  <SelectValue placeholder="Verein auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CLUB">Kein Verein</SelectItem>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>💰 Vereinssoftware-Lizenz</Label>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="vereinssoftwareLicense"
                  checked={formData.vereinssoftwareLicense}
                  onChange={(e) => setFormData(prev => ({ ...prev, vereinssoftwareLicense: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="vereinssoftwareLicense" className="text-sm">
                  Vereinssoftware-Lizenz aktivieren
                </Label>
              </div>
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

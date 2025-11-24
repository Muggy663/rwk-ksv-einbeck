"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Building, Mail, Save, Target } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProfileData {
  displayName: string;
  firstName: string;
  lastName: string;
  clubName: string;
  email: string;
  disciplines: string[];
}

export default function EditProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    firstName: "",
    lastName: "",
    clubName: "",
    email: "",
    disciplines: []
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { db } = await import('@/lib/firebase/config');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const profileRef = doc(db, 'user_permissions', user.uid);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile({
          displayName: data.displayName || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          clubName: data.clubName || "",
          email: data.email || user.email || "",
          disciplines: data.disciplines || []
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email || "",
          displayName: user.displayName || ""
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden des Profils:', error);
      toast({
        title: "Fehler",
        description: "Profil konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { db } = await import('@/lib/firebase/config');
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      
      const userPermissionsRef = doc(db, 'user_permissions', user.uid);
      const existingDoc = await getDoc(userPermissionsRef);
      const existingData = existingDoc.exists() ? existingDoc.data() : {};
      
      await setDoc(userPermissionsRef, {
        ...existingData,
        displayName: profile.displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        clubName: profile.clubName,
        email: profile.email,
        disciplines: profile.disciplines,
        updatedAt: new Date()
      }, { merge: true });

      const publicProfileRef = doc(db, 'public_profiles', user.uid);
      const publicProfileDoc = await getDoc(publicProfileRef);
      
      if (publicProfileDoc.exists()) {
        await setDoc(publicProfileRef, {
          displayName: profile.displayName,
          clubName: profile.clubName,
          updatedAt: new Date()
        }, { merge: true });
      }

      toast({
        title: "Profil gespeichert",
        description: "Ihre Profil-Informationen wurden erfolgreich aktualisiert."
      });
      
      router.push('/social');
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: "Fehler",
        description: error.message || "Profil konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <div className="text-center py-8">Lade Profil...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/social">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Social Training
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Profil bearbeiten</h1>
        <p className="text-muted-foreground">
          Diese Informationen werden in Trainingsgruppen und bei öffentlichen Profilen angezeigt
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persönliche Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Anzeigename *
            </Label>
            <Input
              id="displayName"
              value={profile.displayName}
              onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Wie sollen andere Sie sehen?"
            />
            <p className="text-xs text-muted-foreground">
              Dieser Name wird in Trainingsgruppen und Wettkämpfen angezeigt
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">
              Vorname
            </Label>
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Ihr Vorname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Nachname
            </Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Ihr Nachname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clubName" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Verein
            </Label>
            <Input
              id="clubName"
              value={profile.clubName}
              onChange={(e) => setProfile(prev => ({ ...prev, clubName: e.target.value }))}
              placeholder="Name Ihres Schützenvereins"
            />
            <p className="text-xs text-muted-foreground">
              Wird nur angezeigt, wenn Sie "Vereinszugehörigkeit anzeigen" aktiviert haben
            </p>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Disziplinen
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'KK', label: 'Kleinkaliber' },
                { id: 'LG', label: 'Luftgewehr' },
                { id: 'LP', label: 'Luftpistole' },
                { id: 'GK', label: 'Großkaliber' },
                { id: 'Pistole', label: 'Pistole' },
                { id: 'Bogen', label: 'Bogen' }
              ].map((discipline) => (
                <div key={discipline.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={discipline.id}
                    checked={profile.disciplines.includes(discipline.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setProfile(prev => ({
                          ...prev,
                          disciplines: [...prev.disciplines, discipline.id]
                        }));
                      } else {
                        setProfile(prev => ({
                          ...prev,
                          disciplines: prev.disciplines.filter(d => d !== discipline.id)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={discipline.id} className="text-sm cursor-pointer">
                    {discipline.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Hilft anderen, passende Trainingspartner und Wettkämpfe zu finden
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mail-Adresse
            </Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              E-Mail kann nur in den Account-Einstellungen geändert werden
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Datenschutz-Hinweis
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Der Anzeigename ist für Gruppenmitglieder immer sichtbar</li>
              <li>• Vor-/Nachname und Verein nur bei öffentlichem Profil</li>
              <li>• Sie können die Sichtbarkeit in den Profil-Einstellungen ändern</li>
            </ul>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving || !profile.displayName.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Speichere...' : 'Profil speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// src/app/admin/user-management/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { UserCog, Info, Loader2, SaveIcon, Users as UsersIcon, HelpCircle, ListChecks, Search, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Club, UserPermission } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, doc, setDoc, getDoc, Timestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
// Die Client-Funktionen für Cloud Functions werden hier NICHT mehr benötigt für die Rechtevergabe,
// aber könnten für andere Zwecke (wie User-Erstellung) wieder relevant werden.
// import { setUserRoleAndClubClient, getUserDetailsByEmailClient, getUsersWithoutRoleClient } from '@/lib/firebase/functions';

const CLUBS_COLLECTION = "clubs";
const USER_PERMISSIONS_COLLECTION = "user_permissions";

// Rollen zur Auswahl im Admin-Panel
const ROLES_OPTIONS = [
  { value: 'vereinsvertreter', label: 'Vereinsvertreter' },
  { value: 'mannschaftsfuehrer', label: 'Mannschaftsführer' },
  { value: 'NO_ROLE', label: 'Keine Rolle / Rolle entfernen' },
];

// Interface für die Eingabedaten des Formulars
interface UserPermissionFormData {
  uid: string;
  email: string;
  displayName: string;
  role: string; // Wird 'NO_ROLE' oder ein Rollenwert sein
  clubId1: string;
  clubId2: string;
  clubId3: string;
}

export default function AdminUserManagementPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<UserPermissionFormData>({
    uid: '',
    email: '',
    displayName: '',
    role: 'NO_ROLE',
    clubId1: '',
    clubId2: '',
    clubId3: '',
  });
  
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false); // Für Ladezustand beim Holen von Details

  // Lade alle Vereine für die Dropdowns
  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoadingClubs(true);
      try {
        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        setAllClubs(clubsSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Club)));
      } catch (error) {
        console.error("Error fetching clubs for user management:", error);
        toast({ title: "Fehler beim Laden der Vereine", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingClubs(false);
      }
    };
    fetchClubs();
  }, [toast]);

  // Lade bestehende Berechtigungen, wenn UID eingegeben wird (oder sich ändert)
  const fetchAndSetExistingPermissions = useCallback(async (uidToFetch: string) => {
    if (!uidToFetch.trim()) {
      // Wenn UID leer ist, Formular zurücksetzen (außer UID-Feld selbst)
      setFormData(prev => ({
        ...prev,
        email: '',
        displayName: '',
        role: 'NO_ROLE',
        clubId1: '',
        clubId2: '',
        clubId3: '',
      }));
      return;
    }
    setIsFetchingDetails(true);
    try {
      const userPermDocRef = doc(db, USER_PERMISSIONS_COLLECTION, uidToFetch.trim());
      const docSnap = await getDoc(userPermDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserPermission;
        setFormData({
          uid: uidToFetch.trim(),
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'NO_ROLE',
          clubId1: data.clubIds?.[0] || '',
          clubId2: data.clubIds?.[1] || '',
          clubId3: data.clubIds?.[2] || '',
        });
        toast({title: "Benutzerdaten geladen", description: `Berechtigungen für UID ${uidToFetch.trim()} geladen.`});
      } else {
        // UID nicht in user_permissions, Felder für neue Zuweisung vorbereiten
        // E-Mail und Name bleiben leer oder werden vom Admin manuell eingegeben
        setFormData(prev => ({
          ...prev, // Behalte die UID
          email: '', // Admin muss E-Mail eingeben
          displayName: '', // Admin muss Namen eingeben
          role: 'NO_ROLE',
          clubId1: '',
          clubId2: '',
          clubId3: '',
        }));
        toast({title: "Neuer Benutzer?", description: `Keine Berechtigungen für UID ${uidToFetch.trim()} gefunden. Bitte alle Felder ausfüllen.`, variant: "default"});
      }
    } catch (error) {
      console.error("Error fetching existing user permissions:", error);
      toast({ title: "Fehler", description: "Konnte bestehende Berechtigungen nicht laden.", variant: "destructive"});
    } finally {
      setIsFetchingDetails(false);
    }
  }, [toast]);
  
  // Effekt, der auf Änderungen der UID im Formular reagiert
  useEffect(() => {
    if (formData.uid.trim().length >= 20) { // Typische Länge einer Firebase UID
      fetchAndSetExistingPermissions(formData.uid);
    }
  }, [formData.uid, fetchAndSetExistingPermissions]);


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof UserPermissionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPermissions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUser || adminUser.email !== "admin@rwk-einbeck.de") {
      toast({ title: "Nicht autorisiert", description: "Nur der Super-Admin darf Benutzerberechtigungen ändern.", variant: "destructive" });
      return;
    }
    if (!formData.uid.trim()) {
      toast({ title: "UID fehlt", description: "Bitte geben Sie die User-ID (UID) des Benutzers ein.", variant: "warning" });
      return;
    }
     if (!formData.email.trim()) {
      toast({ title: "E-Mail fehlt", description: "Bitte geben Sie die E-Mail des Benutzers ein (wichtig für Referenz).", variant: "warning" });
      return;
    }

    const roleToSet = formData.role === 'NO_ROLE' ? null : formData.role;
    const rawClubIds = [formData.clubId1, formData.clubId2, formData.clubId3];
    const clubIdsToSet = rawClubIds.filter(id => id && id.trim() !== "").reduce((acc, id) => {
        if (!acc.includes(id)) acc.push(id); 
        return acc;
    }, [] as string[]);

    if (clubIdsToSet.length > 3) {
      toast({ title: "Zu viele Vereine", description: "Einem Benutzer können maximal 3 Vereine zugewiesen werden.", variant: "destructive" });
      return;
    }
    if ((roleToSet === 'vereinsvertreter' || roleToSet === 'mannschaftsfuehrer') && clubIdsToSet.length === 0) {
      toast({ title: "Fehlende Vereinszuweisung", description: `Für die Rolle '${roleToSet}' muss mindestens ein Verein ausgewählt werden.`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const userPermissionRef = doc(db, USER_PERMISSIONS_COLLECTION, formData.uid.trim());
      const permissionData: UserPermission = {
        uid: formData.uid.trim(),
        email: formData.email.trim(),
        displayName: formData.displayName.trim() || null,
        role: roleToSet as UserPermission['role'], // Cast, da wir 'NO_ROLE' behandeln
        clubIds: clubIdsToSet.length > 0 ? clubIdsToSet : null,
        lastUpdated: Timestamp.now(),
      };

      await setDoc(userPermissionRef, permissionData, { merge: true });

      toast({ title: "Berechtigungen gespeichert", description: `Berechtigungen für UID ${formData.uid.trim()} erfolgreich in Firestore gespeichert.` });
      // Formular zurücksetzen nach Erfolg
      setFormData({
        uid: '', email: '', displayName: '', role: 'NO_ROLE', clubId1: '', clubId2: '', clubId3: '',
      });
    } catch (error: any) {
      console.error("Error saving permissions to Firestore:", error);
      toast({ title: "Fehler beim Speichern", description: error.message || "Ein unbekannter Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  // Die Überprüfung auf adminUser.email erfolgt nun in den Firestore-Regeln serverseitig.
  // Die UI wird für alle angezeigt, aber nur der Admin kann Aktionen ausführen.

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <UserCog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Benutzerverwaltung & Berechtigungen</h1>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="anleitung-benutzeranlage">
        <AccordionItem value="anleitung-benutzeranlage">
          <AccordionTrigger className="text-lg font-semibold text-accent hover:no-underline">
            <HelpCircle className="mr-2 h-5 w-5" /> Anleitung: Benutzer manuell anlegen & Berechtigungen zuweisen (OHNE Cloud Functions)
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/30 rounded-md space-y-3 text-sm">
              <p className="font-medium text-destructive">Wichtiger Hinweis: Dieser Prozess erfordert KEINE Cloud Functions für die Rechtevergabe, sondern direkte Einträge in Firestore.</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>
                  <strong>Benutzer in Firebase Authentication anlegen (Manuell durch Super-Admin):</strong>
                  <ul className="list-disc list-inside pl-6 text-xs text-muted-foreground space-y-1">
                    <li>Gehe zur <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Firebase Konsole</a> deines Projekts.</li>
                    <li>Navigiere zu "Authentication" -> Tab "Users".</li>
                    <li>Klicke auf "Add user".</li>
                    <li>Gib die E-Mail-Adresse und ein initiales Passwort für den neuen Benutzer ein.</li>
                    <li>Nach dem Erstellen: **Kopiere die User-ID (UID)** dieses neuen Benutzers. Du benötigst sie im nächsten Schritt.</li>
                  </ul>
                </li>
                <li>
                  <strong>Berechtigungen in dieser App zuweisen (Formular unten):</strong>
                  <ul className="list-disc list-inside pl-6 text-xs text-muted-foreground space-y-1">
                    <li>Gib die kopierte **User-ID (UID)** in das Feld "User-ID (UID) des Benutzers" unten ein.</li>
                    <li>Gib die **E-Mail** und den (optionalen) **Anzeigenamen** des Benutzers ein. Diese werden zur Referenz in den Berechtigungen gespeichert.</li>
                    <li>Wähle die gewünschte Rolle (z.B. "Vereinsvertreter", "Mannschaftsführer").</li>
                    <li>Wähle bis zu 3 Vereine aus, die der Benutzer verwalten darf (relevant für "Vereinsvertreter" und "Mannschaftsführer").</li>
                    <li>Klicke auf "Berechtigungen speichern". Die Berechtigungen werden in der Firestore-Collection `user_permissions` unter der UID des Benutzers gespeichert.</li>
                  </ul>
                </li>
                <li>
                  <strong>Benutzer informieren:</strong> Teile dem Benutzer seine Anmeldedaten (E-Mail und initiales Passwort) mit. Er sollte sein Passwort nach dem ersten Login ändern.
                </li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Berechtigungen für Benutzer zuweisen/ändern</CardTitle>
          <CardDescription>
            Weisen Sie einem Benutzer (identifiziert durch seine UID) eine Rolle und bis zu 3 Vereine zu.
            Die Berechtigungen werden in Firestore (`user_permissions` Collection) gespeichert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPermissions} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="uid">User-ID (UID) des Benutzers</Label>
                <Input
                  id="uid"
                  name="uid"
                  type="text"
                  placeholder="UID aus Firebase Authentication"
                  value={formData.uid}
                  onChange={handleInputChange}
                  required
                  className="font-mono text-xs"
                />
                 <p className="text-xs text-muted-foreground">Wird automatisch geladen/gesetzt, wenn UID bekannt ist.</p>
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="email">E-Mail des Benutzers</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="E-Mail für Referenz"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="displayName">Anzeigename (Optional)</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Vorname Nachname"
                  value={formData.displayName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="role">Rolle zuweisen</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleSelectChange('role', value)}
              >
                <SelectTrigger id="role"><SelectValue placeholder="Rolle auswählen" /></SelectTrigger>
                <SelectContent>
                  {ROLES_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {(formData.role === 'vereinsvertreter' || formData.role === 'mannschaftsfuehrer') && (
              <>
                <p className="text-sm font-medium text-muted-foreground pt-2">Vereine zuweisen (max. 3):</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(index => (
                    <div key={index} className="space-y-1.5">
                      <Label htmlFor={`clubId${index}`}>Verein ${index}</Label>
                      <Select
                        value={formData[`clubId${index}` as keyof UserPermissionFormData]}
                        onValueChange={(value) => handleSelectChange(`clubId${index}` as keyof UserPermissionFormData, value === "NONE" ? "" : value)}
                        disabled={isLoadingClubs || allClubs.length === 0}
                      >
                        <SelectTrigger id={`clubId${index}`}><SelectValue placeholder={`Verein ${index} wählen`} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">- Keinen -</SelectItem>
                          {allClubs.filter(c => c.id && c.id.trim() !== "").map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Ein Vereinsvertreter/Mannschaftsführer muss mindestens einem Verein zugewiesen sein.</p>
              </>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingClubs || !formData.uid.trim() || isFetchingDetails}>
              {(isSubmitting || isFetchingDetails) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Berechtigungen speichern
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg mt-8">
        <CardHeader>
            <CardTitle className="text-xl text-accent flex items-center">
                <Info className="mr-2 h-5 w-5"/>Wichtige Hinweise zur Benutzerverwaltung (Aktueller Stand - OHNE Cloud Functions für Rechte)
            </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
            <div className="p-4 bg-background rounded-md space-y-2">
                <p className="font-semibold">Aktueller Workflow für Super-Admin:</p>
                <ol className="list-decimal list-inside pl-4 text-muted-foreground space-y-1">
                    <li>Benutzer **manuell in der Firebase Authentication Konsole anlegen** (E-Mail & Passwort). UID von dort kopieren.</li>
                    <li>Auf dieser Seite die **UID, E-Mail und Anzeigenamen** des Benutzers eintragen.</li>
                    <li>Rolle und bis zu 3 Vereine auswählen.</li>
                    <li>Auf "Berechtigungen speichern" klicken. Dies schreibt die Daten in die Firestore-Collection `user_permissions`.</li>
                </ol>
                <p className="font-semibold mt-3">Sicherheit:</p>
                <ul className="list-disc list-inside pl-4 text-muted-foreground">
                    <li>Die Firestore-Sicherheitsregeln für die `user_permissions`-Collection MÜSSEN so konfiguriert sein, dass nur der Super-Admin Schreibzugriff hat.</li>
                    <li>Vereinsvertreter/Mannschaftsführer lesen ihre Berechtigungen aus `user_permissions`, um clientseitig ihre Vereins-IDs zu erhalten. Die serverseitige Durchsetzung dieser Rechte in Firestore-Regeln für andere Collections (z.B. `rwk_teams`) ist der nächste Schritt.</li>
                </ul>
                <p className="font-semibold mt-3">Zukünftige Entwicklung (wenn wieder relevant):</p>
                <ul className="list-disc list-inside pl-4 text-muted-foreground">
                    <li>Client-seitige Nutzung der `user_permissions` in den VV-Seiten (ersetzt die temporäre `VV_CLUB_ASSIGNMENTS`-Map).</li>
                    <li>Firestore-Sicherheitsregeln für `rwk_teams`, `rwk_shooters`, etc. anpassen, um die in `user_permissions` gespeicherten `clubIds` serverseitig zu validieren.</li>
                    <li>Anzeige von "Nutzern ohne Berechtigung": Dies würde idealerweise eine Cloud Function (`getUsersWithoutRole`) erfordern, um alle Auth-Nutzer aufzulisten und mit `user_permissions` abzugleichen. Ohne Cloud Function ist dies nur schwer umsetzbar.</li>
                    <li>Direktes Anlegen von Firebase Auth-Nutzern aus dieser UI heraus (erfordert eine Cloud Function `createAuthUser`).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

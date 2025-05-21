
// src/app/admin/user-management/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { UserCog, Info, Loader2, SaveIcon, Users as UsersIcon, HelpCircle, ListChecks, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Club, UserPermission } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
// Import für Client-seitige Aufrufe der (aktuell nicht genutzten) Cloud Functions
// import { setUserRoleAndClubClient, getUserDetailsByEmailClient, getUsersWithoutRoleClient } from '@/lib/firebase/functions';

const CLUBS_COLLECTION = "clubs";
const USER_PERMISSIONS_COLLECTION = "user_permissions";

const ROLES = [
  { value: 'vereinsvertreter', label: 'Vereinsvertreter' },
  { value: 'NO_ROLE', label: 'Keine Rolle / Rolle entfernen' },
];

interface FetchedUser {
  uid: string;
  email?: string;
  displayName?: string | null;
}

export default function AdminUserManagementPage() {
  const { user: adminUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // States für das Hauptformular (Berechtigungen zuweisen)
  const [targetUidInput, setTargetUidInput] = useState('');
  const [targetEmailInput, setTargetEmailInput] = useState(''); // Wird jetzt auch für Speicherung in user_permissions genutzt
  const [targetDisplayNameInput, setTargetDisplayNameInput] = useState(''); // Ebenfalls für user_permissions

  const [selectedRole, setSelectedRole] = useState<string>('NO_ROLE');
  const [selectedClubId1, setSelectedClubId1] = useState<string>('');
  const [selectedClubId2, setSelectedClubId2] = useState<string>('');
  const [selectedClubId3, setSelectedClubId3] = useState<string>('');

  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false); // Für "Benutzer prüfen" Ladezustand

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

  // Lade bestehende Berechtigungen, wenn UID eingegeben wird
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (targetUidInput.trim()) {
        setIsSubmitting(true); // Zeige Ladeindikator, während Daten geholt werden
        try {
          const userPermDocRef = doc(db, USER_PERMISSIONS_COLLECTION, targetUidInput.trim());
          const docSnap = await getDoc(userPermDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserPermission;
            setTargetEmailInput(data.email || ''); // E-Mail aus DB setzen
            setTargetDisplayNameInput(data.displayName || ''); // Anzeigename aus DB
            setSelectedRole(data.role || 'NO_ROLE');
            setSelectedClubId1(data.clubIds?.[0] || '');
            setSelectedClubId2(data.clubIds?.[1] || '');
            setSelectedClubId3(data.clubIds?.[2] || '');
          } else {
            // UID nicht in user_permissions, Felder für neue Zuweisung vorbereiten
            // E-Mail und Name bleiben wie vom Admin ggf. eingegeben (oder leer)
            setSelectedRole('NO_ROLE');
            setSelectedClubId1('');
            setSelectedClubId2('');
            setSelectedClubId3('');
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
          toast({ title: "Fehler", description: "Konnte bestehende Berechtigungen nicht laden.", variant: "destructive"});
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    // Debounce oder manueller Trigger wäre besser, aber für jetzt direkt bei UID-Änderung
    if (targetUidInput.trim().length > 5) { // Einfache Längenprüfung um nicht bei jeder Taste zu feuern
        fetchUserPermissions();
    } else {
        // Reset form if UID is too short or cleared, but keep email/name if user is typing them for a new assignment
        setSelectedRole('NO_ROLE');
        setSelectedClubId1('');
        setSelectedClubId2('');
        setSelectedClubId3('');
    }
  }, [targetUidInput, toast]);


  const resetFormFields = useCallback(() => {
    setTargetUidInput('');
    setTargetEmailInput('');
    setTargetDisplayNameInput('');
    setSelectedRole('NO_ROLE');
    setSelectedClubId1('');
    setSelectedClubId2('');
    setSelectedClubId3('');
  }, []);

  const handleSubmitPermissions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUser || adminUser.email !== "admin@rwk-einbeck.de") {
      toast({ title: "Nicht autorisiert", description: "Nur der Super-Admin darf Benutzerberechtigungen ändern.", variant: "destructive" });
      return;
    }
    if (!targetUidInput.trim()) {
      toast({ title: "UID fehlt", description: "Bitte geben Sie die User-ID (UID) des Benutzers ein.", variant: "warning" });
      return;
    }
    if (!targetEmailInput.trim()) {
      toast({ title: "E-Mail fehlt", description: "Bitte geben Sie die E-Mail des Benutzers ein.", variant: "warning" });
      return;
    }

    const roleToSet = selectedRole === 'NO_ROLE' ? null : selectedRole;
    const rawClubIds = [selectedClubId1, selectedClubId2, selectedClubId3];
    const clubIdsToSet = rawClubIds.filter(id => id && id.trim() !== "").reduce((acc, id) => {
        if (!acc.includes(id)) acc.push(id); 
        return acc;
    }, [] as string[]);


    if (clubIdsToSet.length > 3) {
      toast({ title: "Zu viele Vereine", description: "Einem Benutzer können maximal 3 Vereine zugewiesen werden.", variant: "destructive" });
      return;
    }
    if (roleToSet === 'vereinsvertreter' && clubIdsToSet.length === 0) {
      toast({ title: "Fehlende Vereinszuweisung", description: "Für die Rolle 'Vereinsvertreter' muss mindestens ein Verein ausgewählt werden.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const userPermissionRef = doc(db, USER_PERMISSIONS_COLLECTION, targetUidInput.trim());
      const permissionData: UserPermission = {
        uid: targetUidInput.trim(),
        email: targetEmailInput.trim(),
        displayName: targetDisplayNameInput.trim() || null,
        role: roleToSet,
        clubIds: clubIdsToSet.length > 0 ? clubIdsToSet : null,
        lastUpdated: Timestamp.now(),
      };

      await setDoc(userPermissionRef, permissionData, { merge: true }); // merge: true um nicht-übergebene Felder zu erhalten, falls Struktur komplexer wird

      toast({ title: "Berechtigungen gespeichert", description: `Berechtigungen für UID ${targetUidInput.trim()} erfolgreich in Firestore gespeichert.` });
      resetFormFields();
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
  if (!adminUser || adminUser.email !== "admin@rwk-einbeck.de") {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Zugriff verweigert</CardTitle></CardHeader>
          <CardContent><p>Sie haben keine Berechtigung, diese Seite anzuzeigen.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <UserCog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Benutzerverwaltung & Berechtigungen</h1>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="anleitung-benutzeranlage">
        <AccordionItem value="anleitung-benutzeranlage">
          <AccordionTrigger className="text-lg font-semibold text-accent hover:no-underline">
            <HelpCircle className="mr-2 h-5 w-5" /> Anleitung: Benutzer manuell anlegen & Berechtigungen zuweisen
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/30 rounded-md space-y-3 text-sm">
              <p className="font-medium">Wichtiger Hinweis: Dieser Prozess erfordert keine Cloud Functions für die Rechtevergabe.</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>
                  <strong>Benutzer in Firebase Authentication anlegen (Manuell):</strong>
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
                    <li>Gib die **E-Mail** und den **Anzeigenamen** des Benutzers ein (diese werden für die Referenz in den Berechtigungen gespeichert).</li>
                    <li>Wähle die gewünschte Rolle (z.B. "Vereinsvertreter").</li>
                    <li>Wähle bis zu 3 Vereine aus, die der Benutzer verwalten darf.</li>
                    <li>Klicke auf "Berechtigungen speichern". Die Berechtigungen werden in der Firestore-Collection `user_permissions` gespeichert.</li>
                  </ul>
                </li>
                <li>
                  <strong>Benutzer informieren:</strong> Teile dem Benutzer seine Anmeldedaten (E-Mail und initiales Passwort) mit.
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
            <div className="space-y-1.5">
              <Label htmlFor="targetUidInput">User-ID (UID) des Benutzers</Label>
              <Input
                id="targetUidInput"
                type="text"
                placeholder="UID aus Firebase Authentication einfügen"
                value={targetUidInput}
                onChange={(e) => {
                    setTargetUidInput(e.target.value);
                    // Optional: Felder leeren, wenn UID geändert wird, außer E-Mail/Name, falls Admin gerade neuen User anlegt
                    if (targetUidInput !== e.target.value) {
                        setSelectedRole('NO_ROLE');
                        setSelectedClubId1('');
                        setSelectedClubId2('');
                        setSelectedClubId3('');
                    }
                }}
                required
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">Die UID finden Sie in der Firebase Konsole unter Authentication -> Users.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="targetEmailInputForm">E-Mail des Benutzers (zur Referenz)</Label>
                    <Input
                    id="targetEmailInputForm"
                    type="email"
                    placeholder="E-Mail des Benutzers"
                    value={targetEmailInput}
                    onChange={(e) => setTargetEmailInput(e.target.value)}
                    required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="targetDisplayNameInputForm">Anzeigename (Optional, zur Referenz)</Label>
                    <Input
                    id="targetDisplayNameInputForm"
                    type="text"
                    placeholder="Vorname Nachname"
                    value={targetDisplayNameInput}
                    onChange={(e) => setTargetDisplayNameInput(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Rolle zuweisen</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role"><SelectValue placeholder="Rolle auswählen" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRole === 'vereinsvertreter' && (
              <>
                <p className="text-sm font-medium text-muted-foreground">Vereine zuweisen (max. 3):</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(index => (
                    <div key={index} className="space-y-1.5">
                      <Label htmlFor={`club${index}`}>Verein ${index}</Label>
                      <Select
                        value={
                          index === 1 ? selectedClubId1 :
                          index === 2 ? selectedClubId2 : selectedClubId3
                        }
                        onValueChange={(value) => {
                          if (index === 1) setSelectedClubId1(value);
                          else if (index === 2) setSelectedClubId2(value);
                          else setSelectedClubId3(value);
                        }}
                        disabled={isLoadingClubs || allClubs.length === 0}
                      >
                        <SelectTrigger id={`club${index}`}><SelectValue placeholder={`Verein ${index} wählen`} /></SelectTrigger>
                        <SelectContent>
                          {/* <SelectItem value="">- Keinen -</SelectItem>  REMOVED - This was the cause of the error */ }
                          {allClubs.filter(club => club.id).map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Ein Vereinsvertreter muss mindestens einem Verein zugewiesen sein.</p>
              </>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingClubs || !targetUidInput.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
              Berechtigungen speichern
            </Button>
          </form>
        </CardContent>
      </Card>
       <Card className="shadow-lg mt-8">
        <CardHeader>
            <CardTitle className="text-xl text-accent flex items-center">
                <Info className="mr-2 h-5 w-5"/>Hinweise zur Benutzerverwaltung (Aktueller Stand)
            </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
            <p className="text-muted-foreground">
                Dieser Ansatz zur Rechtevergabe speichert Rollen und Vereinszuweisungen in einer Firestore-Collection (`user_permissions`) anstatt Firebase Custom Claims zu verwenden.
                Dies vermeidet die Notwendigkeit des "Blaze" Bezahlplans für Cloud Functions zum *Setzen* dieser Berechtigungen direkt aus der App.
            </p>
            <div className="pl-2 space-y-2">
                <div>
                    <p className="font-semibold">Aktueller Workflow für Super-Admin:</p>
                    <ul className="list-disc list-inside pl-4 text-muted-foreground">
                        <li>Neue Benutzer müssen vom Super-Admin manuell in der Firebase Konsole (Authentication -> Users) angelegt werden. Die UID muss notiert werden.</li>
                        <li>Über das Formular oben werden der UID dann eine Rolle (z.B. "vereinsvertreter") und bis zu 3 Vereins-IDs zugewiesen. E-Mail und Anzeigename werden ebenfalls für die spätere Referenz hier eingegeben und in `user_permissions` gespeichert.</li>
                    </ul>
                </div>
                 <div>
                    <p className="font-semibold">Sicherheit:</p>
                    <ul className="list-disc list-inside pl-4 text-muted-foreground">
                        <li>Die Firestore-Sicherheitsregeln für die `user_permissions`-Collection MÜSSEN so konfiguriert sein, dass nur der Super-Admin Schreibzugriff hat.</li>
                        <li>Vereinsvertreter können (zukünftig) ihre eigenen Berechtigungen aus `user_permissions` lesen, um clientseitig ihre Vereins-IDs zu erhalten, aber nicht ändern.</li>
                    </ul>
                </div>
                <div>
                    <p className="font-semibold">Nächste Schritte (zukünftige Entwicklung, falls Custom Claims doch genutzt werden oder erweiterte Funktionen benötigt werden):</p>
                     <div className="text-muted-foreground">
                        <ul className="list-disc list-inside pl-4">
                          <li>Die App-Logik (insbesondere die Vereinsvertreter-Seiten) muss angepasst werden, um diese Berechtigungen aus `user_permissions` auszulesen, anstatt die temporäre `VV_CLUB_ASSIGNMENTS`-Map zu verwenden.</li>
                          <li>Die Firestore-Sicherheitsregeln müssen verfeinert werden, um den Zugriff basierend auf den in `user_permissions` gespeicherten Daten zu steuern (z.B. darf ein VV nur Daten für seine `clubIds` bearbeiten).</li>
                           <li>Das Auflisten von "Nutzern ohne Berechtigung" erfordert serverseitige Logik (z.B. eine Cloud Function), da Firebase Auth User nicht einfach clientseitig aufgelistet werden können, um deren Berechtigungsstatus zu prüfen.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

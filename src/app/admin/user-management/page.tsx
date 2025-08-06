"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { UserCog, Info, Loader2, SaveIcon, Users as UsersIcon, HelpCircle, ListChecks, Search, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Club, UserPermission } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { UserList } from './user-list';
import { CreateUserFormLocal } from '@/components/admin/create-user-form-local';
import { MultiClubSelector } from '@/components/admin/multi-club-selector';
import Link from 'next/link';

const CLUBS_COLLECTION = "clubs";
const USER_PERMISSIONS_COLLECTION = "user_permissions";

const ROLES_OPTIONS = [
  { value: 'vereinsvertreter', label: 'Vereinsvertreter' },
  { value: 'mannschaftsfuehrer', label: 'Mannschaftsführer' },
  { value: 'km_organisator', label: 'KM-Organisator' },
  { value: 'NO_ROLE', label: 'Keine Rolle / Rolle entfernen' },
];

interface UserPermissionFormData {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  selectedClubId: string; // Legacy - Hauptverein
  selectedClubIds: string[]; // Multi-Verein-Support
}

export default function AdminUserManagementPage() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<UserPermissionFormData>({
    uid: '',
    email: '',
    displayName: '',
    role: 'NO_ROLE',
    selectedClubId: '',
    selectedClubIds: [],
  });
  
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoadingClubs(true);
      try {
        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs = clubsSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Club));
        setAllClubs(fetchedClubs.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== ""));
      } catch (error) {
        console.error("Error fetching clubs for user management:", error);
        toast({ title: "Fehler beim Laden der Vereine", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingClubs(false);
      }
    };
    fetchClubs();
  }, [toast]);

  const fetchAndSetExistingPermissions = useCallback(async (uidToFetch: string) => {
    if (!uidToFetch.trim()) {
      setFormData(prev => ({
        ...prev, email: '', displayName: '', role: 'NO_ROLE', selectedClubId: '',
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
          selectedClubId: data.clubId || '',
          selectedClubIds: data.representedClubs || (data.clubId ? [data.clubId] : []),
        });
        toast({title: "Benutzerdaten geladen", description: `Berechtigungen für UID ${uidToFetch.trim()} geladen.`});
      } else {
        setFormData(prev => ({
          ...prev, uid: uidToFetch.trim(), email: '', displayName: '', role: 'NO_ROLE', selectedClubId: '',
        }));
        toast({title: "Neuer Benutzer?", description: `Keine Berechtigungen für UID ${uidToFetch.trim()} gefunden. Bitte E-Mail und Anzeigenamen eintragen.`, variant: "default"});
      }
    } catch (error) {
      console.error("Error fetching existing user permissions:", error);
      toast({ title: "Fehler", description: "Konnte bestehende Berechtigungen nicht laden.", variant: "destructive"});
    } finally {
      setIsFetchingDetails(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (formData.uid.trim().length >= 20) { 
      fetchAndSetExistingPermissions(formData.uid);
    } else if (formData.uid.trim().length === 0) {
        setFormData(prev => ({
        ...prev, email: '', displayName: '', role: 'NO_ROLE', selectedClubId: '',
      }));
    }
  }, [formData.uid, fetchAndSetExistingPermissions]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Pick<UserPermissionFormData, 'role' | 'selectedClubId'>, value: string) => {
    if (name === 'role' && value === 'km_organisator') {
      // Automatisch alle Vereine für KM-Organisator auswählen
      const allClubIds = allClubs.map(club => club.id);
      setFormData(prev => ({ ...prev, [name]: value, selectedClubIds: allClubIds }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitPermissions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUser || adminUser.email !== "admin@rwk-einbeck.de") {
      toast({ title: "Nicht autorisiert", variant: "destructive" }); return;
    }
    if (!formData.uid.trim()) {
      toast({ title: "UID fehlt", description: "Bitte User-ID (UID) eingeben.", variant: "warning" }); return;
    }
    if (!formData.email.trim()) {
      toast({ title: "E-Mail fehlt", description: "Bitte E-Mail des Benutzers eingeben (wird in user_permissions gespeichert).", variant: "warning" }); return;
    }

    const roleToSet = formData.role === 'NO_ROLE' ? null : formData.role;
    const clubIdToSet = formData.selectedClubIds.length > 0 ? formData.selectedClubIds[0] : null;
    
    if ((roleToSet === 'vereinsvertreter' || roleToSet === 'mannschaftsfuehrer') && !clubIdToSet) {
      toast({ title: "Fehlende Vereinszuweisung", description: `Für die Rolle '${roleToSet}' muss ein Verein ausgewählt werden.`, variant: "destructive" }); return;
    }
    
    // KM-Organisator braucht keinen spezifischen Verein
    if (roleToSet === 'km_organisator') {
      // Setze alle Vereine für KM-Organisator
      const allClubIds = allClubs.map(club => club.id);
      setFormData(prev => ({ ...prev, selectedClubIds: allClubIds }));
    }

    setIsSubmitting(true);
    try {
      const userPermissionRef = doc(db, USER_PERMISSIONS_COLLECTION, formData.uid.trim());
      const permissionData: UserPermission = {
        uid: formData.uid.trim(),
        email: formData.email.trim(),
        displayName: formData.displayName.trim() || null,
        role: roleToSet as UserPermission['role'],
        clubId: clubIdToSet,
        representedClubs: formData.selectedClubIds.length > 0 ? formData.selectedClubIds : undefined,
        lastUpdated: Timestamp.now(),
      };

      await setDoc(userPermissionRef, permissionData, { merge: true });
      toast({ title: "Berechtigungen gespeichert", description: `Berechtigungen für UID ${formData.uid.trim()} erfolgreich in Firestore gespeichert.` });
      
      setFormData({
        uid: '', email: '', displayName: '', role: 'NO_ROLE', selectedClubId: '', selectedClubIds: [],
      });
      
      // Aktualisiere die Benutzerliste
      setRefreshTrigger(prev => prev + 1);

    } catch (error: any) {
      console.error("Error saving permissions to Firestore:", error);
      toast({ title: "Fehler beim Speichern", description: error.message || "Unbekannter Fehler.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditUser = (user: UserPermission) => {
    setFormData({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: user.role || 'NO_ROLE',
      selectedClubId: user.clubId || '',
      selectedClubIds: user.representedClubs || (user.clubId ? [user.clubId] : []),
    });
    setActiveTab("edit");
  };
  
  const handleUserCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (!adminUser) { // Einfache Ladeanzeige, bis Admin-User geladen ist
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCog className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Benutzerverwaltung & Berechtigungen</h1>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="create">Neuen Benutzer erstellen</TabsTrigger>
          <TabsTrigger value="edit">Berechtigungen bearbeiten</TabsTrigger>
          <TabsTrigger value="list">Benutzerübersicht</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          <CreateUserFormLocal clubs={allClubs} onUserCreated={handleUserCreated} />
        </TabsContent>
        
        <TabsContent value="edit" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Berechtigungen für Benutzer zuweisen/ändern</CardTitle>
              <CardDescription>
                Weisen Sie einem Benutzer (identifiziert durch seine UID) eine Rolle und einen Verein zu.
                Die Berechtigungen werden in Firestore (`user_permissions` Collection) gespeichert.
                E-Mail und Anzeigename dienen hier zur Referenz und sollten mit Firebase Auth übereinstimmen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPermissions} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5 md:col-span-1">
                    <Label htmlFor="uid">User-ID (UID) des Benutzers</Label>
                    <Input id="uid" name="uid" type="text" placeholder="UID aus Firebase Authentication" value={formData.uid} onChange={handleInputChange} required className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <Label htmlFor="email">E-Mail des Benutzers</Label>
                    <Input id="email" name="email" type="email" placeholder="E-Mail (aus Firebase Auth)" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <Label htmlFor="displayName">Anzeigename (Optional)</Label>
                    <Input id="displayName" name="displayName" type="text" placeholder="Vorname Nachname" value={formData.displayName} onChange={handleInputChange} />
                  </div>
                </div>
                
                {isFetchingDetails && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Lade bestehende Berechtigungen...</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="roleSelect">Rolle zuweisen</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => handleSelectChange('role', value)}
                    >
                      <SelectTrigger id="roleSelect"><SelectValue placeholder="Rolle auswählen" /></SelectTrigger>
                      <SelectContent>
                        {ROLES_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                
                  <div className="space-y-1.5">
                    <MultiClubSelector
                      clubs={allClubs}
                      selectedClubIds={formData.selectedClubIds}
                      onSelectionChange={(clubIds) => setFormData(prev => ({ ...prev, selectedClubIds: clubIds }))}
                      disabled={isLoadingClubs}
                    />
                    <p className="text-xs text-muted-foreground">Der erste ausgewählte Verein wird als Hauptverein gesetzt</p>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingClubs || !formData.uid.trim() || isFetchingDetails}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Berechtigungen speichern
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Stellen Sie sicher, dass die UID, E-Mail und der Anzeigename mit den Daten des Benutzers in Firebase Authentication übereinstimmen, um Verwirrung zu vermeiden.
                Die hier gespeicherten E-Mail/Namen dienen nur der einfacheren Identifizierung in der `user_permissions`-Tabelle und überschreiben nicht die Auth-Daten.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <UserList 
            clubs={allClubs} 
            onEditUser={handleEditUser} 
            refreshTrigger={refreshTrigger} 
          />
        </TabsContent>
      </Tabs>

      <Accordion type="single" collapsible className="w-full" defaultValue="anleitung-benutzeranlage">
        <AccordionItem value="anleitung-benutzeranlage">
          <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
            <HelpCircle className="mr-2 h-5 w-5" /> Anleitung: Benutzer anlegen & Berechtigungen zuweisen
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/30 rounded-md space-y-3 text-sm">
              <p className="font-semibold">Workflow zur Benutzerverwaltung:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>
                  <strong>Schritt 1: Benutzer in Firebase Authentication anlegen (Manuell durch Super-Admin):</strong>
                  <ul className="list-disc list-inside pl-6 text-xs text-muted-foreground space-y-1">
                    <li>Gehe zur <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Firebase Konsole</a> deines Projekts.</li>
                    <li>Navigiere zu "Authentication" → Tab "Users".</li>
                    <li>Klicke auf "Add user".</li>
                    <li>Gib die E-Mail-Adresse und ein initiales Passwort für den neuen Benutzer ein. Lege optional einen Anzeigenamen fest.</li>
                    <li>Nach dem Erstellen: <strong>Kopiere die User-ID (UID)</strong> dieses neuen Benutzers. Diese ist entscheidend.</li>
                  </ul>
                </li>
                <li>
                  <strong>Schritt 2: Berechtigungen in dieser App zuweisen:</strong>
                  <ul className="list-disc list-inside pl-6 text-xs text-muted-foreground space-y-1">
                    <li>Wechsle zum Tab "Neuen Benutzer erstellen".</li>
                    <li>Gib die kopierte <strong>User-ID (UID)</strong> in das entsprechende Feld ein.</li>
                    <li>Gib die <strong>E-Mail</strong> und den <strong>Anzeigenamen</strong> des Benutzers ein.</li>
                    <li>Wähle die gewünschte Rolle (z.B. "Vereinsvertreter", "Mannschaftsführer").</li>
                    <li>Wähle den Verein aus, den der Benutzer verwalten darf.</li>
                    <li>Klicke auf "Berechtigungen speichern".</li>
                  </ul>
                </li>
                <li>
                  <strong>Schritt 3: Benutzer informieren:</strong> Teile dem Benutzer seine Anmeldedaten (E-Mail und initiales Passwort) mit und weise ihn darauf hin, sein Passwort nach dem ersten Login zu ändern.
                </li>
              </ol>
              <p className="mt-4 text-amber-700 font-medium">
                <strong>Hinweis:</strong> Da Sie den kostenlosen Spark-Plan verwenden, ist die automatische Benutzererstellung nicht verfügbar. Sie müssen Benutzer manuell in der Firebase Console erstellen und dann hier die Berechtigungen zuweisen.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

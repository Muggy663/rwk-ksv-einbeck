"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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

// Neue 3-Tier-Architektur
const PLATFORM_ROLES = [
  { value: 'SUPER_ADMIN', label: '🔥 Super Admin (Vollzugriff)' },
  { value: 'NO_PLATFORM_ROLE', label: 'Keine Platform-Rolle' },
];

const KV_ROLES = [
  { value: 'KV_WETTKAMPFLEITER', label: '🏆 KV-Wettkampfleiter (RWK + KM Vollzugriff)' },
  { value: 'KV_KM_ORGA', label: '📋 KV-KM-Orga (nur KM-System)' },
  { value: 'NO_KV_ROLE', label: 'Keine KV-Rolle' },
];

const CLUB_ROLES = [
  { value: 'SPORTLEITER', label: '🎯 Sportleiter (RWK + KM Vollzugriff)' },
  { value: 'MANNSCHAFTSFUEHRER', label: '🏹 Mannschaftsführer (Ergebnisse eingeben)' },
  { value: 'NO_CLUB_ROLE', label: 'Keine Club-Rolle' },
];

interface UserPermissionFormData {
  uid: string;
  email: string;
  displayName: string;
  platformRole: string;
  kvRole: string;
  selectedClubId: string;
  clubRole: string;
  selectedClubIds: string[];

  isPremium: boolean;
  premiumMonths?: number;
  autoRenew?: boolean;
}

export default function AdminUserManagementPage() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<UserPermissionFormData>({
    uid: '',
    email: '',
    displayName: '',
    platformRole: 'NO_PLATFORM_ROLE',
    kvRole: 'NO_KV_ROLE',
    selectedClubId: '',
    clubRole: 'NO_CLUB_ROLE',
    selectedClubIds: [],

    isPremium: false,
    premiumMonths: 1,
    autoRenew: false,
  });
  
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoadingClubs(true);
      try {
        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs = clubsSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Club));
        setAllClubs(fetchedClubs.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== ""));
      } catch (error) {
        logError("Error fetching clubs for user management:", error);
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
        ...prev, email: '', displayName: '', platformRole: 'NO_PLATFORM_ROLE', kvRole: 'NO_KV_ROLE', clubRole: 'NO_CLUB_ROLE', selectedClubId: '',
      }));
      return;
    }
    setIsFetchingDetails(true);
    try {
      const userPermDocRef = doc(db, USER_PERMISSIONS_COLLECTION, uidToFetch.trim());
      const docSnap = await getDoc(userPermDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserPermission;
        
        const selectedClubIds = (() => {
          const clubIds = new Set<string>();
          if (data.representedClubs) {
            data.representedClubs.forEach(id => clubIds.add(id));
          }
          if (data.clubId) {
            clubIds.add(data.clubId);
          }
          if ((data as any).clubRoles) {
            Object.keys((data as any).clubRoles).forEach(id => clubIds.add(id));
          }
          return Array.from(clubIds);
        })();
        
        setFormData({
          uid: uidToFetch.trim(),
          email: data.email || '',
          displayName: data.displayName || '',
          platformRole: (data as any).platformRole || 'NO_PLATFORM_ROLE',
          kvRole: (data as any).kvRole || 'NO_KV_ROLE',
          clubRole: Object.values((data as any).clubRoles || {})[0] || 'NO_CLUB_ROLE',
          selectedClubId: data.clubId || Object.keys((data as any).clubRoles || {})[0] || '',
          selectedClubIds,
          isPremium: (data as any).isPremium || false,
          premiumMonths: 1,
          autoRenew: (data as any).autoRenew || false,
        });
        toast({title: "Benutzerdaten geladen", description: `Berechtigungen für UID ${uidToFetch.trim()} geladen.`});
      } else {
        setFormData(prev => ({
          ...prev, uid: uidToFetch.trim(), email: '', displayName: '', platformRole: 'NO_PLATFORM_ROLE', kvRole: 'NO_KV_ROLE', clubRole: 'NO_CLUB_ROLE', selectedClubId: '', isPremium: false,
        }));
        toast({title: "Neuer Benutzer?", description: `Keine Berechtigungen für UID ${uidToFetch.trim()} gefunden. Bitte E-Mail und Anzeigenamen eintragen.`, variant: "default"});
      }
    } catch (error) {
      logError("Error fetching existing user permissions:", error);
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
        ...prev, email: '', displayName: '', platformRole: 'NO_PLATFORM_ROLE', kvRole: 'NO_KV_ROLE', clubRole: 'NO_CLUB_ROLE', selectedClubId: '', isPremium: false,
      }));
    }
  }, [formData.uid, fetchAndSetExistingPermissions]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Pick<UserPermissionFormData, 'selectedClubId'>, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
      toast({ title: "E-Mail fehlt", description: "Bitte E-Mail des Benutzers eingeben.", variant: "warning" }); return;
    }

    // Validierung: Club-Rollen oder KV-Rollen mit Vereinen benötigen Vereinszuweisung
    const hasClubRole = formData.clubRole !== 'NO_CLUB_ROLE';
    const hasKvRole = formData.kvRole !== 'NO_KV_ROLE';
    const hasSelectedClubs = formData.selectedClubIds.length > 0;
    
    if ((hasClubRole || hasKvRole) && !hasSelectedClubs) {
      const roleType = hasClubRole ? `Club-Rolle '${formData.clubRole}'` : `KV-Rolle '${formData.kvRole}'`;
      toast({ title: "Fehlende Vereinszuweisung", description: `${roleType} benötigt mindestens einen Verein.`, variant: "destructive" }); return;
    }

    setIsSubmitting(true);
    try {
      const userPermissionRef = doc(db, USER_PERMISSIONS_COLLECTION, formData.uid.trim());
      
      // Neue 3-Tier-Struktur
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
      
      // Vereine und Club-Rollen verwalten
      if (formData.selectedClubIds.length > 0) {
        // Immer representedClubs setzen, auch ohne Club-Rolle (für KV-Rollen)
        permissionData.representedClubs = formData.selectedClubIds;
        permissionData.clubId = formData.selectedClubIds[0]; // Hauptverein
        
        // Club-Rollen nur setzen wenn eine Club-Rolle ausgewählt ist
        if (formData.clubRole !== 'NO_CLUB_ROLE') {
          const clubRoles: Record<string, string> = {};
          formData.selectedClubIds.forEach(clubId => {
            clubRoles[clubId] = formData.clubRole;
          });
          permissionData.clubRoles = clubRoles;
        } else {
          // Keine Club-Rolle, aber Vereine für KV-Zugang behalten
          permissionData.clubRoles = {};
        }
      } else {
        // Keine Vereine ausgewählt
        permissionData.clubRoles = {};
        permissionData.representedClubs = [];
        permissionData.clubId = null;
      }
      

      
      // Premium-Status
      if (formData.isPremium) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + (formData.premiumMonths || 1));
        
        permissionData.isPremium = true;
        permissionData.premiumUntil = Timestamp.fromDate(expiresAt);
        permissionData.premiumActivatedAt = Timestamp.now();
        permissionData.autoRenew = formData.autoRenew || false;
        permissionData.paymentMethod = 'admin_activated';
        
        // Automatische E-Mail-Verifizierung für Admin-aktivierte Premium-Nutzer
        try {
          const { updateUser } = await import('firebase/auth');
          const { auth } = await import('@/lib/firebase/config');
          
          // Setze emailVerified auf true für diesen User
          // Hinweis: Das funktioniert nur mit Admin SDK, nicht mit Client SDK
          logDebug('📧 E-Mail-Verifizierung für Premium-User:', formData.email);
          
          // Speichere Flag in Firestore dass E-Mail als verifiziert gilt
          permissionData.emailVerifiedByAdmin = true;
          permissionData.emailVerifiedAt = Timestamp.now();
          
        } catch (error) {
          logWarn('E-Mail-Verifizierung fehlgeschlagen:', error);
        }
      } else {
        permissionData.isPremium = false;
        permissionData.premiumUntil = null;
        permissionData.autoRenew = false;
      }

      // Erst bestehende Daten laden, dann gezielt überschreiben
      const existingDoc = await getDoc(userPermissionRef);
      let finalData = permissionData;
      
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        // Behalte alle bestehenden Felder und überschreibe nur die neuen
        finalData = {
          ...existingData,
          ...permissionData,
          // Stelle sicher dass clubRoles komplett überschrieben wird
          clubRoles: permissionData.clubRoles || {},
          representedClubs: permissionData.representedClubs || [],
        };
      }
      
      await setDoc(userPermissionRef, finalData);
      toast({ title: "✅ Berechtigungen gespeichert", description: `3-Tier-Rollen für ${formData.email} erfolgreich gespeichert.` });
      
      // Form zurücksetzen
      setFormData({
        uid: '', email: '', displayName: '', 
        platformRole: 'NO_PLATFORM_ROLE', kvRole: 'NO_KV_ROLE', clubRole: 'NO_CLUB_ROLE',
        selectedClubId: '', selectedClubIds: [], isPremium: false,
        premiumMonths: 1, autoRenew: false,
      });
      
      setRefreshTrigger(prev => prev + 1);

    } catch (error: any) {
      logError("Error saving permissions:", error);
      toast({ title: "Fehler beim Speichern", description: error.message || "Unbekannter Fehler.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditUser = (user: UserPermission) => {
    const selectedClubIds = (() => {
      const clubIds = new Set<string>();
      if (user.representedClubs) {
        user.representedClubs.forEach(id => clubIds.add(id));
      }
      if (user.clubId) {
        clubIds.add(user.clubId);
      }
      if ((user as any).clubRoles) {
        Object.keys((user as any).clubRoles).forEach(id => clubIds.add(id));
      }
      return Array.from(clubIds);
    })();
    
    setFormData({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      platformRole: (user as any).platformRole || 'NO_PLATFORM_ROLE',
      kvRole: (user as any).kvRole || 'NO_KV_ROLE',
      clubRole: Object.values((user as any).clubRoles || {})[0] || 'NO_CLUB_ROLE',
      selectedClubId: user.clubId || Object.keys((user as any).clubRoles || {})[0] || '',
      selectedClubIds,
      isPremium: (user as any).isPremium || false,
      premiumMonths: 1,
      autoRenew: (user as any).autoRenew || false,
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
    <div className="px-2 md:px-4 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <UserCog className="h-6 md:h-8 w-6 md:w-8 text-primary" />
          <h1 className="text-xl md:text-3xl font-bold text-primary">Benutzerverwaltung</h1>
        </div>
        <Link href="/admin">
          <Button variant="outline" className="w-full md:w-auto">
            Zurück zum Dashboard
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list" className="text-xs md:text-sm">Übersicht</TabsTrigger>
          <TabsTrigger value="edit" className="text-xs md:text-sm">🎯 Benutzer verwalten</TabsTrigger>
        </TabsList>
        

        
        <TabsContent value="edit" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">🎯 Benutzerverwaltung</CardTitle>
              <CardDescription>
                Benutzer anlegen und Rollen zuweisen. Kombiniert Erstellung und Rollenverwaltung in einem Formular.<br/>
                <strong>Platform-Rollen:</strong> System-weite Berechtigungen (SUPER_ADMIN)<br/>
                <strong>KV-Rollen:</strong> Kreisverband-Berechtigungen (KV_WETTKAMPFLEITER)<br/>
                <strong>Club-Rollen:</strong> Vereins-spezifische Rollen (SPORTLEITER, VORSTAND, MANNSCHAFTSFÜHRER, etc.)<br/>
                <strong>Premium:</strong> Schießnachweis Premium-Features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPermissions} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="uid">User-ID (UID) des Benutzers</Label>
                    <Input id="uid" name="uid" type="text" placeholder="UID aus Firebase Authentication" value={formData.uid} onChange={handleInputChange} required className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-Mail des Benutzers</Label>
                    <Input id="email" name="email" type="email" placeholder="E-Mail (aus Firebase Auth)" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">Anzeigename (Optional)</Label>
                    <Input id="displayName" name="displayName" type="text" placeholder="Vorname Nachname" value={formData.displayName} onChange={handleInputChange} />
                  </div>
                </div>
                
                {isFetchingDetails && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Lade bestehende Berechtigungen...</div>}

                {/* 3-Tier-Rollen-System */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="platformRoleSelect">🌐 Platform-Rolle</Label>
                    <Select 
                      value={formData.platformRole} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, platformRole: value }))}
                    >
                      <SelectTrigger id="platformRoleSelect"><SelectValue placeholder="Platform-Rolle" /></SelectTrigger>
                      <SelectContent>
                        {PLATFORM_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="kvRoleSelect">🏆 KV-Rolle</Label>
                    <Select 
                      value={formData.kvRole} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, kvRole: value }))}
                    >
                      <SelectTrigger id="kvRoleSelect"><SelectValue placeholder="KV-Rolle" /></SelectTrigger>
                      <SelectContent>
                        {KV_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="clubRoleSelect">🎯 Club-Rolle</Label>
                    <Select 
                      value={formData.clubRole} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, clubRole: value }))}
                    >
                      <SelectTrigger id="clubRoleSelect"><SelectValue placeholder="Club-Rolle" /></SelectTrigger>
                      <SelectContent>
                        {CLUB_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">

                  
                  <div className="space-y-3">
                    <Label>💎 Premium-Status (Schießnachweis)</Label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="isPremium"
                        checked={formData.isPremium || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPremium: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isPremium" className="text-sm">
                        Premium-Features aktivieren (Cloud-Sync, erweiterte Stats)
                      </Label>
                    </div>
                    {formData.isPremium && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                        <div className="space-y-1.5">
                          <Label htmlFor="premiumMonths" className="text-sm font-medium">Laufzeit (Monate)</Label>
                          <Input 
                            id="premiumMonths"
                            name="premiumMonths"
                            type="number"
                            min="1"
                            max="12"
                            placeholder="1"
                            value={formData.premiumMonths || 1}
                            onChange={(e) => setFormData(prev => ({ ...prev, premiumMonths: parseInt(e.target.value) || 1 }))}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Auto-Renewal</Label>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="autoRenew"
                              checked={formData.autoRenew || false}
                              onChange={(e) => setFormData(prev => ({ ...prev, autoRenew: e.target.checked }))}
                              className="rounded"
                            />
                            <Label htmlFor="autoRenew" className="text-sm">
                              Automatische Verlängerung
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>🏠 Vereine auswählen (Multi-Verein)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allClubIds = allClubs.map(club => club.id);
                            setFormData(prev => ({
                              ...prev,
                              selectedClubIds: allClubIds,
                              selectedClubId: allClubIds.length > 0 ? allClubIds[0] : ''
                            }));
                          }}
                          className="text-xs"
                        >
                          Alle auswählen
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              selectedClubIds: [],
                              selectedClubId: ''
                            }));
                          }}
                          className="text-xs"
                        >
                          Alle abwählen
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      {allClubs.map(club => (
                        <div key={club.id} className="flex items-center space-x-2 py-1">
                          <input 
                            type="checkbox" 
                            id={`club-${club.id}`}
                            checked={formData.selectedClubIds.includes(club.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  selectedClubIds: [...prev.selectedClubIds, club.id],
                                  selectedClubId: prev.selectedClubIds.length === 0 ? club.id : prev.selectedClubId
                                }));
                              } else {
                                const newIds = formData.selectedClubIds.filter(id => id !== club.id);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  selectedClubIds: newIds,
                                  selectedClubId: newIds.length > 0 ? newIds[0] : ''
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`club-${club.id}`} className="text-sm cursor-pointer">
                            {club.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Club-Rollen und KV-Rollen benötigen mindestens einen Verein. Erster Verein = Hauptverein.
                    </p>
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

// src/app/admin/email-system/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, FileText, Send, Plus, Trash2, Edit, Save, X, Search, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';

interface EmailContact {
  id: string;
  name: string;
  email: string;
  groups: string[];
  isActive: boolean;
  role?: string;
  clubName?: string;
  source: 'app' | 'liste';   // Herkunft: App-Benutzer (user_permissions) oder manuelle Liste (email_contacts)
  appRole?: string;          // tatsächliche App-Rolle (sportleiter/mannschaftsfuehrer/kv_orga/app_benutzer), falls source='app'
  inMeineListe?: boolean;    // true, wenn zusätzlich in der manuellen E-Mail-Liste vorhanden
  emailDocId?: string;       // Dokument-ID in email_contacts (für Bearbeiten/Löschen), falls vorhanden
}

interface EmailGroup {
  id: string;
  name: string;
  description: string;
  contactIds: string[];
}

export default function EmailSystemPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'compose' | 'contacts' | 'groups' | 'history'>('compose');
  
  // Compose Email State
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    selectedGroups: [] as string[],
    selectedContacts: [] as string[],
    attachments: [] as File[]
  });
  
  // Contacts & Groups
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('alle');
  const [isLoading, setIsLoading] = useState(false);
  // Kontakte-Tab: Suche + Rollenfilter
  const [contactSearch, setContactSearch] = useState('');
  const [contactRoleFilter, setContactRoleFilter] = useState<string>('alle');
  // Verfassen-Tab: Suche + Rollenfilter für die Einzelkontakt-Auswahl
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerRoleFilter, setPickerRoleFilter] = useState<string>('alle');
  
  // New Contact Form
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    groups: [] as string[]
  });
  
  // Edit Contact State
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editContact, setEditContact] = useState({
    name: '',
    email: '',
    groups: [] as string[],
    extraGroups: [] as string[]   // zusätzliche Rollen-Gruppen für einen Listen-Kontakt
  });

  useEffect(() => {
    loadContacts();
    loadGroups();
    loadLeagues();
  }, []);

  const loadContacts = async () => {
    try {
      const loadedContacts: EmailContact[] = [];
      const byEmail = new Map<string, EmailContact>(); // E-Mail (lowercase) -> Kontakt

      // 1. App-Benutzer aus user_permissions laden — das ist die "Wahrheit" für Rollen.
      const userPermissionsSnapshot = await getDocs(query(collection(db, 'user_permissions')));

      userPermissionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.email || !data.displayName || data.email === 'admin@rwk-einbeck.de') return;

        // Rolle aus den tatsächlichen Berechtigungen ableiten.
        // Reihenfolge: KV-Orga > Sportleiter > Mannschaftsführer > (sonst) app_benutzer.
        const clubRoleValues = data.clubRoles ? Object.values(data.clubRoles) : [];
        const kvRoleValues = data.kvRoles ? Object.values(data.kvRoles) : [];

        const istKvOrga =
          kvRoleValues.includes('KV_KM_ORGA') ||
          kvRoleValues.includes('KV_WETTKAMPFLEITER') ||
          data.kvRole === 'KV_KM_ORGA' ||
          data.kvRole === 'KV_WETTKAMPFLEITER' ||
          data.role === 'km_organisator' ||
          data.role === 'km_orga';
        // Sportleiter: neue clubRoles-Struktur ODER Legacy role='vereinsvertreter'
        const istSportleiter =
          clubRoleValues.includes('SPORTLEITER') || data.role === 'vereinsvertreter';
        const istMannschaftsfuehrer =
          clubRoleValues.includes('MANNSCHAFTSFUEHRER') || data.role === 'mannschaftsfuehrer';

        let userRole = 'app_benutzer'; // reiner App-/Schießnachweis-Nutzer ohne RWK-Rolle
        if (istKvOrga) userRole = 'kv_orga';
        else if (istSportleiter) userRole = 'sportleiter';
        else if (istMannschaftsfuehrer) userRole = 'mannschaftsfuehrer';

        const kontakt: EmailContact = {
          id: `user_${doc.id}`,
          name: data.displayName,
          email: data.email,
          groups: [userRole],
          isActive: data.isActive !== false,
          role: userRole,
          clubName: data.clubName,
          source: 'app',
          appRole: userRole
        };
        loadedContacts.push(kontakt);
        byEmail.set(data.email.toLowerCase(), kontakt);
      });

      // 2. Manuelle Liste (email_contacts) laden und mit App-Benutzern zusammenführen.
      const emailContactsSnapshot = await getDocs(
        query(collection(db, 'email_contacts'), orderBy('name', 'asc'))
      );

      emailContactsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.email) return;
        const extra = Array.isArray(data.extraGroups) ? data.extraGroups : [];
        const vorhanden = byEmail.get(data.email.toLowerCase());

        if (vorhanden) {
          // Gleiche E-Mail wie ein App-Benutzer -> NICHT duplizieren.
          // App-Rolle bleibt führend; nur als "auch in Meiner Liste" markieren.
          vorhanden.inMeineListe = true;
          vorhanden.emailDocId = doc.id;
          if (!vorhanden.groups.includes('meine_liste')) vorhanden.groups.push('meine_liste');
          extra.forEach((g: string) => { if (!vorhanden.groups.includes(g)) vorhanden.groups.push(g); });
        } else {
          // Reiner E-Mail-Kontakt ohne App-Konto.
          const kontakt: EmailContact = {
            id: `email_${doc.id}`,
            name: data.name,
            email: data.email,
            groups: ['meine_liste', ...extra],
            isActive: true,
            role: 'meine_liste',
            source: 'liste',
            inMeineListe: true,
            emailDocId: doc.id
          };
          loadedContacts.push(kontakt);
          byEmail.set(data.email.toLowerCase(), kontakt);
        }
      });

      setContacts(loadedContacts.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      logError('Fehler beim Laden der Kontakte:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakte konnten nicht geladen werden.',
        variant: 'destructive'
      });
    }
  };

  const loadGroups = async () => {
    // Aktuelle Rollen des KSV Einbeck (Vorstand/Kassenwart/Schriftführer aus
    // Vereinssoftware-Zeiten entfernt – gibt es im RWK nicht mehr).
    const defaultGroups: EmailGroup[] = [
      {
        id: 'meine_liste',
        name: 'Meine Liste (Sportleiter-Kontakte)',
        description: 'Manuell gepflegte E-Mail-Liste (Kontakte-Tab)',
        contactIds: []
      },
      {
        id: 'sportleiter',
        name: 'Sportleiter',
        description: 'App-Benutzer mit Rolle Sportleiter',
        contactIds: []
      },
      {
        id: 'mannschaftsfuehrer',
        name: 'Mannschaftsführer',
        description: 'App-Benutzer mit Rolle Mannschaftsführer',
        contactIds: []
      },
      {
        id: 'kv_orga',
        name: 'KV-Orga',
        description: 'Kreisverband-Organisation (KM-Orga / Wettkampfleiter)',
        contactIds: []
      },
      {
        id: 'alle',
        name: 'Alle App-Benutzer',
        description: 'Alle registrierten App-Benutzer (inkl. reiner Schießnachweis-Nutzer)',
        contactIds: []
      }
    ];

    setGroups(defaultGroups);
  };

  const loadLeagues = async () => {
    try {
      const seasonsQuery = query(collection(db, 'seasons'), where('status', '==', 'Laufend'));
      const seasonsSnapshot = await getDocs(seasonsQuery);
      const seasonIds = seasonsSnapshot.docs.map(doc => doc.id);
      
      if (seasonIds.length > 0) {
        const leaguesQuery = query(collection(db, 'rwk_leagues'), where('seasonId', 'in', seasonIds));
        const leaguesSnapshot = await getDocs(leaguesQuery);
        const loadedLeagues = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeagues(loadedLeagues);
      }
    } catch (error) {
      logError('Fehler beim Laden der Ligen:', error);
    }
  };

  const getFilteredContacts = (): EmailContact[] => {
    let filtered = contacts.filter(c => c.isActive);
    
    // Liga-Filter anwenden (hier würde die Liga-Logik kommen)
    if (selectedLeague !== 'alle') {
      // TODO: Liga-Filter implementieren wenn Benutzer Liga-Zuordnungen haben
      // filtered = filtered.filter(c => c.leagueIds?.includes(selectedLeague));
    }
    
    return filtered;
  };

  // Kontakte für den Kontakte-Tab, gefiltert nach Suchtext und Rollenfilter.
  const getFilteredContactList = (): EmailContact[] => {
    const q = contactSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      // Textsuche über Name + E-Mail
      if (q && !(`${c.name} ${c.email}`.toLowerCase().includes(q))) return false;
      // Rollenfilter
      switch (contactRoleFilter) {
        case 'alle': return true;
        case 'sportleiter': return c.appRole === 'sportleiter';
        case 'mannschaftsfuehrer': return c.appRole === 'mannschaftsfuehrer';
        case 'kv_orga': return c.appRole === 'kv_orga';
        case 'app_benutzer': return c.appRole === 'app_benutzer';
        case 'nur_liste': return c.source === 'liste';   // reine E-Mail-Kontakte (Kreissportleiterin-Verteiler)
        default: return true;
      }
    });
  };

  // Kontakte für die Einzelauswahl im Verfassen-Tab (eigene Suche/Filter).
  const getPickerContacts = (): EmailContact[] => {
    const q = pickerSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      if (!c.isActive) return false;
      if (q && !(`${c.name} ${c.email}`.toLowerCase().includes(q))) return false;
      switch (pickerRoleFilter) {
        case 'alle': return true;
        case 'sportleiter': return c.appRole === 'sportleiter';
        case 'mannschaftsfuehrer': return c.appRole === 'mannschaftsfuehrer';
        case 'kv_orga': return c.appRole === 'kv_orga';
        case 'app_benutzer': return c.appRole === 'app_benutzer';
        case 'nur_liste': return c.source === 'liste';
        default: return true;
      }
    });
  };

  // Lesbares Label für eine Rollen-/Gruppen-ID.
  const rollenLabel = (id?: string): string => {
    switch (id) {
      case 'sportleiter': return 'App: Sportleiter';
      case 'mannschaftsfuehrer': return 'App: Mannschaftsführer';
      case 'kv_orga': return 'App: KV-Orga';
      case 'app_benutzer': return 'App-Benutzer (ohne RWK-Rolle)';
      case 'meine_liste': return 'Meine Liste';
      default: return id || '';
    }
  };

  const getContactsByGroup = (groupId: string): EmailContact[] => {
    const filteredContacts = getFilteredContacts();
    
    switch (groupId) {
      case 'alle':
        // Alle App-Benutzer (aus user_permissions), NICHT die manuelle Liste.
        return filteredContacts.filter(c => c.role !== 'meine_liste');
      case 'meine_liste':
        return filteredContacts.filter(c => c.role === 'meine_liste');
      case 'sportleiter':
        return filteredContacts.filter(c => c.role === 'sportleiter');
      case 'mannschaftsfuehrer':
        return filteredContacts.filter(c => c.role === 'mannschaftsfuehrer');
      case 'kv_orga':
        return filteredContacts.filter(c => c.role === 'kv_orga');
      default:
        return [];
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast({
        title: 'Fehler',
        description: 'Betreff und Nachricht sind erforderlich.',
        variant: 'destructive'
      });
      return;
    }

    // Sammle alle Empfänger
    let recipients: EmailContact[] = [];
    
    // Aus Gruppen
    emailData.selectedGroups.forEach(groupId => {
      recipients = [...recipients, ...getContactsByGroup(groupId)];
    });
    
    // Aus einzelnen Kontakten
    emailData.selectedContacts.forEach(contactId => {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) recipients.push(contact);
    });

    // Duplikate entfernen
    recipients = recipients.filter((contact, index, self) => 
      index === self.findIndex(c => c.email === contact.email)
    );

    if (recipients.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Keine Empfänger ausgewählt.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Bereite FormData für Anhänge vor
      const formData = new FormData();
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.message);
      const recipientData = recipients.map(r => ({ name: r.name, email: r.email }));
      formData.append('recipients', JSON.stringify(recipientData));
      
      // Anhänge hinzufügen
      emailData.attachments.forEach((file, index) => {
        formData.append(`attachment-${index}`, file);
      });
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'E-Mail gesendet',
          description: result.message,
        });

        // Form zurücksetzen
        setEmailData({
          subject: '',
          message: '',
          selectedGroups: [],
          selectedContacts: [],
          attachments: []
        });
      } else {
        toast({
          title: 'E-Mail-Versand fehlgeschlagen',
          description: result.message,
          variant: 'destructive'
        });
      }

    } catch (error: any) {
      const errorMessage = error?.message || 'E-Mail konnte nicht versendet werden.';
      toast({
        title: 'Fehler beim E-Mail-Versand',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addNewContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast({
        title: 'Fehler',
        description: 'Name und E-Mail sind erforderlich.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'email_contacts'), {
        name: newContact.name,
        email: newContact.email,
        groups: newContact.groups,
        isActive: true,
        createdAt: new Date()
      });

      toast({
        title: 'Kontakt hinzugefügt',
        description: `${newContact.name} wurde hinzugefügt.`
      });

      setNewContact({ name: '', email: '', groups: [] });
      loadContacts();
    } catch (error) {
      logError('Fehler beim Hinzufügen des Kontakts:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakt konnte nicht hinzugefügt werden.',
        variant: 'destructive'
      });
    }
  };

  const startEditContact = (contact: EmailContact) => {
    // Bearbeitet wird immer der email_contacts-Eintrag (per emailDocId).
    if (!contact.emailDocId) return;
    setEditingContact(contact.emailDocId);
    setEditContact({
      name: contact.name,
      email: contact.email,
      groups: contact.groups,
      // zusätzliche Rollen-Gruppen (ohne die feste 'meine_liste')
      extraGroups: contact.groups.filter((g) => g !== 'meine_liste')
    });
  };

  const saveEditContact = async () => {
    if (!editingContact || !editContact.name || !editContact.email) return;
    
    try {
      await updateDoc(doc(db, 'email_contacts', editingContact), {
        name: editContact.name,
        email: editContact.email,
        extraGroups: editContact.extraGroups,   // Overrides speichern
        updatedAt: new Date()
      });
      
      toast({
        title: 'Kontakt aktualisiert',
        description: `${editContact.name} wurde aktualisiert.`
      });
      
      setEditingContact(null);
      loadContacts();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Kontakt konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteContact = async (emailDocId: string) => {
    if (!emailDocId) {
      toast({
        title: 'Fehler',
        description: 'Nur manuell hinzugefügte Kontakte können gelöscht werden.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!confirm('Aus „Meine Liste" entfernen?')) return;
    
    try {
      await deleteDoc(doc(db, 'email_contacts', emailDocId));
      
      toast({
        title: 'Kontakt gelöscht',
        description: 'Kontakt wurde erfolgreich gelöscht.'
      });
      
      loadContacts();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Kontakt konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">E-Mail-System</h1>
            <p className="text-muted-foreground">Rundschreiben und Kommunikation verwalten</p>
          </div>
        </div>
        <Link href="/admin">
          <Button variant="outline">Zurück zum Dashboard</Button>
        </Link>
      </div>

      {/* Setup-Hinweis */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            E-Mail-Integration bereit
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <p className="mb-2">
            E-Mail-Versand mit rwk-einbeck.de:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Domain:</strong> rwk-einbeck.de (Strato)</li>
            <li><strong>Absender:</strong> admin@rwk-einbeck.de</li>
            <li><strong>Status:</strong> DNS-Verifikation läuft</li>
            <li><strong>Resend:</strong> Kostenlos bis 3.000 E-Mails/Monat</li>
          </ul>
          <div className="bg-white p-3 rounded-md mt-3 text-sm">
            <strong>Setup (.env.local):</strong><br/>
            <code className="text-xs">
              RESEND_API_KEY=re_...<br/>
              RESEND_FROM_EMAIL=admin@rwk-einbeck.de
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        {[
          { id: 'compose', label: 'E-Mail verfassen', icon: Send },
          { id: 'contacts', label: 'Kontakte', icon: Users },
          { id: 'groups', label: 'Gruppen', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* E-Mail verfassen */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Neue E-Mail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* GMX-Style Header */}
                <div className="space-y-3 border-b pb-4">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <Label className="col-span-2 text-sm font-medium text-right">An:</Label>
                    <div className="col-span-10 text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
                      {(() => {
                        let recipients: any[] = [];
                        emailData.selectedGroups.forEach(groupId => {
                          recipients = [...recipients, ...getContactsByGroup(groupId)];
                        });
                        emailData.selectedContacts.forEach(contactId => {
                          const contact = contacts.find(c => c.id === contactId);
                          if (contact) recipients.push(contact);
                        });
                        recipients = recipients.filter((contact, index, self) => 
                          index === self.findIndex(c => c.email === contact.email)
                        );
                        return recipients.length > 0 
                          ? `${recipients.length} Empfänger ausgewählt`
                          : 'Keine Empfänger ausgewählt';
                      })()
                      }
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <Label className="col-span-2 text-sm font-medium text-right">Betreff:</Label>
                    <div className="col-span-10">
                      <Input
                        value={emailData.subject}
                        onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Betreff eingeben..."
                        className="border-0 border-b border-gray-300 rounded-none focus:border-blue-500 focus:ring-0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 ml-20">
                    <span className="text-xs text-muted-foreground mr-2">Vorlagen:</span>
                    {[
                      'Rundschreiben RWK',
                      'Terminänderung',
                      'Ergebnisse verfügbar'
                    ].map(template => (
                      <Button
                        key={template}
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEmailData(prev => ({ ...prev, subject: template }))}
                        className="text-xs h-5 px-2 text-blue-600 hover:bg-blue-50"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* GMX-Style Message Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEmailData(prev => ({ ...prev, message: 'Liebe Schützenfreunde,\n\n\n\nMit sportlichen Grüßen\nMarcel Bünger\nRWK-Leiter' }))}
                        className="text-xs h-6 text-blue-600 hover:bg-blue-50"
                      >
                        📝 Vorlage
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEmailData(prev => ({ ...prev, message: prev.message + '\n\nMit sportlichen Grüßen\nMarcel Bünger\nRWK-Leiter' }))}
                        className="text-xs h-6 text-blue-600 hover:bg-blue-50"
                      >
                        ✍️ Signatur
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Nachricht eingeben..."
                    rows={12}
                    className="resize-none border-gray-300 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label>Anhänge</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setEmailData(prev => ({ ...prev, attachments: files }));
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Erlaubte Formate: PDF, Word, Bilder, Text (max. 10MB pro Datei)
                    </p>
                    
                    {emailData.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm font-medium">Ausgewählte Dateien:</Label>
                        {emailData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEmailData(prev => ({
                                  ...prev,
                                  attachments: prev.attachments.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* GMX-Style Send Button */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    {emailData.attachments.length > 0 && `${emailData.attachments.length} Anhang/Anhänge`}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Entwurf speichern
                    </Button>
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={isLoading || !emailData.subject || !emailData.message}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isLoading ? 'Sende...' : 'Senden'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Empfänger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Gruppen</Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {groups.map(group => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={emailData.selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEmailData(prev => ({
                                ...prev,
                                selectedGroups: [...prev.selectedGroups, group.id]
                              }));
                            } else {
                              setEmailData(prev => ({
                                ...prev,
                                selectedGroups: prev.selectedGroups.filter(id => id !== group.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`group-${group.id}`} className="text-sm">
                          {group.name} ({getContactsByGroup(group.id).length})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Liga-Filter</Label>
                  <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Liga auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Ligen</SelectItem>
                      {leagues.map(league => (
                        <SelectItem key={league.id} value={league.id}>
                          {league.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Filtert Gruppen und Einzelkontakte nach Liga
                  </p>
                </div>

                <div>
                  <Label>Einzelne Kontakte gezielt hinzufügen</Label>
                  {/* Suche + Rollenfilter, damit man z.B. gezielt die Kreissportleiterin-
                      Kontakte (Nur E-Mail-Liste) findet und dazunimmt. */}
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Kontakt suchen..."
                        className="pl-8 h-9"
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                      />
                    </div>
                    <Select value={pickerRoleFilter} onValueChange={setPickerRoleFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Rolle filtern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle Kontakte</SelectItem>
                        <SelectItem value="sportleiter">Nur Sportleiter</SelectItem>
                        <SelectItem value="mannschaftsfuehrer">Nur Mannschaftsführer</SelectItem>
                        <SelectItem value="kv_orga">Nur KV-Orga</SelectItem>
                        <SelectItem value="app_benutzer">Nur App-Benutzer (ohne Rolle)</SelectItem>
                        <SelectItem value="nur_liste">Nur E-Mail-Liste (Kreissportleiterin)</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Alle aktuell gefilterten auf einmal hinzufügen/entfernen */}
                    <div className="flex gap-2">
                      <Button
                        type="button" size="sm" variant="outline" className="text-xs flex-1"
                        onClick={() => {
                          const ids = getPickerContacts().map((c) => c.id);
                          setEmailData(prev => ({
                            ...prev,
                            selectedContacts: Array.from(new Set([...prev.selectedContacts, ...ids]))
                          }));
                        }}
                      >
                        Alle sichtbaren hinzufügen
                      </Button>
                      <Button
                        type="button" size="sm" variant="ghost" className="text-xs"
                        onClick={() => {
                          const ids = new Set(getPickerContacts().map((c) => c.id));
                          setEmailData(prev => ({
                            ...prev,
                            selectedContacts: prev.selectedContacts.filter((id) => !ids.has(id))
                          }));
                        }}
                      >
                        Entfernen
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getPickerContacts().length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Keine Kontakte gefunden.</p>
                    )}
                    {getPickerContacts().map(contact => (
                      <div key={contact.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`contact-${contact.id}`}
                          checked={emailData.selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEmailData(prev => ({
                                ...prev,
                                selectedContacts: [...prev.selectedContacts, contact.id]
                              }));
                            } else {
                              setEmailData(prev => ({
                                ...prev,
                                selectedContacts: prev.selectedContacts.filter(id => id !== contact.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`contact-${contact.id}`} className="text-xs">
                          {contact.name} ({contact.email})
                          <span className="text-muted-foreground"> — {rollenLabel(contact.appRole || contact.role)}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Vorschau Empfänger</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
                    {(() => {
                      let recipients: EmailContact[] = [];
                      
                      // Aus Gruppen
                      emailData.selectedGroups.forEach(groupId => {
                        recipients = [...recipients, ...getContactsByGroup(groupId)];
                      });
                      
                      // Aus einzelnen Kontakten
                      emailData.selectedContacts.forEach(contactId => {
                        const contact = contacts.find(c => c.id === contactId);
                        if (contact) recipients.push(contact);
                      });
                      
                      // Duplikate entfernen
                      recipients = recipients.filter((contact, index, self) => 
                        index === self.findIndex(c => c.email === contact.email)
                      );
                      
                      return recipients.length > 0 ? (
                        <div className="space-y-1">
                          {recipients.slice(0, 8).map(contact => (
                            <div key={contact.email} className="text-xs">
                              {contact.name} ({contact.email})
                              {contact.role && <span className="text-muted-foreground"> - {contact.role}</span>}
                            </div>
                          ))}
                          {recipients.length > 8 && (
                            <div className="text-xs text-muted-foreground">
                              ... und {recipients.length - 8} weitere
                            </div>
                          )}
                          <div className="text-xs font-medium mt-2 pt-2 border-t">
                            Gesamt: {recipients.length} Empfänger
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Keine Empfänger ausgewählt
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Kontakte verwalten */}
      {activeTab === 'contacts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Kontakte ({getFilteredContactList().length} / {contacts.length})</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name oder E-Mail suchen..."
                      className="pl-8"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                    />
                  </div>
                  <Select value={contactRoleFilter} onValueChange={setContactRoleFilter}>
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue placeholder="Rolle filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Kontakte</SelectItem>
                      <SelectItem value="sportleiter">Nur Sportleiter</SelectItem>
                      <SelectItem value="mannschaftsfuehrer">Nur Mannschaftsführer</SelectItem>
                      <SelectItem value="kv_orga">Nur KV-Orga</SelectItem>
                      <SelectItem value="app_benutzer">Nur App-Benutzer (ohne Rolle)</SelectItem>
                      <SelectItem value="nur_liste">Nur E-Mail-Liste (ohne App-Konto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getFilteredContactList().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">Keine Kontakte gefunden.</p>
                  )}
                  {getFilteredContactList().map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingContact === contact.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editContact.name}
                            onChange={(e) => setEditContact(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Name"
                          />
                          <Input
                            value={editContact.email}
                            onChange={(e) => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="E-Mail"
                          />
                          <div className="space-y-1">
                            <Label className="text-xs">Gehört zu „Meine Liste". Zusätzlich zu Gruppe(n) hinzufügen:</Label>
                            <div className="flex flex-wrap gap-1">
                              {['sportleiter', 'mannschaftsfuehrer', 'kv_orga'].map((group) => (
                                <Button
                                  key={group}
                                  type="button"
                                  size="sm"
                                  variant={editContact.extraGroups.includes(group) ? 'default' : 'outline'}
                                  onClick={() =>
                                    setEditContact((prev) => ({
                                      ...prev,
                                      extraGroups: prev.extraGroups.includes(group)
                                        ? prev.extraGroups.filter((g) => g !== group)
                                        : [...prev.extraGroups, group],
                                    }))
                                  }
                                  className="text-xs h-6"
                                >
                                  {rollenLabel(group)}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEditContact}>
                              <Save className="h-4 w-4 mr-1" /> Speichern
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingContact(null)}>
                              <X className="h-4 w-4 mr-1" /> Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contact.source === 'app' ? (
                                <Badge
                                  className={`text-xs ${
                                    contact.appRole === 'app_benutzer'
                                      ? 'bg-gray-200 text-gray-700'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {rollenLabel(contact.appRole)}
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-amber-100 text-amber-800">
                                  Nur E-Mail-Liste (kein App-Konto)
                                </Badge>
                              )}
                              {/* App-Benutzer, der zusätzlich in der manuellen Liste steht */}
                              {contact.source === 'app' && contact.inMeineListe && (
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                                  auch in „Meine Liste"
                                </Badge>
                              )}
                              {/* Zusätzliche manuelle Gruppen-Zuordnungen anzeigen */}
                              {contact.groups
                                .filter((g) => g !== 'meine_liste' && g !== contact.appRole)
                                .map((group) => (
                                  <Badge key={group} variant="outline" className="text-xs">
                                    + {rollenLabel(group)}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.isActive ? (
                              <Badge variant="outline" className="text-green-600">Aktiv</Badge>
                            ) : (
                              <Badge variant="secondary">Inaktiv</Badge>
                            )}
                            {/* Bearbeiten/Löschen nur für den manuellen Listen-Eintrag (email_contacts) */}
                            {contact.emailDocId && (
                              <>
                                <Button size="sm" variant="ghost" title="Listen-Eintrag bearbeiten" onClick={() => startEditContact(contact)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Aus Meiner Liste entfernen" onClick={() => deleteContact(contact.emailDocId!)} className="text-red-600 hover:text-red-800">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {/* Reiner App-Benutzer ohne Listen-Eintrag: Verwaltung in der Benutzerverwaltung */}
                            {contact.source === 'app' && !contact.emailDocId && (
                              <Link href="/admin/user-management" title="In der Benutzerverwaltung verwalten/löschen">
                                <Button size="sm" variant="ghost" className="text-muted-foreground">
                                  <UserCog className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Neuen Kontakt hinzufügen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="max@example.com"
                  />
                </div>
                <Button onClick={addNewContact} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Zu „Meine Liste" hinzufügen
                </Button>
                
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md">
                  <strong>Hinweis:</strong> App-Benutzer (Sportleiter, Mannschaftsführer, KV-Orga) werden
                  automatisch aus der Benutzerverwaltung geladen. Hier hinzugefügte Kontakte landen in der
                  Gruppe „Meine Liste" – ideal für externe Personen ohne App-Konto.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Gruppen */}
      {activeTab === 'groups' && (
        <Card>
          <CardHeader>
            <CardTitle>E-Mail-Gruppen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(group => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{group.name}</h3>
                    <Badge variant="outline">
                      {getContactsByGroup(group.id).length} Kontakte
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                  <div className="space-y-1">
                    {getContactsByGroup(group.id).slice(0, 3).map(contact => (
                      <div key={contact.email} className="text-xs">
                        {contact.name} ({contact.email})
                      </div>
                    ))}
                    {getContactsByGroup(group.id).length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... und {getContactsByGroup(group.id).length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

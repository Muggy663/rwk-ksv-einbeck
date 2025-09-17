// src/app/admin/email-system/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, FileText, Send, Plus, Trash2, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface EmailContact {
  id: string;
  name: string;
  email: string;
  groups: string[];
  isActive: boolean;
  role?: string;
  clubName?: string;
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
  
  // New Contact Form
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    groups: [] as string[]
  });

  useEffect(() => {
    loadContacts();
    loadGroups();
    loadLeagues();
  }, []);

  const loadContacts = async () => {
    try {
      const loadedContacts: EmailContact[] = [];
      
      // 1. Lade Sportleiter aus email_contacts
      const emailContactsQuery = query(collection(db, 'email_contacts'), orderBy('name', 'asc'));
      const emailContactsSnapshot = await getDocs(emailContactsQuery);
      
      emailContactsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        loadedContacts.push({
          id: `email_${doc.id}`,
          name: data.name,
          email: data.email,
          groups: [data.group || 'sportleiter'],
          isActive: true,
          role: data.role || 'vereinsvertreter'
        });
      });
      
      // 2. Lade App-Benutzer aus user_permissions
      const userPermissionsQuery = query(collection(db, 'user_permissions'));
      const userPermissionsSnapshot = await getDocs(userPermissionsQuery);
      
      userPermissionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email && data.displayName) {
          // Prüfe ob E-Mail bereits existiert
          const existingContact = loadedContacts.find(c => c.email === data.email);
          if (!existingContact) {
            // Bestimme Rolle aus neuen Club-Rollen oder Legacy-Rolle
            let userRole = data.role || 'app_benutzer';
            let groups = [userRole];
            
            // Neue Club-Rollen prüfen
            if (data.clubRoles && Object.keys(data.clubRoles).length > 0) {
              const clubRoleValues = Object.values(data.clubRoles);
              if (clubRoleValues.includes('SPORTLEITER')) {
                userRole = 'sportleiter';
                groups = ['sportleiter', 'vereinsvertreter'];
              } else if (clubRoleValues.includes('VORSTAND')) {
                userRole = 'vorstand';
                groups = ['vorstand', 'vereinsvertreter'];
              } else if (clubRoleValues.includes('KASSENWART')) {
                userRole = 'kassenwart';
                groups = ['kassenwart', 'vereinsvertreter'];
              } else if (clubRoleValues.includes('SCHRIFTFUEHRER')) {
                userRole = 'schriftfuehrer';
                groups = ['schriftfuehrer', 'vereinsvertreter'];
              }
            }
            
            // KV-Rollen prüfen
            if (data.kvRole) {
              if (data.kvRole === 'KV_WETTKAMPFLEITER') {
                userRole = 'kv_wettkampfleiter';
                groups = ['kv_wettkampfleiter', 'vereinsvertreter'];
              }
            }
            
            loadedContacts.push({
              id: `user_${doc.id}`,
              name: data.displayName,
              email: data.email,
              groups: groups,
              isActive: data.isActive !== false,
              role: userRole,
              clubName: data.clubName
            });
          }
        }
      });

      setContacts(loadedContacts.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakte konnten nicht geladen werden.',
        variant: 'destructive'
      });
    }
  };

  const loadGroups = async () => {
    // Standard-Gruppen (erweitert für neue Rollen)
    const defaultGroups: EmailGroup[] = [
      {
        id: 'alle',
        name: 'Alle Benutzer',
        description: 'Alle registrierten Benutzer',
        contactIds: []
      },
      {
        id: 'vereinsvertreter',
        name: 'Vereinsvertreter',
        description: 'Alle Vereinsvertreter (inkl. neue Rollen)',
        contactIds: []
      },
      {
        id: 'sportleiter',
        name: 'Sportleiter',
        description: 'Alle Sportleiter',
        contactIds: []
      },
      {
        id: 'vorstand',
        name: 'Vorstand',
        description: 'Vorstandsmitglieder',
        contactIds: []
      },
      {
        id: 'kassenwart',
        name: 'Kassenwarte',
        description: 'Alle Kassenwarte',
        contactIds: []
      },
      {
        id: 'kv_wettkampfleiter',
        name: 'KV-Wettkampfleiter',
        description: 'Kreisverband Wettkampfleiter',
        contactIds: []
      },
      {
        id: 'mannschaftsfuehrer',
        name: 'Mannschaftsführer (Legacy)',
        description: 'Legacy Mannschaftsführer',
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
      console.error('Fehler beim Laden der Ligen:', error);
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

  const getContactsByGroup = (groupId: string): EmailContact[] => {
    const filteredContacts = getFilteredContacts();
    
    switch (groupId) {
      case 'alle':
        return filteredContacts;
      case 'vereinsvertreter':
        return filteredContacts.filter(c => c.groups.includes('vereinsvertreter'));
      case 'sportleiter':
        return filteredContacts.filter(c => c.role === 'sportleiter');
      case 'vorstand':
        return filteredContacts.filter(c => c.groups.includes('vorstand'));
      case 'kassenwart':
        return filteredContacts.filter(c => c.role === 'kassenwart');
      case 'kv_wettkampfleiter':
        return filteredContacts.filter(c => c.role === 'kv_wettkampfleiter');
      case 'mannschaftsfuehrer':
        return filteredContacts.filter(c => c.role === 'mannschaftsfuehrer');
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
      formData.append('recipients', JSON.stringify(recipients.map(r => ({ name: r.name, email: r.email }))));
      
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
      console.error('Fehler beim Hinzufügen des Kontakts:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakt konnte nicht hinzugefügt werden.',
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Neue E-Mail verfassen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Betreff</Label>
                  <Input
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="z.B. Wichtige Informationen zum nächsten Wettkampf"
                  />
                </div>

                <div>
                  <Label>Nachricht</Label>
                  <Textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Ihre Nachricht..."
                    rows={8}
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

                <div className="flex gap-4">
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={isLoading || !emailData.subject || !emailData.message} 
                    className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? 'Wird versendet...' : 'E-Mail senden'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Empfänger auswählen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label>Einzelne Kontakte</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {getFilteredContacts().map(contact => (
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
                          {contact.role && <span className="text-muted-foreground"> - {contact.role}</span>}
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
                <CardTitle>Kontakte ({contacts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.email}</div>
                        <div className="flex gap-1 mt-1">
                          {contact.groups.map(group => (
                            <Badge key={group} variant="secondary" className="text-xs">
                              {group}
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
                      </div>
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
                  Kontakt hinzufügen
                </Button>
                
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md">
                  <strong>Hinweis:</strong> Kontakte aus der Benutzerverwaltung werden automatisch geladen. 
                  Hier können zusätzliche Kontakte (z.B. externe Personen) hinzugefügt werden.
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

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Edit, Trash2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface Contact {
  id: string;
  name: string;
  email: string;
  group: string;
  role: string;
  createdAt: Date;
}

export default function ManageContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('alle');
  
  // Edit/Add Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    group: 'sportleiter',
    role: 'sportleiter'
  });

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, groupFilter]);

  const loadContacts = async () => {
    try {
      const contactsQuery = query(collection(db, 'email_contacts'), orderBy('name', 'asc'));
      const snapshot = await getDocs(contactsQuery);
      
      const contactsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Contact[];
      
      setContacts(contactsData);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakte konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;
    
    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (groupFilter !== 'alle') {
      filtered = filtered.filter(contact => contact.group === groupFilter);
    }
    
    setFilteredContacts(filtered);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Fehler',
        description: 'Name und E-Mail sind erforderlich.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingContact) {
        // Update
        await updateDoc(doc(db, 'email_contacts', editingContact.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast({
          title: 'Kontakt aktualisiert',
          description: `${formData.name} wurde aktualisiert.`,
        });
      } else {
        // Create
        await addDoc(collection(db, 'email_contacts'), {
          ...formData,
          createdAt: new Date()
        });
        toast({
          title: 'Kontakt erstellt',
          description: `${formData.name} wurde hinzugefügt.`,
        });
      }
      
      setIsDialogOpen(false);
      setEditingContact(null);
      setFormData({ name: '', email: '', group: 'sportleiter', role: 'sportleiter' });
      await loadContacts();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakt konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      group: contact.group,
      role: contact.role
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Kontakt "${contact.name}" wirklich löschen?`)) return;

    try {
      await deleteDoc(doc(db, 'email_contacts', contact.id));
      toast({
        title: 'Kontakt gelöscht',
        description: `${contact.name} wurde gelöscht.`,
      });
      await loadContacts();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast({
        title: 'Fehler',
        description: 'Kontakt konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  const handleAddNew = () => {
    setEditingContact(null);
    setFormData({ name: '', email: '', group: 'sportleiter', role: 'sportleiter' });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Lade Kontakte...</div>;
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users className="h-8 w-8" />
            Kontakte verwalten
          </h1>
          <p className="text-muted-foreground mt-2">
            {contacts.length} E-Mail-Kontakte in der Datenbank
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Kontakt
        </Button>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Suche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name oder E-Mail suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gruppe</Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Gruppen</SelectItem>
                  <SelectItem value="sportleiter">Sportleiter</SelectItem>
                  <SelectItem value="vorstand">Vorstand</SelectItem>
                  <SelectItem value="kassenwart">Kassenwart</SelectItem>
                  <SelectItem value="schriftfuehrer">Schriftführer</SelectItem>
                  <SelectItem value="kv_wettkampfleiter">KV-Wettkampfleiter</SelectItem>
                  <SelectItem value="admins">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontakte-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Kontakte ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Gruppe</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.group}</TableCell>
                  <TableCell>{contact.role}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name des Kontakts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Gruppe</Label>
              <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sportleiter">Sportleiter</SelectItem>
                  <SelectItem value="vorstand">Vorstand</SelectItem>
                  <SelectItem value="kassenwart">Kassenwart</SelectItem>
                  <SelectItem value="schriftfuehrer">Schriftführer</SelectItem>
                  <SelectItem value="kv_wettkampfleiter">KV-Wettkampfleiter</SelectItem>
                  <SelectItem value="admins">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sportleiter">Sportleiter</SelectItem>
                  <SelectItem value="vorstand">Vorstand</SelectItem>
                  <SelectItem value="kassenwart">Kassenwart</SelectItem>
                  <SelectItem value="schriftfuehrer">Schriftführer</SelectItem>
                  <SelectItem value="kv_wettkampfleiter">KV-Wettkampfleiter</SelectItem>
                  <SelectItem value="vereinsvertreter">Vereinsvertreter (Legacy)</SelectItem>
                  <SelectItem value="mannschaftsfuehrer">Mannschaftsführer (Legacy)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {editingContact ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

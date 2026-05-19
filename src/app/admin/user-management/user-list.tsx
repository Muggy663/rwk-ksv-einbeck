"use client";
import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Loader2, UserCog, MailCheck } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserPermission, Club } from '@/types/rwk';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface UserListProps {
  clubs: Club[];
  onEditUser: (user: UserPermission) => void;
  refreshTrigger: number;
}

export function UserList({ clubs, onEditUser, refreshTrigger }: UserListProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserPermission | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingVerificationFor, setSendingVerificationFor] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Benutzerberechtigungen laden
      const usersQuery = query(collection(db, 'user_permissions'), orderBy('email', 'asc'));
      const snapshot = await getDocs(usersQuery);
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        logDebug('User data for', data.email, ':', data);
        return {
          ...data,
          uid: doc.id
        };
      }) as UserPermission[];
      
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      logError('Error fetching users:', error);
      toast({
        title: 'Fehler beim Laden der Benutzer',
        description: 'Die Benutzerliste konnte nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
      (user.displayName && user.displayName.toLowerCase().includes(lowerSearchTerm)) ||
      (user.role && user.role.toLowerCase().includes(lowerSearchTerm)) ||
      (user.representedClubs && user.representedClubs.some(clubId => 
        clubs.find(club => club.id === clubId)?.name.toLowerCase().includes(lowerSearchTerm)
      )) ||
      (user.clubId && clubs.find(club => club.id === user.clubId)?.name.toLowerCase().includes(lowerSearchTerm))
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, clubs]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'user_permissions', userToDelete.uid));
      setUsers(prevUsers => prevUsers.filter(user => user.uid !== userToDelete.uid));
      setFilteredUsers(prevUsers => prevUsers.filter(user => user.uid !== userToDelete.uid));
      
      toast({
        title: 'Benutzer gelöscht',
        description: `Die Berechtigungen für ${userToDelete.email} wurden gelöscht.`,
      });
    } catch (error) {
      logError('Error deleting user:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Die Benutzerberechtigungen konnten nicht gelöscht werden.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleResendVerification = async (user: UserPermission) => {
    setSendingVerificationFor(user.uid);
    try {
      const res = await fetch('/api/admin/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: '📧 Bestätigungs-E-Mail gesendet', description: `E-Mail an ${user.email} verschickt.` });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSendingVerificationFor(null);
    }
  };

  const confirmDelete = (user: UserPermission) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const getClubNames = (user: UserPermission) => {
    // Sammle alle Club-IDs aus verschiedenen Quellen
    const clubIds = new Set<string>();
    
    // Aus representedClubs
    if (user.representedClubs) {
      user.representedClubs.forEach(id => clubIds.add(id));
    }
    
    // Aus clubId (Legacy)
    if (user.clubId) {
      clubIds.add(user.clubId);
    }
    
    // Aus clubRoles (neue Struktur)
    if (user.clubRoles) {
      Object.keys(user.clubRoles).forEach(id => clubIds.add(id));
    }
    
    if (clubIds.size === 0) return '-';
    
    const clubNames = Array.from(clubIds).map(clubId => {
      const club = clubs.find(c => c.id === clubId);
      return club ? club.name : 'Unbekannt';
    });
    
    return clubNames.join(', ');
  };

  const getClubCount = (user: UserPermission) => {
    const clubIds = new Set<string>();
    
    if (user.representedClubs) {
      user.representedClubs.forEach(id => clubIds.add(id));
    }
    
    if (user.clubId) {
      clubIds.add(user.clubId);
    }
    
    if (user.clubRoles) {
      Object.keys(user.clubRoles).forEach(id => clubIds.add(id));
    }
    
    return clubIds.size;
  };

  const getRoleBadge = (user: UserPermission) => {
    const roles = [];
    
    // Platform-Rolle
    if (user.platformRole) {
      roles.push(<Badge key="platform" variant="default" className="bg-red-500">{user.platformRole}</Badge>);
    }
    
    // Legacy-Rolle
    if (user.role) {
      switch (user.role) {
        case 'vereinsvertreter':
          roles.push(<Badge key="legacy" variant="default" className="bg-blue-500">Vereinsvertreter</Badge>);
          break;
        case 'mannschaftsfuehrer':
          roles.push(<Badge key="legacy" variant="default" className="bg-green-500">Mannschaftsführer</Badge>);
          break;
        case 'km_orga':
          roles.push(<Badge key="legacy" variant="default" className="bg-purple-500">KM-Orga</Badge>);
          break;
        default:
          roles.push(<Badge key="legacy" variant="secondary">{user.role}</Badge>);
      }
    }
    
    // KM-Zugang durch representedClubs oder SPORTLEITER-Rolle
    const hasKmAccess = (user.representedClubs && user.representedClubs.length > 0) || 
                       (user.clubRoles && Object.values(user.clubRoles).includes('SPORTLEITER'));
    const clubCount = user.representedClubs?.length || (user.clubRoles ? Object.keys(user.clubRoles).length : 0);
    
    if (hasKmAccess && !user.role) {
      roles.push(<Badge key="km-access" variant="outline" className="bg-purple-100">KM-Zugang ({clubCount} Vereine)</Badge>);
    }
    
    // KV-Rollen (neue Struktur hat Priorität)
    if (user.kvRole) {
      roles.push(<Badge key="kv-new" variant="outline" className="bg-yellow-100">{user.kvRole}</Badge>);
    } else if (user.kvRoles) {
      Object.entries(user.kvRoles).forEach(([kvId, role]) => {
        roles.push(<Badge key={`kv-${kvId}`} variant="outline" className="bg-yellow-100">{role}</Badge>);
      });
    }
    
    // Club-Rollen
    if (user.clubRoles) {
      Object.entries(user.clubRoles).forEach(([clubId, role]) => {
        const club = clubs.find(c => c.id === clubId);
        const clubName = club ? club.name.substring(0, 10) : clubId.substring(0, 8);
        roles.push(<Badge key={`club-${clubId}`} variant="outline" className="bg-green-100">{role} ({clubName})</Badge>);
      });
    }
    
    return roles.length > 0 ? <div className="flex flex-wrap gap-1">{roles}</div> : <Badge variant="outline">Keine Rolle</Badge>;
  };



  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCog className="mr-2 h-5 w-5" />
          Benutzerübersicht
        </CardTitle>
        <CardDescription>
          Liste aller Benutzer mit ihren Berechtigungen und zugewiesenen Vereinen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Benutzer, E-Mail oder Verein suchen..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p>Benutzer werden geladen...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {searchTerm ? 'Keine Benutzer gefunden, die Ihren Suchkriterien entsprechen.' : 'Keine Benutzer gefunden.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">E-Mail</TableHead>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead className="w-[200px]">Rolle</TableHead>
                    <TableHead className="w-[250px]">Vereine</TableHead>
                    <TableHead className="w-[100px]">Premium</TableHead>
                    <TableHead className="w-[100px] text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.displayName || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getClubNames(user)}</span>
                          {getClubCount(user) > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {getClubCount(user)} Vereine
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(user as any).isPremium ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                              📎 Premium
                            </Badge>
                            {(user as any).autoRenew && (
                              <Badge variant="outline" className="text-xs">
                                Auto-Renewal
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Standard
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Bestätigungs-E-Mail erneut senden"
                            onClick={() => handleResendVerification(user)}
                            disabled={sendingVerificationFor === user.uid}
                          >
                            {sendingVerificationFor === user.uid
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <MailCheck className="h-4 w-4 text-blue-500" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => confirmDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Benutzerberechtigungen löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Berechtigungen für {userToDelete?.email} wirklich löschen? 
                Dies entfernt nur die Berechtigungen in der App, nicht den Benutzer aus Firebase Authentication.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser} 
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Loader2, UserCog, Clock } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Benutzerberechtigungen laden
      const usersQuery = query(collection(db, 'user_permissions'), orderBy('email', 'asc'));
      const snapshot = await getDocs(usersQuery);
      const fetchedUsers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserPermission[];
      
      // Letzte Login-Daten laden
      const usersWithLoginData = await Promise.all(
        fetchedUsers.map(async (user) => {
          try {
            // Versuche, die Login-Daten aus der users-Collection zu laden
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...user,
                lastLogin: userData.lastLogin || null
              };
            }
          } catch (error) {
            console.error(`Error fetching login data for user ${user.uid}:`, error);
          }
          return user;
        })
      );
      
      setUsers(usersWithLoginData);
      setFilteredUsers(usersWithLoginData);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      console.error('Error deleting user:', error);
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

  const confirmDelete = (user: UserPermission) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const getClubName = (clubId: string | null) => {
    if (!clubId) return '-';
    const club = clubs.find(c => c.id === clubId);
    return club ? club.name : 'Unbekannter Verein';
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">Keine Rolle</Badge>;
    
    switch (role) {
      case 'vereinsvertreter':
        return <Badge variant="default" className="bg-blue-500">Vereinsvertreter</Badge>;
      case 'mannschaftsfuehrer':
        return <Badge variant="default" className="bg-green-500">Mannschaftsführer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const formatLastLogin = (lastLogin: any) => {
    if (!lastLogin) return 'Nie';
    
    try {
      const date = lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
      return format(date, 'dd.MM.yyyy HH:mm', { locale: de });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unbekannt';
    }
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
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Verein</TableHead>
                    <TableHead>Letzter Login</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.displayName || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getClubName(user.clubId)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{formatLastLogin(user.lastLogin)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Letzter Login des Benutzers</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
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
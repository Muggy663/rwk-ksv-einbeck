"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface TrainingGroup {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  maxMembers: number;
  isActive: boolean;
}

interface InviteToGroupDialogProps {
  targetUserId: string;
  targetUserName: string;
  children: React.ReactNode;
}

export function InviteToGroupDialog({ targetUserId, targetUserName, children }: InviteToGroupDialogProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { TrainingGroupsService } = await import('@/lib/services/training-groups-service');
      const userGroups = await TrainingGroupsService.getUserGroups(user.uid);
      
      // Nur Gruppen wo User Admin ist und Target noch nicht Mitglied
      const adminGroups = userGroups.filter(group => 
        group.admins.includes(user.uid) && 
        !group.members.includes(targetUserId) &&
        group.members.length < group.maxMembers
      );
      
      setGroups(adminGroups);
    } catch (error) {
      logError('Fehler beim Laden der Gruppen:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteToGroup = async (groupId: string) => {
    if (!user) return;
    
    setInviting(groupId);
    try {
      // Erstelle Einladung in der Datenbank
      const { db } = await import('@/lib/firebase/config');
      const { addDoc, collection } = await import('firebase/firestore');
      
      await addDoc(collection(db, 'group_invitations'), {
        groupId,
        invitedUserId: targetUserId,
        invitedBy: user.uid,
        invitedByName: user.displayName || user.email,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
      });
      
      alert(`Einladung an ${targetUserName} gesendet!`);
    } catch (error) {
      logError('Fehler beim Senden der Einladung:', error);
      alert('Fehler beim Senden der Einladung');
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {targetUserName} zu Gruppe einladen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie eine Ihrer Gruppen aus, um {targetUserName} einzuladen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Lade Gruppen...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-4">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Keine verfügbaren Gruppen. Sie müssen Admin einer Gruppe sein, um Einladungen zu senden.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <Card key={group.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {group.members.length}/{group.maxMembers} Mitglieder
                        </Badge>
                        <Badge variant="secondary">Admin</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => inviteToGroup(group.id)}
                      disabled={inviting === group.id}
                    >
                      {inviting === group.id ? (
                        <>
                          <X className="h-3 w-3 mr-1 animate-spin" />
                          Sende...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Einladen
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
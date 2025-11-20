import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, arrayUnion, arrayRemove, Timestamp, deleteDoc } from 'firebase/firestore';
import { TrainingGroup } from '@/types/social';

export class TrainingGroupsService {
  
  // Neue Trainingsgruppe erstellen
  static async createGroup(userId: string, groupData: {
    name: string;
    description?: string;
    maxMembers: number;
    allowCompetitions: boolean;
    publicResults: boolean;
    autoAcceptMembers: boolean;
  }): Promise<string> {
    
    // Generiere 6-stelligen Join-Code
    const joinCode = this.generateJoinCode();
    
    const newGroup: Omit<TrainingGroup, 'id'> = {
      name: groupData.name,
      description: groupData.description,
      createdBy: userId,
      joinCode,
      members: [userId],
      admins: [userId],
      isActive: true,
      maxMembers: groupData.maxMembers,
      settings: {
        allowCompetitions: groupData.allowCompetitions,
        publicResults: groupData.publicResults,
        autoAcceptMembers: groupData.autoAcceptMembers,
        requiresPremium: groupData.allowCompetitions // Live-Wettkämpfe = Premium
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    const groupRef = await addDoc(collection(db, 'training_groups'), newGroup);
    
    // Ersteller als Mitglied hinzufügen
    await this.addGroupMember(groupRef.id, userId, 'admin');
    
    return groupRef.id;
  }
  
  // Gruppe beitreten
  static async joinGroup(userId: string, joinCode: string): Promise<string> {
    // Finde Gruppe mit Join-Code
    const groupsRef = collection(db, 'training_groups');
    const q = query(groupsRef, where('joinCode', '==', joinCode.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Gruppe mit diesem Code nicht gefunden');
    }
    
    const groupDoc = snapshot.docs[0];
    const groupData = groupDoc.data() as TrainingGroup;
    
    // Prüfe ob Gruppe aktiv ist
    if (!groupData.isActive) {
      throw new Error('Diese Gruppe ist nicht mehr aktiv');
    }
    
    // Prüfe ob bereits Mitglied
    if (groupData.members.includes(userId)) {
      throw new Error('Sie sind bereits Mitglied dieser Gruppe');
    }
    
    // Prüfe Mitglieder-Limit
    if (groupData.members.length >= groupData.maxMembers) {
      throw new Error('Diese Gruppe hat bereits die maximale Anzahl an Mitgliedern erreicht');
    }
    
    // Füge User zur Gruppe hinzu
    await updateDoc(doc(db, 'training_groups', groupDoc.id), {
      members: arrayUnion(userId),
      lastActivity: new Date()
    });
    
    return groupDoc.id;
  }
  
  // Mitglied zur Gruppe hinzufügen (interne Funktion)
  private static async addGroupMember(groupId: string, userId: string, role: 'member' | 'admin') {
    const memberRef = doc(db, 'training_groups', groupId, 'members', userId);
    
    await setDoc(memberRef, {
      userId,
      joinedAt: new Date(),
      role,
      isActive: true
    });
  }
  
  // Benutzer-Gruppen laden
  static async getUserGroups(userId: string): Promise<TrainingGroup[]> {
    const groupsRef = collection(db, 'training_groups');
    const q = query(groupsRef, where('members', 'array-contains', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TrainingGroup));
  }
  
  // Gruppe verlassen
  static async leaveGroup(userId: string, groupId: string) {
    const groupRef = doc(db, 'training_groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Gruppe nicht gefunden');
    }
    
    const groupData = groupDoc.data() as TrainingGroup;
    
    // Prüfe ob User Mitglied ist
    if (!groupData.members.includes(userId)) {
      throw new Error('Sie sind kein Mitglied dieser Gruppe');
    }
    
    // Entferne aus Mitglieder-Liste
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      admins: arrayRemove(userId), // Falls Admin
      lastActivity: new Date()
    });
    
    // Deaktiviere Mitgliedschaft
    const memberRef = doc(db, 'training_groups', groupId, 'members', userId);
    await updateDoc(memberRef, {
      isActive: false,
      leftAt: new Date()
    });
    
    // Wenn letzter Admin, mache ersten Mitglied zum Admin
    const updatedGroup = await getDoc(groupRef);
    const updatedData = updatedGroup.data() as TrainingGroup;
    
    if (updatedData.admins.length === 0 && updatedData.members.length > 0) {
      const newAdmin = updatedData.members[0];
      await updateDoc(groupRef, {
        admins: [newAdmin]
      });
      
      // Update Mitglied-Rolle
      const newAdminRef = doc(db, 'training_groups', groupId, 'members', newAdmin);
      await updateDoc(newAdminRef, {
        role: 'admin'
      });
    }
    
    // Wenn keine Mitglieder mehr, deaktiviere Gruppe
    if (updatedData.members.length === 0) {
      await updateDoc(groupRef, {
        isActive: false
      });
    }
  }
  
  // 6-stelligen Join-Code generieren
  private static generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Gruppe-Details laden
  static async getGroupDetails(groupId: string): Promise<TrainingGroup | null> {
    const groupRef = doc(db, 'training_groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return null;
    }
    
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    } as TrainingGroup;
  }
  
  // Gruppen-Einstellungen aktualisieren (nur Admins)
  static async updateGroupSettings(groupId: string, userId: string, settings: Partial<TrainingGroup['settings']>) {
    const groupRef = doc(db, 'training_groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Gruppe nicht gefunden');
    }
    
    const groupData = groupDoc.data() as TrainingGroup;
    
    // Prüfe Admin-Berechtigung
    if (!groupData.admins.includes(userId)) {
      throw new Error('Keine Berechtigung zum Ändern der Einstellungen');
    }
    
    await updateDoc(groupRef, {
      'settings': { ...groupData.settings, ...settings },
      lastActivity: new Date()
    });
  }
  
  // Inaktive Gruppen finden (älter als 90 Tage)
  static async findInactiveGroups(): Promise<TrainingGroup[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const groupsRef = collection(db, 'training_groups');
    const q = query(groupsRef, where('lastActivity', '<', cutoffDate), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TrainingGroup));
  }
  
  // Warnung für inaktive Gruppe senden
  static async markGroupAsWarned(groupId: string) {
    const groupRef = doc(db, 'training_groups', groupId);
    await updateDoc(groupRef, {
      inactivityWarning: new Date(),
      warningCount: 1
    });
  }
  
  // Gruppe wegen Inaktivität archivieren
  static async archiveInactiveGroup(groupId: string, reason: string = 'Inaktivität > 120 Tage') {
    const groupRef = doc(db, 'training_groups', groupId);
    await updateDoc(groupRef, {
      isActive: false,
      archivedAt: new Date(),
      archiveReason: reason
    });
  }
  
  // Gruppe löschen (nur für Ersteller)
  static async deleteGroup(groupId: string, userId: string) {
    const groupRef = doc(db, 'training_groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Gruppe nicht gefunden');
    }
    
    const groupData = groupDoc.data() as TrainingGroup;
    
    // Prüfe ob User der Ersteller oder Admin ist
    if (groupData.createdBy !== userId && groupData.ownerId !== userId && !groupData.admins?.includes(userId)) {
      throw new Error('Nur der Ersteller oder ein Admin kann die Gruppe löschen');
    }
    
    // Lösche alle Subcollections
    const membersQuery = query(collection(db, 'training_groups', groupId, 'members'));
    const membersSnapshot = await getDocs(membersQuery);
    const deletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Lösche die Gruppe permanent
    await deleteDoc(groupRef);
  }
  
  // Gruppen-Aktivität aktualisieren
  static async updateGroupActivity(groupId: string) {
    const groupRef = doc(db, 'training_groups', groupId);
    await updateDoc(groupRef, {
      lastActivity: new Date()
    });
  }
  
  // Cleanup-Job für inaktive Gruppen
  static async cleanupInactiveGroups(): Promise<{
    warned: number;
    archived: number;
  }> {
    const now = new Date();
    const warningDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 Tage
    const archiveDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // 120 Tage
    
    const groupsRef = collection(db, 'training_groups');
    const allGroupsQuery = query(groupsRef, where('isActive', '==', true));
    const snapshot = await getDocs(allGroupsQuery);
    
    let warned = 0;
    let archived = 0;
    
    for (const doc of snapshot.docs) {
      const group = doc.data() as TrainingGroup & { inactivityWarning?: Date; warningCount?: number };
      const lastActivity = group.lastActivity?.toDate() || group.createdAt.toDate();
      
      // Archivieren nach 120 Tagen
      if (lastActivity < archiveDate) {
        await this.archiveInactiveGroup(doc.id);
        archived++;
      }
      // Warnung nach 90 Tagen (nur einmal)
      else if (lastActivity < warningDate && !group.inactivityWarning) {
        await this.markGroupAsWarned(doc.id);
        warned++;
      }
    }
    
    return { warned, archived };
  }
}

import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export interface Protest {
  id?: string;
  title: string;
  description: string;
  category: 'ergebnis' | 'verhalten' | 'regelverstoß' | 'sonstiges';
  status: 'eingereicht' | 'in_bearbeitung' | 'entschieden' | 'abgelehnt';
  priority: 'niedrig' | 'mittel' | 'hoch';
  
  // Betroffene Daten
  leagueId?: string;
  leagueName?: string;
  teamId?: string;
  teamName?: string;
  shooterId?: string;
  shooterName?: string;
  matchDate?: Date;
  
  // Workflow
  submittedBy: string; // E-Mail des Einreichers
  submittedByName: string;
  submittedAt: Date;
  
  assignedTo?: string; // Sportausschuss-Mitglied
  assignedAt?: Date;
  
  decidedBy?: string;
  decidedAt?: Date;
  decision?: string;
  decisionReason?: string;
  
  // Anhänge
  attachments: string[];
  
  // Kommunikation
  comments: ProtestComment[];
}

export interface ProtestComment {
  id: string;
  authorEmail: string;
  authorName: string;
  content: string;
  createdAt: Date;
  isInternal: boolean; // Nur für Sportausschuss sichtbar
}

class ProtestService {
  private collection = 'protests';

  /**
   * Neuen Protest einreichen
   */
  async submitProtest(protest: Omit<Protest, 'id' | 'submittedAt' | 'status' | 'comments'>): Promise<string> {
    try {
      const protestData = {
        ...protest,
        status: 'eingereicht' as const,
        submittedAt: Timestamp.fromDate(new Date()),
        comments: []
      };

      const docRef = await addDoc(collection(db, this.collection), protestData);
      
      // TODO: Push-Notification an Rundenwettkampfleiter senden

      
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Einreichen des Protests:', error);
      throw error;
    }
  }

  /**
   * Alle Proteste abrufen (für Sportausschuss)
   */
  async getAllProtests(): Promise<Protest[]> {
    try {
      const protestsQuery = query(
        collection(db, this.collection),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(protestsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        assignedAt: doc.data().assignedAt?.toDate(),
        decidedAt: doc.data().decidedAt?.toDate(),
        matchDate: doc.data().matchDate?.toDate(),
        comments: doc.data().comments?.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt?.toDate() || new Date()
        })) || []
      })) as Protest[];
    } catch (error) {
      console.error('Fehler beim Laden der Proteste:', error);
      throw error;
    }
  }

  /**
   * Proteste eines Benutzers abrufen
   */
  async getUserProtests(userEmail: string): Promise<Protest[]> {
    try {
      const protestsQuery = query(
        collection(db, this.collection),
        where('submittedBy', '==', userEmail),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(protestsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        assignedAt: doc.data().assignedAt?.toDate(),
        decidedAt: doc.data().decidedAt?.toDate(),
        matchDate: doc.data().matchDate?.toDate(),
        comments: doc.data().comments?.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt?.toDate() || new Date()
        })) || []
      })) as Protest[];
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer-Proteste:', error);
      throw error;
    }
  }

  /**
   * Protest-Status aktualisieren
   */
  async updateProtestStatus(
    protestId: string, 
    status: Protest['status'], 
    assignedTo?: string,
    decision?: string,
    decisionReason?: string,
    decidedBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status
      };

      if (status === 'in_bearbeitung' && assignedTo) {
        updateData.assignedTo = assignedTo;
        updateData.assignedAt = Timestamp.fromDate(new Date());
      }

      if ((status === 'entschieden' || status === 'abgelehnt') && decidedBy) {
        updateData.decidedBy = decidedBy;
        updateData.decidedAt = Timestamp.fromDate(new Date());
        updateData.decision = decision;
        updateData.decisionReason = decisionReason;
      }

      await updateDoc(doc(db, this.collection, protestId), updateData);
      
      // TODO: Push-Notification an Einreicher senden

    } catch (error) {
      console.error('Fehler beim Aktualisieren des Protest-Status:', error);
      throw error;
    }
  }

  /**
   * Kommentar zu Protest hinzufügen
   */
  async addComment(
    protestId: string,
    comment: Omit<ProtestComment, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      // Aktuellen Protest laden
      const protestsQuery = query(
        collection(db, this.collection),
        where('__name__', '==', protestId)
      );
      
      const snapshot = await getDocs(protestsQuery);
      
      if (snapshot.empty) {
        throw new Error('Protest nicht gefunden');
      }

      const protestData = snapshot.docs[0].data();
      const existingComments = protestData.comments || [];

      const newComment: ProtestComment = {
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date()
      };

      const updatedComments = [...existingComments, {
        ...newComment,
        createdAt: Timestamp.fromDate(newComment.createdAt)
      }];

      await updateDoc(doc(db, this.collection, protestId), {
        comments: updatedComments
      });


    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error);
      throw error;
    }
  }

  /**
   * Protest löschen (nur für Admins)
   */
  async deleteProtest(protestId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collection, protestId));

    } catch (error) {
      console.error('Fehler beim Löschen des Protests:', error);
      throw error;
    }
  }

  /**
   * Protest-Statistiken
   */
  async getProtestStats(): Promise<{
    total: number;
    eingereicht: number;
    inBearbeitung: number;
    entschieden: number;
    abgelehnt: number;
  }> {
    try {
      const protests = await this.getAllProtests();
      
      return {
        total: protests.length,
        eingereicht: protests.filter(p => p.status === 'eingereicht').length,
        inBearbeitung: protests.filter(p => p.status === 'in_bearbeitung').length,
        entschieden: protests.filter(p => p.status === 'entschieden').length,
        abgelehnt: protests.filter(p => p.status === 'abgelehnt').length
      };
    } catch (error) {
      console.error('Fehler beim Laden der Protest-Statistiken:', error);
      throw error;
    }
  }
}

export const protestService = new ProtestService();

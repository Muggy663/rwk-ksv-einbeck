import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, arrayUnion } from 'firebase/firestore';
import { NotificationService } from './notification-service';

export interface Duel {
  id: string;
  challengerId: string;
  challengedId: string;
  discipline: string;
  shotCount: number;
  status: 'pending' | 'accepted' | 'active' | 'finished' | 'declined';
  
  // Ergebnisse
  challengerResult?: {
    totalScore: number;
    totalRings: number;
    serien: any[];
    submittedAt: Date;
  };
  challengedResult?: {
    totalScore: number;
    totalRings: number;
    serien: any[];
    submittedAt: Date;
  };
  
  // Wettkampf-Details
  winner?: string;
  createdAt: Date;
  acceptedAt?: Date;
  finishedAt?: Date;
  expiresAt: Date; // 7 Tage zum Annehmen
}

export class DuelService {
  
  // Duell-Herausforderung senden
  static async challengeUser(challengerId: string, challengedId: string, duelData: {
    discipline: string;
    shotCount: number;
  }): Promise<string> {
    
    // Prüfe ob bereits ein aktives Duell zwischen den Usern existiert
    const existingDuel = await this.getActiveDuelBetweenUsers(challengerId, challengedId);
    if (existingDuel) {
      throw new Error('Es existiert bereits ein aktives Duell zwischen diesen Schützen');
    }
    
    // Erstelle neues Duell
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage zum Annehmen
    
    const newDuel: Omit<Duel, 'id'> = {
      challengerId,
      challengedId,
      discipline: duelData.discipline,
      shotCount: duelData.shotCount,
      status: 'pending',
      createdAt: new Date(),
      expiresAt
    };
    
    const duelRef = await addDoc(collection(db, 'duels'), newDuel);
    
    // Sende Benachrichtigung an herausgeforderten User
    const challengerData = await this.getUserData(challengerId);
    await NotificationService.createNotification({
      userId: challengedId,
      type: 'competition_invite',
      title: 'Duell-Herausforderung',
      message: `${challengerData.displayName} fordert Sie zu einem Duell heraus: ${duelData.discipline} (${duelData.shotCount} Schuss)`,
      data: { duelId: duelRef.id, challengerId, discipline: duelData.discipline },
      read: false
    });
    
    return duelRef.id;
  }
  
  // Duell annehmen
  static async acceptDuel(duelId: string, userId: string) {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    
    if (!duelDoc.exists()) {
      throw new Error('Duell nicht gefunden');
    }
    
    const duel = duelDoc.data() as Duel;
    
    // Prüfe Berechtigung
    if (duel.challengedId !== userId) {
      throw new Error('Sie sind nicht berechtigt, dieses Duell anzunehmen');
    }
    
    if (duel.status !== 'pending') {
      throw new Error('Dieses Duell kann nicht mehr angenommen werden');
    }
    
    // Prüfe Ablaufzeit
    if (new Date() > new Date(duel.expiresAt)) {
      throw new Error('Die Annahmezeit für dieses Duell ist abgelaufen');
    }
    
    // Aktualisiere Duell-Status
    await updateDoc(duelRef, {
      status: 'accepted',
      acceptedAt: new Date()
    });
    
    // Benachrichtige Herausforderer
    const challengedData = await this.getUserData(userId);
    await NotificationService.createNotification({
      userId: duel.challengerId,
      type: 'competition_started',
      title: 'Duell angenommen',
      message: `${challengedData.displayName} hat Ihre Duell-Herausforderung angenommen! Das Duell kann beginnen.`,
      data: { duelId, challengedId: userId },
      read: false
    });
  }
  
  // Duell ablehnen
  static async declineDuel(duelId: string, userId: string) {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    
    if (!duelDoc.exists()) {
      throw new Error('Duell nicht gefunden');
    }
    
    const duel = duelDoc.data() as Duel;
    
    if (duel.challengedId !== userId) {
      throw new Error('Sie sind nicht berechtigt, dieses Duell abzulehnen');
    }
    
    if (duel.status !== 'pending') {
      throw new Error('Dieses Duell kann nicht mehr abgelehnt werden');
    }
    
    await updateDoc(duelRef, {
      status: 'declined'
    });
    
    // Benachrichtige Herausforderer
    const challengedData = await this.getUserData(userId);
    await NotificationService.createNotification({
      userId: duel.challengerId,
      type: 'competition_finished',
      title: 'Duell abgelehnt',
      message: `${challengedData.displayName} hat Ihre Duell-Herausforderung abgelehnt.`,
      data: { duelId },
      read: false
    });
  }
  
  // Duell-Ergebnis einreichen
  static async submitDuelResult(duelId: string, userId: string, result: {
    totalScore: number;
    totalRings: number;
    serien: any[];
  }) {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    
    if (!duelDoc.exists()) {
      throw new Error('Duell nicht gefunden');
    }
    
    const duel = duelDoc.data() as Duel;
    
    // Prüfe Berechtigung
    if (duel.challengerId !== userId && duel.challengedId !== userId) {
      throw new Error('Sie sind nicht Teilnehmer dieses Duells');
    }
    
    if (duel.status !== 'accepted' && duel.status !== 'active') {
      throw new Error('Dieses Duell ist nicht aktiv');
    }
    
    // Bestimme welches Ergebnis gesetzt wird
    const resultField = duel.challengerId === userId ? 'challengerResult' : 'challengedResult';
    const resultData = {
      ...result,
      submittedAt: new Date()
    };
    
    const updateData: any = {
      [resultField]: resultData,
      status: 'active' // Setze auf aktiv wenn erstes Ergebnis
    };
    
    // Prüfe ob beide Ergebnisse vorliegen
    const otherResultField = duel.challengerId === userId ? 'challengedResult' : 'challengerResult';
    const otherResult = duel[otherResultField as keyof Duel];
    
    if (otherResult) {
      // Beide Ergebnisse vorhanden - bestimme Gewinner
      const challengerScore = duel.challengerId === userId ? result.totalScore : (otherResult as any).totalScore;
      const challengedScore = duel.challengedId === userId ? result.totalScore : (otherResult as any).totalScore;
      
      updateData.winner = challengerScore > challengedScore ? duel.challengerId : 
                         challengedScore > challengerScore ? duel.challengedId : 
                         'tie';
      updateData.status = 'finished';
      updateData.finishedAt = new Date();
    }
    
    await updateDoc(duelRef, updateData);
    
    // Benachrichtige anderen Teilnehmer
    const otherUserId = duel.challengerId === userId ? duel.challengedId : duel.challengerId;
    const userData = await this.getUserData(userId);
    
    if (updateData.status === 'finished') {
      // Duell beendet - sende Ergebnis-Benachrichtigungen
      await this.sendDuelFinishedNotifications(duelId, duel, updateData.winner);
    } else {
      // Erstes Ergebnis eingereicht
      await NotificationService.createNotification({
        userId: otherUserId,
        type: 'competition_started',
        title: 'Duell-Ergebnis eingereicht',
        message: `${userData.displayName} hat sein Ergebnis eingereicht. Reichen Sie Ihr Ergebnis ein, um das Duell zu beenden.`,
        data: { duelId },
        read: false
      });
    }
  }
  
  // Duell-beendet Benachrichtigungen senden
  private static async sendDuelFinishedNotifications(duelId: string, duel: Duel, winner: string) {
    const challengerData = await this.getUserData(duel.challengerId);
    const challengedData = await this.getUserData(duel.challengedId);
    
    if (winner === 'tie') {
      // Unentschieden
      const message = `Ihr Duell gegen ${challengedData.displayName} endete unentschieden!`;
      
      await NotificationService.createNotification({
        userId: duel.challengerId,
        type: 'result_achieved',
        title: 'Duell beendet - Unentschieden',
        message: `Ihr Duell gegen ${challengedData.displayName} endete unentschieden!`,
        data: { duelId, result: 'tie' },
        read: false
      });
      
      await NotificationService.createNotification({
        userId: duel.challengedId,
        type: 'result_achieved',
        title: 'Duell beendet - Unentschieden',
        message: `Ihr Duell gegen ${challengerData.displayName} endete unentschieden!`,
        data: { duelId, result: 'tie' },
        read: false
      });
    } else {
      // Gewinner/Verlierer
      const winnerId = winner;
      const loserId = winner === duel.challengerId ? duel.challengedId : duel.challengerId;
      const winnerData = winner === duel.challengerId ? challengerData : challengedData;
      const loserData = winner === duel.challengerId ? challengedData : challengerData;
      
      await NotificationService.createNotification({
        userId: winnerId,
        type: 'result_achieved',
        title: 'Duell gewonnen! 🏆',
        message: `Glückwunsch! Sie haben das Duell gegen ${loserData.displayName} gewonnen!`,
        data: { duelId, result: 'won' },
        read: false
      });
      
      await NotificationService.createNotification({
        userId: loserId,
        type: 'result_achieved',
        title: 'Duell beendet',
        message: `Das Duell gegen ${winnerData.displayName} ist beendet. Besser Glück beim nächsten Mal!`,
        data: { duelId, result: 'lost' },
        read: false
      });
    }
  }
  
  // User-Duelle laden
  static async getUserDuels(userId: string): Promise<Duel[]> {
    const duelsRef = collection(db, 'duels');
    
    // Lade Duelle als Herausforderer
    const challengerQuery = query(duelsRef, where('challengerId', '==', userId));
    const challengerSnapshot = await getDocs(challengerQuery);
    
    // Lade Duelle als Herausgeforderter
    const challengedQuery = query(duelsRef, where('challengedId', '==', userId));
    const challengedSnapshot = await getDocs(challengedQuery);
    
    const allDuels = [
      ...challengerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Duel)),
      ...challengedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Duel))
    ];
    
    // Sortiere nach Erstellungsdatum (neueste zuerst)
    return allDuels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Aktives Duell zwischen zwei Usern finden
  private static async getActiveDuelBetweenUsers(user1Id: string, user2Id: string): Promise<Duel | null> {
    const duelsRef = collection(db, 'duels');
    
    // Suche in beide Richtungen
    const query1 = query(
      duelsRef, 
      where('challengerId', '==', user1Id),
      where('challengedId', '==', user2Id),
      where('status', 'in', ['pending', 'accepted', 'active'])
    );
    
    const query2 = query(
      duelsRef,
      where('challengerId', '==', user2Id), 
      where('challengedId', '==', user1Id),
      where('status', 'in', ['pending', 'accepted', 'active'])
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(query1),
      getDocs(query2)
    ]);
    
    if (!snapshot1.empty) {
      return { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() } as Duel;
    }
    
    if (!snapshot2.empty) {
      return { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } as Duel;
    }
    
    return null;
  }
  
  // User-Daten laden
  private static async getUserData(userId: string) {
    const userRef = doc(db, 'user_permissions', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User nicht gefunden');
    }
    
    return userDoc.data();
  }
  
  // Duell-Details laden
  static async getDuelDetails(duelId: string): Promise<Duel | null> {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    
    if (!duelDoc.exists()) {
      return null;
    }
    
    return { id: duelDoc.id, ...duelDoc.data() } as Duel;
  }
}

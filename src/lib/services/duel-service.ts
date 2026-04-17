import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { NotificationService } from './notification-service';

export interface Duel {
  id: string;
  challengerId: string;
  challengedId: string;
  discipline: string;
  shotCount: number;
  status: 'pending' | 'accepted' | 'active' | 'finished' | 'declined';
  challengerResult?: { totalScore: number; totalRings: number; serien: any[]; submittedAt: Date; };
  challengedResult?: { totalScore: number; totalRings: number; serien: any[]; submittedAt: Date; };
  winner?: string;
  createdAt: Date;
  acceptedAt?: Date;
  finishedAt?: Date;
  expiresAt: Date;
}

export class DuelService {

  static async challengeUser(challengerId: string, challengedId: string, duelData: {
    discipline: string;
    shotCount: number;
  }): Promise<string> {
    const existingDuel = await this.getActiveDuelBetweenUsers(challengerId, challengedId);
    if (existingDuel) throw new Error('Es existiert bereits ein aktives Duell zwischen diesen Schützen');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newDuel: Omit<Duel, 'id'> = {
      challengerId, challengedId,
      discipline: duelData.discipline,
      shotCount: duelData.shotCount,
      status: 'pending',
      createdAt: new Date(),
      expiresAt
    };

    const duelRef = await addDoc(collection(db, 'duels'), newDuel);
    const challengerData = await this.getUserData(challengerId);

    await NotificationService.createNotification({
      userId: challengedId,
      type: 'competition_invite',
      title: 'Duell-Herausforderung',
      message: `${challengerData.displayName} fordert Sie zu einem Duell heraus: ${duelData.discipline} (${duelData.shotCount} Schuss)`,
      data: { duelId: duelRef.id, challengerId, discipline: duelData.discipline },
      read: false,
      createdAt: new Date()
    });

    return duelRef.id;
  }

  static async acceptDuel(duelId: string, userId: string) {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    if (!duelDoc.exists()) throw new Error('Duell nicht gefunden');

    const duel = duelDoc.data() as Duel;
    if (duel.challengedId !== userId) throw new Error('Sie sind nicht berechtigt, dieses Duell anzunehmen');
    if (duel.status !== 'pending') throw new Error('Dieses Duell kann nicht mehr angenommen werden');
    if (new Date() > new Date(duel.expiresAt)) throw new Error('Die Annahmezeit für dieses Duell ist abgelaufen');

    await updateDoc(duelRef, { status: 'accepted', acceptedAt: new Date() });

    const challengedData = await this.getUserData(userId);
    await NotificationService.createNotification({
      userId: duel.challengerId,
      type: 'competition_started',
      title: 'Duell angenommen',
      message: `${challengedData.displayName} hat Ihre Duell-Herausforderung angenommen!`,
      data: { duelId, challengedId: userId },
      read: false,
      createdAt: new Date()
    });
  }

  static async declineDuel(duelId: string, userId: string) {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    if (!duelDoc.exists()) throw new Error('Duell nicht gefunden');

    const duel = duelDoc.data() as Duel;
    if (duel.challengedId !== userId) throw new Error('Sie sind nicht berechtigt, dieses Duell abzulehnen');
    if (duel.status !== 'pending') throw new Error('Dieses Duell kann nicht mehr abgelehnt werden');

    await updateDoc(duelRef, { status: 'declined' });

    const challengedData = await this.getUserData(userId);
    await NotificationService.createNotification({
      userId: duel.challengerId,
      type: 'competition_finished',
      title: 'Duell abgelehnt',
      message: `${challengedData.displayName} hat Ihre Duell-Herausforderung abgelehnt.`,
      data: { duelId },
      read: false,
      createdAt: new Date()
    });
  }

  static async submitDuelResult(duelId: string, userId: string, result: {
    totalScore: number; totalRings: number; serien: any[];
  }) {
    const duelRef = doc(db, 'duels', duelId);
    const duelDoc = await getDoc(duelRef);
    if (!duelDoc.exists()) throw new Error('Duell nicht gefunden');

    const duel = duelDoc.data() as Duel;
    if (duel.challengerId !== userId && duel.challengedId !== userId) throw new Error('Sie sind nicht Teilnehmer dieses Duells');
    if (duel.status !== 'accepted' && duel.status !== 'active') throw new Error('Dieses Duell ist nicht aktiv');

    const resultField = duel.challengerId === userId ? 'challengerResult' : 'challengedResult';
    const resultData = { ...result, submittedAt: new Date() };
    const updateData: any = { [resultField]: resultData, status: 'active' };

    const otherResultField = duel.challengerId === userId ? 'challengedResult' : 'challengerResult';
    const otherResult = duel[otherResultField as keyof Duel];

    if (otherResult) {
      const challengerScore = duel.challengerId === userId ? result.totalScore : (otherResult as any).totalScore;
      const challengedScore = duel.challengedId === userId ? result.totalScore : (otherResult as any).totalScore;
      updateData.winner = challengerScore > challengedScore ? duel.challengerId :
                          challengedScore > challengerScore ? duel.challengedId : 'tie';
      updateData.status = 'finished';
      updateData.finishedAt = new Date();
    }

    await updateDoc(duelRef, updateData);

    const otherUserId = duel.challengerId === userId ? duel.challengedId : duel.challengerId;
    const userData = await this.getUserData(userId);

    if (updateData.status === 'finished') {
      await this.sendDuelFinishedNotifications(duelId, duel, updateData.winner);
    } else {
      await NotificationService.createNotification({
        userId: otherUserId,
        type: 'competition_started',
        title: 'Duell-Ergebnis eingereicht',
        message: `${userData.displayName} hat sein Ergebnis eingereicht. Reichen Sie Ihr Ergebnis ein, um das Duell zu beenden.`,
        data: { duelId },
        read: false,
        createdAt: new Date()
      });
    }
  }

  private static async sendDuelFinishedNotifications(duelId: string, duel: Duel, winner: string) {
    const challengerData = await this.getUserData(duel.challengerId);
    const challengedData = await this.getUserData(duel.challengedId);

    if (winner === 'tie') {
      await NotificationService.createNotification({
        userId: duel.challengerId, type: 'result_achieved',
        title: 'Duell beendet - Unentschieden',
        message: `Ihr Duell gegen ${challengedData.displayName} endete unentschieden!`,
        data: { duelId, result: 'tie' }, read: false, createdAt: new Date()
      });
      await NotificationService.createNotification({
        userId: duel.challengedId, type: 'result_achieved',
        title: 'Duell beendet - Unentschieden',
        message: `Ihr Duell gegen ${challengerData.displayName} endete unentschieden!`,
        data: { duelId, result: 'tie' }, read: false, createdAt: new Date()
      });
    } else {
      const loserId = winner === duel.challengerId ? duel.challengedId : duel.challengerId;
      const winnerData = winner === duel.challengerId ? challengerData : challengedData;
      const loserData = winner === duel.challengerId ? challengedData : challengerData;

      await NotificationService.createNotification({
        userId: winner, type: 'result_achieved',
        title: 'Duell gewonnen! 🏆',
        message: `Glückwunsch! Sie haben das Duell gegen ${loserData.displayName} gewonnen!`,
        data: { duelId, result: 'won' }, read: false, createdAt: new Date()
      });
      await NotificationService.createNotification({
        userId: loserId, type: 'result_achieved',
        title: 'Duell beendet',
        message: `Das Duell gegen ${winnerData.displayName} ist beendet. Besser Glück beim nächsten Mal!`,
        data: { duelId, result: 'lost' }, read: false, createdAt: new Date()
      });
    }
  }

  static async getUserDuels(userId: string): Promise<Duel[]> {
    const duelsRef = collection(db, 'duels');
    const [s1, s2] = await Promise.all([
      getDocs(query(duelsRef, where('challengerId', '==', userId))),
      getDocs(query(duelsRef, where('challengedId', '==', userId)))
    ]);
    const allDuels = [
      ...s1.docs.map(d => ({ id: d.id, ...d.data() } as Duel)),
      ...s2.docs.map(d => ({ id: d.id, ...d.data() } as Duel))
    ];
    return allDuels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private static async getActiveDuelBetweenUsers(user1Id: string, user2Id: string): Promise<Duel | null> {
    const duelsRef = collection(db, 'duels');
    const [s1, s2] = await Promise.all([
      getDocs(query(duelsRef, where('challengerId', '==', user1Id), where('challengedId', '==', user2Id), where('status', 'in', ['pending', 'accepted', 'active']))),
      getDocs(query(duelsRef, where('challengerId', '==', user2Id), where('challengedId', '==', user1Id), where('status', 'in', ['pending', 'accepted', 'active'])))
    ]);
    if (!s1.empty) return { id: s1.docs[0].id, ...s1.docs[0].data() } as Duel;
    if (!s2.empty) return { id: s2.docs[0].id, ...s2.docs[0].data() } as Duel;
    return null;
  }

  private static async getUserData(userId: string) {
    const userDoc = await getDoc(doc(db, 'user_permissions', userId));
    if (!userDoc.exists()) throw new Error('User nicht gefunden');
    return userDoc.data();
  }

  static async getDuelDetails(duelId: string): Promise<Duel | null> {
    const duelDoc = await getDoc(doc(db, 'duels', duelId));
    if (!duelDoc.exists()) return null;
    return { id: duelDoc.id, ...duelDoc.data() } as Duel;
  }
}

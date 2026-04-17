import { db } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/secure-logger';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, arrayUnion, arrayRemove, onSnapshot, writeBatch } from 'firebase/firestore';
import { LiveCompetition, CompetitionResult } from '@/types/social';

export class LiveCompetitionService {

  static async createCompetition(userId: string, input: {
    name: string;
    groupId: string;
    discipline: string;
    shotCount: number;
    timeLimit?: number;
    allowLateJoin: boolean;
    showLiveResults: boolean;
  }): Promise<string> {
    const isPremium = await this.checkPremiumStatus(userId);
    if (!isPremium) throw new Error('Live-Wettkämpfe erfordern eine Premium-Lizenz');

    const newCompetition: Omit<LiveCompetition, 'id'> = {
      name: input.name,
      groupId: input.groupId,
      discipline: input.discipline,
      shotCount: input.shotCount,
      createdBy: userId,
      status: 'waiting',
      participants: [userId],
      settings: {
        timeLimit: input.timeLimit,
        allowLateJoin: input.allowLateJoin,
        showLiveResults: input.showLiveResults
      },
      requiresPremium: true
    };

    const competitionRef = await addDoc(collection(db, 'live_competitions'), newCompetition);
    return competitionRef.id;
  }

  static async joinCompetition(userId: string, competitionId: string) {
    try {
      const competitionRef = doc(db, 'live_competitions', competitionId);
      const competitionDoc = await getDoc(competitionRef);
      if (!competitionDoc.exists()) throw new Error('Wettkampf nicht gefunden');

      const competition = competitionDoc.data() as LiveCompetition;
      if (competition.status === 'finished') throw new Error('Dieser Wettkampf ist bereits beendet');
      if (competition.status === 'active' && !competition.settings.allowLateJoin) throw new Error('Spätes Beitreten ist nicht erlaubt');
      if (competition.participants.includes(userId)) throw new Error('Sie nehmen bereits an diesem Wettkampf teil');

      await updateDoc(competitionRef, { participants: arrayUnion(userId) });
    } catch (error) {
      logError('Error joining competition:', error);
      throw error instanceof Error ? error : new Error('Fehler beim Beitreten');
    }
  }

  static async startCompetition(userId: string, competitionId: string) {
    try {
      const competitionRef = doc(db, 'live_competitions', competitionId);
      const competitionDoc = await getDoc(competitionRef);
      if (!competitionDoc.exists()) throw new Error('Wettkampf nicht gefunden');

      const competition = competitionDoc.data() as LiveCompetition;
      if (competition.createdBy !== userId) throw new Error('Nur der Ersteller kann den Wettkampf starten');
      if (competition.status !== 'waiting') throw new Error('Wettkampf kann nicht gestartet werden');

      await updateDoc(competitionRef, { status: 'active', startTime: new Date() });
    } catch (error) {
      logError('Error starting competition:', error);
      throw error instanceof Error ? error : new Error('Fehler beim Starten');
    }
  }

  static async submitResult(userId: string, competitionId: string, resultData: {
    serien: any[]; totalScore: number; totalRings: number;
  }) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    if (!competitionDoc.exists()) throw new Error('Wettkampf nicht gefunden');

    const competition = competitionDoc.data() as LiveCompetition;
    if (!competition.participants.includes(userId)) throw new Error('Sie nehmen nicht an diesem Wettkampf teil');
    if (competition.status !== 'active') throw new Error('Wettkampf ist nicht aktiv');

    const resultRef = doc(db, 'live_competitions', competitionId, 'results', userId);
    const competitionResult: CompetitionResult = {
      userId, competitionId,
      serien: resultData.serien,
      totalScore: resultData.totalScore,
      totalRings: resultData.totalRings,
      submittedAt: new Date()
    };

    await setDoc(resultRef, competitionResult);
    await this.checkCompetitionComplete(competitionId);
  }

  private static async checkCompetitionComplete(competitionId: string) {
    const competitionDoc = await getDoc(doc(db, 'live_competitions', competitionId));
    if (!competitionDoc.exists()) return;

    const competition = competitionDoc.data() as LiveCompetition;
    const resultsSnapshot = await getDocs(collection(db, 'live_competitions', competitionId, 'results'));
    if (resultsSnapshot.size >= competition.participants.length) {
      await this.finishCompetition(competitionId);
    }
  }

  static async finishCompetition(competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const resultsSnapshot = await getDocs(collection(db, 'live_competitions', competitionId, 'results'));

    const results = resultsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CompetitionResult));
    results.sort((a, b) => b.totalScore - a.totalScore);

    const batch = writeBatch(db);
    results.forEach((result, index) => {
      batch.update(doc(db, 'live_competitions', competitionId, 'results', result.userId), { position: index + 1 });
    });
    batch.update(competitionRef, { status: 'finished', endTime: new Date() });
    await batch.commit();
  }

  static subscribeToLiveRanking(competitionId: string, callback: (results: CompetitionResult[]) => void) {
    return onSnapshot(collection(db, 'live_competitions', competitionId, 'results'), (snapshot) => {
      const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CompetitionResult));
      results.sort((a, b) => b.totalScore - a.totalScore);
      callback(results);
    });
  }

  static async getCompetitionDetails(competitionId: string): Promise<LiveCompetition | null> {
    const competitionDoc = await getDoc(doc(db, 'live_competitions', competitionId));
    if (!competitionDoc.exists()) return null;
    return { id: competitionDoc.id, ...competitionDoc.data() } as LiveCompetition;
  }

  static async getUserCompetitions(userId: string): Promise<LiveCompetition[]> {
    const snapshot = await getDocs(query(collection(db, 'live_competitions'), where('participants', 'array-contains', userId)));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveCompetition));
  }

  private static async checkPremiumStatus(userId: string): Promise<boolean> {
    const userDoc = await getDoc(doc(db, 'user_permissions', userId));
    if (!userDoc.exists()) return false;
    return userDoc.data().isPremium === true;
  }

  static async leaveCompetition(userId: string, competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const resultRef = doc(db, 'live_competitions', competitionId, 'results', userId);

    const [competitionDoc, resultDoc] = await Promise.all([getDoc(competitionRef), getDoc(resultRef)]);
    if (!competitionDoc.exists()) throw new Error('Wettkampf nicht gefunden');

    const competition = competitionDoc.data() as LiveCompetition;
    if (competition.status === 'active') throw new Error('Sie können einen aktiven Wettkampf nicht verlassen');

    const batch = writeBatch(db);
    batch.update(competitionRef, { participants: arrayRemove(userId) });
    if (resultDoc.exists()) batch.update(resultRef, { deleted: true, deletedAt: new Date() });
    await batch.commit();
  }
}

import { db } from '@/lib/firebase/config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { LiveCompetition, CompetitionResult } from '@/types/social';

export class LiveCompetitionService {
  
  // Neuen Live-Wettkampf erstellen (Premium)
  static async createCompetition(userId: string, competitionData: {
    name: string;
    groupId: string;
    discipline: string;
    shotCount: number;
    timeLimit?: number;
    allowLateJoin: boolean;
    showLiveResults: boolean;
  }): Promise<string> {
    
    // Prüfe Premium-Status
    const isPremium = await this.checkPremiumStatus(userId);
    if (!isPremium) {
      throw new Error('Live-Wettkämpfe erfordern eine Premium-Lizenz');
    }
    
    const newCompetition: Omit<LiveCompetition, 'id'> = {
      name: competitionData.name,
      groupId: competitionData.groupId,
      discipline: competitionData.discipline,
      shotCount: competitionData.shotCount,
      createdBy: userId,
      status: 'waiting',
      participants: [userId],
      settings: {
        timeLimit: competitionData.timeLimit,
        allowLateJoin: competitionData.allowLateJoin,
        showLiveResults: competitionData.showLiveResults
      },
      requiresPremium: true
    };
    
    const competitionRef = await addDoc(collection(db, 'live_competitions'), newCompetition);
    return competitionRef.id;
  }
  
  // Wettkampf beitreten
  static async joinCompetition(userId: string, competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      throw new Error('Wettkampf nicht gefunden');
    }
    
    const competition = competitionDoc.data() as LiveCompetition;
    
    // Prüfe Status
    if (competition.status === 'finished') {
      throw new Error('Dieser Wettkampf ist bereits beendet');
    }
    
    if (competition.status === 'active' && !competition.settings.allowLateJoin) {
      throw new Error('Spätes Beitreten ist für diesen Wettkampf nicht erlaubt');
    }
    
    // Prüfe ob bereits Teilnehmer
    if (competition.participants.includes(userId)) {
      throw new Error('Sie nehmen bereits an diesem Wettkampf teil');
    }
    
    // Füge Teilnehmer hinzu
    await updateDoc(competitionRef, {
      participants: arrayUnion(userId)
    });
  }
  
  // Wettkampf starten
  static async startCompetition(userId: string, competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      throw new Error('Wettkampf nicht gefunden');
    }
    
    const competition = competitionDoc.data() as LiveCompetition;
    
    // Prüfe Berechtigung
    if (competition.createdBy !== userId) {
      throw new Error('Nur der Ersteller kann den Wettkampf starten');
    }
    
    if (competition.status !== 'waiting') {
      throw new Error('Wettkampf kann nicht gestartet werden');
    }
    
    await updateDoc(competitionRef, {
      status: 'active',
      startTime: new Date()
    });
  }
  
  // Ergebnis einreichen
  static async submitResult(userId: string, competitionId: string, result: {
    serien: any[];
    totalScore: number;
    totalRings: number;
  }) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      throw new Error('Wettkampf nicht gefunden');
    }
    
    const competition = competitionDoc.data() as LiveCompetition;
    
    // Prüfe Teilnahme-Berechtigung
    if (!competition.participants.includes(userId)) {
      throw new Error('Sie nehmen nicht an diesem Wettkampf teil');
    }
    
    if (competition.status !== 'active') {
      throw new Error('Wettkampf ist nicht aktiv');
    }
    
    // Speichere Ergebnis
    const resultRef = doc(db, 'live_competitions', competitionId, 'results', userId);
    const competitionResult: CompetitionResult = {
      userId,
      competitionId,
      serien: result.serien,
      totalScore: result.totalScore,
      totalRings: result.totalRings,
      submittedAt: new Date()
    };
    
    await setDoc(resultRef, competitionResult);
    
    // Prüfe ob alle Ergebnisse eingereicht wurden
    await this.checkCompetitionComplete(competitionId);
  }
  
  // Prüfe ob Wettkampf abgeschlossen werden kann
  private static async checkCompetitionComplete(competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) return;
    
    const competition = competitionDoc.data() as LiveCompetition;
    
    // Lade alle Ergebnisse
    const resultsRef = collection(db, 'live_competitions', competitionId, 'results');
    const resultsSnapshot = await getDocs(resultsRef);
    
    // Wenn alle Teilnehmer Ergebnisse eingereicht haben
    if (resultsSnapshot.size >= competition.participants.length) {
      await this.finishCompetition(competitionId);
    }
  }
  
  // Wettkampf beenden
  static async finishCompetition(competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    
    // Berechne Platzierungen
    const resultsRef = collection(db, 'live_competitions', competitionId, 'results');
    const resultsSnapshot = await getDocs(resultsRef);
    
    const results = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CompetitionResult));
    
    // Sortiere nach Gesamtergebnis (höchste Punktzahl gewinnt)
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    // Weise Platzierungen zu
    for (let i = 0; i < results.length; i++) {
      const resultRef = doc(db, 'live_competitions', competitionId, 'results', results[i].userId);
      await updateDoc(resultRef, {
        position: i + 1
      });
    }
    
    // Markiere Wettkampf als beendet
    await updateDoc(competitionRef, {
      status: 'finished',
      endTime: new Date()
    });
  }
  
  // Live-Rangliste abrufen
  static subscribeToLiveRanking(competitionId: string, callback: (results: CompetitionResult[]) => void) {
    const resultsRef = collection(db, 'live_competitions', competitionId, 'results');
    
    return onSnapshot(resultsRef, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CompetitionResult));
      
      // Sortiere nach Gesamtergebnis
      results.sort((a, b) => b.totalScore - a.totalScore);
      
      callback(results);
    });
  }
  
  // Wettkampf-Details abrufen
  static async getCompetitionDetails(competitionId: string): Promise<LiveCompetition | null> {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      return null;
    }
    
    return {
      id: competitionDoc.id,
      ...competitionDoc.data()
    } as LiveCompetition;
  }
  
  // Benutzer-Wettkämpfe laden
  static async getUserCompetitions(userId: string): Promise<LiveCompetition[]> {
    const competitionsRef = collection(db, 'live_competitions');
    const q = query(competitionsRef, where('participants', 'array-contains', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LiveCompetition));
  }
  
  // Premium-Status prüfen
  private static async checkPremiumStatus(userId: string): Promise<boolean> {
    const userPermissionsRef = doc(db, 'user_permissions', userId);
    const userPermissions = await getDoc(userPermissionsRef);
    
    if (!userPermissions.exists()) return false;
    
    const userData = userPermissions.data();
    return userData.isPremium === true;
  }
  
  // Wettkampf verlassen
  static async leaveCompetition(userId: string, competitionId: string) {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      throw new Error('Wettkampf nicht gefunden');
    }
    
    const competition = competitionDoc.data() as LiveCompetition;
    
    if (competition.status === 'active') {
      throw new Error('Sie können einen aktiven Wettkampf nicht verlassen');
    }
    
    // Entferne aus Teilnehmer-Liste
    await updateDoc(competitionRef, {
      participants: arrayRemove(userId)
    });
    
    // Lösche Ergebnis falls vorhanden
    const resultRef = doc(db, 'live_competitions', competitionId, 'results', userId);
    const resultDoc = await getDoc(resultRef);
    if (resultDoc.exists()) {
      await setDoc(resultRef, { deleted: true });
    }
  }
}

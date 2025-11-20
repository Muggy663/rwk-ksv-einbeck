import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Competition {
  id?: string;
  groupId: string;
  name: string;
  discipline: string;
  shots: number;
  rounds: number;
  createdBy: string;
  createdByName: string;
  status: 'active' | 'completed';
  participants: string[];
  results: { [userId: string]: number[] }; // Array für jede Runde
  scoreType: 'whole' | 'decimal'; // Ganze Ringe oder Zehntel
  sortBy: 'total' | 'average' | 'best'; // Sortierung der Rangliste
  createdAt: any;
  completedAt?: any;
}

export class CompetitionsService {
  static async createCompetition(competition: Omit<Competition, 'id' | 'createdAt' | 'status' | 'participants' | 'results'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'live_competitions'), {
      ...competition,
      status: 'active',
      participants: [competition.createdBy],
      results: {},
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getGroupCompetitions(groupId: string): Promise<Competition[]> {
    const q = query(
      collection(db, 'live_competitions'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competition));
  }

  static async joinCompetition(competitionId: string, userId: string): Promise<void> {
    console.log('CompetitionsService.joinCompetition called with:', { competitionId, userId });
    
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    console.log('Competition doc exists:', competitionDoc.exists());
    
    if (!competitionDoc.exists()) {
      throw new Error('Wettkampf nicht gefunden');
    }
    
    const competition = competitionDoc.data() as Competition;
    console.log('Current participants:', competition.participants);
    console.log('User already participant?', competition.participants.includes(userId));
    
    if (!competition.participants.includes(userId)) {
      console.log('Adding user to participants...');
      await updateDoc(competitionRef, {
        participants: [...competition.participants, userId]
      });
      console.log('User added successfully');
    } else {
      console.log('User already a participant');
    }
  }

  static async resetCompetitionResults(competitionId: string): Promise<void> {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    await updateDoc(competitionRef, {
      results: {}
    });
  }

  static async deleteCompetition(competitionId: string): Promise<void> {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    await deleteDoc(competitionRef);
  }

  static async submitResult(competitionId: string, userId: string, round: number, score: number): Promise<void> {
    const competitionRef = doc(db, 'live_competitions', competitionId);
    const competitionDoc = await getDoc(competitionRef);
    
    if (!competitionDoc.exists()) {
      throw new Error('Wettkampf nicht gefunden');
    }
    
    const competition = competitionDoc.data() as Competition;
    const userResults = competition.results[userId] || [];
    
    // Setze Ergebnis für die Runde
    userResults[round - 1] = score;
    
    await updateDoc(competitionRef, {
      [`results.${userId}`]: userResults
    });
    
    // Speichere auch als Gruppen-Ergebnis für "Ergebnisse" Tab
    const groupResultRef = doc(db, 'training_groups', competition.groupId, 'results', `${competitionId}_${userId}_${round}`);
    await setDoc(groupResultRef, {
      userId,
      discipline: competition.discipline,
      rings: score,
      shots: competition.shots,
      average: score / competition.shots,
      date: new Date(),
      createdAt: new Date(),
      competitionId,
      round,
      isLiveCompetition: true
    });
  }
}
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Duel {
  id?: string;
  groupId: string;
  challengerId: string;
  challengerName: string;
  opponentId: string;
  opponentName: string;
  discipline: string;
  status: 'pending' | 'active' | 'completed';
  challengerScore?: number;
  opponentScore?: number;
  winner?: string;
  createdAt: any;
  completedAt?: any;
}

export class DuelsService {
  static async createDuel(duel: Omit<Duel, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'duels'), {
      ...duel,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getGroupDuels(groupId: string): Promise<Duel[]> {
    const q = query(
      collection(db, 'duels'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Duel));
  }

  static async acceptDuel(duelId: string): Promise<void> {
    await updateDoc(doc(db, 'duels', duelId), {
      status: 'active'
    });
  }

  static async submitScore(duelId: string, userId: string, score: number): Promise<void> {
    const duelDoc = await getDoc(doc(db, 'duels', duelId));
    const duel = duelDoc.data() as Duel;
    
    const isChallenger = duel.challengerId === userId;
    const updateData: any = {};
    
    if (isChallenger) {
      updateData.challengerScore = score;
    } else {
      updateData.opponentScore = score;
    }
    
    // Check if duel is complete
    const otherScore = isChallenger ? duel.opponentScore : duel.challengerScore;
    if (otherScore !== undefined) {
      updateData.status = 'completed';
      updateData.completedAt = serverTimestamp();
      updateData.winner = score > otherScore ? 
        (isChallenger ? duel.challengerName : duel.opponentName) :
        (isChallenger ? duel.opponentName : duel.challengerName);
    }
    
    await updateDoc(doc(db, 'duels', duelId), updateData);
  }
}
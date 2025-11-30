import { db, storage } from '@/lib/firebase/config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TrainingResult } from '@/types/social-training';

export class SocialTrainingService {
  static async saveResult(result: Omit<TrainingResult, 'id' | 'createdAt'>, photo?: File): Promise<string> {
    try {
      let photoUrl = '';
      
      if (photo) {
        // Upload Foto zu Firebase Storage
        const photoRef = ref(storage, `social-training-results/${Date.now()}_${photo.name}`);
        const snapshot = await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      // Speichere Ergebnis in Firestore
      const docRef = await addDoc(collection(db, 'social_training_results'), {
        ...result,
        photoUrl,
        createdAt: new Date(),
        verified: result.proofType === 'verified'
      });
      
      // Falls groupId vorhanden, füge auch zu Gruppen-Ergebnissen hinzu
      logDebug('🔍 SocialTrainingService - groupId:', result.groupId);
      if (result.groupId) {
        logDebug('🔍 Speichere in Gruppe:', result.groupId);
        await addDoc(collection(db, 'training_groups', result.groupId, 'results'), {
          userId: result.userId,
          resultId: docRef.id,
          discipline: result.discipline,
          shots: result.shots,
          rings: result.rings,
          average: result.average,
          date: result.date,
          createdAt: new Date()
        });
        logDebug('✅ Ergebnis auch in Gruppe gespeichert:', result.groupId);
      } else {
        logDebug('⚠️ Keine groupId - nicht in Gruppe gespeichert');
      }

      logDebug('✅ Social Training Ergebnis gespeichert:', docRef.id);
      return docRef.id;
    } catch (error) {
      logError('Fehler beim Speichern des Social Training Ergebnisses:', error);
      throw error;
    }
  }

  static async getUserResults(userId: string): Promise<TrainingResult[]> {
    try {
      const q = query(
        collection(db, 'social_training_results'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TrainingResult));
    } catch (error) {
      logError('Fehler beim Laden der Ergebnisse:', error);
      throw error;
    }
  }

  static async getGroupResults(groupId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'training_groups', groupId, 'results'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logError('Fehler beim Laden der Gruppen-Ergebnisse:', error);
      throw error;
    }
  }
  
  static async getResultById(resultId: string): Promise<TrainingResult | null> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'social_training_results', resultId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as TrainingResult;
    } catch (error) {
      logError('Fehler beim Laden des Ergebnisses:', error);
      return null;
    }
  }

  static async analyzePhotoWithGemini(photoFile: File): Promise<{ shots: number; rings: number; confidence: number }> {
    try {
      const formData = new FormData();
      formData.append('image', photoFile);
      
      const response = await fetch('/api/gemini/analyze-target', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Gemini-Analyse fehlgeschlagen');
      }
      
      return await response.json();
    } catch (error) {
      logError('Fehler bei Gemini-Analyse:', error);
      throw error;
    }
  }
}

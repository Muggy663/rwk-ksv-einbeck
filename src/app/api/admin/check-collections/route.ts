import { NextResponse } from 'next/server';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTIONS_TO_CHECK = [
  'shooters',
  'rwk_scores', 
  'rwk_results_2025',
  'rwk_teams'
];

export async function GET() {
  const results = {};
  
  for (const collectionName of COLLECTIONS_TO_CHECK) {
    try {
      const snapshot = await getDocs(query(collection(db, collectionName), limit(5)));
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      results[collectionName] = {
        count: snapshot.size,
        sample: docs,
        hasJuergenWauker: docs.some(doc => doc.name?.includes('Jürgen Wauker')),
        hasJanGreve: docs.some(doc => doc.name?.includes('Jan Greve'))
      };
    } catch (error) {
      results[collectionName] = { error: error.message };
    }
  }
  
  return NextResponse.json(results);
}
import { NextResponse } from 'next/server';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const IDS_TO_DELETE = [
  'bU6uW8ee6b86cyaN7txc', // Jürgen Wauker Duplikat
];

export async function GET() {
  return POST();
}

export async function POST() {
  const results = [];
  
  for (const id of IDS_TO_DELETE) {
    try {
      await deleteDoc(doc(db, 'rwk_scores', id));
      results.push({ id, status: 'deleted' });
    } catch (error) {
      results.push({ id, status: 'error', error: error.message });
    }
  }
  
  return NextResponse.json({ results });
}
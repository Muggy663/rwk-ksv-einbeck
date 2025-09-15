import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

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
      await adminDb.collection('rwk_scores').doc(id).delete();
      results.push({ id, status: 'deleted' });
    } catch (error) {
      results.push({ id, status: 'error', error: error.message });
    }
  }
  
  return NextResponse.json({ results });
}
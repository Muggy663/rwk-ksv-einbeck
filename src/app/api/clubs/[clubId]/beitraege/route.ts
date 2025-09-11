// src/app/api/clubs/[clubId]/beitraege/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const beitraegeCollection = `clubs/${params.clubId}/beitraege`;
    const snapshot = await getDocs(collection(db, beitraegeCollection));
    
    const beitraege = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, data: beitraege });
  } catch (error) {
    console.error('Fehler beim Laden der Beiträge:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const data = await request.json();
    const beitraegeCollection = `clubs/${params.clubId}/beitraege`;
    
    const docRef = await addDoc(collection(db, beitraegeCollection), {
      ...data,
      clubId: params.clubId,
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen des Beitrags:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
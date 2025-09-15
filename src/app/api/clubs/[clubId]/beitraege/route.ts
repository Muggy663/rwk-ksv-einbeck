// src/app/api/clubs/[clubId]/beitraege/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const beitraegeCollection = `clubs/${params.clubId}/beitraege`;
    const snapshot = await adminDb.collection(beitraegeCollection).get();
    
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
    
    const docRef = await adminDb.collection(beitraegeCollection).add({
      ...data,
      clubId: params.clubId,
      erstelltAm: FieldValue.serverTimestamp(),
      aktualisiertAm: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen des Beitrags:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
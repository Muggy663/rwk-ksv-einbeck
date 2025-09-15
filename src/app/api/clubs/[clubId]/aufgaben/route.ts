// src/app/api/clubs/[clubId]/aufgaben/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const aufgabenCollection = `clubs/${params.clubId}/aufgaben`;
    const snapshot = await adminDb.collection(aufgabenCollection).get();
    
    const aufgaben = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, data: aufgaben });
  } catch (error) {
    console.error('Fehler beim Laden der Aufgaben:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const data = await request.json();
    const aufgabenCollection = `clubs/${params.clubId}/aufgaben`;
    
    const docRef = await adminDb.collection(aufgabenCollection).add({
      ...data,
      clubId: params.clubId,
      erstelltAm: FieldValue.serverTimestamp(),
      aktualisiertAm: FieldValue.serverTimestamp(),
      status: data.status || 'offen'
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
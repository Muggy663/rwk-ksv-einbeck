// src/app/api/clubs/[clubId]/mitglieder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const mitgliederCollection = `clubs/${params.clubId}/mitglieder`;
    const snapshot = await adminDb.collection(mitgliederCollection).get();
    
    const mitglieder = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, data: mitglieder });
  } catch (error) {
    console.error('Fehler beim Laden der Mitglieder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const data = await request.json();
    const mitgliederCollection = `clubs/${params.clubId}/mitglieder`;
    
    const docRef = await adminDb.collection(mitgliederCollection).add({
      ...data,
      clubId: params.clubId,
      erstelltAm: FieldValue.serverTimestamp(),
      aktualisiertAm: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen des Mitglieds:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
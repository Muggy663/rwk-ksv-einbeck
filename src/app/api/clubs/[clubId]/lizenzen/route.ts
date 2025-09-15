// src/app/api/clubs/[clubId]/lizenzen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const lizenzenCollection = `clubs/${params.clubId}/lizenzen`;
    const snapshot = await adminDb.collection(lizenzenCollection).get();
    
    const lizenzen = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, data: lizenzen });
  } catch (error) {
    console.error('Fehler beim Laden der Lizenzen:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const data = await request.json();
    const lizenzenCollection = `clubs/${params.clubId}/lizenzen`;
    
    const docRef = await adminDb.collection(lizenzenCollection).add({
      ...data,
      clubId: params.clubId,
      erstelltAm: FieldValue.serverTimestamp(),
      aktualisiertAm: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen der Lizenz:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
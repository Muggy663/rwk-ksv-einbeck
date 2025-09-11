// src/app/api/clubs/[clubId]/mitglieder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const mitgliederCollection = `clubs/${params.clubId}/mitglieder`;
    const snapshot = await getDocs(collection(db, mitgliederCollection));
    
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
    
    const docRef = await addDoc(collection(db, mitgliederCollection), {
      ...data,
      clubId: params.clubId,
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen des Mitglieds:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
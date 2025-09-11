// src/app/api/clubs/[clubId]/aufgaben/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const aufgabenCollection = `clubs/${params.clubId}/aufgaben`;
    const snapshot = await getDocs(collection(db, aufgabenCollection));
    
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
    
    const docRef = await addDoc(collection(db, aufgabenCollection), {
      ...data,
      clubId: params.clubId,
      erstelltAm: new Date(),
      aktualisiertAm: new Date(),
      status: data.status || 'offen'
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
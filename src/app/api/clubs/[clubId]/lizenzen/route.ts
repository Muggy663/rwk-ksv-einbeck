// src/app/api/clubs/[clubId]/lizenzen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const lizenzenCollection = `clubs/${params.clubId}/lizenzen`;
    const snapshot = await getDocs(collection(db, lizenzenCollection));
    
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
    
    const docRef = await addDoc(collection(db, lizenzenCollection), {
      ...data,
      clubId: params.clubId,
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen der Lizenz:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
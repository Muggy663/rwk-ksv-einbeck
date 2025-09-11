// src/app/api/clubs/[clubId]/jubilaeen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const jubilaeenCollection = `clubs/${params.clubId}/jubilaeen`;
    const snapshot = await getDocs(collection(db, jubilaeenCollection));
    
    const jubilaeen = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, data: jubilaeen });
  } catch (error) {
    console.error('Fehler beim Laden der Jubiläen:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const data = await request.json();
    const jubilaeenCollection = `clubs/${params.clubId}/jubilaeen`;
    
    const docRef = await addDoc(collection(db, jubilaeenCollection), {
      ...data,
      clubId: params.clubId,
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Fehler beim Erstellen des Jubiläums:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
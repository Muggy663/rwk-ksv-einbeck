import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const docRef = doc(db, 'vereinsrecht_satzung', params.id);
    
    await updateDoc(docRef, {
      ...data,
      aktualisiertAm: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Dokument aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const docRef = doc(db, 'vereinsrecht_satzung', params.id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Dokument gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}